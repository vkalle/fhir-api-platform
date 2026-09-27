# Nova Portal

Front end for DataLink's FHIR and API app platform. Three personas share one codebase:

| Persona                 | Route prefix  | Example                             |
| ----------------------- | ------------- | ----------------------------------- |
| Account (Sutter Health) | `/account/…`  | Build, test and run FHIR / API apps |
| Org (UMR)               | `/org/…`      | Approve apps, manage Accounts       |
| Platform (DataLink)     | `/platform/…` | Provisioning, source DBs, oversight |

The persona switcher in the top bar is for demos only.

## Requirements

- Node 20.19+ (22 recommended)
- npm 10+

## Getting started

```bash
npm ci          # installs dependencies and git hooks
npm start       # http://localhost:4200
```

## Scripts

| Script              | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm start`         | Dev server with live reload                                     |
| `npm run build`     | Production build to `dist/nova-portal/browser`                  |
| `npm run lint`      | ESLint (TS + templates + a11y rules), Stylelint, Prettier check |
| `npm run lint:scss` | Stylelint only                                                  |
| `npm run format`    | Prettier write                                                  |
| `npm test`          | Unit tests (watch)                                              |
| `npm run test:ci`   | Unit tests, single run, headless Chrome                         |
| `npm run a11y`      | WCAG 2 AA scan of built pages with pa11y-ci (run `build` first) |

## Project structure

```
src/
  styles/
    abstracts/_tokens.scss   Design tokens. The only file allowed raw colours, shadows, fonts.
    abstracts/_mixins.scss   type(), focus-visible, surface(), transition(), visually-hidden
    base/_base.scss          Reset, element defaults, utilities (u-meta, u-mono, u-num, u-sr-only)
    components/              Global design-system classes: dl-btn, dl-chip, dl-card, dl-kpi,
                             dl-table, dl-input, dl-segmented, dl-with-rail, dl-rail-card, dl-drawer
    main.scss                Entry point
  app/
    core/personas.ts         Persona metadata and sidebar navigation
    layout/                  Shell, top bar (persona switcher), sidebar
    shared/                  Icon, charts (line, spark, ops trio), placeholder page
    data/                    Sample data generators (replace with API services)
    features/<persona>/      One folder per screen
```

## Design system rules

These are enforced by Stylelint and fail the build and the pre-commit hook:

- **Tokens only.** Colours, backgrounds, borders, fills, strokes, shadows and font families must come from
  `abstracts/_tokens.scss` (`@use 'tokens' as t;` then `t.$brand-primary`). Raw hex values and named colours are
  rejected everywhere else.
- **BEM class names**, lower case: `block__element--modifier`. Global design-system blocks use the `dl-` prefix.
- **No IDs in selectors**, nesting depth 3 at most, no `!important`.
- **No inline styles** in templates. Use classes; bind only dynamic values (e.g. `[style.width.%]` for bar length).
- Status is always a chip **with a word**, never a bare coloured dot.
- Short create flows (add member, new credential, request Account) open in a **right drawer**, not a new page.
  Long flows (app registration) get their own route.
- Dashboards put the summary first, the detail second, and approvals / alerts in the **right rail**.

## Accessibility

- Template accessibility rules from `angular-eslint` run on every `.html` file.
- CI runs `pa11y-ci` (WCAG 2 AA) against the built dashboards. Add new routes to `.pa11yci.json`.
- Minimum text size 14px, visible focus on every control, skip link in the shell.

## Git workflow

- Branch from `main`: `feat/…`, `fix/…`, `chore/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) and are checked by commitlint:
  `feat(org): add account request drawer`.
- The pre-commit hook (Husky + lint-staged) lints and formats staged files. Commits that fail lint are blocked.
- Every pull request runs `.github/workflows/ci.yml`: lint, format check, unit tests, build, accessibility scan.
  Protect `main` in your Git host and require this check to pass.

## Adding a screen

1. `npx ng g c features/<persona>/<screen> --change-detection OnPush`
2. Replace the `planned(...)` entry in `src/app/app.routes.ts` with a `loadComponent` route.
3. Use the global `dl-*` classes first. Put screen-only styles in the component `.scss` and use tokens.
4. Add the route to `.pa11yci.json`.

## Status

Phase 1 (this commit): design system, shell, persona switcher, and the three dashboards
(`/account/dashboard`, `/org/dashboard`, `/platform/dashboard`).

Phase 2: the remaining 31 screens. Each has a route today that shows a placeholder with its prototype code
(S2–S15, U2–U8, D2–D11).
