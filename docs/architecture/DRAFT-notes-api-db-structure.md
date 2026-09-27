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
| Review Queue (approve/reject App Registration + scope changes) | `tenants` schema — **see resolved model below**, not DataLink | resolved this session |
| Metering/Usage rollups | shared, cross-service (similar shape to `audit` schema — one schema, tenant_id + product on every row) | medium |
| Audit | `audit` schema (already designed) | high — settled earlier this session |

### Review Queue / approval — RESOLVED

Corrected business model (this session): **DL is never in the approval path.** Approval authority belongs to the Customer's own org admin, over that Customer's Accounts — not to DataLink. DataLink's role is pure oversight plus an independent circuit-breaker, not a gate in the normal flow.

This splits into two genuinely separate concerns, owned by two different services, that must stay independent:

**1. Business approval — owned by `tenants`**
- `tenants.production_reviews` (or similar): the org admin's approve/reject/request-changes workflow over an Account's App Registration production request. Stores `app_registration_id` as an opaque reference (no DB-level FK across schemas — that would violate the "no cross-schema writes/refs" rule). To act on it, `Tenants` service calls `SubTenants`' API (service-to-service, not a direct write) to flip the actual App Registration status.
- The originally-planned "DL-facing Review Queue" screen (`D2`) is wrong per this correction — that approval UI belongs in the **Org** persona (Tenant-facing), not Platform (DataLink-facing). `app.routes.ts` currently has `org/approvals` (U3, "App approvals & allow-list") — that's actually the right home; the planning doc's `D2` "Approvals across orgs" needs re-scoping to DL's *view* of approvals (read-only) or dropped in favor of DL's own concerns below.

**2. Operational circuit-breaker — owned by `datalink`, independent of approval status**
- DL can suspend a *technically approved* app's ability to call the FHIR gateway, orthogonal to whether the Tenant approved it. Two independent flags, two owners:
  - `subtenants.app_registrations.status` — business approval (Tenant-controlled)
  - `datalink.app_gateway_status` — operational gate (DataLink-controlled: active/suspended)
- At request time, the gateway checks **both** — approved AND not suspended — before allowing a call through.
- **Automatic + manual** (per this session): `datalink` owns rate-limit policies/tiers and live enforcement state (the Redis-based live counters from the planning doc), plus an auto-suspension rule (threshold breach → auto-flip `app_gateway_status` to suspended) and a manual override via Incident Console (`freeze`, `force-revoke`, `force JWKS refetch` — already in the screens).
- **Notification on suspension — confirmed this session**: when DataLink auto-suspends or an admin manually freezes an app, the Tenant's org admin must be notified (not silent, not discovered only via a usage drop). This is a cross-service concern: DataLink triggers it, Tenants' org admin is the recipient (matches `OrgDashboard`'s existing "cards for ... apps with rate-limit warnings" per the planning doc IA table).
  - Open question worth flagging: this is now a second consumer of "send a notification to a tenant admin" (the first being existing rate-limit-warning cards on `OrgDashboard`). Per the `Common` promotion rule (promote after 2x duplication, not preemptively), this may already justify a `Common.Notifications` module — a thin abstraction (email/in-app) any service can call — rather than DataLink and Tenants each growing their own notification-sending code independently. Not decided yet; flagging for the end-of-session review.
- **Dedicated DL observability** (per this session, not just shared audit/metering): DataLink's own schema already needs the rate-limit/gateway-status tables above to drive auto-suspension — this mostly *is* the dedicated observability the session called for, rather than a separate new concept. Worth confirming at schema-drafting time whether anything more is needed beyond gateway-status + rate-limit-event tables.

Next step once Review Queue ownership is settled: draft actual table definitions (columns, FKs, indexes) per schema, matching the entity table from the planning doc (Customer/Account/DB Binding/App Registration/API Scope table with cardinality + key attributes).

## 4. API granularity / mapping APIs to Angular routes

Not yet drafted. Plan: once schema ownership is settled, map each of the 34 screens (route codes S1-S15, U1-U8, D1-D11 from `app.routes.ts`) to the domain service(s) and specific endpoints it calls — this becomes the concrete "boundary" reference so a new screen's data needs make it obvious which service it talks to, and flags any screen that genuinely needs composition (→ candidate for revisiting BFF).
