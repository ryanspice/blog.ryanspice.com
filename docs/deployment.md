# Blog deployment notes

Version: 0.1.0

This repo builds two production targets from the same content source:

- `blog.ryanspice.com` uses the Ryan-themed shell.
- `blog.canopydigital.ca` uses the lightweight Canopy-themed shell.

The SvelteKit routes, Markdown articles, RSS, sitemap generation, and PHP-static adapter are shared. The build flavor is selected at build time with `PUBLIC_SITE_ID`.

## Setup

Copy the example config and edit only local values:

```powershell
cd "<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com"
Copy-Item .\deploy.config.example.json .\deploy.config.json -Force
notepad .\deploy.config.json
```

For the Canopy subdomain, use a separate ignored local config:

```powershell
Copy-Item .\deploy.canopy.config.example.json .\deploy.canopy.config.local.json -Force
notepad .\deploy.canopy.config.local.json
```

`deploy.config.json` is ignored by git. Do not commit keys, passwords, or host secrets.

## SSH key setup (cPanel)

This deploy flow assumes **key-based SSH**:

- Public key (`*.pub`) gets uploaded and authorized on the server.
- Private key (no extension) stays on your machine and is referenced by `deploy.config.json` `keyPath`.

If you only have a `*.pub` file, you **cannot** SSH with it — you need the matching private key file.

Typical cPanel flow:

1. cPanel → **SSH Access** → **Manage SSH Keys**
2. **Import Key**
3. Paste the contents of your local `*.pub` file
4. Click **Import**, then **Authorize**

Local key to use with this repo by default:

```txt
<USER_HOME>\.ssh\<DEPLOY_KEY_NAME>      (private key)
<USER_HOME>\.ssh\<DEPLOY_KEY_NAME>.pub  (public key you upload)
```

## Find the right SSH username + document root

Two values must be correct in `deploy.config.json`:

- `user`
  - Usually your **cPanel account username** (not an email address).
  - In cPanel, it’s commonly shown in the sidebar / “General Information”.
- `remotePath`
  - The **document root** for the target domain.
  - This is often shown in cPanel **relative to your home directory**, so it may look like `domains/ryanspice.com/public_html/blog` (no leading `/`).
  - Common values look like `public_html/blog` or `domains/ryanspice.com/public_html/blog`.
  - In cPanel: Domains → find `blog.ryanspice.com` or `blog.canopydigital.ca` → read “Document Root”.
  - The current Canopy target should use `domains/blog.canopydigital.ca/public_html` unless cPanel shows a different relative path.

## Test SSH connection

Once the key is authorized and `deploy.config.json` is correct:

```powershell
cd "<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com"
pnpm run deploy:test
```

## Build for `https://blog.ryanspice.com/` (domain root)

```powershell
pnpm run build:blog
```

## Build for `https://blog.canopydigital.ca/` (domain root)

```powershell
pnpm run build:blog:canopy
pnpm run audit:seo
```

This sets `PUBLIC_SITE_ID=canopy` during the build and rewrites public site metadata to `https://blog.canopydigital.ca`. It does not duplicate the article source.

This runs a clean PHP-hosted release build with `PUBLIC_BASE_PATH=""` by default and uses the committed vendored adapter. To build for a subpath, pass a base path:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Build-BlogStatic.ps1 -BasePath "/blog" -Clean
```

The build output now includes `index.php`, adapter-generated `.htaccess` rules, and the redirect overlay from `static/.htaccess`.
It also verifies the PHP adapter contract: `router.php`, `_runtime/compat.php`, `_protected/.htaccess`, `_app/version.json`, and `adapter/route-manifest.php`.

## Release checklist

Use this order before any commit/push/deploy:

1. `pnpm run verify:production`
2. Smoke the build with PHP against `build/router.php` and check `/`, a representative article route, `/rss.xml`, `/sitemap.xml`, `/_app/version.json`, one missing route, and one protected runtime denial
3. For the full local gate, also run `pnpm run test:e2e` and `pnpm run deploy:test`
4. Confirm the contract files exist:
   - `index.php`
   - `.htaccess`
   - `router.php`
   - `_runtime/compat.php`
   - `_protected/.htaccess`
   - `_app/version.json`
   - `adapter/route-manifest.php`
5. Deploy with the checked-in vendored adapter artifact only

To refresh the vendored adapter from the canonical source, pass the adapter root explicitly or set `SVELTEKIT_PHP_ADAPTER_ROOT`. The default build path does not touch a local adapter checkout, which keeps GitHub Actions and local release builds deterministic.

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Sync-SvelteKitPhpAdapter.ps1 -AdapterRoot "<SVELTEKIT_PHP_ADAPTER_ROOT>"
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Build-BlogStatic.ps1 -AdapterRoot "<SVELTEKIT_PHP_ADAPTER_ROOT>" -Clean
```

