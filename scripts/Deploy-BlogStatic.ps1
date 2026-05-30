param(
  [string]$ConfigPath = "deploy.config.json",
  [string]$BuildDir = "build",
  [string]$ReleaseId = "",
  [switch]$Build,
  [switch]$Apply,
  [switch]$Activate,
  [switch]$OpenProbe,
  [switch]$NoClean,
  [switch]$AllowBroadRemotePath
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
    publicUrl = if ($env:BLOG_PUBLIC_URL) { $env:BLOG_PUBLIC_URL } else { "https://blog.ryanspice.com/" }
    keyPath = $env:BLOG_DEPLOY_KEY_PATH
    keepNames = @("_incoming", "_releases", "_backups", ".well-known", "cgi-bin")
    basePath = if ($env:BLOG_BASE_PATH) { $env:BLOG_BASE_PATH } else { "" }
  }
}

function ShellQuote([string]$Value) {
  return "'" + $Value.Replace("'", "'\''") + "'"
}

function Normalize-PublicUrl([string]$Url) {
  if ([string]::IsNullOrWhiteSpace($Url)) { return "" }
  return $Url.TrimEnd('/') + '/'
}

function Assert-SafeRemotePath([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { throw "Remote path is empty." }
  if ($Path -notmatch "^[A-Za-z0-9._~/-]+$") { throw "Remote path contains unsafe characters: $Path" }
  if (-not $AllowBroadRemotePath -and $Path -in @("/", ".", "~", "/home", "/var", "/var/www", "public_html")) {
    throw "Refusing broad remote path for this blog deploy: $Path. Use a blog-specific path such as public_html/blog or blog, or pass -AllowBroadRemotePath intentionally."
  }
}

function New-RemoteScript([string]$Template, [hashtable]$Values) {
  $out = $Template
  foreach ($key in $Values.Keys) {
    $out = $out.Replace("__${key}__", [string]$Values[$key])
  }
  return $out
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Config = Read-DeployConfig -Path $ConfigPath

$HostName = [string]$Config.host
$UserName = [string]$Config.user
$Port = if ($Config.port) { [string]$Config.port } else { "22" }
$RemotePath = if ($Config.remotePath) { ([string]$Config.remotePath).TrimEnd('/') } else { "blog" }
$PublicUrl = Normalize-PublicUrl ([string]$Config.publicUrl)
$KeyPath = if ($Config.keyPath) { [string]$Config.keyPath } else { "" }
$BasePath = if ($Config.basePath -ne $null) { [string]$Config.basePath } else { "" }
$KeepNames = if ($Config.keepNames) { @($Config.keepNames) } else { @("_incoming", "_releases", "_backups", ".well-known", "cgi-bin") }

Assert-SafeRemotePath -Path $RemotePath

$BuildPath = if ([IO.Path]::IsPathRooted($BuildDir)) { $BuildDir } else { Join-Path $ProjectRoot $BuildDir }
if ([string]::IsNullOrWhiteSpace($ReleaseId)) {
  $ReleaseId = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
}
if ($ReleaseId -notmatch "^[A-Za-z0-9._-]+$") { throw "ReleaseId contains unsafe characters: $ReleaseId" }

Step "Resolve deploy settings"
Info "ProjectRoot" $ProjectRoot
Info "BuildPath" $BuildPath
Info "Host" $HostName
Info "User" $(if ($UserName) { $UserName } else { "<missing>" })
Info "RemotePath" $RemotePath
Info "ReleaseId" $ReleaseId
Info "PublicUrl" $PublicUrl
Info "Mode" $(if ($Apply) { if ($Activate) { "UPLOAD + ACTIVATE" } else { "PARALLEL UPLOAD" } } else { "DRY RUN" })

if ([string]::IsNullOrWhiteSpace($HostName)) { throw "Missing deploy host. Create deploy.config.json or set BLOG_DEPLOY_HOST." }
if ([string]::IsNullOrWhiteSpace($UserName)) { throw "Missing deploy user. Create deploy.config.json or set BLOG_DEPLOY_USER." }

if (-not $Apply) {
  Step "Dry run complete"
  Write-Host "This would build/upload to a parallel release folder, not activate it."
  Write-Host "Run: pnpm run deploy:parallel"
  exit 0
}

Require-Command ssh
Require-Command scp
Require-Command tar

if ($Build) {
  Step "Build blog for $BasePath"
  & pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Build-BlogStatic.ps1") -BasePath $BasePath -Clean
  if ($LASTEXITCODE -ne 0) { throw "Build failed." }
}

if (-not (Test-Path -LiteralPath (Join-Path $BuildPath "index.html"))) {
  throw "Build output missing index.html: $BuildPath. Run pnpm run build:blog first."
}

$SshArgs = @("-p", $Port, "-o", "User=$UserName")
$ScpArgs = @("-P", $Port, "-o", "User=$UserName")
$SshArgs += @("-o", "StrictHostKeyChecking=accept-new")
$ScpArgs += @("-o", "StrictHostKeyChecking=accept-new")

if (-not [string]::IsNullOrWhiteSpace($KeyPath)) {
  $ExpandedKeyPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($KeyPath)
  if (-not (Test-Path -LiteralPath $ExpandedKeyPath)) { throw "keyPath does not exist: $ExpandedKeyPath" }
  $rawKey = Get-Content -LiteralPath $ExpandedKeyPath -Raw -ErrorAction SilentlyContinue
  if ($rawKey -notmatch "BEGIN .*PRIVATE KEY") {
    throw "keyPath is not a private key. Do not use the .pub file: $ExpandedKeyPath"
  }
  $SshArgs += @("-i", $ExpandedKeyPath, "-o", "IdentitiesOnly=yes")
  $ScpArgs += @("-i", $ExpandedKeyPath, "-o", "IdentitiesOnly=yes")
}

$ArchiveName = "blog-ryanspice-com-$ReleaseId.tar.gz"
$LocalArchive = Join-Path ([IO.Path]::GetTempPath()) $ArchiveName

Step "Create local build archive"
if (Test-Path -LiteralPath $LocalArchive) { Remove-Item -LiteralPath $LocalArchive -Force }
Push-Location -LiteralPath $BuildPath
try {
  & tar -czf $LocalArchive .
  if ($LASTEXITCODE -ne 0) { throw "tar failed while creating local build archive." }
}
finally {
  Pop-Location
}
Info "Archive" $LocalArchive

$remoteQ = ShellQuote $RemotePath
$releaseQ = ShellQuote $ReleaseId
$archiveQ = ShellQuote $ArchiveName
$keepCsv = ($KeepNames -join ',')
$keepQ = ShellQuote $keepCsv

$PrepareRemoteTemplate = @'
set -eu
LIVE=__REMOTE__
RELEASE=__RELEASE__
mkdir -p "$LIVE/_incoming" "$LIVE/_releases/$RELEASE" "$LIVE/_backups"
printf '%s\n' 'Require all denied' 'Deny from all' > "$LIVE/_incoming/.htaccess" || true
printf '%s\n' 'Require all denied' 'Deny from all' > "$LIVE/_backups/.htaccess" || true
test -d "$LIVE"
echo "Remote live path: $LIVE"
echo "Remote release path: $LIVE/_releases/$RELEASE"
'@

$PrepareRemote = New-RemoteScript $PrepareRemoteTemplate @{ REMOTE = $remoteQ; RELEASE = $releaseQ }

Step "Prepare remote release folders"
$PrepareRemote | & ssh @SshArgs $HostName "sh -s"
if ($LASTEXITCODE -ne 0) { throw "Remote prepare failed." }

$RemoteArchivePath = "$RemotePath/_incoming/$ArchiveName"

Step "Upload archive"
& scp @ScpArgs $LocalArchive "${HostName}:$RemoteArchivePath"
if ($LASTEXITCODE -ne 0) { throw "Upload failed." }

$ExtractRemoteTemplate = @'
set -eu
LIVE=__REMOTE__
RELEASE=__RELEASE__
ARCHIVE=__ARCHIVE__
RELEASE_DIR="$LIVE/_releases/$RELEASE"
INCOMING="$LIVE/_incoming/$ARCHIVE"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
tar -xzf "$INCOMING" -C "$RELEASE_DIR"
test -f "$RELEASE_DIR/index.html"
rm -f "$INCOMING"
echo "Parallel release uploaded: $RELEASE_DIR"
'@

$ExtractRemote = New-RemoteScript $ExtractRemoteTemplate @{ REMOTE = $remoteQ; RELEASE = $releaseQ; ARCHIVE = $archiveQ }

Step "Extract parallel release"
$ExtractRemote | & ssh @SshArgs $HostName "sh -s"
if ($LASTEXITCODE -ne 0) { throw "Remote extract failed." }

if ($Activate) {
  $ActivateRemoteTemplate = @'
set -eu
LIVE=__REMOTE__
RELEASE=__RELEASE__
KEEP_NAMES=__KEEP__
BACKUP="$LIVE/_backups/live-$RELEASE.tar.gz"

cd "$LIVE"
test -f "_releases/$RELEASE/index.html"

tar -czf "_backups/live-$RELEASE.tar.gz" --exclude='./_incoming' --exclude='./_releases' --exclude='./_backups' . || true

is_keep_name() {
  name="$1"
  old_ifs="$IFS"
  IFS=','
  for keep in $KEEP_NAMES; do
    IFS="$old_ifs"
    if [ "$name" = "$keep" ]; then return 0; fi
    IFS=','
  done
  IFS="$old_ifs"
  return 1
}

for entry in ./* ./.[!.]* ./..?*; do
  [ -e "$entry" ] || continue
  name="${entry#./}"
  if is_keep_name "$name"; then
    echo "Keeping: $name"
    continue
  fi
  rm -rf -- "$entry"
done

cp -a "_releases/$RELEASE"/. .
echo "Activated release: $RELEASE"
echo "Backup: $BACKUP"
'@

  $ActivateRemote = New-RemoteScript $ActivateRemoteTemplate @{ REMOTE = $remoteQ; RELEASE = $releaseQ; KEEP = $keepQ }

  Step "Activate release"
  $ActivateRemote | & ssh @SshArgs $HostName "sh -s"
  if ($LASTEXITCODE -ne 0) { throw "Remote activate failed." }
}

if (-not $NoClean -and (Test-Path -LiteralPath $LocalArchive)) {
  Remove-Item -LiteralPath $LocalArchive -Force
}

Step "Receipt"
$releaseUrl = if ($PublicUrl) { $PublicUrl + "_releases/$ReleaseId/" } else { "<set publicUrl to compute>" }
Info "Parallel URL" $releaseUrl
Info "Live URL" $PublicUrl
Info "Activated" $(if ($Activate) { "Yes" } else { "No" })

if ($OpenProbe -and $releaseUrl -notlike "<*") {
  Start-Process $releaseUrl
}
