# blog.ryanspice.com deployment notes

Version: 0.1.5

## Setup

Copy the example config and edit only local values:

```powershell
cd "<AI_WIKI_ROOT>\07_Projects\blog.ryanspice.com"
Copy-Item .\deploy.config.example.json .\deploy.config.json -Force
notepad .\deploy.config.json
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
  - The **document root** for `blog.ryanspice.com`.
  - This is often shown in cPanel **relative to your home directory**, so it may look like `domains/ryanspice.com/public_html/blog` (no leading `/`).
  - Common values look like `public_html/blog` or `domains/ryanspice.com/public_html/blog`.
  - In cPanel: Domains → find `blog.ryanspice.com` → read “Document Root”.

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

This builds with `PUBLIC_BASE_PATH=""` by default. To build for a subpath, pass a base path:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Build-BlogStatic.ps1 -BasePath "/blog" -Clean
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

## Activate uploaded release

After checking the parallel release:

```powershell
pnpm run deploy:activate
```

Activation backs up the current remote blog folder to `_backups/live-<release-id>.tar.gz`, keeps `_incoming`, `_releases`, `_backups`, `.well-known`, and `cgi-bin`, then copies the chosen release into the live blog folder (including the repo-managed `.htaccess`).

## Runtime dependency repair

The v0.1.0 installer tried to create `node_modules` as a junction before pnpm ran. On Windows/OneDrive, pnpm can fail with `ENOTDIR` in that shape. Use:

```powershell
pnpm run setup:runtime
```

This keeps the heavy pnpm store and virtual store in `B:\AI-Wiki\.runtime\projects\blog.ryanspice.com`, while allowing pnpm to own the lightweight project `node_modules` linker folder.

## Remote path safety

The deploy script refuses broad paths like `.` by default. If your SSH account lands directly inside the blog folder, run the script manually with `-AllowBroadRemotePath` after confirming the account is truly scoped to the blog folder.


