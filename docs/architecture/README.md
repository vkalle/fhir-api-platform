# Architecture reference docs

Reference material informing `CODING_GUIDELINES.md`, kept here rather than inline for anything too long to belong in the guideline itself.

- Audit approach and naming conventions are adapted from the Datalink/Nova platform's audit framework — proven in a HIPAA-covered production system. Scoped down for this project's current stage; see `CODING_GUIDELINES.md` § Audit for the phase split (core now vs. infra later).
- Hierarchy search (PathString + search-index pattern) is adapted from the Datalink hierarchy scaling work — documented as the future pattern for Tenants/SubTenants, not built yet.
