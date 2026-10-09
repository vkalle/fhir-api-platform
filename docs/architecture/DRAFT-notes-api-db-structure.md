# DRAFT working notes — API layering, DB schema, folder structure

Status: BFF decision, DB schema ownership, Review Queue model, tenant isolation model, and module sequencing have been merged into `CODING_GUIDELINES.md`. Remaining open items below.

## Open

1. **Notification bell/TopBar screen** — hold off until `Common.Notifications` is decided, or build a placeholder now?
2. **`Common.Notifications` module** — does the suspension-notification requirement (2nd consumer of "notify tenant admin" after OrgDashboard rate-limit cards) justify creating this now, per the `Common` promotion rule (promote after 2x duplication)?
3. **API granularity / mapping APIs to Angular routes** — not yet drafted. Once schema ownership is settled (done) and each module's screens are approved, map each screen's route code to the domain service(s) and specific endpoints it calls.
4. **D2 screen re-scope** — "Approvals across orgs" needs to move to Org persona / become read-only for DL, per the Review Queue model. Not yet done in Claude Design.

## Table design decisions (in progress, 2026-10-09)

Terminology (backend): DL, Tenant, Sub Tenant. The UI keeps saying "Account". No Sub Tenant limit per Tenant (the earlier "<=25" is dropped). Tenant and Sub Tenant are defined manually (no self-service signup).

**subtenants schema (so far)**
- `sub_tenants`: sub_tenant_id, tenant_id (opaque), name, slug (unique per tenant), status (Tenant-controlled), contact_name, contact_email, created_at, updated_at. DL suspension is a separate flag in `datalink.sub_tenant_gateway_status` (same two-flag pattern as apps; gateway blocks if either is suspended).
- `sub_tenant_members`: member_id, tenant_id, sub_tenant_id (FK), email (unique per sub tenant), display_name, external_user_id (null until accepted), auth_method (`sso`|`local`), role, status (`invited`|`active`|`removed`), invited_at, joined_at, created_at, updated_at.
- `local_credentials` (in both `tenants` and `subtenants`, each for its own users): member_id, password_hash, failed_attempts, locked_until, last_login_at. Separate table so hashes never land in audit old_data/new_data. Local login is a permanent option (trials, no SSO, demos), not demo-only. No forced password change. Security bar (Argon2id, lockout, reset via one-time tokens in a `credential_tokens` table) lives in Security.Incubator until reviewed.
- Members sign in via the Tenant's SSO when `auth_method = sso`.

**datalink schema (so far)**
- `api_catalog`: api_id, name, path, resource_type (`fhir`|`api`), version, status. Loaded manually by DL ops.
- `api_grants`: subject_type (`tenant`|`sub_tenant`), subject_id, api_id, filter_params (jsonb, null = no limit). Loaded manually by DL ops. filter_params limits which members a Sub Tenant sees through an API; the future program that generates APIs per Sub Tenant will write to it.
- `db_bindings`: db_binding_id, source_system_id (FK), database_name, schema_name, status, created_at, updated_at. Created manually by DL ops.
- `db_binding_crosswalk`: crosswalk_id, db_binding_id (FK), tenant_id (opaque), created_at; unique (db_binding_id, tenant_id). Tenant-level only; Sub Tenants inherit their Tenant's DB access.
- Effective scopes are computed at login/token time (grants narrowed by role and by what the app was approved for). Not stored per login. No separate scope_limits table: scopes do the limiting.
- Dynamic per-Sub Tenant API generation is a separate future program, out of scope.
