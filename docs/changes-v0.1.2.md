# v0.1.2 changes

- Fixed pnpm externalization by replacing the pre-install `node_modules` junction with external `store-dir` and `virtual-store-dir` config.
- Added `scripts/Repair-PnpmExternalization.ps1`.
- Added `scripts/Build-BlogStatic.ps1` for `/blog` static builds.
- Added `scripts/Deploy-BlogStatic.ps1` for SSH upload, parallel releases, and optional activation.
- Added `deploy.config.example.json`.
- Updated routes so the app can deploy under `https://ryanspice.com/blog/` without generating `/blog/blog/...` public URLs.
- Added package scripts: `setup:runtime`, `build:blog`, `deploy:plan`, `deploy:parallel`, `deploy:activate`, and `publish:parallel`.

- Fixed remote shell quoting in the SSH deploy script.
