param(
  [string]$BasePath = "",
  [switch]$Clean
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

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BuildDir = Join-Path $ProjectRoot "build"
if ([string]::IsNullOrWhiteSpace($BasePath)) {
  $BasePath = if ($env:BLOG_BASE_PATH) { $env:BLOG_BASE_PATH } elseif ($env:PUBLIC_BASE_PATH) { $env:PUBLIC_BASE_PATH } else { "" }
}

Step "Resolve paths"
Info "ProjectRoot" $ProjectRoot
Info "BuildDir" $BuildDir
Info "BasePath" $(if ($BasePath) { $BasePath } else { "(root)" })

if ($Clean -and (Test-Path -LiteralPath $BuildDir)) {
  Step "Clean build output"
  Remove-Item -LiteralPath $BuildDir -Recurse -Force
}

Step "Build blog with adapter-static"
Push-Location -LiteralPath $ProjectRoot
try {
  $env:PUBLIC_BASE_PATH = $BasePath
  $env:SK_BASE_PATH = $BasePath
  # Generate static tower-accent.css (fetches live CN Tower colour if possible)
  & pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Generate-TowerAccent.ps1")
  if ($LASTEXITCODE -ne 0) { throw "Tower accent generation failed" }

  pnpm exec svelte-kit sync
  if ($LASTEXITCODE -ne 0) { throw "svelte-kit sync failed" }

  pnpm exec vite build
  if ($LASTEXITCODE -ne 0) { throw "vite build failed" }
}
finally {
  Pop-Location
}

# Copy static assets (including tower-accent.css and .htaccess)
$StaticDir = Join-Path $ProjectRoot "static"
$HtaccessSource = Join-Path $StaticDir ".htaccess"
$HtaccessDest = Join-Path $BuildDir ".htaccess"
$WellKnownSource = Join-Path $StaticDir ".well-known"
$WellKnownDest = Join-Path $BuildDir ".well-known"

if (Test-Path -LiteralPath $HtaccessSource) {
  Copy-Item -LiteralPath $HtaccessSource -Destination $HtaccessDest -Force
  Info "Copied" ".htaccess"
}
if (Test-Path -LiteralPath $WellKnownSource) {
  if (Test-Path -LiteralPath $WellKnownDest) {
    Remove-Item -LiteralPath $WellKnownDest -Recurse -Force
  }
  Copy-Item -LiteralPath $WellKnownSource -Destination $WellKnownDest -Recurse -Force
  Info "Copied" ".well-known/"
}

Step "Receipt"
Info "Built" $BuildDir
Info "BasePath" $(if ($BasePath) { $BasePath } else { "(root)" })
