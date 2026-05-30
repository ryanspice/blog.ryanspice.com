param(
  [string]$ConfigPath = "deploy.config.json"
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

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Read-DeployConfig([string]$Path) {
  $resolved = if ([IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $ProjectRoot $Path }

  if (Test-Path -LiteralPath $resolved) {
    return Get-Content -LiteralPath $resolved -Raw | ConvertFrom-Json
  }

  return [pscustomobject]@{
    host = $env:BLOG_DEPLOY_HOST
    user = $env:BLOG_DEPLOY_USER
    port = if ($env:BLOG_DEPLOY_PORT) { [int]$env:BLOG_DEPLOY_PORT } else { 22 }
    keyPath = $env:BLOG_DEPLOY_KEY_PATH
  }
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Config = Read-DeployConfig -Path $ConfigPath

$HostName = [string]$Config.host
$UserName = [string]$Config.user
$Port = if ($Config.port) { [string]$Config.port } else { "22" }
$KeyPath = if ($Config.keyPath) { [string]$Config.keyPath } else { "" }

Step "Resolve deploy settings"
Info "ProjectRoot" $ProjectRoot
Info "Host" $HostName
Info "User" $(if ($UserName) { $UserName } else { "<missing>" })
Info "Port" $Port
Info "KeyPath" $(if ($KeyPath) { $KeyPath } else { "<missing>" })

if ([string]::IsNullOrWhiteSpace($HostName)) { throw "Missing deploy host. Create deploy.config.json or set BLOG_DEPLOY_HOST." }
if ([string]::IsNullOrWhiteSpace($UserName)) { throw "Missing deploy user. Create deploy.config.json or set BLOG_DEPLOY_USER." }

Require-Command ssh

$SshArgs = @(
  "-p", $Port,
  "-o", "User=$UserName",
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "BatchMode=yes",
  "-o", "ConnectTimeout=10"
)

if (-not [string]::IsNullOrWhiteSpace($KeyPath)) {
  $ExpandedKeyPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($KeyPath)
  if (-not (Test-Path -LiteralPath $ExpandedKeyPath)) { throw "keyPath does not exist: $ExpandedKeyPath" }
  $rawKey = Get-Content -LiteralPath $ExpandedKeyPath -Raw -ErrorAction SilentlyContinue
  if ($rawKey -notmatch "BEGIN .*PRIVATE KEY") {
    throw "keyPath is not a private key. Do not use the .pub file: $ExpandedKeyPath"
  }
  $SshArgs += @("-i", $ExpandedKeyPath, "-o", "IdentitiesOnly=yes")
}

Step "Test ssh connection"
& ssh @SshArgs $HostName "echo connection_ok"
if ($LASTEXITCODE -ne 0) { throw "SSH connection test failed (exit $LASTEXITCODE)." }

Step "Receipt"
Info "Result" "OK"
