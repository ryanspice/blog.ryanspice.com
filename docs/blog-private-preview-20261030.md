# Private previews and Microsoft sign-in repair

## Objective and evidence

The existing draft list imported raw draft Markdown into browser code after a
client sign-in gate. That did not protect generated assets. This change builds
only public articles and independently public version snapshots into the public
catalog. Drafts and morning briefs move to a separate private payload served by
the PHP owner endpoint. The public status response no longer includes draft
counts or private paths. Legacy draft and brief URLs redirect to their owner
list instead of returning the public homepage.

The reported `post_request_failed` and the observed live `connect-src 'self'`
policy are consistent with blocked MSAL authority requests. The actual failed
browser request has not been captured. The only added connection origin is
`https://login.microsoftonline.com`; other CSP directives are preserved. Graph
requests remain server-side. A source fix is not proof of a repaired live login.

## Contracts and ownership

- `/drafts/owner/private/` verifies the Microsoft Graph token against the
  existing owner mapping before reading draft or brief data. Missing or invalid
  tokens, other accounts, missing owner configuration and unsafe roots deny.
- `kind=articles` is the default; `kind=briefs` selects briefs. Other kinds and
  traversal fail. Bodies and lists use `no-store` and `Vary: Authorization`.
- `BLOG_PRIVATE_CONTENT_ROOT` must be an absolute existing directory outside the
  actual document root. A missing or unresolvable document root fails closed.
  The guard must resolve inside the private root. Node development returns 503;
  PHP-static is the supported private-content runtime.
- `Build-PrivateContent.mjs` writes outside `build/`, `static/` and `src/`, rejects
  directory links and ancestor destinations, and refuses replacing an unrelated
  directory. POSIX directories use 0700 and files 0600. Host ACLs still require
  verification on Windows. Never upload this directory as a static artifact.
- The existing owner mapping in `src/lib/auth.ts` and the PHP metadata action is
  preserved. This repair does not migrate that legacy mapping to a new stable
  identifier. A future migration needs private verified issuer/tenant/object
  evidence and separate review.
- Publication and scheduling rules remain in `article-publication.ts`; every
  version must independently satisfy them. No article metadata is changed here.
  The mailbox campaign remains on hold. No draft publication or communication
  is authorized by this repair.

## Verification

Lead integration is isolated from the dirty synced source and based on upstream
`4721953763623422375875f92a6e3f96ad7bef58`. Packet before hashes matched. The
synced checkout, its unpublished mailbox article and unrelated edits were not
modified. Worker evidence is separate from these lead checks:

- `pnpm run check`: 0 errors, 0 warnings.
- `pnpm run test:unit`: 23 tests pass.
- `pnpm run test:confidentiality`: synthetic public/private/version fixtures,
  complete generated assets, direct endpoint HTML/JSON paths, owner/anonymous/
  invalid/revoked/non-owner cases, traversal, missing config, root containment,
  directory-link rejection and CSP source/build policy checks. The graph service
  in this suite is synthetic. The explicit test router and disabled native URL
  streams enforce that boundary; the first Linux CI fixture failure and its
  correction are recorded in the review-fixes receipt.
- `pnpm run build:blog -SkipAdapterSync -RuntimeRoot <isolated-output>` passed
  with the committed adapter and real source catalog, including social images.
  Adapter synchronization was deliberately skipped to avoid changing another
  checkout or importing unpublished adapter edits.
- `pnpm run audit:files` and `BLOG_BUILD_DIR=<isolated-build> pnpm run audit:seo`
  pass. The first source audit expected removed server loaders; its route list
  now requires their PHP/redirect replacements.
- Svelte MCP reviewed all six changed components without remaining suggestions.

The check workflow uses synthetic identity inputs, read-only token permissions,
pinned actions and no production secrets. It includes the isolated
confidentiality suite and uploads no private payload. PR creation does not
trigger the existing production-branch deployment workflow.

## Release gates and rollback

The independent review's four findings and the lead fixes are recorded in
[blog-review-fixes-20261030.md](blog-review-fixes-20261030.md). Directory trees
must be disjoint in both directions. The test suite additionally covers mounted
query navigation, stale responses and metadata-save feedback.

Do not activate this source PR until independent review, CI and a deployment
plan for separately installed private content are accepted. Verify the actual
document root, PHP/Apache authorization-header forwarding, header layers,
private file permissions, current owner configuration and exact callback.
Capture the actual browser failure and test owner sign-in, denied other account,
callback, list and preview on the deployment. Keep source, synthetic runtime,
browser/provider and human acceptance as separate receipts.

Inventory and retire old exposed builds and cached private chunks at the origin
and CDN. A clean new build cannot retract content that was previously downloaded
or establish that old assets are unreachable. Never advertise a confidential
preview while the deployment or old-asset retirement gate remains open.

No production changes were made. Before deployment, record exact source/build
hashes and host-key-verified backups. Rollback uses the reviewed source revision
and exact-file restoration only when the current hashes still match. Preserve
private configuration, owner mapping, sessions, draft edits and unrelated work.
Do not restore the old client-bundled drafts as an automatic rollback: keep
private previews denied while a confidentiality-safe revision is prepared.
