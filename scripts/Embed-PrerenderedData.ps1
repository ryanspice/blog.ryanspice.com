# Post-build fixes:
# 1. Replace build/index.php with prerendered HTML wrapped in minimal PHP
#    (prevents hydration flicker from adapter data re-execution)
param(
  [string]$BuildDir = (Join-Path (Split-Path $PSScriptRoot -Parent) "build"),
  [string]$PrerenderedFile = ""
)

Set-StrictMode -Version Latest

if (-not $PrerenderedFile) {
  $PrerenderedFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".svelte-kit" "output" "prerendered" "pages" "index.html"
}

$IndexPhp = Join-Path $BuildDir "index.php"
$DataPhp = Join-Path $BuildDir "__data.php"

# --- Fix 1: Replace index.php with prerendered HTML ---
if (-not (Test-Path $PrerenderedFile)) {
  Write-Host "Skipping index.php: prerendered file not found"
} else {
  $PrerenderedHtml = Get-Content -Raw $PrerenderedFile
  $PhpWrapper = "<?php
// Static prerendered homepage — hydration data is embedded below.
// No PHP runtime re-execution — prevents hydration flicker.
?>
" + $PrerenderedHtml
  Set-Content -Encoding UTF8 -NoNewline -Path $IndexPhp -Value $PhpWrapper
  Write-Host "Replaced build/index.php with prerendered HTML + PHP wrapper"
}
