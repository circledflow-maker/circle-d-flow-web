# Decode application pack PDF from repo to drive D:
# No browser download needed.
#   powershell -ExecutionPolicy Bypass -File .\scripts\application_pack\install_to_D.ps1

$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$B64 = Join-Path $Here "Application_Pack_Marc_Hope-Bruce_Charles_Cluzeaud_Lisbon.pdf.b64"
$DestDir = "D:\Wakungo_Content_Studio\Documents\Application_Pack"
$DestPdf = Join-Path $DestDir "Application_Pack_Marc_Hope-Bruce_Charles_Cluzeaud_Lisbon.pdf"

if (-not (Test-Path $B64)) {
  Write-Host "ERROR: missing base64 file. Run git checkout for scripts/application_pack first." -ForegroundColor Red
  exit 2
}
if (-not (Test-Path "D:\")) {
  Write-Host "ERROR: Drive D: not available" -ForegroundColor Red
  exit 3
}

New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
$raw = Get-Content -Raw -Path $B64
$clean = $raw -replace "\s", ""
$bytes = [Convert]::FromBase64String($clean)
[System.IO.File]::WriteAllBytes($DestPdf, $bytes)

$lilith = Join-Path $Here "lilith.jpg"
if (Test-Path $lilith) {
  Copy-Item -Force $lilith (Join-Path $DestDir "lilith.jpg")
}

$readme = @(
  "Application pack (English) - Marc Hope-Bruce and Charles Cluzeaud - Lisbon"
  "Also attach the Marc employment contract PDF in this folder when sending."
  "Contacts: circle.d.flow@gmail.com / charles.cluzeaud@gmail.com"
  "Cat: Lilith"
) -join "`r`n"
Set-Content -Path (Join-Path $DestDir "README.txt") -Value $readme -Encoding UTF8

Write-Host "OK -> $DestPdf" -ForegroundColor Green
explorer $DestDir
