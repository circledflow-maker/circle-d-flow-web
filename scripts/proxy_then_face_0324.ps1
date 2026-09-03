$ErrorActionPreference='Continue'
$src='F:\DCIM\106NZ502\DSC_0324.MOV'
$proxy='D:\Wakungo_Content_Studio\Destiny Hostel\31July\002\01_raw_cache\DSC_0324_proxy720.mp4'
$logs='D:\Wakungo_Content_Studio\Destiny Hostel\31July\002\00_logs'
function L($m){ $l="[{0:HH:mm:ss}] {1}" -f (Get-Date),$m; Write-Host $l; Add-Content (Join-Path $logs 'proxy_then_face.log') $l }
L "Build 720p proxy for face-ID (FAT32-safe)..."
& ffmpeg -y -hide_banner -loglevel error -stats -hwaccel d3d11va -i $src -vf scale=1280:-2 -c:v libx264 -preset ultrafast -crf 28 -an -movflags +faststart $proxy
if (-not (Test-Path $proxy) -or ((Get-Item $proxy).Length -lt 50MB)) { L "PROXY FAIL"; exit 3 }
L ("proxy OK MB={0:N0}" -f ((Get-Item $proxy).Length/1MB))
Remove-Item (Join-Path $logs 'face_frames_0324\*') -Force -EA SilentlyContinue
L "Start face-assign (proxy for ID, SD for final encode)"
$env:DESTINY_SRC = $proxy
$env:DESTINY_MASTER = $src
$env:TF_CPP_MIN_LOG_LEVEL = '2'
& python 'D:\circle-d-flow-web\scripts\destiny_0324_face_assign.py'
L ("exit=$LASTEXITCODE")
