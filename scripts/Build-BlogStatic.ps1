param(
  [string]$BasePath = "",
  [string]$AdapterRoot = "",
  [switch]$Clean,
  [switch]$SkipAdapterSync
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
function Normalize-BasePath([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value) -or $Value -eq "/" -or $Value -eq ".") { return "" }
  $normalized = $Value.Trim()
  if (-not $normalized.StartsWith("/")) { $normalized = "/$normalized" }
  return $normalized.TrimEnd("/")
}
function Test-PathSafe([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  try { return Test-Path -LiteralPath $Path } catch { return $false }
}
function Wait-ForPath([string]$Path, [int]$Attempts = 20, [int]$DelayMs = 250) {
  for ($index = 0; $index -lt $Attempts; $index++) {
    if (Test-Path -LiteralPath $Path) { return $true }
    Start-Sleep -Milliseconds $DelayMs
  }
  return $false
}

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BuildDir = Join-Path $ProjectRoot "build"
if ([string]::IsNullOrWhiteSpace($BasePath)) {
  $BasePath = if ($env:BLOG_BASE_PATH) { $env:BLOG_BASE_PATH } elseif ($env:PUBLIC_BASE_PATH) { $env:PUBLIC_BASE_PATH } else { "" }
}
$BasePath = Normalize-BasePath $BasePath
if ([string]::IsNullOrWhiteSpace($AdapterRoot)) {
  $AdapterRoot = if ($env:SVELTEKIT_PHP_ADAPTER_ROOT) { $env:SVELTEKIT_PHP_ADAPTER_ROOT } else { "B:\Dev\sveltekit-php" }
}

Step "Resolve paths"
Info "ProjectRoot" $ProjectRoot
Info "BuildDir" $BuildDir
Info "BasePath" $(if ($BasePath) { $BasePath } else { "(root)" })
Info "AdapterRoot" $AdapterRoot

if (-not $SkipAdapterSync) {
  if (Test-PathSafe $AdapterRoot) {
    Step "Sync canonical PHP adapter"
    & pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Sync-SvelteKitPhpAdapter.ps1") -AdapterRoot $AdapterRoot
    if ($LASTEXITCODE -ne 0) { throw "Adapter sync failed with exit code $LASTEXITCODE" }
  } else {
    Info "Adapter sync" "Skipped; AdapterRoot not found, using committed vendored adapter"
  }
}

if ($Clean -and (Test-Path -LiteralPath $BuildDir)) {
  Step "Clean build output"
  Remove-Item -LiteralPath $BuildDir -Recurse -Force
}

Step "Build blog with PHP adapter"
Push-Location -LiteralPath $ProjectRoot
try {
  $env:PUBLIC_BASE_PATH = $BasePath
  $env:SK_BASE_PATH = $BasePath
  $env:DEPLOY_BASE = $BasePath
  if (-not $env:ADAPTER_MODE) { $env:ADAPTER_MODE = "php-static" }
  if (-not $env:ADAPTER_BASE_MODE) { $env:ADAPTER_BASE_MODE = "fixed" }
  $env:ADAPTER_OUT = $BuildDir
  $env:ADAPTER_ASSETS = $BuildDir

  pnpm exec svelte-kit sync
  if ($LASTEXITCODE -ne 0) { throw "svelte-kit sync failed" }

  pnpm exec vite build
  if ($LASTEXITCODE -ne 0) { throw "vite build failed" }
}
finally {
  Pop-Location
}

# Post-build fix: adapter codegen bug — missing close paren in nested arrow fn
$pagePhp = Join-Path $BuildDir "_protected" "_page.php"
if (Test-Path $pagePhp) {
  $content = Get-Content -Raw $pagePhp
  $fixed = $content.Replace("fn(`$word) => `$word !== '')", "fn(`$word) => `$word !== ''))")
  if ($fixed -ne $content) {
    Set-Content -Encoding UTF8 -NoNewline -Path $pagePhp -Value $fixed
    Write-Host "Fixed PHP syntax in _protected/_page.php"
  }
}

$requiredContract = @(
  "index.php",
  ".htaccess",
  "router.php",
  "_runtime/compat.php",
  "_app/version.json",
  "adapter/route-manifest.php"
)
if ($env:ADAPTER_MODE -eq "js-ssr") {
  $requiredContract += @("server/handler.mjs", "server/index.js")
} else {
  $requiredContract += @("_protected/.htaccess")
}
foreach ($item in $requiredContract) {
  $full = Join-Path $BuildDir $item
  if (-not (Wait-ForPath -Path $full)) {
    throw "Build output missing required PHP adapter contract file: build/$item"
  }
}

$debugArtifacts = @("php.stderr.log", "php.stdout.log", "sidecar.stderr.log", "sidecar.stdout.log")
foreach ($item in $debugArtifacts) {
  $full = Join-Path $BuildDir $item
  if (Test-Path -LiteralPath $full) { Remove-Item -LiteralPath $full -Force }
}

Step "Merge adapter .htaccess overlay"
$StaticDir = Join-Path $ProjectRoot "static"
$HtaccessSource = Join-Path $StaticDir ".htaccess"
$HtaccessDest = Join-Path $BuildDir ".htaccess"
$WellKnownSource = Join-Path $StaticDir ".well-known"
$WellKnownDest = Join-Path $BuildDir ".well-known"

if (Test-Path -LiteralPath $HtaccessSource) {
  $Overlay = Get-Content -LiteralPath $HtaccessSource -Raw
  $Generated = Get-Content -LiteralPath $HtaccessDest -Raw
  $Merged = @(
    "# BEGIN blog.ryanspice.com host overlay"
    $Overlay.Trim()
    "# END blog.ryanspice.com host overlay"
    ""
    "# BEGIN @ryanspice/sveltekit-adapter-php"
    $Generated.Trim()
    "# END @ryanspice/sveltekit-adapter-php"
    ""
  ) -join "`n"
  Set-Content -LiteralPath $HtaccessDest -Value $Merged -Encoding utf8NoBOM
  Info "Merged" ".htaccess"
  $MergedContent = Get-Content -LiteralPath $HtaccessDest -Raw
  if ($MergedContent -notmatch '__data\.json' -or $MergedContent -notmatch 'BEGIN @ryanspice/sveltekit-adapter-php') {
    throw "Merged .htaccess did not preserve adapter rewrite rules."
  }
}

if (Test-Path -LiteralPath $WellKnownSource) {
  if (Test-Path -LiteralPath $WellKnownDest) { Remove-Item -LiteralPath $WellKnownDest -Recurse -Force }
  Copy-Item -LiteralPath $WellKnownSource -Destination $WellKnownDest -Recurse -Force
  Info "Copied" ".well-known/"
}

Step "Receipt"
Info "Built" $BuildDir
Info "Mode" $env:ADAPTER_MODE
Info "BasePath" $(if ($BasePath) { $BasePath } else { "(root)" })
