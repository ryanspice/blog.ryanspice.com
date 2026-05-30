param(
  [string]$RuntimeRoot = "B:\AI-Wiki\.runtime\projects\blog.ryanspice.com",
  [switch]$Apply,
  [switch]$InstallDeps,
  [switch]$CleanProjectNodeModules
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Info([string]$Key, [string]$Value) {
  Write-Host ("{0,-22}: {1}" -f $Key, $Value)
}

function Remove-NodeModulesSafely([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return }

  $item = Get-Item -LiteralPath $Path -Force
  $attrs = $item.Attributes.ToString()

  Write-Host "Removing existing node_modules shape: $attrs"

  # Directory junctions / symlinks can be removed as the link itself with DirectoryInfo.Delete().
  if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    $item.Delete()
    return
  }

  Remove-Item -LiteralPath $Path -Recurse -Force
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ProjectNodeModules = Join-Path $ProjectRoot "node_modules"
$PnpmStore = Join-Path $RuntimeRoot "pnpm-store"
$PnpmVirtualStore = Join-Path $RuntimeRoot "pnpm-virtual-store"
$NpmrcPath = Join-Path $ProjectRoot ".npmrc"

Step "Resolve paths"
Info "ProjectRoot" $ProjectRoot
Info "RuntimeRoot" $RuntimeRoot
Info "Project modules" $ProjectNodeModules
Info "pnpm store" $PnpmStore
Info "virtual store" $PnpmVirtualStore
Info "Mode" $(if ($Apply) { "APPLY" } else { "DRY RUN" })

if (-not $Apply) {
  Step "Dry run complete"
  Write-Host "Run again with -Apply to repair pnpm externalization."
  exit 0
}

Step "Create external pnpm runtime"
New-Item -ItemType Directory -Force -Path $RuntimeRoot, $PnpmStore, $PnpmVirtualStore | Out-Null

Step "Repair project node_modules"
# The v0.1.0 installer created node_modules as a junction before pnpm install. pnpm 9 can choke on that on Windows/OneDrive.
# Use an external pnpm store and external virtual store instead; leave only the lightweight linker folder in the project.
Remove-NodeModulesSafely -Path $ProjectNodeModules

if ($CleanProjectNodeModules -and (Test-Path -LiteralPath $ProjectNodeModules)) {
  throw "node_modules still exists after cleanup: $ProjectNodeModules"
}

Step "Write .npmrc"
$store = $PnpmStore.Replace('\','/')
$virtual = $PnpmVirtualStore.Replace('\','/')
$npmrc = @(
  "node-linker=isolated",
  "strict-peer-dependencies=false",
  "store-dir=$store",
  "virtual-store-dir=$virtual"
)
Set-Content -LiteralPath $NpmrcPath -Value $npmrc -Encoding UTF8
Info ".npmrc" $NpmrcPath

if ($InstallDeps) {
  Step "Install dependencies with pnpm"
  $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
  if (-not $pnpm) {
    Write-Host "pnpm not found. Trying Corepack." -ForegroundColor Yellow
    corepack enable
    $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
  }

  if (-not $pnpm) {
    throw "pnpm is not available. Install pnpm or enable Corepack, then run pnpm install."
  }

  Push-Location -LiteralPath $ProjectRoot
  try {
    pnpm install
    if ($LASTEXITCODE -ne 0) {
      throw "pnpm install failed with exit code $LASTEXITCODE"
    }
  }
  finally {
    Pop-Location
  }
}

Step "Receipt"
Info "Project" $ProjectRoot
Info "Runtime" $RuntimeRoot
Info "Next" "cd `"$ProjectRoot`"; pnpm check; pnpm run build:blog"
