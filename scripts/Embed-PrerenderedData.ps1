# Replace build/index.php with prerendered HTML wrapped in minimal PHP.
# The adapter's data replacement corrupts the hydration payload — skip it
# entirely for the prerendered homepage.
param(
  [string]$BuildDir = (Join-Path (Split-Path $PSScriptRoot -Parent) "build"),
  [string]$PrerenderedFile = ""
)

Set-StrictMode -Version Latest

if (-not $PrerenderedFile) {
  $PrerenderedFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".svelte-kit" "output" "prerendered" "pages" "index.html"
}

$IndexPhp = Join-Path $BuildDir "index.php"

if (-not (Test-Path $PrerenderedFile)) {
  Write-Host "Skipping: prerendered file not found"
  exit 0
}

$PrerenderedHtml = Get-Content -Raw $PrerenderedFile

# Insert a minimal PHP header so the file still parses as PHP
# (required by the .htaccess rewrite rules)
$PhpWrapper = "<?php
// Static prerendered homepage — hydration data is embedded below.
// No PHP runtime re-execution — prevents hydration flicker.
?>
" + $PrerenderedHtml

Set-Content -Encoding UTF8 -NoNewline -Path $IndexPhp -Value $PhpWrapper
Write-Host "Replaced build/index.php with prerendered HTML + PHP wrapper"
