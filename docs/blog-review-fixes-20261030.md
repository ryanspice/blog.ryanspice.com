# Blog review remediation — 2026-10-30

The independent Sol xhigh review requested changes on four findings. This is the
lead's remediation record, not a replacement for that review or live acceptance.

| Finding | Change | Focused verification |
| --- | --- | --- |
| P1: private root could contain the document root | Resolved public and private trees must be disjoint in both directions | PHP root-policy probe rejects equality, private-inside-public, and public document roots under private `articles/` or `briefs/` |
| P2: public-path aliases below private output could be deleted | Generator resolves every protected path and rejects containment in either direction before replacement | Build-alias and static-junction fixtures both fail closed and preserve public sentinel files |
| P2: query navigation retained stale selection/filters | Query fields derive from browser `page.url`; `afterNavigate` refreshes selection; request sequence ignores old responses | Mounted synthetic draft/brief list → preview → list, query filters, and deliberately delayed old-response tests |
| P2: metadata failures were replaced by redirects | Preview sends a JSON POST to the existing guarded action and displays returned failure/success; native form fallback preserves status/message | Actual fixture PHP action tests missing token for HTML/JSON (400, no redirect), synthetic owner save (200), plus mounted feedback tests |

The metadata action's existing owner mapping and validation remain unchanged.
Tokens are added to the POST body in memory; no reusable token is placed in a
URL or hidden DOM input. Plain form responses display the action message with
`no-store` instead of redirecting through the GET preview loader. Preview GET
navigation retains the legacy redirect. A selected draft's controls are keyed
by slug so save feedback cannot carry into another article.

The mounted UI tests use a fresh headless browser, an isolated synthetic source
workspace, a test-only auth module and intercepted endpoint/action responses.
They cannot establish Microsoft sign-in or authorize a real owner. Separate
PHP HTTP fixtures exercise the actual guard and action with fake Graph responses
and a synthetic configured owner; successful metadata writes affect fixture
Markdown only. The fixture server's extra filesystem allowance is restricted to
its workspace and shared dependencies on loopback; production Vite config is
unchanged.

The first remediation build rejected reading query parameters during prerender.
Browser-only derived query reads fixed that source issue. Initial mounted tests
then exposed fixture dependency serving and missing synthetic owner configuration;
those were corrected only in the test harness. Earlier failure receipts remain
in ignored local output alongside the final reports.

After the fixes, Svelte checks report 0 errors/warnings, unit tests pass 23/23,
scoped PHP lint and JavaScript syntax checks pass, and the full isolated blog
build and SEO audit pass again. The expanded suite passes 116 checks, including
mounted navigation and save feedback. The final 903-file real-build scan found
no complete private HTML bodies, exact private slug fields or private preview
URLs among 46 private items, and the merged CSP matched the source policy. This
scan supplements synthetic marker tests; it is not a global confidentiality
guarantee. Generated
social-image source changes were saved privately and restored by exact hash;
they are excluded from this repair.

The focused independent recheck resolved the root-overlap, mounted navigation
and metadata feedback findings. It found one additional generator edge case:
the helper treated every relative name beginning with `..` as outside its
parent. The lead corrected the test to recognize only the complete parent
segment (`..` or `..` followed by the platform separator). New negatives cover
both `..public-*` aliases and a public build's `..private-payload` child. The
116-check suite passes with those cases; rejected aliases preserve their public
sentinels. The original reports retain their dispositions at the reviewed
revisions. This final small helper correction is lead-verified remediation,
not a claim of a new independent approval or live browser/provider acceptance.

Production remains gated on private installation, actual root/alias/permission
and header verification, real Microsoft/browser/owner and denied-other-account
acceptance, and retirement of old exposed assets. CSP remains a candidate fix
for the reported failure, not an exclusive diagnosis. The mailbox campaign hold
and the dirty synced-source boundary remain in effect.
