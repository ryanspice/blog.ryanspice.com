# Post-build fixes:
# 1. Replace build/index.php with prerendered HTML wrapped in minimal PHP
#    (prevents hydration flicker from adapter data re-execution)
# 2. Replace build/__data.php with a static data extractor
#    (client navigation returns same articles as initial load)
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

# --- Fix 2: Replace __data.php with static data extractor ---
if (-not (Test-Path $IndexPhp)) {
  Write-Host "Skipping __data.php: index.php not found"
} else {
  # Read the index.php to extract the data payload
  $Html = Get-Content -Raw $IndexPhp

  # Find the kit.start() data payload
  $marker = 'data: [null,(function'
  $dataPos = $Html.IndexOf($marker)
  if ($dataPos -lt 0) {
    Write-Host "Skipping __data.php: no data payload found in index.php"
  } else {
    $jsonStart = $dataPos + 6  # skip "data: "
    # Find matching closing bracket
    $balance = 0
    $inString = $false
    $stringChar = ''
    $jsonEnd = -1
    for ($i = $jsonStart; $i -lt $Html.Length; $i++) {
      $c = $Html[$i]
      if ($inString) {
        if ($c -eq $stringChar) { $inString = $false }
        continue
      }
      if ($c -eq '"' -or $c -eq "'" -or $c -eq '`') {
        $inString = $true
        $stringChar = $c
        continue
      }
      if ($c -eq '[') { $balance++; continue }
      if ($c -eq ']') {
        $balance--
        if ($balance -eq 0) { $jsonEnd = $i + 1; break }
      }
    }

    if ($jsonEnd -gt 0) {
      $JsonRaw = $Html.Substring($jsonStart, $jsonEnd - $jsonStart)

      # Create the __data.php
      $DataPhpContent = @"
<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600');
echo '{"type":"data","nodes":' . file_get_contents(__DIR__ . '/__data.nodes.json') . '}';
"@

      # Write the raw nodes data as a separate JSON file
      $NodesFile = Join-Path $BuildDir "__data.nodes.json"
      Set-Content -Encoding UTF8 -NoNewline -Path $NodesFile -Value $JsonRaw

      # Write the __data.php
      Set-Content -Encoding UTF8 -NoNewline -Path $DataPhp -Value $DataPhpContent
      Write-Host "Replaced build/__data.php — serves static nodes from prerender"
    }
  }
}
