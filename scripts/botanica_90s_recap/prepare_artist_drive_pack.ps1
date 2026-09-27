# Botanica artist Drive pack — stabilize + graded photos into artist folders
# Run on the Windows PC that has D:
$ErrorActionPreference = "Stop"
$Root = if ($env:BOTANICA_ROOT) { $env:BOTANICA_ROOT } else { "D:\Wakungo_Content_Studio\Botanica" }
$Repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path $Root)) {
  Write-Host "ERROR: Botanica not found at $Root" -ForegroundColor Red
  exit 3
}
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: ffmpeg not on PATH" -ForegroundColor Red
  exit 2
}
Write-Host "Root: $Root"
Write-Host "Repo: $Repo"
$force = @()
if ($args -contains "-ForceRebuild" -or $env:BOTANICA_FORCE -eq "1") {
  $force = @("--force")
}
python "$PSScriptRoot\prepare_artist_drive_pack.py" --root "$Root" --repo "$Repo" @force @args
