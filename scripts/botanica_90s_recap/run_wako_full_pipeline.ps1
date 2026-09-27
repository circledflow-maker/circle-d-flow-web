# FULL Botanica pipeline on Windows + D:
#  1) Analyze & face-sort  D:\Wakungo_Content_Studio\Botanica\Wako Kungo
#  2) Build one 90s 9:16 reel from that footage
#
# Usage:
#   cd D:\circle-d-flow-web
#   powershell -ExecutionPolicy Bypass -File .\scripts\botanica_90s_recap\run_wako_full_pipeline.ps1

$ErrorActionPreference = "Stop"
$Root = if ($env:BOTANICA_ROOT) { $env:BOTANICA_ROOT } else { "D:\Wakungo_Content_Studio\Botanica" }
$Source = Join-Path $Root "Wako Kungo"
$Repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Botanica FULL pipeline" -ForegroundColor Cyan
Write-Host " Root:   $Root"
Write-Host " Source: $Source"
Write-Host " Repo:   $Repo"
Write-Host "========================================" -ForegroundColor Cyan

if (-not (Test-Path $Root)) {
  Write-Host "ERROR: Botanica root not found: $Root" -ForegroundColor Red
  exit 3
}
if (-not (Test-Path $Source)) {
  Write-Host "ERROR: Wako Kungo folder not found: $Source" -ForegroundColor Red
  Write-Host "Create it and put event videos (.MOV/.mp4) inside." -ForegroundColor Yellow
  exit 3
}
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: ffmpeg not on PATH" -ForegroundColor Red
  exit 2
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: python not on PATH" -ForegroundColor Red
  exit 2
}

# Count source media
$vids = Get-ChildItem -Path $Source -Recurse -File -Include *.mp4,*.mov,*.m4v,*.mkv,*.MOV,*.MP4 -ErrorAction SilentlyContinue
$photos = Get-ChildItem -Path $Source -Recurse -File -Include *.jpg,*.jpeg,*.png,*.JPG,*.JPEG,*.PNG -ErrorAction SilentlyContinue
Write-Host ("Wako Kungo media: {0} videos, {1} photos" -f $vids.Count, $photos.Count) -ForegroundColor Green
if ($vids.Count -eq 0) {
  Write-Host "ERROR: No videos inside Wako Kungo — nothing to analyze." -ForegroundColor Red
  exit 4
}
Write-Host "Sample files:" -ForegroundColor DarkGray
$vids | Select-Object -First 8 | ForEach-Object { Write-Host ("  - " + $_.FullName) }

Write-Host ""
Write-Host "STEP A — pip deps for face sort…" -ForegroundColor Cyan
python -m pip install --quiet opencv-python-headless numpy Pillow

Write-Host ""
Write-Host "STEP B — Face-analyze + sort into ARTISTS / DRIVE_UPLOAD…" -ForegroundColor Cyan
python "$PSScriptRoot\organize_artists_face.py" `
  --root "$Root" `
  --repo "$Repo" `
  --source "$Source" `
  --samples 14 `
  --force
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "STEP C — Build 90s cinematic reel (9:16) from Wako Kungo…" -ForegroundColor Cyan
python "$PSScriptRoot\run_botanica_recap.py" `
  --root "$Root" `
  --repo "$Repo" `
  --prefer-subdir "wako kungo" `
  --seconds 90 `
  --force
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Copy reel into Drive upload pack
$reel = Join-Path $Root "EXPORT\BOTANICA_90s_RECAP_9x16.mp4"
$eventDir = Join-Path $Root "DRIVE_UPLOAD\EVENT"
New-Item -ItemType Directory -Force -Path $eventDir | Out-Null
if (Test-Path $reel) {
  Copy-Item -Force $reel (Join-Path $eventDir "BOTANICA_90s_RECAP_9x16.mp4")
  Write-Host ""
  Write-Host "DONE" -ForegroundColor Green
  Write-Host "  Reel:    $reel"
  Write-Host "  Artists: $Root\DRIVE_UPLOAD\ARTISTS"
  Write-Host "  Log:     $Root\ANALYSIS\face_match_log.json"
  explorer (Join-Path $Root "DRIVE_UPLOAD")
  explorer $reel
} else {
  Write-Host "WARN: reel file missing at $reel" -ForegroundColor Yellow
  exit 5
}
