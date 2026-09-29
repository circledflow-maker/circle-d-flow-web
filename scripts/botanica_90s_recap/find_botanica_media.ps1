$ErrorActionPreference = "Continue"
$Root = "D:\Wakungo_Content_Studio\Botanica"
Write-Host "=== Botanica diagnostic ===" -ForegroundColor Cyan
Write-Host "Root exists: $(Test-Path -LiteralPath $Root)  $Root"
if (-not (Test-Path -LiteralPath $Root)) { exit 3 }

Write-Host "`n--- Top-level folders ---"
Get-ChildItem -LiteralPath $Root -Directory -ErrorAction SilentlyContinue | ForEach-Object { Write-Host ("  " + $_.Name) }

$wakoCandidates = @(
  (Join-Path $Root "Wako Kungo"),
  (Join-Path $Root "Wako_Kungo"),
  (Join-Path $Root "wako kungo"),
  (Join-Path $Root "WakoKungo")
)
Write-Host "`n--- Wako folder candidates ---"
foreach ($c in $wakoCandidates) {
  Write-Host ("  [{0}] {1}" -f (Test-Path -LiteralPath $c), $c)
}

Write-Host "`n--- All videos under Botanica (first 40) ---"
$vids = @(Get-ChildItem -LiteralPath $Root -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '\.(mp4|mov|m4v|mkv)$' -and $_.FullName -notmatch '\\(EXPORT|00_work|DRIVE_UPLOAD|ANALYSIS)\\' })
Write-Host ("Count (excl. export/work): {0}" -f $vids.Count)
$vids | Select-Object -First 40 | ForEach-Object {
  Write-Host ("  {0:N1} MB  {1}" -f ($_.Length/1MB), $_.FullName)
}

Write-Host "`n--- Already rendered masters anywhere under Botanica ---"
$masters = @(Get-ChildItem -LiteralPath $Root -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match 'BOTANICA|RECAP|LETTERBOX|ENGAGING|9x16|9X16' -and $_.Extension -match '\.mp4$' })
if ($masters.Count -eq 0) { Write-Host "  (none found)" } else {
  $masters | ForEach-Object { Write-Host ("  {0:N1} MB  {1}" -f ($_.Length/1MB), $_.FullName) }
}

Write-Host "`n--- Done. Copy this output back if EXPORT is still empty. ---"
