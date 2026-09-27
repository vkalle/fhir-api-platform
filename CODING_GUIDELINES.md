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

**Tenant isolation: row-level, not schema/DB per tenant.** Every tenant-scoped table carries `tenant_id` (and `account_id` where relevant), indexed, enforced at the query/repository layer, with Postgres RLS as an optional backstop. No schema-per-tenant or DB-per-tenant — schema boundaries stay aligned to the 3 services only. Exception: a specific customer with a contractual/regulatory requirement for physical DB isolation is a one-off carve-out, not the default.

**Cross-schema references are opaque, never FKs.** A service may store another service's ID (e.g. `app_registration_id`) as a plain value with no DB-level foreign key across schemas. To act on the referenced entity, call that service's API — never write across the schema boundary directly.

## Composition — no dedicated BFF (for now)

Angular calls the domain services (`Tenants.Api` / `SubTenants.Api` / `DataLink.Api`) directly through the future API gateway (routing/auth only, no aggregation). Cross-service composition for dashboard-style screens lives in a thin Angular-side facade/data-access service per persona, not a separate backend.

Revisit only if: composition logic gets duplicated across multiple Angular consumers of the same shape, or a persona needs a genuinely distinct auth/session model that makes routing through shared domain APIs awkward.

Note: **runtime service-to-service HTTP calls are fine and expected** (e.g. DataLink → SubTenants to validate an App Registration's scope) — this is different from the "no service project references another service project" rule, which is about compile-time code references only.

## Review Queue / approval model

DataLink is never in the approval path. Approval authority belongs to the Customer's own org admin over that Customer's Accounts. DataLink's role is pure oversight plus an independent circuit-breaker.

- **Business approval — owned by `tenants`**: `tenants.production_reviews` stores `app_registration_id` as an opaque reference (no cross-schema FK). To act on it, `Tenants` calls `SubTenants`' API to flip the App Registration status. This is a Tenant-facing (Org persona) UI, not DataLink-facing.
- **Operational circuit-breaker — owned by `datalink`, independent of approval**: two separate status flags, two owners — `subtenants.app_registrations.status` (business approval) and `datalink.app_gateway_status` (operational gate). At request time the gateway checks both. `datalink` also owns rate-limit policies/live enforcement state, with automatic (threshold breach) and manual (Incident Console) suspension.
- **Notification on suspension is required**: when DataLink auto-suspends or an admin manually freezes an app, the Tenant's org admin must be notified — not silent. (Whether this justifies a `Common.Notifications` module is still open — see project doc open items.)

## Module build sequencing

Per module/persona, work through: approved screen HTMLs → DB schema (to ~90% confidence) → API contract (to ~90% confidence) → Angular build. Move to the next module only once the current one clears review.

**Order: Account (SubTenants) → Org (Tenants) → Platform (DataLink).**

SubTenants owns the deepest entity chain (Account → DB Binding → App Registration → API Scopes → Credentials/JWKS) and is the proven coupling point with both other schemas (Review Queue model above), so settling it first gives Tenants and DataLink a stable target to design against instead of guessing and later reopening a "settled" schema. DataLink goes last — it's the most reactive schema (gateway status, rate-limit enforcement), easiest to bolt on once it's clear exactly what it's gating.

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

Audit is a condition of entry, not a feature — designed in from the first line of code, not retrofitted. Adopted from the proven Datalink/Nova audit framework, scoped to what this project needs now; the infra layers below are a documented later phase, not deferred indefinitely.

### The six questions every audit record must answer

A record that cannot answer all six is incomplete for compliance purposes, regardless of what else it contains.

| Question | What it captures |
|---|---|
| WHO | Authenticated user — identity and role *at time of access*, not the role they hold today |
| WHAT | Action and resource — exactly which record |
| WHEN | UTC timestamp, ordered, unambiguous |
| WHERE | Correlation/request ID linking this event to the full request chain |
| WHY | Business context — reason code for sensitive-category access |
| SCOPE | Product and tenant — which service, which customer |

### Phase 0 (now) — DB triggers + application interceptor

**Writes (INSERT/UPDATE/DELETE) — trigger-based, the completeness guarantee.**
- One generic trigger function applied to every table in `tenants`, `subtenants`, `datalink` schemas. Fires inside the same transaction as the write — if the write commits, the audit record commits.
- Trigger-based because it's attached at DDL time: a new table missing it is a visible gap (caught by CI against `pg_trigger`), not a silently-skipped app-code path.
- A trigger only knows the DB role and row values — not who, why, or which feature. Context arrives via PostgreSQL session variables the application sets before every operation:

| Variable | Set by | Contains |
|---|---|---|
| `app.user_id` | Audit middleware | Authenticated user identity |
| `app.tenant_id` | Audit middleware | Customer tenant |
| `app.request_id` | Audit middleware | Correlation ID |
| `app.product` | Audit middleware | `TN` \| `ST` \| `DL` |
| `app.feature` | Feature entry point (controller/handler) | `tenant_onboard`, `subtenant_create`, etc. — not automatic, must be set explicitly |
| `app.reason` | Audit middleware, from `X-Audit-Reason` header | Reason code, sensitive access only |
| `app.source` | Middleware / worker | `application` \| `batch` \| `migration` — gates session-variable-gated triggers on pipeline-fed tables |

**Application interceptor — scoped narrowly, not blanket instrumentation.**
- Standard CUD needs *no* audit code in domain handlers — the trigger + session variables cover it completely.
- The interceptor (EF Core `SaveChangesInterceptor`, in `Common.Audit`) is used only where application-level context is the *only* source: sensitive-category classification (response content must be inspected) and reason-code capture (human intent, stated at access time, cannot be reconstructed after the fact).
- Atomicity is non-negotiable: audit write and clinical write are the same transaction. If the audit insert fails, the whole transaction rolls back — a change that cannot be audited must not be committed. Never catch-and-continue on an audit failure.

**Reads (SELECT) — application-level only, no exception.**
- Triggers cannot fire on `SELECT`, full stop. Implemented as an `AuditBehavior` in the CQRS query pipeline (`Common.Cqrs`) for any query returning PHI.

**Sensitive categories — elevated treatment.**
- Categories requiring a stated reason before access is granted (not optional, enforced at the API): PHI subject to elevated regulatory treatment where applicable (e.g. mental health, substance use, HIV status, genetic information) — maintained in an ops-updatable `audit.sensitive_registry` table, not hardcoded.
- The audit event records the *category*, never the raw clinical value — the clinical DB stays the single authoritative source for actual values; the audit record must stay safe to route to broader-access consumers later (log pipelines, alerting) without becoming a second PHI store.

**Background workers (Kafka consumers, scheduled jobs) — context propagation, not exemption.**
- Workers run outside the HTTP pipeline, so middleware never sets session variables — a worker touching a PHI table produces a *complete-looking but anonymous* audit record unless context is explicitly propagated with the message (not the thread): capture context at publish time, carry it in message headers, extract and `SET LOCAL` it before the domain handler runs, scoped to that message's transaction only.
- No active context at publish time (a daemon with no originating user) → fall back to an explicit system identity, never a silent null.

**Storage (now).**
- Dedicated `audit` schema, partitioned by `changed_at` (monthly) from day one — retrofitting partitioning in production later is expensive. Sub-partitioning by product/service only if query volume justifies it.
- `audit.activity` — all CUD, shared across services, columns: `audit_id, tenant_id, product, table_name, record_pk, operation, changed_at, user_id, request_id, feature, reason, old_data, new_data, changed_cols`.
- `audit.sensitive` — sensitive-category events, separate table (not a filtered view), stricter access.
- Append-only: `UPDATE`/`DELETE` grants on `audit.*` revoked at the role level, not convention.
- Migrations under `db/migrations/audit/`, versioned separately as shared infrastructure.

**Where the code lives.**
- `Common.Audit` — interceptor, session-context middleware/accessor, shared audit DTOs (the six-field contract floor every service's audit record extends). Lives in Common by default (not promotion-gated like other shared code) because audit logic inside a domain service drifts under feature pressure — this is deliberate, not an exception to the "promote after 2x duplication" rule.
- The trigger function itself is SQL in `db/migrations/audit/`, not app code — it must survive even if the application layer is bypassed entirely.

### Phase 1+ (later, documented not built) — perimeter and backstop layers

Not implemented yet; noted here so the schema/session-variable contract above doesn't need to change when these arrive:
- **API gateway perimeter logging** (if/when a gateway like APISIX sits in front) — endpoint, user, status, timestamp for every call, zero application code.
- **pgaudit** as the DBA/privileged-access backstop — DDL, schema migrations, role changes, direct DB access bypassing the app. Scoped narrowly (DDL + privileged roles), not general CUD — triggers already own that.
- **Kafka topics + a log/trace backend** (e.g. SigNoz) for operational investigation, separate from the PostgreSQL `audit.*` tables which remain the system of record for change history and compliance packet assembly.

## Naming conventions

Golden rule: a name derives from the folder/service it belongs to. Know the folder, know every other name — no independent naming decisions per layer.

**Service short codes** (audit trail, Kafka topics, HTTP headers only — never in permission keys or folder names):

| Service | Short code |
|---|---|
| Tenants | `TN` |
| SubTenants | `ST` |
| DataLink | `DL` |

**Case conventions:**

| What | Convention | Example |
|---|---|---|
| Folders | kebab-case | `src/services/tenants/` (display name `Tenants` in .sln) |
| .NET projects/classes | PascalCase | `Tenants.Application`, `AuditInterceptor` |
| .NET interfaces | IPascalCase | `IAuditService` |
| .NET constants | PascalCase.Property | `AuditTopics.Tenants` |
| DB schema/table/column | snake_case, lowercase | `audit.activity`, `changed_at` |
| DB roles | `fhir_snake_case` | `fhir_app`, `fhir_dba`, `fhir_readonly`, `fhir_audit_reader` |
| Session variables | `app.snake_case` | `app.user_id`, `app.tenant_id` |
| HTTP headers | X-Pascal-Case | `X-Request-Id`, `X-Audit-Reason` |
| Kafka topics (phase 1+) | dot.separated.hierarchical, env-prefixed | `prod.audit.app.tn` |
| Permission keys | `Prefix.Module.Action` | `TN.Tenants.Edit`, `ST.SubTenants.Create` — full prefix word or short code consistently, agreed once, never mixed |

Anti-pattern: a name that doesn't derive from its folder, or mixes conventions (e.g. `cm.care-plans.edit`, `SA.Config.Edit`) — raise it before introducing a name outside these rules; a new inconsistent name is a future integration seam failure, not a style nitpick.

## Hierarchy search (documented pattern, not built yet)

Tenants → SubTenants is a hierarchy. At small scale, straightforward parent-ID lookups are fine — no need to build the pattern below now. Documented so the future move isn't a redesign:

- Store a precomputed **PathString** per node (e.g. `/1/1/2/`) alongside the relational parent reference. Descendant lookups become string-prefix matches (`WHERE path_string LIKE '/1/1/%'`) instead of recursive traversal — this is what makes it scale past tens of thousands of nodes.
- If/when search volume or hierarchy depth justifies it, bulk-index nodes (with precomputed path + type path) into a search layer (e.g. OpenSearch) for sub-second prefix/full-text search, hierarchy-scoped by path prefix for access control.
- Trigger to revisit: query times degrading as node count grows, or a search requirement (filter/full-text across tenant hierarchy) that a simple SQL `LIKE` can't serve well. At that point this becomes a `Common.Search` candidate per the promotion rule above — not before.
