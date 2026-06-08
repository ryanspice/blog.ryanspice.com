# Concerns

## Operational concerns observed during catalog pass

- Playwright desktop catalog run reports `ERR_CONNECTION_REFUSED` on a subset of article routes when navigated sequentially under the same browser session.
- Mobile catalog captures show frequent `Navigation interrupted by another navigation to ...` during route transitions.
- Some cataloged route titles in mobile failures reflect the previously loaded page, indicating runtime redirects/churn during catalog execution.

## Runtime resilience concerns

- The article page path currently performs heavy rendering and markdown processing; full-page screenshots can fail when documents are long (historically due to viewport capture limits), so capture strategy currently depends on defensive fallback behavior.
- Multiple catalog entries are captured but marked with route-level errors, so success should be interpreted as “best-effort screenshot + diagnostics,” not guaranteed complete navigation fidelity.
- `login` and `drafts` logic depends on browser session and MSAL availability; automation that visits these routes is environment-sensitive.

## Maintenance and documentation concerns

- README text appears partially historical (example mentions specific counts/examples) and should be checked against current routing and content state.
- No local template bundle exists for this `acquire-codebase-knowledge` skill in this checkout, so docs were manually produced from evidence files.

## Evidence

- `tests/e2e/website-catalog.spec.ts`
- `docs/website-catalog/desktop-catalog.json`
- `docs/website-catalog/mobile-catalog.json`
- `README.md`
- `src/lib/auth.ts`
- `src/routes/login/+page.svelte`
- `src/routes/drafts/+page.svelte`

## Open intent vs reality checks

- `[ASK USER]` Do we want to block this catalog workflow on navigation failures, or keep it permissive and report failures inline as diagnostics only?
- `[ASK USER]` Should cataloging include auth-protected routes (`/drafts`, `/login`) with mocked auth, or should they stay excluded from automated capture?
- `[ASK USER]` Is it acceptable to treat README statements as intent hints while `actual` source-of-truth is current route + script behavior for CI and audits?
