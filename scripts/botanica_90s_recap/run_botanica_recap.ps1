# Botanica 90s Recap — run on the PC that has D:
# Requires: ffmpeg on PATH, Python 3.10+
$ErrorActionPreference = "Stop"
$Root = if ($env:BOTANICA_ROOT) { $env:BOTANICA_ROOT } else { "D:\Wakungo_Content_Studio\Botanica" }
$Repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path $Root)) {
  Write-Host "ERROR: Botanica not found at $Root" -ForegroundColor Red
  Write-Host "Set BOTANICA_ROOT or create the folder and put raw media inside."
  exit 3
}
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: ffmpeg not on PATH" -ForegroundColor Red
  exit 2
}
Write-Host "Root: $Root"
Write-Host "Repo: $Repo"
Write-Host "Tip: add -ForceRebuild for a clean v2 re-encode (fixes empty text plates)"
$pyArgs = @("--root", "$Root", "--repo", "$Repo")
if ($args -contains "-ForceRebuild" -or $env:BOTANICA_FORCE -eq "1") {
  $pyArgs += "--force"
  $args = @($args | Where-Object { $_ -ne "-ForceRebuild" })
}
python "$PSScriptRoot\run_botanica_recap.py" @pyArgs @args
