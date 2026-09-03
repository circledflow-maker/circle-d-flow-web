$ErrorActionPreference='Continue'
$outRoot='D:\Wakungo_Content_Studio\Destiny Hostel\31July\002'
$logs=Join-Path $outRoot '00_logs'
$full319=Join-Path $outRoot '05_Format_Drafts\Circle_D_Stages\00_full_takes\DSC_0319_stages_full.mp4'
$flag=Join-Path $logs 'DSC0324_SOCIAL_COMPLETE.flag'
function L($m){ $line="[{0:HH:mm:ss}] {1}" -f (Get-Date),$m; Write-Host $line; Add-Content (Join-Path $logs 'wait_then_0324.log') $line }

function Dur($p){
  try { return [double](& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $p 2>$null) } catch { return 0 }
}
function Ok319 {
  if (-not (Test-Path $full319)) { return $false }
  if ((Get-Item $full319).Length -lt 50MB) { return $false }
  $d = Dur $full319
  # expect ~907s
  return ($d -ge 800)
}

L 'Supervisor: wait for DSC_0319 full take, then run DSC_0324 artist+social'
while (-not (Ok319)) {
  if (Test-Path $flag) { L '0324 already complete'; exit 0 }
  # still encoding?
  $ff = @(Get-CimInstance Win32_Process -Filter "Name='ffmpeg.exe'" | Where-Object { $_.CommandLine -match 'DSC_0319' })
  $partial = if (Test-Path $full319) { '{0:N0}s / {1:N0}MB' -f (Dur $full319), ((Get-Item $full319).Length/1MB) } else { 'none' }
  L ("waiting 0319... partial=$partial ffmpeg0319=$($ff.Count)")
  Start-Sleep 90
}

L 'DSC_0319 full take ready. Freeing SD for DSC_0324...'
# Stop full-card stages pipeline so it does not grab 0320+ before 0324 social job
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'destiny_stages_cuts\.ps1' } | ForEach-Object {
  L ("stop stages_cuts PID $($_.ProcessId)")
  Stop-Process -Id $_.ProcessId -Force -EA SilentlyContinue
}
Get-CimInstance Win32_Process -Filter "Name='ffmpeg.exe'" | Where-Object { $_.CommandLine -match '106NZ502|Destiny Hostel' -and $_.CommandLine -notmatch 'DSC_0324' } | ForEach-Object {
  L ("stop leftover ffmpeg PID $($_.ProcessId)")
  Stop-Process -Id $_.ProcessId -Force -EA SilentlyContinue
}
Start-Sleep 3

if (-not (Test-Path 'F:\DCIM\106NZ502\DSC_0324.MOV')) { L 'ERROR: DSC_0324 missing on F:'; exit 2 }

# Start artist index after any existing Artist folders
$existing = @(Get-ChildItem (Join-Path $outRoot '05_Format_Drafts\Circle_D_Stages\02_Artists') -Directory -EA SilentlyContinue | Where-Object { $_.Name -match '^Artist_\d+' })
$startIdx = 1
if ($existing.Count -gt 0) {
  $nums = $existing | ForEach-Object { if ($_.Name -match 'Artist_(\d+)') { [int]$Matches[1] } }
  $startIdx = ($nums | Measure-Object -Maximum).Maximum + 1
}
L ("Launch DSC_0324 social cuts (ArtistStartIndex=$startIdx)")
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\circle-d-flow-web\scripts\destiny_0324_artist_social.ps1' -ArtistStartIndex $startIdx
$code = $LASTEXITCODE
L ("0324 script exit=$code")
exit $code
