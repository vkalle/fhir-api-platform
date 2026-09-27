# DRAFT working notes — API layering, DB schema, folder structure

Status: BFF decision, DB schema ownership, Review Queue model, tenant isolation model, and module sequencing have been merged into `CODING_GUIDELINES.md`. Remaining open items below.

## Open

1. **Notification bell/TopBar screen** — hold off until `Common.Notifications` is decided, or build a placeholder now?
2. **`Common.Notifications` module** — does the suspension-notification requirement (2nd consumer of "notify tenant admin" after OrgDashboard rate-limit cards) justify creating this now, per the `Common` promotion rule (promote after 2x duplication)?
3. **API granularity / mapping APIs to Angular routes** — not yet drafted. Once schema ownership is settled (done) and each module's screens are approved, map each screen's route code to the domain service(s) and specific endpoints it calls.
4. **D2 screen re-scope** — "Approvals across orgs" needs to move to Org persona / become read-only for DL, per the Review Queue model. Not yet done in Claude Design.
