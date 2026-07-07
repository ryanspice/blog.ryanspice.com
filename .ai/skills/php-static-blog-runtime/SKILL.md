---
name: php-static-blog-runtime
description: Reviews the blog PHP-static runtime, including PHP 8.1 shared-hosting assumptions, +page.server.php mirrors, generated .htaccess/router behavior, MIME and fallback safety, adapter sync, and deployment-secret hygiene. Use when editing or auditing PHP runtime files, deploy scripts, adapter output, or PHP-hosted smoke behavior.
---

# PHP Static Blog Runtime

Use this skill for `blog.ryanspice.com` PHP-hosting work.

## Runtime contract

- Production uses the vendored SvelteKit PHP adapter in `php-static` mode.
- The canonical adapter source is `B:\Dev\sveltekit-php`; the blog vendors `adapter/index.js` and `adapter/src/runtime/php-compat.php`.
- `adapter/source-manifest.json` records source commit, package version, dirty state, hashes, and copied files.
- The default build path must use the committed vendored adapter. Only sync from the canonical adapter when explicitly reviewing or updating adapter output.

## Review focus

- Keep `src/routes/+page.server.php` in sync with the TypeScript homepage load contract, including locale, UI labels, paths, alternates, and article ordering.
- Treat `.env`, deploy configs, SSH values, and owner identity values as private; never print secrets or commit local config.
- Verify generated runtime files: `index.php`, `.htaccess`, `router.php`, `_runtime/compat.php`, `_protected/.htaccess`, `_app/version.json`, and `adapter/route-manifest.php`.
- Missing asset-like paths must not receive route fallback HTML.
- PHP mirrors and generated runtime helpers should target PHP 8.1+ compatibility unless the repo explicitly raises the floor.

## Verification

```powershell
pnpm run build:blog
php -l .\src\routes\+page.server.php
pnpm run audit:seo
```

For runtime smoke, serve `build` with PHP and check `/`, a representative article, `/rss.xml`, `/sitemap.xml`, `/_app/version.json`, one missing route, and one protected runtime path.
