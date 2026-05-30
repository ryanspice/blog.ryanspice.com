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
  Write-Host ("{0,-16}: {1}" -f $Key, $Value)
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BuildDir = Join-Path $ProjectRoot "build"

Step "Resolve paths"
Info "ProjectRoot" $ProjectRoot
Info "BuildDir" $BuildDir
Info "BasePath" $BasePath

if ($Clean -and (Test-Path -LiteralPath $BuildDir)) {
  Step "Clean build output"
  Remove-Item -LiteralPath $BuildDir -Recurse -Force
}

Step "Build static blog"
Push-Location -LiteralPath $ProjectRoot
try {
  $env:PUBLIC_BASE_PATH = $BasePath

  pnpm exec svelte-kit sync
  if ($LASTEXITCODE -ne 0) {
    throw "svelte-kit sync failed with exit code $LASTEXITCODE"
  }

  pnpm exec vite build
  if ($LASTEXITCODE -ne 0) {
    throw "vite build failed with exit code $LASTEXITCODE"
  }
}
finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath (Join-Path $BuildDir "index.html"))) {
  throw "Build did not produce index.html in $BuildDir"
}

Step "Copy dotfiles from static/"
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
Info "Public path" "$BasePath/"
