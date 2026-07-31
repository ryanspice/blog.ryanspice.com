param(
  [string]$BasePath = "",
  [string]$AdapterRoot = "",
  [string]$RuntimeRoot = "",
  [string]$RuntimeConfigPath = "",
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
function Resolve-AbsolutePath([string]$Path, [string]$BasePath) {
  $expanded = [Environment]::ExpandEnvironmentVariables($Path.Trim())
  if ([IO.Path]::IsPathRooted($expanded)) {
    return [IO.Path]::GetFullPath($expanded)
  }
  return [IO.Path]::GetFullPath((Join-Path $BasePath $expanded))
}
function Initialize-SiteRuntimeLayout([string]$Root) {
  $paths = @(
    "data/drafts",
    "data/private",
    "data/encrypted",
    "data/db",
    "cache/svelte-kit",
    "cache/vite",
    "build",
    "releases",
    "receipts"
  )
  foreach ($path in $paths) {
    New-Item -ItemType Directory -Path (Join-Path $Root $path) -Force | Out-Null
  }
}
function Add-PathListValue([string]$Current, [string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return $Current }
  $items = @()
  if (-not [string]::IsNullOrWhiteSpace($Current)) {
    $items = @($Current.Split(";") | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  }
  $normalized = [IO.Path]::GetFullPath($Value)
  foreach ($item in $items) {
    if ([IO.Path]::GetFullPath($item) -ieq $normalized) { return ($items -join ";") }
  }
  return (@($items) + $normalized) -join ";"
}
function Get-SiteBuildConfig([string]$SiteId) {
  $ConfigScript = Join-Path $PSScriptRoot "Read-SiteBuildConfig.mjs"
  if (-not (Test-Path -LiteralPath $ConfigScript)) {
    throw "Missing site build config reader: $ConfigScript"
  }

  $Json = & node $ConfigScript --site $SiteId
  if ($LASTEXITCODE -ne 0) { throw "Unable to read site build config for '$SiteId'" }
  return $Json | ConvertFrom-Json
}
function Write-PublicEnvModule([string]$BuildPath) {
  $AppDir = Join-Path $BuildPath "_app"
  if (-not (Test-Path -LiteralPath $AppDir)) {
    New-Item -ItemType Directory -Path $AppDir -Force | Out-Null
  }

  $PublicEnv = [ordered]@{}
  Get-ChildItem Env: |
    Where-Object { $_.Name -like "PUBLIC_*" } |
    Sort-Object Name |
    ForEach-Object { $PublicEnv[$_.Name] = [string]$_.Value }

  $Json = $PublicEnv | ConvertTo-Json -Compress
  if ([string]::IsNullOrWhiteSpace($Json)) { $Json = "{}" }

  Set-Content -LiteralPath (Join-Path $AppDir "env.js") -Value "export const env=$Json;`n" -Encoding utf8NoBOM
  Info "Public env" "_app/env.js"
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
} elseif (Test-PathSafe "B:\Dev\sveltekit-php") {
  $AdapterRoot = "B:\Dev\sveltekit-php"
  $AdapterRootSource = "local default"
}
$SiteBuildConfig = Get-SiteBuildConfig -SiteId $SiteId
$CanonicalRedirectHosts = @($SiteBuildConfig.canonicalRedirectHosts | ForEach-Object {
  ([string]$_).Trim()
} | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
$PublicRouteExclusions = @($SiteBuildConfig.publicRouteExclusions | ForEach-Object {
  ([string]$_).Trim().Trim("/")
} | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

$RuntimeRootSource = "disabled"
$RuntimeSiteId = if ($SiteId -eq "ryan") { "ryanspice.com" } else { "" }
$SvelteKitOutDir = ""
$ViteCacheDir = ""
$SafeExternalRoot = ""

if (-not [string]::IsNullOrWhiteSpace($RuntimeSiteId)) {
  if (-not [string]::IsNullOrWhiteSpace($RuntimeRoot)) {
    $RuntimeRoot = Resolve-AbsolutePath -Path $RuntimeRoot -BasePath $ProjectRoot
    $RuntimeRootSource = "parameter"
    Initialize-SiteRuntimeLayout -Root $RuntimeRoot
  } elseif (-not [string]::IsNullOrWhiteSpace($env:BLOG_RUNTIME_ROOT)) {
    $RuntimeRoot = Resolve-AbsolutePath -Path $env:BLOG_RUNTIME_ROOT -BasePath $ProjectRoot
    $RuntimeRootSource = "environment"
    Initialize-SiteRuntimeLayout -Root $RuntimeRoot
  } elseif (-not [string]::IsNullOrWhiteSpace($AdapterRoot)) {
    $AdapterRuntimeConfig = if (-not [string]::IsNullOrWhiteSpace($RuntimeConfigPath)) {
      Resolve-AbsolutePath -Path $RuntimeConfigPath -BasePath $ProjectRoot
    } else {
      Join-Path $AdapterRoot "config/site-runtime.local.json"
    }
    if (-not [string]::IsNullOrWhiteSpace($RuntimeConfigPath) -and -not (Test-Path -LiteralPath $AdapterRuntimeConfig)) {
      throw "RuntimeConfigPath does not exist: $AdapterRuntimeConfig"
    }
    if (Test-Path -LiteralPath $AdapterRuntimeConfig) {
      $ResolverScript = Join-Path $AdapterRoot "scripts/Resolve-SiteRuntime.ps1"
      if (-not (Test-Path -LiteralPath $ResolverScript)) {
        throw "Runtime config exists but resolver script is missing: $ResolverScript"
      }
      $RuntimeRoot = (& pwsh -NoProfile -ExecutionPolicy Bypass -File $ResolverScript -SiteId $RuntimeSiteId -ConfigPath $AdapterRuntimeConfig -Create | Select-Object -Last 1)
      if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($RuntimeRoot)) {
        throw "Unable to resolve runtime root for $RuntimeSiteId"
      }
      $RuntimeRoot = Resolve-AbsolutePath -Path $RuntimeRoot -BasePath $ProjectRoot
      $RuntimeRootSource = "adapter local config"
    } else {
      $RuntimeRoot = ""
    }
  }
}

if (-not [string]::IsNullOrWhiteSpace($RuntimeRoot)) {
  $BuildDir = Join-Path $RuntimeRoot "build"
  $SvelteKitOutDir = Join-Path $RuntimeRoot "cache/svelte-kit"
  $ViteCacheDir = Join-Path $RuntimeRoot "cache/vite"
  Initialize-SiteRuntimeLayout -Root $RuntimeRoot

  $SafeExternalRoot = $RuntimeRoot
  if (-not [string]::IsNullOrWhiteSpace($AdapterRoot) -and (Test-Path -LiteralPath $AdapterRoot)) {
    $AdapterRootFull = (Resolve-Path -LiteralPath $AdapterRoot).Path
    $AdapterRuntimeRoot = [IO.Path]::GetFullPath((Join-Path $AdapterRootFull ".runtime"))
    $AdapterRuntimePrefix = $AdapterRuntimeRoot.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    if ($RuntimeRoot -ieq $AdapterRuntimeRoot -or $RuntimeRoot.StartsWith($AdapterRuntimePrefix, [StringComparison]::OrdinalIgnoreCase)) {
      $SafeExternalRoot = $AdapterRuntimeRoot
    }
  }
}

Step "Resolve paths"
Info "ProjectRoot" $ProjectRoot
Info "BuildDir" $BuildDir
Info "RuntimeRoot" $(if ($RuntimeRoot) { $RuntimeRoot } else { "(disabled)" })
Info "RuntimeSource" $RuntimeRootSource
Info "SvelteKitOut" $(if ($SvelteKitOutDir) { $SvelteKitOutDir } else { "(default)" })
Info "ViteCache" $(if ($ViteCacheDir) { $ViteCacheDir } else { "(default)" })
Info "Safe roots" $(if ($SafeExternalRoot) { $SafeExternalRoot } else { "(default)" })
Info "BasePath" $(if ($BasePath) { $BasePath } else { "(root)" })
Info "SiteId" $SiteId
Info "PublicSiteUrl" $PublicSiteUrl
Info "AdapterRoot" $(if ($AdapterRoot) { $AdapterRoot } else { "(committed vendored adapter)" })
Info "AdapterRootSource" $AdapterRootSource
Info "Canonical hosts" $(if ($CanonicalRedirectHosts.Count) { $CanonicalRedirectHosts -join ", " } else { "(none)" })
Info "Route exclusions" $(if ($PublicRouteExclusions.Count) { $PublicRouteExclusions -join ", " } else { "(none)" })

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

if ($Clean) {
  $CleanTargets = @($BuildDir)
  if ($SvelteKitOutDir) { $CleanTargets += $SvelteKitOutDir }
  if ($ViteCacheDir) { $CleanTargets += $ViteCacheDir }
  $ExistingCleanTargets = @($CleanTargets | Sort-Object -Unique | Where-Object { Test-Path -LiteralPath $_ })
  if ($ExistingCleanTargets.Count -gt 0) {
    Step "Clean build/cache output"
    foreach ($target in $ExistingCleanTargets) {
      Remove-Item -LiteralPath $target -Recurse -Force
      Info "Cleaned" $target
    }
  }
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
  if ($RuntimeRoot) { $env:BLOG_RUNTIME_ROOT = $RuntimeRoot }
  if ($SvelteKitOutDir) { $env:SVELTEKIT_OUTDIR = $SvelteKitOutDir }
  if ($ViteCacheDir) { $env:VITE_CACHE_DIR = $ViteCacheDir }
  if ($SafeExternalRoot) {
    $env:SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS = Add-PathListValue -Current $env:SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS -Value $SafeExternalRoot
  }
  $env:ADAPTER_OUT = $BuildDir
  $env:ADAPTER_ASSETS = $BuildDir

  pnpm exec svelte-kit sync
  if ($LASTEXITCODE -ne 0) { throw "svelte-kit sync failed" }

  pnpm run generate:social-images -- --site=$SiteId
  if ($LASTEXITCODE -ne 0) { throw "social image generation failed" }

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
$EmbedArgs = @("-BuildDir", $BuildDir)
if (-not [string]::IsNullOrWhiteSpace($SvelteKitOutDir)) {
  $PrerenderedFile = Join-Path $SvelteKitOutDir "output"
  $PrerenderedFile = Join-Path $PrerenderedFile "prerendered"
  $PrerenderedFile = Join-Path $PrerenderedFile "pages"
  $PrerenderedFile = Join-Path $PrerenderedFile "index.html"
  $EmbedArgs += @("-PrerenderedFile", $PrerenderedFile)
}
& pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Embed-PrerenderedData.ps1") @EmbedArgs

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
Write-PublicEnvModule -BuildPath $BuildDir

$IndexFile = Join-Path $BuildDir "index.php"
if (Test-Path -LiteralPath $IndexFile) {
  $IndexContent = Get-Content -LiteralPath $IndexFile -Raw
  $OtherSiteId = if ($DocumentSiteId -eq "canopy") { "ryan" } else { "canopy" }
  if ($IndexContent -notmatch ('data-site="' + [regex]::Escape($DocumentSiteId) + '"')) {
    throw "$DocumentSiteId build did not stamp data-site=`"$DocumentSiteId`" into build/index.php."
  }
  if ($IndexContent -notmatch ('site-shell--' + [regex]::Escape($DocumentSiteId))) {
    throw "$DocumentSiteId build did not prerender its site shell class into build/index.php."
  }
  if ($IndexContent -match ('site-shell--' + [regex]::Escape($OtherSiteId)) -or $IndexContent -match ('"?themeClass"?:\s*"' + [regex]::Escape($OtherSiteId) + '"')) {
    throw "$DocumentSiteId build contains $OtherSiteId shell or hydration data. Check PUBLIC_SITE_ID/BLOG_SITE_ID before deploy."
  }
}

$requiredContract = @(
  "index.php",
  ".htaccess",
  "router.php",
  "_runtime/compat.php",
  "_app/env.js",
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
  if ($CanonicalRedirectHosts.Count -gt 0) {
    $HostRedirectRules = $CanonicalRedirectHosts | ForEach-Object {
      "`tRewriteCond %{HTTP_HOST} $_ [NC]`n`tRewriteRule ^(.*)$ $PublicSiteUrl/`$1 [R=301,L]"
    }
    $OverlaySections += @"
# $SiteId public build: redirect alternate hosts to $PublicSiteUrl.
<IfModule mod_rewrite.c>
	RewriteEngine On
$($HostRedirectRules -join "`n")
</IfModule>
"@.Trim()
  }
  if ($PublicRouteExclusions.Count -gt 0) {
    $RoutePattern = ($PublicRouteExclusions | ForEach-Object { [regex]::Escape($_) }) -join "|"
    $OverlaySections += @"
# $SiteId public build: block site-excluded owner and utility surfaces at the edge.
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteRule ^($RoutePattern)(/|$) - [R=404,L]
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
if ($RuntimeRoot) {
  $ReceiptDir = Join-Path $RuntimeRoot "receipts"
  New-Item -ItemType Directory -Path $ReceiptDir -Force | Out-Null
  $RuntimeReceipt = [pscustomobject]@{
    siteId = $RuntimeSiteId
    runtimeRoot = $RuntimeRoot
    source = $RuntimeRootSource
    buildDir = $BuildDir
    svelteKitOutDir = $SvelteKitOutDir
    viteCacheDir = $ViteCacheDir
    safeExternalRoot = $SafeExternalRoot
    adapterRoot = $AdapterRoot
  }
  $BuildReceipt = [pscustomobject]@{
    builtAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    siteId = $SiteId
    publicSiteUrl = $PublicSiteUrl
    mode = $env:ADAPTER_MODE
    buildDir = $BuildDir
    svelteKitOutDir = $SvelteKitOutDir
  }
  $RuntimeReceipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $ReceiptDir "runtime-root.json") -Encoding utf8NoBOM
  $BuildReceipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $ReceiptDir "last-build.json") -Encoding utf8NoBOM
  Info "Runtime receipt" (Join-Path $ReceiptDir "runtime-root.json")
  Info "Build receipt" (Join-Path $ReceiptDir "last-build.json")
}
Info "Built" $BuildDir
Info "Mode" $env:ADAPTER_MODE
Info "BasePath" $(if ($BasePath) { $BasePath } else { "(root)" })
Info "SiteId" $SiteId
