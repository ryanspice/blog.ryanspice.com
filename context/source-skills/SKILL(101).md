# Windows TAR package installer workflow

## Purpose

Use this skill when creating or applying downloadable project packages for Ryan's Windows workflow.

The preferred pattern is:

- provide a single `.tar.gz` artifact;
- include one internal installer script in the archive;
- give one copy-paste PowerShell block that extracts the TAR and runs the internal installer;
- put generated project/code output under `B:\Dev` when practical;
- keep downloads and temporary extraction under `B:\Temp\@Browser`;
- avoid separate `.ps1` download links unless the fix is tiny and script-only.

## Default roots

```powershell
$DownloadsRoot = "B:\Temp\@Browser"
$DevRoot = "B:\Dev"
$AiWikiRoot = "<AI_WIKI_ROOT>"
```

## Standard package shape

```txt
package-name-v0.1.0.tar.gz
package-name-v0.1.0/
  README.md
  install-package-name-v0.1.0.ps1
  cleanup-package-name-v0.1.0.ps1      # optional
  scripts/
  docs/
  src/                                 # optional
```

## Standard copy-paste installer block

```powershell
cd B:\Temp\@Browser

$Archive = "B:\Temp\@Browser\package-name-v0.1.0.tar.gz"
$Work = "B:\Temp\@Browser\package-name-v0.1.0"

if (Test-Path $Work) { Remove-Item $Work -Recurse -Force }
tar -xzf $Archive -C "B:\Temp\@Browser"

pwsh -NoProfile -ExecutionPolicy Bypass -File "$Work\install-package-name-v0.1.0.ps1" -Apply -Open
```

## Parameterized reusable wrapper

Use `scripts/Install-TarPackage.ps1` from this skill when a package should be installed to a categorized `B:\Dev` location.

Example:

```powershell
$Installer = "<AI_WIKI_ROOT>\04_skills\generated\windows-tar-package-installer-workflow\scripts\Install-TarPackage.ps1"

pwsh -NoProfile -ExecutionPolicy Bypass -File $Installer `
  -Archive "B:\Temp\@Browser\webos-shell-v0.2.0.tar.gz" `
  -ProjectName "webos-shell" `
  -Category "webos" `
  -InstallToDev `
  -RunInternalInstaller `
  -Apply `
  -Open
```

This extracts to temp, prunes dependency/build folders, mirrors package contents to `B:\Dev\<Category>\<ProjectName>`, then optionally runs the internal installer.

## Categories

Use short category names when useful:

```txt
android
webos
pixelboats
ai-wiki
tools
client
experiments
```

Default output with category:

```txt
B:\Dev\<Category>\<ProjectName>
```

Default output without category:

```txt
B:\Dev\<ProjectName>
```

## Dependency / node_modules rule

Do not ship, mirror, or preserve `node_modules` in generated TAR packages unless there is a very specific reason.

For Bun projects:

- prefer committing `bun.lock`;
- prefer `bun install --frozen-lockfile` for reproducible installs;
- prefer `bun install --linker isolated` when pnpm-like isolation is useful;
- avoid manually symlinking `node_modules` unless a package manager officially owns that layout.

Bun's isolated linker creates a central package store in `node_modules/.bun` with top-level symlinks, which is the closest Bun-native equivalent to pnpm-style dependency layout.

## Safety rules

- Never overwrite `.git` unless explicitly requested.
- Exclude `node_modules`, `.svelte-kit`, `.next`, `dist`, `build`, `out`, `target`, `.gradle`, `.venv`, `venv`, `__pycache__`, and dependency caches from mirrors.
- Use `-Apply` for writes; default scripts may dry-run.
- Use `-Open` to open the output folder.
- Use `-CleanupArchive` only after successful extraction/install.
- Keep AI Wiki canonical notes in the AI Wiki, not inside `B:\Dev`.

