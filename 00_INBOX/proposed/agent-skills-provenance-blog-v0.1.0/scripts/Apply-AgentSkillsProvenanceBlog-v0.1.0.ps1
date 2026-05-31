param(
  [switch]$Apply,
  [string]$AiWikiRoot = "S:\OneDrive\Obsidan\AI-Wiki",
  [string]$PackageArchive = "",
  [switch]$Open
)

$ErrorActionPreference = "Stop"
$PackageName = "agent-skills-provenance-blog-v0.1.0"

function Write-Section($Text) {
  Write-Host ""
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

function Write-Kv($Key, $Value) {
  Write-Host ("  {0,-24} {1}" -f $Key, $Value)
}

if (-not $Apply) {
  throw "Run with -Apply to stage the blog pack."
}

if (-not (Test-Path $AiWikiRoot)) {
  $Alt = "S:\OneDrive\Obsidian\AI-Wiki"
  if (Test-Path $Alt) { $AiWikiRoot = $Alt }
}

if (-not (Test-Path $AiWikiRoot)) {
  throw "AI Wiki root not found: $AiWikiRoot"
}

$ScriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

if ([string]::IsNullOrWhiteSpace($PackageArchive)) {
  $Candidates = @(
    (Join-Path $ScriptRoot "$PackageName.tar.gz"),
    (Join-Path "B:\Temp\@Browser" "$PackageName.tar.gz"),
    (Join-Path (Get-Location).Path "$PackageName.tar.gz")
  )
  $PackageArchive = $Candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $PackageArchive -or -not (Test-Path $PackageArchive)) {
  throw "Package archive not found. Pass -PackageArchive or place $PackageName.tar.gz beside this script."
}

$ExtractRoot = Join-Path $env:TEMP $PackageName
if (Test-Path $ExtractRoot) {
  Remove-Item -Recurse -Force $ExtractRoot
}
New-Item -ItemType Directory -Force $ExtractRoot | Out-Null

Write-Section "Extracting package"
Write-Kv "Archive" $PackageArchive
Write-Kv "ExtractRoot" $ExtractRoot

tar -xzf $PackageArchive -C $ExtractRoot

$PackageRoot = Join-Path $ExtractRoot $PackageName
if (-not (Test-Path $PackageRoot)) {
  throw "Package root not found after extraction: $PackageRoot"
}

$WikiTarget = Join-Path $AiWikiRoot "00_INBOX\proposed\blog-drafts\$PackageName"
$BlogProjectTarget = Join-Path $AiWikiRoot "07_Projects\blog.ryanspice.com\00_INBOX\proposed\$PackageName"

Write-Section "Staging blog pack"
Write-Kv "AI Wiki root" $AiWikiRoot
Write-Kv "PackageRoot" $PackageRoot
Write-Kv "WikiTarget" $WikiTarget
Write-Kv "BlogTarget" $BlogProjectTarget

foreach ($Target in @($WikiTarget, $BlogProjectTarget)) {
  if (Test-Path $Target) {
    Remove-Item -Recurse -Force $Target
  }
  New-Item -ItemType Directory -Force $Target | Out-Null
  Copy-Item -Path (Join-Path $PackageRoot "*") -Destination $Target -Recurse -Force
  Copy-Item -Path (Join-Path $PackageRoot ".thoughts") -Destination $Target -Force
}

Write-Section "Complete"
Write-Kv "Wiki proposal" $WikiTarget
Write-Kv "Blog proposal" $BlogProjectTarget
Write-Kv "Full draft" (Join-Path $BlogProjectTarget "blog\blog.ryanspice.com-agent-skills-provenance-pnpm.mdx")
Write-Kv "Fragment" (Join-Path $BlogProjectTarget "blog\fragments\agent-skills-provenance-pnpm-fragment.md")

if ($Open) {
  Start-Process $BlogProjectTarget
}
