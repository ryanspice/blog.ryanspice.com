# Translation Viability Audit

Date: 2026-06-05

Scope:

- `blog.ryanspice.com`
- the local `sveltekit-php` adapter checkout
- a local Lancaster SvelteKit reference implementation

This is a viability pass, not a runtime migration. The goal is to decide whether the blog and the PHP adapter can support translations cleanly, what is missing, and where a larger LLM should sit in the workflow.

## Executive Read

Translation support is viable for both `blog.ryanspice.com` and `sveltekit-php`, but the work should be split by ownership:

- The blog should own locale routing, translated content, dictionaries, SEO alternates, localized feeds, and publication rules.
- `sveltekit-php` should own proof that locale-prefixed SvelteKit output survives PHP-static routing, base paths, `__data.json`, actions, content negotiation, and Apache/PHP rewrite behavior.
- A larger LLM should sit in the content pipeline before publication, not in the runtime adapter. Runtime translation would create SEO, latency, cache, and review-risk problems.

The best first target is `en` as the default root language and `fr` or `fr-CA` behind a prefix such as `/fr/...`, matching Lancaster's current pattern.

## External Best-Practice Baseline

- Svelte's official Paraglide add-on is the current SvelteKit-oriented i18n option. It is compiler-based, emits tree-shakable message functions, supports type safety, avoids async message waterfalls, and wires SvelteKit `reroute` plus `handle` hooks, `lang`, and text-direction handling. Reference: [Svelte CLI Paraglide docs](https://svelte.dev/docs/cli/paraglide).
- SvelteKit routing supports filesystem routes, dynamic parameters, optional parameters such as `[[lang]]`, param matchers under `src/params`, and hooks/reroute for translated URLs. References: [Routing](https://svelte.dev/docs/kit/routing), [Advanced routing](https://svelte.dev/docs/kit/advanced-routing), [Hooks](https://svelte.dev/docs/kit/hooks).
- Static/prerendered sites must keep SSR enabled and ensure every public page/endpoint is prerendered unless a fallback is intentionally used. Reference: [SvelteKit static site generation](https://svelte.dev/docs/kit/adapter-static).
- SvelteKit SEO guidance favors SSR, normalized URLs, unique page titles/descriptions, and sitemap endpoints for content sites. Reference: [SvelteKit SEO](https://svelte.dev/docs/kit/seo).
- Google recommends explicitly marking localized versions with `hreflang`, using fully qualified URLs, making every language version list itself and its alternates, and keeping alternates bidirectional. It also notes that `hreflang` and `html lang` are not how Google detects page language. Reference: [Google Search Central localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions).
- W3C guidance treats language tags as the shared identifier for `lang`, `hreflang`, `Accept-Language`, and `Content-Language`; choose the shortest tag that distinguishes the audience. Reference: [W3C language tags in HTML and XML](https://w3c.github.io/i18n-drafts/articles/language-tags/index.en.html).
- MDN documents `rel="alternate"` plus `hreflang` as indicating a translated alternate representation. Reference: [MDN rel attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel).

## Lancaster Reference Pattern

Lancaster is the useful local model because it has already solved the main SvelteKit shape:

- `src/lib/content/locales.ts` defines `DEFAULT_LOCALE`, `SUPPORTED_LOCALES`, and the `SupportedLocale` type.
- `src/params/lang.ts` validates language route params.
- `src/hooks.server.ts` preserves `/fr` prefixes while canonicalizing aliases, host, protocol, city slugs, and service routes.
- `src/lib/server/content/routes.server.ts` provides locale resolution, localized paths, and alternate link helpers.
- `src/lib/server/content/locales.server.ts` merges fallback dictionaries and sends only route-relevant dictionary sections to the client.
- `src/routes/(web)/+layout.server.ts` resolves locale from `url.pathname`, returns `locale`, `localeDictionary`, and localized header/footer data.
- `src/lib/utils/translate.ts` keeps component usage small through key lookup and interpolation.
- Its scripts add important guardrails: i18n bundle verification, route i18n usage audit, locale dictionary key audit, and payload threshold checks.

Important caveat: Lancaster currently has comments in header/footer logic that only homepage translation is complete in some navigation paths. Treat Lancaster as an architecture reference, not as evidence that every translated route is production-complete.

## Current Blog Viability

The blog is structurally close to viable because it is already prerender-oriented and content-driven:

- It runs SvelteKit 2.49.1 and Svelte 5.45.6.
- `svelte.config.js` uses the local PHP adapter in `php-static` mode with `prerender.entries` covering public endpoints and routes.
- The content layer is already centralized in `src/lib/articles.ts`, `src/lib/content/articles`, markdown parsing, RSS generation, and article card/view components.
- Public pages already centralize SEO in page-level `<svelte:head>` blocks.

The main blockers are content model and metadata, not framework capability:

- `src/app.html` hard-codes `<html lang="en">`.
- `src/lib/rss-friendly-html.ts` also hard-codes `<html lang="en">`.
- `src/routes/rss.xml/+server.ts` hard-codes `<language>en</language>`.
- There is no `src/params/lang.ts`, locale registry, dictionary loader, or route-level locale resolver.
- Most navigation labels, status/auth/RSS copy, and article shell copy are hard-coded in Svelte components.
- Article markdown frontmatter has no locale fields such as `locale`, `translation_of`, `canonical_slug`, or `translations`.
- The PHP homepage mirror in `src/routes/+page.server.php` parses one English article corpus and would need the same locale-aware content selection as the TypeScript path.
- Sitemap and RSS alternates are not locale-aware yet.

Recommended blog architecture:

- Keep default English at root: `/`, `/dev-log/`, `/some-article/`.
- Add prefixed translated pages: `/fr/`, `/fr/dev-log/`, `/fr/some-article/`.
- Add `src/lib/i18n/locales.ts` with `DEFAULT_LOCALE`, `SUPPORTED_LOCALES`, `localeToLanguageTag`, and `localePrefix`.
- Add `src/params/lang.ts` for route validation.
- Add `src/lib/server/i18n.ts` for `resolveLocaleFromPathname`, `stripLocalePrefix`, `pathWithLocale`, and `getLocalizedAlternates`.
- Add dictionary files for shared UI shell strings first, then migrate page copy in batches.
- Add article frontmatter fields: `locale`, `translation_of`, `translation_status`, `canonical_slug`, `translated_slug`, and `translations`.
- Keep translated markdown physically separate from English source, for example `src/lib/content/articles/fr`.
- Generate localized canonical, `hreflang`, and sitemap entries only for pages where the main content is translated.
- Generate separate locale feeds if translated articles are published: `/rss.xml` for English and `/fr/rss.xml` for French.

## Current sveltekit-php Viability

The adapter should be able to support translated SvelteKit output if the app prerenders explicit locale URLs. It already has useful primitives:

- Route manifest generation for prerendered pages and endpoints.
- Base path stripping and reconstruction in PHP router code.
- Static file serving, extensionless matching, directory index serving, and `__data.json` to `__data.php` mapping.
- SvelteKit-style page/endpoint content negotiation with `Vary: Accept`.
- Apache `.htaccess` generation and PHP built-in server router generation.

The adapter's missing i18n proof is test coverage and examples:

- No locale-prefixed route fixture such as `/fr/`, `/fr/blog/[slug]`, or `/fr/rss.xml`.
- No test proving localized `__data.json` maps to the correct `__data.php` under a locale prefix and optional base path.
- No test proving route manifest regexes and PHP param maps preserve locale params.
- No test proving `basePath + localePrefix` works together, for example `/blog/fr/article/`.
- No fixture with `src/params/lang.ts` to prove param matchers and locale params survive adapter output.
- No proof for localized alternates in prerendered HTML or sitemap XML.
- No explicit docs telling consumers that the adapter should not decide the locale at runtime unless their app deliberately implements negotiation.

Recommended adapter work:

- Add a small i18n fixture app with `SUPPORTED_LOCALES = ['en', 'fr']`.
- Include routes for `/`, `/fr/`, `/blog/[slug]`, `/fr/blog/[slug]`, `/rss.xml`, and `/fr/rss.xml`.
- Include one `+page.server.php` load and one TypeScript/JS load so both adapter modes are covered.
- Verify `php-static` with fixed root base and subdirectory base.
- Verify `__data.json`, action routes, direct page loads, and endpoint content negotiation.
- Document that adapter-level language negotiation is optional and should be avoided for SEO-sensitive static pages unless the app emits stable canonical URLs and `Vary: Accept-Language`.

## Where a Larger LLM Belongs

Use a larger LLM as a pre-publication translation and review assistant:

- Extract candidate UI dictionary keys from Svelte components.
- Translate article markdown drafts into locale folders.
- Preserve code blocks, command snippets, frontmatter, citations, URLs, and product names.
- Produce a bilingual diff report for human review.
- Generate translated title, summary, social metadata, RSS description, and `hreflang` alternate candidates.
- Check terminology consistency against a project glossary.
- Flag untranslated English strings after migration.

Do not put the larger LLM in the PHP adapter runtime:

- Runtime translation breaks deterministic prerendering and cacheability.
- It creates latency and cost on every request.
- It risks publishing unreviewed translations.
- It makes `hreflang`, canonical URLs, RSS, sitemap, and social previews unstable.

The right shape is a script or AI Wiki command that outputs draft translation files and review artifacts, then the SvelteKit build consumes only approved content.

## Suggested Rollout

1. Add locale infrastructure without translating articles yet.
2. Move shared shell strings into dictionaries and prove `/` plus `/fr/` render stable localized UI.
3. Add canonical and `hreflang` helpers, but emit alternates only when both page versions exist.
4. Add localized sitemap and RSS handling.
5. Add adapter fixture coverage in `sveltekit-php`.
6. Add LLM-assisted translation scripts for article drafts.
7. Translate a small pilot set: homepage shell, RSS reader, one technical article, and one dev-log entry.
8. Add audits for missing keys, missing alternates, untranslated English, and payload growth.

## Viability Verdict

- `blog.ryanspice.com`: high viability, medium implementation effort. The risk is not SvelteKit; it is keeping article metadata, RSS, sitemap, PHP mirrors, and SEO alternates consistent.
- `sveltekit-php`: high viability as a transport/runtime adapter, low-to-medium implementation effort. The gap is proof coverage for locale-prefixed routes, base paths, and data files.
- Lancaster: good architectural reference, especially for locale registry, route helpers, layout data, serialized dictionary subsets, and i18n audits.
- Larger LLM: useful for translation generation and review, but should remain upstream of build artifacts and never become a live adapter concern.
