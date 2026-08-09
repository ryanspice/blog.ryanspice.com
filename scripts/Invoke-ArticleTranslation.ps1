[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$Source,
  [ValidateSet("fr")]
  [string]$Target = "fr",
  [switch]$PreferLuna
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SourcePath = Join-Path $RepoRoot "src\lib\content\articles\$Source.md"
$TargetPath = Join-Path $RepoRoot "src\lib\content\articles\$Target\$Source.md"
$FuguAdapter = Join-Path $env:USERPROFILE ".local\bin\Invoke-FuguLane.ps1"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$RunDir = Join-Path $RepoRoot "report\i18n\runs\$Stamp-$Source-$Target"

if (-not (Test-Path -LiteralPath $SourcePath)) { throw "Source article not found: $SourcePath" }
if (-not (Test-Path -LiteralPath $FuguAdapter)) { throw "Fugu adapter not found: $FuguAdapter" }
New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

function Invoke-Lane {
  param([string]$Lane, [string]$PromptPath, [string]$OutputPath)
  & $FuguAdapter -Lane $Lane -PromptFile $PromptPath -Tag "blog-translation-$Source-$Target" -OutFile $OutputPath -TimeoutSec 900
  if (-not (Test-Path -LiteralPath $OutputPath)) { throw "Translation lane $Lane produced no output." }
}

function Clean-ModelMarkdown {
  param([string]$Path)
  $Text = Get-Content -LiteralPath $Path -Raw
  $Text = $Text -replace "`e\[[0-9;]*[A-Za-z]", ""
  $Text = $Text -replace "(?m)^session_id:.*$", ""
  $Text = $Text.Trim()
  if ($Text -match "(?s)^```(?:markdown|md)?\s*(.*?)\s*```$") { $Text = $Matches[1].Trim() }
  return $Text
}

Push-Location $RepoRoot
try {
  $LiteralPrompt = Join-Path $RunDir "01-literal.prompt.txt"
  $LiteralOutput = Join-Path $RunDir "01-literal.md"
  node .\scripts\translate-article.mjs --source $Source --target $Target --prompt-output $LiteralPrompt --prompt-only
  if ($LASTEXITCODE -ne 0) { throw "Failed to build the literal translation prompt." }
  Invoke-Lane -Lane "worker-flash" -PromptPath $LiteralPrompt -OutputPath $LiteralOutput

  $EditorialPrompt = Join-Path $RunDir "02-editorial.prompt.txt"
  $EditorialOutput = Join-Path $RunDir "02-editorial.md"
  @(
    "ROLE: Quebec/Canadian French technical editor."
    "TASK: Revise the supplied literal translation for idiomatic Montreal-aware Canadian French."
    "Keep the author's practical first-person voice. Do not force slang, add claims, translate product/API names, or alter Markdown structure, links, images, inline code, or code fences."
    "Return only the revised Markdown body."
    ""
    (Clean-ModelMarkdown $LiteralOutput)
  ) -join "`n" | Set-Content -LiteralPath $EditorialPrompt -Encoding UTF8

  $EditorialLane = if ($PreferLuna) { "aux-luna" } else { "worker-spark" }
  try {
    Invoke-Lane -Lane $EditorialLane -PromptPath $EditorialPrompt -OutputPath $EditorialOutput
  } catch {
    if ($EditorialLane -eq "aux-luna") { throw }
    Write-Warning "Spark was unavailable; falling back to Luna for the Canadian French editorial pass."
    Invoke-Lane -Lane "aux-luna" -PromptPath $EditorialPrompt -OutputPath $EditorialOutput
  }

  $SynthesisPrompt = Join-Path $RunDir "03-sol-synthesis.prompt.txt"
  $SynthesisOutput = Join-Path $RunDir "03-sol-synthesis.md"
  @(
    "ROLE: GPT-5.6 Sol final bilingual editor working against Ryan's visible project voice."
    "TASK: Synthesize the literal and editorial drafts into the final Canadian French article body."
    "Use precise, natural Canadian French suitable for Montreal technical readers. Preserve uncertainty and the author's soul without caricature."
    "The heading levels, links, image targets, inline code, and fenced code must remain structurally identical to the English source."
    "Return only Markdown body text, with no frontmatter, preamble, or surrounding fence."
    ""
    "## English source"
    (Get-Content -LiteralPath $SourcePath -Raw)
    ""
    "## Literal DeepSeek Flash draft"
    (Clean-ModelMarkdown $LiteralOutput)
    ""
    "## Canadian editorial draft"
    (Clean-ModelMarkdown $EditorialOutput)
  ) -join "`n" | Set-Content -LiteralPath $SynthesisPrompt -Encoding UTF8
  Invoke-Lane -Lane "worker-lead" -PromptPath $SynthesisPrompt -OutputPath $SynthesisOutput

  $CleanBodyPath = Join-Path $RunDir "03-sol-synthesis.clean.md"
  Clean-ModelMarkdown $SynthesisOutput | Set-Content -LiteralPath $CleanBodyPath -Encoding UTF8
  $CandidatePath = Join-Path $RunDir "$Source.$Target.candidate.md"
  node .\scripts\translate-article.mjs --source $Source --target $Target --llm-output $CleanBodyPath --output $CandidatePath
  if ($LASTEXITCODE -ne 0) { throw "Failed to create the translation candidate." }

  node .\scripts\validate-article-translation.mjs --source $SourcePath --target $CandidatePath
  if ($LASTEXITCODE -ne 0) { throw "Translation validation failed. Candidate remains in $RunDir for review." }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $TargetPath) | Out-Null
  Copy-Item -LiteralPath $CandidatePath -Destination $TargetPath -Force
  Write-Host "French review draft: $TargetPath"
  Write-Host "Translation evidence: $RunDir"
} finally {
  Pop-Location
}
