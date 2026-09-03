# Fix batch 003 Nicke Klein intro name only (was Heike Klein)
$ErrorActionPreference = 'Stop'
$OutRoot = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003'
$logs = Join-Path $OutRoot '00_logs'
$drive = Join-Path $OutRoot '06_drive_ready\Circle_D_Stages\Artists\Nicke_Klein'
$artists = Join-Path $OutRoot '04_videos_compressed\Artists\Nicke_Klein'
$drafts = Join-Path $OutRoot '05_Format_Drafts\Circle_D_Stages\02_Artists\Nicke_Klein'
$tmp = Join-Path $env:TEMP 'destiny_003_nicke_name_fix'
$env:FONTCONFIG_FILE = 'D:\circle-d-flow-web\scripts\fonts\fonts.conf'
$env:FONTCONFIG_PATH = 'D:\circle-d-flow-web\scripts\fonts'
$file = '01_Nicke-Klein_ONENESS_Stages_16x9.mp4'
$introDur = 7.0

function Write-Log([string]$m) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $m"
  Write-Host $line
  Add-Content (Join-Path $logs 'fix_nicke_name_003.log') $line
}

$src = Join-Path $drive $file
if (-not (Test-Path $src)) { throw "missing $src" }
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory -Force -Path $tmp, $logs | Out-Null

Write-Log 'Nicke 003: fix intro name to Nicke Klein'
Copy-Item $src (Join-Path $tmp 'src.mp4') -Force
$body = Join-Path $tmp 'body.mp4'
& ffmpeg -y -hide_banner -loglevel error -ss $introDur -i (Join-Path $tmp 'src.mp4') -c copy $body
if ($LASTEXITCODE -ne 0) { throw 'body fail' }

$intro = Join-Path $tmp 'intro.mp4'
$vf = Join-Path $tmp 'vf.txt'
@'
drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Circle D Stages presents':fontsize=36:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.22,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Wako Kungo  ONENESS':fontsize=52:fontcolor=#E8C547:x=(w-text_w)/2:y=h*0.34,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Sunset Destination Hostel - Cais do Sodre':fontsize=28:fontcolor=white@0.85:x=(w-text_w)/2:y=h*0.48,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Nicke Klein':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=h*0.66,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='@nickeklein - Live':fontsize=28:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.80,format=yuv420p
'@ | Set-Content $vf -Encoding ascii -NoNewline
& ffmpeg -y -hide_banner -loglevel error -f lavfi -i "color=c=0x0A0A0F:s=1920x1080:d=7:r=60000/1001" -f lavfi -i "anullsrc=r=48000:cl=stereo" -t 7 -filter_script:v $vf -c:v libx264 -preset ultrafast -crf 18 -c:a aac -ar 48000 -ac 2 -b:a 192k -shortest $intro
if ($LASTEXITCODE -ne 0) { throw 'intro fail' }

$out169 = Join-Path $tmp $file
$out916 = Join-Path $tmp '01_Nicke-Klein_ONENESS_Stages_9x16.mp4'
$fc = '[0:v]setpts=PTS-STARTPTS,format=yuv420p[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS,format=yuv420p[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
Write-Log 'concat'
& ffmpeg -y -hide_banner -loglevel error -i $intro -i $body -filter_complex $fc -map '[v]' -map '[a]' -c:v libx264 -preset ultrafast -crf 20 -c:a aac -b:a 192k -ar 48000 -ac 2 $out169
if ($LASTEXITCODE -ne 0) { throw 'concat fail' }
Write-Log '9x16'
& ffmpeg -y -hide_banner -loglevel error -i $out169 -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p' -c:v libx264 -preset ultrafast -crf 21 -c:a aac -b:a 192k -ar 48000 -ac 2 $out916
$thumb = Join-Path $tmp '01_Nicke-Klein_thumb.jpg'
& ffmpeg -y -hide_banner -loglevel error -ss 20 -i $out169 -frames:v 1 -q:v 2 $thumb

foreach ($base in @($artists, $drafts, $drive)) {
  New-Item -ItemType Directory -Force -Path $base | Out-Null
  Copy-Item $out169, $out916, $thumb $base -Force
}
@(
  'Artist: Nicke Klein',
  'IG: @nickeklein',
  'Venue: Sunset Destination Hostel - Cais do Sodre',
  'Source: DSC_0322.MOV'
) | Set-Content (Join-Path $artists 'ARTIST_INFO.txt') -Encoding UTF8

Remove-Item $tmp -Recurse -Force -EA SilentlyContinue
'READY' | Set-Content (Join-Path $logs 'NICKE_NAME_003_FIXED.flag')
Write-Log 'READY Nicke Klein 003'