## Upload parallel release

This uploads a parallel release folder under the remote `remotePath` without overwriting the live root:

```powershell
pnpm run deploy:parallel
```

That uploads to something like:

```txt
https://blog.ryanspice.com/_releases/<release-id>/
```

It does **not** overwrite the live blog root.

For a local Canopy parallel upload after building the Canopy target:

```powershell
pnpm run build:blog:canopy
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Deploy-BlogStatic.ps1 -ConfigPath .\deploy.canopy.config.local.json -Apply
```

Add `-Activate` only after checking the parallel release URL. While DNS/SSL is still settling, use the hosting control panel path and release folder to verify files instead of assuming the public hostname resolves.

## Activate uploaded release

After checking the parallel release:

```powershell
pnpm run deploy:activate
```

Activation backs up the current remote blog folder to `_backups/live-<release-id>.tar.gz`, verifies that archive before touching the live files, keeps `_incoming`, `_releases`, `_backups`, `.well-known`, and `cgi-bin`, then copies the chosen release into the live blog folder (including the merged repo-managed `.htaccess` and `index.php` entrypoint).

Backups under `_backups` must stay compressed. During activation, legacy backup directories are converted to `.tar.gz` archives and removed. Any remaining uncompressed backup artifact makes the deploy fail before activation continues.

## Runtime dependency repair

The v0.1.0 installer tried to create `node_modules` as a junction before pnpm ran. On Windows/OneDrive, pnpm can fail with `ENOTDIR` in that shape. Use:

```powershell
pnpm run setup:runtime
```

This keeps the heavy pnpm store outside the synced project folder, while keeping `node_modules\.pnpm` local to the worktree. The virtual store must not cross drives because SvelteKit/Rollup uses dependency realpaths when naming SSR entries.

## GitHub branches and production deploy

The workflow at `.github/workflows/deploy-blog.yml` deploys on pushes to `production` and can also be run manually with `workflow_dispatch`.

Branch rules:

- `main` is the working integration branch.
- Feature work branches from `main`.
- `main` and pull requests run tests only through `.github/workflows/test-blog.yml`.
- Production deploys happen only after code reaches `production`.
- A `production` deploy builds and activates both `blog.ryanspice.com` and `blog.canopydigital.ca` with the same release id.

Required repository secrets:

- `BLOG_DEPLOY_HOST`
- `BLOG_DEPLOY_USER`
- `BLOG_DEPLOY_PATH`
- `VITE_MSAL_CLIENT_ID`
- one of `BLOG_DEPLOY_KEY_B64` or `BLOG_DEPLOY_KEY`

Required for Canopy only if it does not share the Ryan SSH host/user:

- `CANOPY_BLOG_DEPLOY_HOST`
- `CANOPY_BLOG_DEPLOY_USER`

The Canopy deploy path defaults to `domains/blog.canopydigital.ca/public_html`, but you can override it with:

- `CANOPY_BLOG_DEPLOY_PATH`

Optional repository secrets:

- `BLOG_DEPLOY_PORT`
- `VITE_MSAL_TENANT_ID` (defaults to `common`)
- `VITE_MSAL_REDIRECT_URI`
- `VITE_OWNER_EMAIL_SHA256`
- `VITE_OWNER_ACCESS_LABEL`
- `BLOG_OWNER_EMAIL_SHA256`
- `BLOG_PUBLIC_URL`
- `BLOG_BASE_PATH`
- `PUBLIC_SITE_URL`
- `PUBLIC_BASE_PATH`
- `CANOPY_BLOG_DEPLOY_PORT`
- `CANOPY_BLOG_PUBLIC_URL`
- `CANOPY_BLOG_BASE_PATH`

The workflow validates required production config, runs `audit:files`, unit tests, typecheck, the Ryan PHP build/audit/deploy, then the Canopy PHP build/audit/deploy. It uses the committed vendored `adapter/` artifact; GitHub Actions cannot access your local adapter checkout, so sync the adapter locally before committing adapter changes.

## Remote path safety

The deploy script refuses broad paths like `.` by default. If your SSH account lands directly inside the blog folder, run the script manually with `-AllowBroadRemotePath` after confirming the account is truly scoped to the blog folder.


