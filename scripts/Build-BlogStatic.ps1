param(
  [string]$BasePath = "",
  [string]$AdapterRoot = "",
  [string]$SiteId = "",
  [string]$PublicSiteUrl = "",
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
if ([string]::IsNullOrWhiteSpace($SiteId)) {
  $SiteId = if ($env:PUBLIC_SITE_ID) { $env:PUBLIC_SITE_ID } elseif ($env:BLOG_SITE_ID) { $env:BLOG_SITE_ID } else { "ryan" }
}
$SiteId = $SiteId.Trim().ToLowerInvariant()
if ($SiteId -notin @("ryan", "canopy")) {
  throw "Unsupported SiteId '$SiteId'. Expected 'ryan' or 'canopy'."
}
if ([string]::IsNullOrWhiteSpace($PublicSiteUrl)) {
  $PublicSiteUrl = if ($env:PUBLIC_SITE_URL) {
    $env:PUBLIC_SITE_URL
  } elseif ($SiteId -eq "canopy") {
    "https://blog.canopydigital.ca"
  } else {
    "https://blog.ryanspice.com"
  }
}
$PublicSiteUrl = $PublicSiteUrl.TrimEnd("/")

$AdapterRootSource = "none"
if (-not [string]::IsNullOrWhiteSpace($AdapterRoot)) {
  $AdapterRootSource = "parameter"
} elseif (-not [string]::IsNullOrWhiteSpace($env:SVELTEKIT_PHP_ADAPTER_ROOT)) {
  $AdapterRoot = $env:SVELTEKIT_PHP_ADAPTER_ROOT
  $AdapterRootSource = "environment"
}

Step "Resolve paths"
Info "ProjectRoot" $ProjectRoot
Info "BuildDir" $BuildDir
Info "BasePath" $(if ($BasePath) { $BasePath } else { "(root)" })
Info "SiteId" $SiteId
Info "PublicSiteUrl" $PublicSiteUrl
Info "AdapterRoot" $(if ($AdapterRoot) { $AdapterRoot } else { "(committed vendored adapter)" })

if ($SkipAdapterSync) {
  Info "Adapter sync" "Skipped by -SkipAdapterSync"
} elseif ([string]::IsNullOrWhiteSpace($AdapterRoot)) {
  Info "Adapter sync" "Skipped; no AdapterRoot or SVELTEKIT_PHP_ADAPTER_ROOT configured"
} else {
  if (Test-PathSafe $AdapterRoot) {
    Step "Sync canonical PHP adapter"
    & pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Sync-SvelteKitPhpAdapter.ps1") -AdapterRoot $AdapterRoot
    if ($LASTEXITCODE -ne 0) { throw "Adapter sync failed with exit code $LASTEXITCODE" }
  } else {
    throw "AdapterRoot from $AdapterRootSource not found: $AdapterRoot"
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
  $env:PUBLIC_SITE_ID = $SiteId
  $env:BLOG_SITE_ID = $SiteId
  $env:PUBLIC_SITE_URL = $PublicSiteUrl
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

# Post-build compatibility fixes for older generated PHP variants.
$pagePhp = Join-Path $BuildDir "_protected" "_page.php"
if (Test-Path $pagePhp) {
  $content = Get-Content -Raw $pagePhp

  $readingMinutesGood = '$words = array_values(array_filter(explode('' '', trim((string) $normalized)), fn($word) => $word !== ''''));'
  $readingMinutesMissingParen = '$words = array_values(array_filter(explode('' '', trim((string) $normalized)), fn($word) => $word !== '''');'
  $readingMinutesExtraParen = '$words = array_values(array_filter(explode('' '', trim((string) $normalized)), fn($word) => $word !== '''')));'

  $fixed = $content.
    Replace($readingMinutesMissingParen, $readingMinutesGood).
    Replace($readingMinutesExtraParen, $readingMinutesGood)

  # Fix getcwd() path — use __DIR__ relative to build output so article .md
  # files are found even when PHP's CWD is not the project root.
  $fixed = $fixed.Replace(
    "`$contentRoot = getcwd() . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . 'articles';",
    "`$contentRoot = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . 'articles';"
  )

  if ($fixed -ne $content) {
    Set-Content -Encoding UTF8 -NoNewline -Path $pagePhp -Value $fixed
    Write-Host "Fixed PHP syntax and path in _protected/_page.php"
  }
}

# Post-build fix: embed prerendered hydration data directly instead of
# re-executing the PHP load function at runtime. Prevents hydration flicker.
& pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Embed-PrerenderedData.ps1") -BuildDir $BuildDir

# Stamp the selected site onto generated document shells so the root theme is
# correct before hydration and without relying only on host-detection script.
$DocumentSiteId = if ($SiteId -eq "canopy") { "canopy" } else { "ryan" }
$ThemeColor = if ($DocumentSiteId -eq "canopy") { "#f5f1e6" } else { "#070a0f" }
$DocumentFiles = Get-ChildItem -LiteralPath $BuildDir -Recurse -File -Include "*.php", "*.html"
foreach ($file in $DocumentFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw
  if ($content -notmatch '<html\b' -and $content -notmatch 'name="theme-color"') { continue }

  $stamped = $content.
    Replace('<html lang="en" data-site="ryan">', "<html lang=`"en`" data-site=`"$DocumentSiteId`">").
    Replace('<html lang="en" data-site="canopy">', "<html lang=`"en`" data-site=`"$DocumentSiteId`">").
    Replace('<html lang="en">', "<html lang=`"en`" data-site=`"$DocumentSiteId`">")

  $stamped = [regex]::Replace(
    $stamped,
    '<meta name="theme-color" content="[^"]*" />',
    "<meta name=`"theme-color`" content=`"$ThemeColor`" />"
  )

  if ($stamped -ne $content) {
    Set-Content -LiteralPath $file.FullName -Value $stamped -Encoding utf8NoBOM
  }
}
Info "Stamped site theme" $DocumentSiteId

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
  $HostOverlayLabel = if ($SiteId -eq "canopy") { "blog.canopydigital.ca host overlay" } else { "blog.ryanspice.com host overlay" }
  $OverlaySections = @($Overlay.Trim())
  if ($SiteId -eq "canopy") {
    $OverlaySections += @"
# Canopy public build: block Ryan-only owner and utility surfaces at the edge.
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteRule ^(auth|briefs|dev-log|drafts|library|login|status)(/|$) - [R=404,L]
</IfModule>
"@.Trim()
  }
  $Merged = @(
    "# BEGIN $HostOverlayLabel"
    ($OverlaySections -join "`n`n")
    "# END $HostOverlayLabel"
    ""
    "# BEGIN @ryanspice/sveltekit-adapter-php"
    $Generated.Trim()
    "# END @ryanspice/sveltekit-adapter-php"
    ""
  ) -join "`n"
  Set-Content -LiteralPath $HtaccessDest -Value $Merged -Encoding utf8NoBOM
  Info "Merged" ".htaccess"
  $MergedContent = Get-Content -LiteralPath $HtaccessDest -Raw
  if ($MergedContent -notmatch 'BEGIN @ryanspice/sveltekit-adapter-php') {
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
Info "SiteId" $SiteId
