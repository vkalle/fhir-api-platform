# DRAFT working notes — API layering, DB schema, folder structure

Status: **discussion notes, not yet in CODING_GUIDELINES.md.** Review at end of session and merge whatever survives.

## 1. Folder structure / SCSS — current state is roughly right

`src/Web/src/styles/` already has the right shape:
- `abstracts/_tokens.scss` — design tokens (from the Datalink design system)
- `abstracts/_mixins.scss`
- `base/_base.scss`
- `components/_button.scss`, `_card.scss`, `_chip.scss`, `_form.scss`, `_page.scss`, `_rail.scss`, `_table.scss`

`src/Web/src/app/features/{persona}/{screen}/` per-screen component + scss is the right growth pattern as the 31 placeholder screens get built out. No change needed yet — revisit once more screens exist and we see real duplication (same rule as `Common` promotion: don't restructure preemptively).

## 2. BFF vs no BFF — DECIDED: no dedicated BFF service, for now

Two distinct things were being conflated under "API calling APIs":

- **BFF (Backend-For-Frontend)**: a dedicated API layer per frontend, shaped to that screen's needs.
- **Service-to-service runtime calls** (e.g. DataLink → SubTenants to validate an App Registration's scope before proxying a FHIR call): normal orchestration, not the same as our "no service references another service *project*" rule — that rule is about compile-time code references, not runtime HTTP calls. Runtime calls between deployed services are fine and expected.

**Reasoning against a dedicated BFF right now:**
- A BFF per persona = 3 more deployable services on top of the 3 domain services (Tenants/SubTenants/DataLink) = 6+ backend deployables for a brand-new, single-developer project. Real operational cost, not free.
- Most screens map to **one owning domain service** (Account screens → SubTenants, Org screens → Tenants, Platform screens → DataLink). A BFF's value — composing multiple services into one screen-shaped response — only pays off where cross-service composition is actually needed. Looking at the 3 dashboards built so far (`metrics.mock.ts`), that's probably the main real composition need right now, not a majority-case problem.
- What a BFF buys you (one round trip, screen-shaped response, per-persona auth) can be had more cheaply: **composition in Angular**, not a separate deployed backend.

**Proposed approach:**
- Angular calls domain services (`Tenants.Api` / `SubTenants.Api` / `DataLink.Api`) directly, through the future API gateway (already planned as Phase 1+ in the audit framework doc) for routing/auth only — gateway does not aggregate.
- Cross-service composition for dashboard-style screens lives in a thin Angular-side facade/data-access service per persona, not a backend service.
- **Trigger to revisit an actual BFF later**: composition logic duplicated across multiple Angular consumers of the same shape, OR a persona needs a genuinely distinct auth/session model that makes routing through shared domain APIs awkward. Not just "we have 3 personas."

Open question for later: does the API gateway (Phase 1+) end up doing enough request shaping that it blurs into a BFF anyway? Worth revisiting once the gateway is actually chosen/built.

## 3. DB schema — entity ownership proposal (from the planning doc hierarchy)

Customer → Account (≤25) → DB Binding → App Registration → API Scopes

| Entity | Proposed owner | Confidence |
|---|---|---|
| Customer, Org Team/SSO, Partner Tiering, Billing | `tenants` schema | high — top-level, org-wide, matches Tenants service |
| Account, DB Binding, App Registration, API Scopes, Credentials/signing keys (JWKS) | `subtenants` schema | high — explicitly Account-scoped per planning doc |
| Source System technical config (connection pool, health checks), Rate limit enforcement state | `datalink` schema | medium — operational/gateway concern, distinct from the tenant config that describes it |
| Review Queue (approve/reject App Registration + scope changes) | **open — resolved below, revisit** | user asked to defer; leaning toward living with SubTenants (owns the App Registration data being approved) but exposed via DataLink-facing UI/API, same split-ownership pattern as Metering |
| Metering/Usage rollups | shared, cross-service (similar shape to `audit` schema — one schema, tenant_id + product on every row) | medium |
| Audit | `audit` schema (already designed) | high — settled earlier this session |

Next step once Review Queue ownership is settled: draft actual table definitions (columns, FKs, indexes) per schema, matching the entity table from the planning doc (Customer/Account/DB Binding/App Registration/API Scope table with cardinality + key attributes).

## 4. API granularity / mapping APIs to Angular routes

Not yet drafted. Plan: once schema ownership is settled, map each of the 34 screens (route codes S1-S15, U1-U8, D1-D11 from `app.routes.ts`) to the domain service(s) and specific endpoints it calls — this becomes the concrete "boundary" reference so a new screen's data needs make it obvious which service it talks to, and flags any screen that genuinely needs composition (→ candidate for revisiting BFF).
