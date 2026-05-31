param(
  [string]$AdapterRoot = "",
  [switch]$NoBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Info([string]$Key, [string]$Value) {
  Write-Host ("{0,-18}: {1}" -f $Key, $Value)
}

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Get-GitValue([string]$Repo, [string[]]$GitArgs) {
  try {
    $output = & git -C $Repo @GitArgs 2>$null
    if ($LASTEXITCODE -eq 0) { return ($output -join "`n").Trim() }
  } catch {}
  return ""
}

function Get-RelativePathSafe([string]$BasePath, [string]$Path) {
  $baseResolved = (Resolve-Path -LiteralPath $BasePath).Path
  $pathResolved = (Resolve-Path -LiteralPath $Path).Path
  $baseUri = [Uri]($baseResolved.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar)
  $pathUri = [Uri]$pathResolved
  return [Uri]::UnescapeDataString($baseUri.MakeRelativeUri($pathUri).ToString()).Replace('/', [IO.Path]::DirectorySeparatorChar)
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
if ([string]::IsNullOrWhiteSpace($AdapterRoot)) {
  $AdapterRoot = if ($env:SVELTEKIT_PHP_ADAPTER_ROOT) { $env:SVELTEKIT_PHP_ADAPTER_ROOT } else { "B:\Dev\sveltekit-php" }
}

if (-not (Test-Path -LiteralPath $AdapterRoot)) {
  throw "AdapterRoot does not exist: $AdapterRoot"
}

$AdapterRoot = (Resolve-Path -LiteralPath $AdapterRoot).Path
$SourceIndex = Join-Path $AdapterRoot "adapter\index.js"
$SourceCompat = Join-Path $AdapterRoot "adapter\src\runtime\php-compat.php"
$PackagePath = Join-Path $AdapterRoot "package.json"
$DestRoot = Join-Path $ProjectRoot "adapter"
$DestRuntime = Join-Path $DestRoot "src\runtime"
$DestIndex = Join-Path $DestRoot "index.js"
$DestCompat = Join-Path $DestRuntime "php-compat.php"
$ManifestPath = Join-Path $DestRoot "source-manifest.json"

Step "Resolve adapter source"
Info "ProjectRoot" $ProjectRoot
Info "AdapterRoot" $AdapterRoot
Info "Build" $(if ($NoBuild) { "No" } else { "Yes" })

if (-not $NoBuild) {
  Require-Command bun
  Step "Build canonical adapter"
  Push-Location -LiteralPath $AdapterRoot
  try {
    bun run build:adapter
    if ($LASTEXITCODE -ne 0) { throw "bun run build:adapter failed with exit code $LASTEXITCODE" }
  }
  finally {
    Pop-Location
  }
}

foreach ($required in @($SourceIndex, $SourceCompat, $PackagePath)) {
  if (-not (Test-Path -LiteralPath $required)) {
    throw "Missing required adapter source file: $required"
  }
}

Step "Copy vendored adapter files"
New-Item -ItemType Directory -Force -Path $DestRoot, $DestRuntime | Out-Null
Copy-Item -LiteralPath $SourceIndex -Destination $DestIndex -Force
Copy-Item -LiteralPath $SourceCompat -Destination $DestCompat -Force
Info "Copied" "adapter/index.js"
Info "Copied" "adapter/src/runtime/php-compat.php"

$package = Get-Content -LiteralPath $PackagePath -Raw | ConvertFrom-Json
$gitHead = Get-GitValue $AdapterRoot @("rev-parse", "HEAD")
$gitBranch = Get-GitValue $AdapterRoot @("branch", "--show-current")
$gitStatus = Get-GitValue $AdapterRoot @("status", "--short")

$files = foreach ($file in @($DestIndex, $DestCompat)) {
  $hash = Get-FileHash -LiteralPath $file -Algorithm SHA256
  [pscustomobject]@{
    path = (Get-RelativePathSafe $ProjectRoot $file).Replace('\', '/')
    sha256 = $hash.Hash.ToLowerInvariant()
    bytes = (Get-Item -LiteralPath $file).Length
  }
}

$manifest = [pscustomobject]@{
  generatedBy = "scripts/Sync-SvelteKitPhpAdapter.ps1"
  syncedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
  sourceRoot = $AdapterRoot.Replace('\', '/')
  packageName = [string]$package.name
  packageVersion = [string]$package.version
  gitHead = $gitHead
  gitBranch = $gitBranch
  gitDirty = -not [string]::IsNullOrWhiteSpace($gitStatus)
  files = $files
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ManifestPath -Encoding utf8NoBOM

Step "Receipt"
Info "Manifest" $ManifestPath
Info "Git HEAD" $(if ($gitHead) { $gitHead } else { "<unknown>" })
Info "Git dirty" $([string]$manifest.gitDirty)
