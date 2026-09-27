# Face-organize Botanica / Wako Kungo → artist Drive folders
$ErrorActionPreference = "Stop"
$Root = if ($env:BOTANICA_ROOT) { $env:BOTANICA_ROOT } else { "D:\Wakungo_Content_Studio\Botanica" }
$Repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path $Root)) { Write-Host "ERROR: $Root missing" -ForegroundColor Red; exit 3 }
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { Write-Host "ERROR: ffmpeg missing" -ForegroundColor Red; exit 2 }

Write-Host "Installing opencv-python-headless (if needed)…"
python -m pip install --quiet opencv-python-headless numpy Pillow

$force = @()
if ($args -contains "-ForceRebuild" -or $env:BOTANICA_FORCE -eq "1") { $force = @("--force") }

python "$PSScriptRoot\organize_artists_face.py" --root "$Root" --repo "$Repo" --source "$Root\Wako Kungo" @force
Write-Host "Open: $Root\DRIVE_UPLOAD\ARTISTS"
explorer "$Root\DRIVE_UPLOAD\ARTISTS"
