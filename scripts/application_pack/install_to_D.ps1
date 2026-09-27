# Decode application pack PDF from repo → external drive D:
# No browser download needed.
# Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File D:\circle-d-flow-web\scripts\application_pack\install_to_D.ps1

$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$B64 = Join-Path $Here "Application_Pack_Marc_Hope-Bruce_Charles_Cluzeaud_Lisbon.pdf.b64"
$DestDir = "D:\Wakungo_Content_Studio\Documents\Application_Pack"
$DestPdf = Join-Path $DestDir "Application_Pack_Marc_Hope-Bruce_Charles_Cluzeaud_Lisbon.pdf"

if (-not (Test-Path $B64)) {
  Write-Host "ERROR: missing $B64 — git pull the branch first" -ForegroundColor Red
  exit 2
}
if (-not (Test-Path "D:\")) {
  Write-Host "ERROR: Drive D: not available" -ForegroundColor Red
  exit 3
}

New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
$bytes = [Convert]::FromBase64String( ((Get-Content -Raw $B64) -replace "\s","") )
[System.IO.File]::WriteAllBytes($DestPdf, $bytes)

$lilith = Join-Path $Here "lilith.jpg"
if (Test-Path $lilith) { Copy-Item -Force $lilith (Join-Path $DestDir "lilith.jpg") }

@"
Application pack (English) — Marc Hope-Bruce & Charles Cluzeaud — Lisbon
Also attach Marc's employment contract PDF in this folder when sending.
Contacts: circle.d.flow@gmail.com · charles.cluzeaud@gmail.com
Cat: Lilith
"@ | Set-Content -Encoding UTF8 (Join-Path $DestDir "README.txt")

Write-Host "OK -> $DestPdf" -ForegroundColor Green
explorer $DestDir
