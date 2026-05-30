param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
  [switch]$Install
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "==> blog.ryanspice.com dev" -ForegroundColor Cyan
Write-Host "ProjectRoot : $ProjectRoot"

Set-Location -LiteralPath $ProjectRoot

if ($Install) {
  Write-Host "==> Installing dependencies with pnpm" -ForegroundColor Cyan
  pnpm install
}

Write-Host "==> Starting SvelteKit" -ForegroundColor Cyan
pnpm dev
