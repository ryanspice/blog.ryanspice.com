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
    publicUrl = if ($env:BLOG_PUBLIC_URL) { $env:BLOG_PUBLIC_URL } elseif ($env:PUBLIC_SITE_URL) { $env:PUBLIC_SITE_URL } else { "https://blog.ryanspice.com/" }
    siteId = if ($env:PUBLIC_SITE_ID) { $env:PUBLIC_SITE_ID } elseif ($env:BLOG_SITE_ID) { $env:BLOG_SITE_ID } else { "" }
    keyPath = $env:BLOG_DEPLOY_KEY_PATH
    keepNames = @("_incoming", "_releases", "_backups", ".well-known", "cgi-bin")
    basePath = if ($env:BLOG_BASE_PATH) { $env:BLOG_BASE_PATH } elseif ($env:PUBLIC_BASE_PATH) { $env:PUBLIC_BASE_PATH } else { "" }
  }
}

function ShellQuote([string]$Value) {
  return "'" + $Value.Replace("'", "'\''") + "'"
}

function Normalize-PublicUrl([string]$Url) {
  if ([string]::IsNullOrWhiteSpace($Url)) { return "" }
  return $Url.TrimEnd('/') + '/'
}

function Resolve-SiteId([string]$Value, [string]$PublicUrl) {
  $normalized = if ([string]::IsNullOrWhiteSpace($Value)) { "" } else { $Value.Trim().ToLowerInvariant() }
  if ($normalized -in @("canopy", "canopydigital", "blog.canopydigital.ca")) { return "canopy" }
  if ($normalized -in @("ryan", "ryanspice", "blog.ryanspice.com")) { return "ryan" }
  if (-not [string]::IsNullOrWhiteSpace($normalized)) {
    throw "Unsupported siteId '$Value'. Expected 'ryan' or 'canopy'."
  }

  $normalizedUrl = if ([string]::IsNullOrWhiteSpace($PublicUrl)) { "" } else { $PublicUrl.Trim().ToLowerInvariant() }
  if ($normalizedUrl -match "canopydigital\.ca") { return "canopy" }
  return "ryan"
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
$ConfiguredSiteId = if ($Config.PSObject.Properties["siteId"] -and $Config.siteId) { [string]$Config.siteId } elseif ($env:PUBLIC_SITE_ID) { $env:PUBLIC_SITE_ID } elseif ($env:BLOG_SITE_ID) { $env:BLOG_SITE_ID } else { "" }
$SiteId = Resolve-SiteId -Value $ConfiguredSiteId -PublicUrl $PublicUrl
$KeyPath = if ($Config.keyPath) { [string]$Config.keyPath } else { "" }
$BasePath = if ($Config.basePath -ne $null) { [string]$Config.basePath } else { "" }
$KeepNames = if ($Config.keepNames) { @($Config.keepNames) } else { @("_incoming", "_releases", "_backups", ".well-known", "cgi-bin") }

Assert-SafeRemotePath -Path $RemotePath

$BuildPath = if ([IO.Path]::IsPathRooted($BuildDir)) { $BuildDir } else { Join-Path $ProjectRoot $BuildDir }
$AdapterMode = if ($env:ADAPTER_MODE) { $env:ADAPTER_MODE } else { "php-static" }
if ($AdapterMode -eq "js-ssr" -and $env:ALLOW_BLOG_JS_SSR_DEPLOY -ne "true") {
  throw "Blog production deploy is php-static only. Set ALLOW_BLOG_JS_SSR_DEPLOY=true only after a sidecar supervisor and public-root protection are configured."
}
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
Info "SiteId" $SiteId
Info "AdapterMode" $AdapterMode
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
  Step "Build $SiteId blog for $BasePath"
  $BuildPublicUrl = $PublicUrl.TrimEnd("/")
  & pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Build-BlogStatic.ps1") -BasePath $BasePath -Clean -SiteId $SiteId -PublicSiteUrl $BuildPublicUrl
  if ($LASTEXITCODE -ne 0) { throw "Build failed." }
}

if (-not (Test-Path -LiteralPath (Join-Path $BuildPath "index.php"))) {
  $BuildCommandHint = if ($SiteId -eq "canopy") { "pnpm run build:blog:canopy" } else { "pnpm run build:blog" }
  throw "Build output missing index.php: $BuildPath. Run $BuildCommandHint first."
}

$RequiredContract = @(
  "index.php",
  ".htaccess",
  "router.php",
  "_runtime/compat.php",
  "_app/version.json",
  "adapter/route-manifest.php"
)

if ($AdapterMode -eq "js-ssr") {
  $RequiredContract += @(
    "server/handler.mjs",
    "server/index.js"
  )
} else {
  $RequiredContract += @(
    "_protected/.htaccess"
  )
}

foreach ($item in $RequiredContract) {
  $full = Join-Path $BuildPath $item
  if (-not (Test-Path -LiteralPath $full)) {
    throw "Build output missing required PHP adapter contract file: $item"
  }
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
test -f "$RELEASE_DIR/index.php"
test -f "$RELEASE_DIR/.htaccess"
test -f "$RELEASE_DIR/router.php"
test -f "$RELEASE_DIR/_runtime/compat.php"
test -f "$RELEASE_DIR/_app/version.json"
test -f "$RELEASE_DIR/adapter/route-manifest.php"
if [ -f "$RELEASE_DIR/server/handler.mjs" ] || [ -f "$RELEASE_DIR/server/index.js" ]; then
  test -f "$RELEASE_DIR/server/handler.mjs"
  test -f "$RELEASE_DIR/server/index.js"
else
  test -f "$RELEASE_DIR/_protected/.htaccess"
fi
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
BACKUP="_backups/live-$RELEASE.tar.gz"
BACKUP_LABEL="$LIVE/$BACKUP"

cd "$LIVE"
test -f "_releases/$RELEASE/index.php"
test -f "_releases/$RELEASE/.htaccess"
test -f "_releases/$RELEASE/router.php"
test -f "_releases/$RELEASE/_runtime/compat.php"
test -f "_releases/$RELEASE/_app/version.json"
test -f "_releases/$RELEASE/adapter/route-manifest.php"
if [ -f "_releases/$RELEASE/server/handler.mjs" ] || [ -f "_releases/$RELEASE/server/index.js" ]; then
  test -f "_releases/$RELEASE/server/handler.mjs"
  test -f "_releases/$RELEASE/server/index.js"
else
  test -f "_releases/$RELEASE/_protected/.htaccess"
fi

tar -czf "$BACKUP" --exclude='./_incoming' --exclude='./_releases' --exclude='./_backups' .
test -s "$BACKUP"
tar -tzf "$BACKUP" >/dev/null

find "_backups" -mindepth 1 -maxdepth 1 -type d | while IFS= read -r backup_dir; do
  name="${backup_dir#_backups/}"
  archive="_backups/$name.tar.gz"
  if [ -e "$archive" ]; then
    echo "Uncompressed backup has matching archive; leaving for manual cleanup: $backup_dir" >&2
    exit 1
  fi
  tar -czf "$archive" -C "_backups" "$name"
  test -s "$archive"
  tar -tzf "$archive" >/dev/null
  rm -rf -- "$backup_dir"
  echo "Compressed legacy backup: $archive"
done

uncompressed_backup="$(find "_backups" -mindepth 1 -maxdepth 1 ! -name '*.tar.gz' ! -name '.htaccess' -print -quit)"
if [ -n "$uncompressed_backup" ]; then
  echo "Found uncompressed backup artifact in _backups: $uncompressed_backup" >&2
  exit 1
fi

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
echo "Backup: $BACKUP_LABEL"
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
