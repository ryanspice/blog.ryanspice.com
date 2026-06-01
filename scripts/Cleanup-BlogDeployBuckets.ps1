param(
  [string]$ConfigPath = "deploy.config.json",
  [switch]$Apply,
  [switch]$AllowBroadRemotePath,
  [int]$KeepReleases = -1,
  [int]$KeepBackups = -1
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
    remotePath = if ($env:BLOG_DEPLOY_PATH) { $env:BLOG_DEPLOY_PATH } else { "blog" }
    keyPath = $env:BLOG_DEPLOY_KEY_PATH
    keepReleases = if ($env:BLOG_KEEP_RELEASES) { [int]$env:BLOG_KEEP_RELEASES } else { 1 }
    keepBackups = if ($env:BLOG_KEEP_BACKUPS) { [int]$env:BLOG_KEEP_BACKUPS } else { 0 }
  }
}

function ShellQuote([string]$Value) {
  return "'" + $Value.Replace("'", "'\''") + "'"
}

function Assert-SafeRemotePath([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { throw "Remote path is empty." }
  if ($Path -notmatch "^[A-Za-z0-9._~/-]+$") { throw "Remote path contains unsafe characters: $Path" }
  if (-not $AllowBroadRemotePath -and $Path -in @("/", ".", "~", "/home", "/var", "/var/www", "public_html")) {
    throw "Refusing broad remote path for this blog cleanup: $Path. Use a blog-specific path such as public_html/blog, or pass -AllowBroadRemotePath intentionally."
  }
}

function Parse-IntOr([object]$Value, [int]$Fallback) {
  if ($Value -eq $null) { return $Fallback }
  try { return [int]$Value } catch { return $Fallback }
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Config = Read-DeployConfig -Path $ConfigPath

$HostName = [string]$Config.host
$UserName = [string]$Config.user
$Port = if ($Config.port) { [string]$Config.port } else { "22" }
$RemotePath = if ($Config.remotePath) { ([string]$Config.remotePath).TrimEnd('/') } else { "blog" }
$KeyPath = if ($Config.keyPath) { [string]$Config.keyPath } else { "" }

Assert-SafeRemotePath -Path $RemotePath

if ($KeepReleases -lt 0) { $KeepReleases = Parse-IntOr $Config.keepReleases 1 }
if ($KeepBackups -lt 0) { $KeepBackups = Parse-IntOr $Config.keepBackups 0 }
if ($KeepReleases -lt 1) { $KeepReleases = 1 }
if ($KeepBackups -lt 0) { $KeepBackups = 0 }

Step "Resolve cleanup settings"
Info "ProjectRoot" $ProjectRoot
Info "Host" $HostName
Info "User" $(if ($UserName) { $UserName } else { "<missing>" })
Info "RemotePath" $RemotePath
Info "KeepReleases" ([string]$KeepReleases)
Info "KeepBackups" ([string]$KeepBackups)
Info "Mode" $(if ($Apply) { "APPLY" } else { "DRY RUN" })

if ([string]::IsNullOrWhiteSpace($HostName)) { throw "Missing deploy host. Create deploy.config.json or set BLOG_DEPLOY_HOST." }
if ([string]::IsNullOrWhiteSpace($UserName)) { throw "Missing deploy user. Create deploy.config.json or set BLOG_DEPLOY_USER." }

Require-Command ssh

$SshArgs = @("-p", $Port)
if (-not [string]::IsNullOrWhiteSpace($KeyPath)) {
  $SshArgs += @("-i", $KeyPath)
}
$SshArgs += @(
  "-o", "BatchMode=yes",
  "-o", "StrictHostKeyChecking=accept-new"
)

$remoteQ = ShellQuote $RemotePath

$ListRemote = @"
set -eu
LIVE=$remoteQ
if [ ! -d "\$LIVE" ]; then
  echo "ERR\tmissing_live\t\$LIVE"
  exit 0
fi

if [ -d "\$LIVE/_releases" ]; then
  for d in "\$LIVE/_releases"/*; do
    [ -d "\$d" ] || continue
    name="\$(basename "\$d")"
    [ -n "\$name" ] || continue
    case "\$name" in
      .*) continue ;;
    esac
    echo "RELEASE\t\$name"
  done
fi

if [ -d "\$LIVE/_backups" ]; then
  for f in "\$LIVE/_backups"/*.tar.gz; do
    [ -f "\$f" ] || continue
    name="\$(basename "\$f")"
    [ -n "\$name" ] || continue
    echo "BACKUP\t\$name"
  done
fi
"@

Step "Query remote bucket contents"
$raw = $ListRemote | & ssh @SshArgs "$UserName@$HostName" "sh -s"
if ($LASTEXITCODE -ne 0) { throw "Remote list failed." }

$releaseNames = New-Object System.Collections.Generic.List[string]
$backupNames = New-Object System.Collections.Generic.List[string]

foreach ($line in ($raw -split "`n")) {
  $trim = $line.TrimEnd("`r").Trim()
  if (-not $trim) { continue }
  $parts = $trim -split "`t", 3
  if ($parts.Length -lt 2) { continue }
  if ($parts[0] -eq "RELEASE") { $releaseNames.Add($parts[1]); continue }
  if ($parts[0] -eq "BACKUP") { $backupNames.Add($parts[1]); continue }
  if ($parts[0] -eq "ERR") { throw "Remote error: $trim" }
}

$releases = $releaseNames.ToArray() | Sort-Object
$backups = $backupNames.ToArray() | Sort-Object

function Tail([string[]]$Items, [int]$Count) {
  if ($Count -le 0) { return @() }
  if ($Items.Length -le $Count) { return $Items }
  return $Items[($Items.Length - $Count)..($Items.Length - 1)]
}

$keepRelease = Tail $releases $KeepReleases
$keepBackup = Tail $backups $KeepBackups
$deleteRelease = $releases | Where-Object { $_ -notin $keepRelease }
$deleteBackup = $backups | Where-Object { $_ -notin $keepBackup }

Step "Plan"
Info "Releases" ([string]$releases.Length)
Info "Backups" ([string]$backups.Length)
Info "Keep release" ($(if ($keepRelease.Length) { $keepRelease -join ", " } else { "(none)" }))
Info "Keep backups" ($(if ($keepBackup.Length) { $keepBackup -join ", " } else { "(none)" }))

if (-not $Apply) {
  Step "Dry run complete"
  Write-Host "Would delete releases:"
  foreach ($name in $deleteRelease) { Write-Host "  - $name" }
  Write-Host "Would delete backups:"
  foreach ($name in $deleteBackup) { Write-Host "  - $name" }
  Write-Host ""
  Write-Host "Re-run with -Apply to perform the deletions."
  exit 0
}

foreach ($name in $deleteRelease) {
  if ($name -notmatch "^[A-Za-z0-9._-]+$") { throw "Unsafe release name from remote listing: $name" }
}
foreach ($name in $deleteBackup) {
  if ($name -notmatch "^[A-Za-z0-9._-]+\\.tar\\.gz$") { throw "Unsafe backup name from remote listing: $name" }
}

$deleteReleaseScript = ($deleteRelease | ForEach-Object { "rm -rf -- \"\$LIVE/_releases/$($_)\"" }) -join "`n"
$deleteBackupScript = ($deleteBackup | ForEach-Object { "rm -f -- \"\$LIVE/_backups/$($_)\"" }) -join "`n"

$CleanupRemote = @"
set -eu
LIVE=$remoteQ
test -d "\$LIVE"

$deleteReleaseScript
$deleteBackupScript

echo "Cleanup complete."
"@

Step "Apply cleanup (remote deletes)"
$CleanupRemote | & ssh @SshArgs "$UserName@$HostName" "sh -s"
if ($LASTEXITCODE -ne 0) { throw "Remote cleanup failed." }

Step "Receipt"
Info "Deleted releases" ([string]$deleteRelease.Length)
Info "Deleted backups" ([string]$deleteBackup.Length)

