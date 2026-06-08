# Testing

## Current test stack

- Unit tests: Vitest (`vitest.config.ts` includes `tests/unit/**/*.test.ts` with Node environment).
- E2E tests: Playwright (`tests/e2e/`).
- One unit coverage test currently checks locale path helper behavior (`tests/unit/article-routing.test.ts`).
- One behavior test currently checks article layout on mobile (`tests/e2e/article-mobile.spec.ts`).

## Web catalog automation

- Route screenshot suite is in `tests/e2e/website-catalog.spec.ts`.
- Browser projects:
  - `catalog-desktop` (1600x2200, Desktop Chrome)
  - `mobile` (iPhone 14)
- Output artifacts:
  - `docs/website-catalog/desktop-catalog.json`
  - `docs/website-catalog/mobile-catalog.json`
  - screenshot files in `docs/website-catalog/screenshots/`

## Commands

- `pnpm run test:unit`
- `pnpm run test:mobile` (unit + e2e mobile route test)
- `pnpm run test:e2e -- tests/e2e/website-catalog.spec.ts --project=catalog-desktop`
- `pnpm run test:e2e -- tests/e2e/website-catalog.spec.ts --project=mobile`

## Evidence

- `vitest.config.ts`
- `playwright.config.ts`
- `tests/unit/article-routing.test.ts`
- `tests/e2e/article-mobile.spec.ts`
- `tests/e2e/website-catalog.spec.ts`
- `docs/website-catalog/desktop-catalog.json`
- `docs/website-catalog/mobile-catalog.json`

## Open intent vs reality checks

- `[ASK USER]` Should the catalog spec be promoted to a permanent CI artifact gate, or remain a manual verification step?
- `[TODO]` No test exists that validates all non-public/article content pages are present in the catalog outputs after publish. Add if catalog is to be treated as release-quality evidence.
