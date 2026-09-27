# Coding Guidelines — FHIR API Platform

## Versions

- Angular 22
- PostgreSQL 18
- .NET (latest LTS at time of build)

## Architecture

Monorepo, multiple independently deployable services, shared Postgres database.

```
src/
├── Services/
│   ├── Tenants/          → deploys as Tenants.Api
│   ├── SubTenants/        → deploys as SubTenants.Api
│   └── DataLink/          → deploys as DataLink.Api
├── Common/                 → shared code, promoted-not-dumped (see rules below)
├── Security.Incubator/     → WIP security patterns, not yet hardened (see below)
└── Web/                    → Angular frontend (separate deploy pipeline)
```

Each service follows the same 4-layer shape:

- `{Service}.Api` — host, controllers/endpoints, DI wiring. The only project actually deployed.
- `{Service}.Application` — CQRS: `Commands/` and `Queries/`, each with its handler colocated.
- `{Service}.Domain` — entities, aggregates, domain logic. No framework dependencies.
- `{Service}.Infrastructure` — EF Core, repositories, external calls.

## Database

One Postgres instance, **one schema per service**: `tenants`, `subtenants`, `datalink`. Schema name matches service folder name, lowercase, no exceptions.

Rules:
- A service's `.Infrastructure` only writes to its own schema.
- Reading another service's data goes through that service's API, or a Postgres view explicitly exposed for cross-schema reads — never a direct cross-schema table reference from application code.
- Migrations live under `db/migrations/{schema}/`, one folder per service, run independently.

## CQRS conventions

- Commands and queries live in `{Service}.Application/Commands` and `/Queries`.
- Handler is colocated with its command/query (same file or same folder) — don't split them across the codebase.
- Cross-cutting behavior (validation, logging, transaction wrapping) lives in `Common.Cqrs` as pipeline behaviors. `Common.Cqrs` never contains business logic — only generic pipeline plumbing.

## Dependency rules (what keeps services independently deployable)

- **No service project references another service project.** Ever. Not even "just this one small thing."
- Cross-service needs go through `Common.Contracts` (shared DTOs/events) or a network call (HTTP/queue) — never a project reference.
- Services may depend on `Common.*`, never the reverse.

## Common — promotion, not dumping

Do not add code to `Common` speculatively. Rule: something moves to `Common` only after it is duplicated in **two or more services**, and the move happens as its own PR with a clear "why."

Example: FHIR search-parameter logic. If `Tenants` and `SubTenants` both implement it, extract to `Common.Search` at that point — not before.

## Security.Incubator

Holding area for security-related code/patterns that are still being figured out — tenant isolation edge cases, API key rotation, external OAuth flows under review. Explicitly **not** production-hardened by default. Anything here needs a deliberate promotion (with review) before a service depends on it. Add a short note at the top of each pattern's file on what's unresolved.

## Audit (HIPAA)

Audit is mandatory across all tables in all services. Writes and reads are audited by different mechanisms — they are not interchangeable:

**Writes (INSERT/UPDATE/DELETE) — trigger-based, source of truth**
- Every table in `tenants`, `subtenants`, `datalink` schemas gets a generic audit trigger writing to `audit.change_log` (old row, new row, operation, table, timestamp as JSONB).
- Trigger-based because it's attached at DDL time — a new table without its trigger is a visible gap, not a silently-missed app-code path. This is what makes "all tables" actually enforceable.
- Every transaction sets session context before writing: `SET LOCAL app.user_id`, `app.tenant_id`, `app.correlation_id`. The trigger reads these into the audit row. Without this, triggers alone are context-blind (see architecture note below).
- CI check: a query against `pg_trigger` confirms every table in the three schemas has the audit trigger attached. New tables without it fail the build.

**Reads (SELECT / PHI views) — application-level only**
- Triggers cannot fire on `SELECT` — this half cannot be done at the DB layer, full stop.
- Implemented as an `AuditBehavior` in the CQRS query pipeline (`Common.Cqrs`), logging who viewed which record(s) and when, into `audit.access_log`.
- Every query handler that returns PHI goes through this behavior — not optional per-handler.

**Storage**
- Same Postgres instance, dedicated `audit` schema (`audit.change_log`, `audit.access_log`).
- Append-only: `UPDATE` and `DELETE` grants on `audit.*` tables are revoked at the role level for all application roles. Enforced by role permissions, not convention.
- Migrations for the audit schema live in `db/migrations/audit/`, versioned separately since it's shared infrastructure, not owned by one service.

**Where the code lives**
- `Common.Audit` — the pipeline behavior, session-context setter, and shared audit DTOs. Used by every service; owned in Common because audit is cross-cutting by definition, not duplicated logic waiting to be promoted.
- The Postgres trigger function itself lives in `db/migrations/audit/` as SQL, applied to each service schema's tables — not app code, since it must survive even if the app layer is bypassed.

## Naming

- Projects: `{Service}.{Layer}` (e.g. `Tenants.Application`).
- Only `.Api` projects are deployment targets — CI/CD triggers per-folder, not per-repo.
- Schemas: lowercase, matches service folder name exactly.
