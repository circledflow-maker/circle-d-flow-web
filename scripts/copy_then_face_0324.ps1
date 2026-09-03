$ErrorActionPreference='Continue'
$src='F:\DCIM\106NZ502\DSC_0324.MOV'
$dst='D:\Wakungo_Content_Studio\Destiny Hostel\31July\002\01_raw_cache\DSC_0324_raw.mov'
$logs='D:\Wakungo_Content_Studio\Destiny Hostel\31July\002\00_logs'
function L($m){ $l="[{0:HH:mm:ss}] {1}" -f (Get-Date),$m; Write-Host $l; Add-Content (Join-Path $logs 'copy_then_face.log') $l }
L "Copy DSC_0324 to D: ..."
if ((Test-Path $dst) -and ((Get-Item $dst).Length -gt 15GB)) { L "cache already present" }
else {
  if (Test-Path $dst) { Remove-Item $dst -Force }
  Copy-Item -LiteralPath $src -Destination $dst -Force
  L ("copy done MB={0:N0}" -f ((Get-Item $dst).Length/1MB))
}
Remove-Item 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\002\00_logs\face_frames_0324\*' -Force -EA SilentlyContinue
L "Start face-assign from cache"
$env:DESTINY_SRC = $dst
$env:TF_CPP_MIN_LOG_LEVEL = '2'
& python 'D:\circle-d-flow-web\scripts\destiny_0324_face_assign.py'
L ("face-assign exit=$LASTEXITCODE")
