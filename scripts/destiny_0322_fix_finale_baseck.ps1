# Rebuild Finale_Baseck: intro with &, remove 00:01:10-00:03:12
# Fast path: reburn lower-third only on short part1; keep part2 as-is
$ErrorActionPreference = 'Stop'
$OutRoot = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003'
$logs = Join-Path $OutRoot '00_logs'
$tmp = Join-Path $OutRoot '00_work\Finale_Baseck_fix'
$env:FONTCONFIG_FILE = 'D:\circle-d-flow-web\scripts\fonts\fonts.conf'
$env:FONTCONFIG_PATH = 'D:\circle-d-flow-web\scripts\fonts'

$src169 = Join-Path $OutRoot '06_drive_ready\Circle_D_Stages\Artists\Finale_Baseck\01_Finale-Baseck_ONENESS_Stages_16x9.mp4'
$slug = 'Finale_Baseck'
$safe = 'Finale-Baseck'
$introDur = 7.0
$cutStart = 70.0
$cutEnd = 192.0

function Write-Log([string]$m) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $m"
  Write-Host $line
  Add-Content (Join-Path $logs 'fix_finale_baseck.log') $line
}

New-Item -ItemType Directory -Force -Path $tmp, $logs | Out-Null
if (-not (Test-Path $src169)) { throw "missing $src169" }

# Clear hung partial body
Remove-Item (Join-Path $tmp 'body.mp4') -Force -ErrorAction SilentlyContinue

$srcDur = [double](& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $src169)
Write-Log ("FIX Finale start remove {0}-{1}s srcDur={2:N1}" -f $cutStart, $cutEnd, $srcDur)

$intro = Join-Path $tmp 'intro60.mp4'
$introVf = Join-Path $tmp 'intro_vf.txt'
@'
drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Circle D Stages presents':fontsize=36:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.22,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Wako Kungo  ONENESS':fontsize=52:fontcolor=#E8C547:x=(w-text_w)/2:y=h*0.34,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Sunset Destination Hostel - Cais do Sodre':fontsize=30:fontcolor=white@0.85:x=(w-text_w)/2:y=h*0.48,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Baseck & Edoardo & Joao':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=h*0.66,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='basseck.mankabu - Live':fontsize=28:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.80,format=yuv420p
'@ | Set-Content $introVf -Encoding ascii -NoNewline
& ffmpeg -y -hide_banner -loglevel error -f lavfi -i "color=c=0x0A0A0F:s=1920x1080:d=7:r=60000/1001" -f lavfi -i "anullsrc=r=48000:cl=stereo" -t 7 -filter_script:v $introVf -c:v libx264 -preset ultrafast -crf 18 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k -shortest $intro
if ($LASTEXITCODE -ne 0) { throw 'intro fail' }

$part1Start = $introDur
$part1Dur = [math]::Max(0.1, $cutStart - $introDur)
$part2Start = $cutEnd
$part2Dur = [math]::Max(0.1, $srcDur - $cutEnd)
$p1raw = Join-Path $tmp 'part1_raw.mp4'
$p1 = Join-Path $tmp 'part1.mp4'
$p2 = Join-Path $tmp 'part2.mp4'
$body = Join-Path $tmp 'body.mp4'

Write-Log ("part1_raw ss={0} t={1}" -f $part1Start, $part1Dur)
& ffmpeg -y -hide_banner -loglevel error -ss $part1Start -i $src169 -t $part1Dur -c:v libx264 -preset ultrafast -crf 20 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k $p1raw
if ($LASTEXITCODE -ne 0) { throw 'part1_raw fail' }

# Lower third only on short part1 (~63s)
$vfPath = Join-Path $tmp 'vf_p1.txt'
@'
drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Baseck & Edoardo & Joao':fontsize=42:fontcolor=white:borderw=2:bordercolor=black@0.65:x=56:y=h-168:enable='between(t\,1.0\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Live Performance':fontsize=28:fontcolor=white@0.92:borderw=1:bordercolor=black@0.5:x=56:y=h-112:enable='between(t\,1.2\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='basseck.mankabu':fontsize=24:fontcolor=#E8C547:borderw=1:bordercolor=black@0.5:x=56:y=h-72:enable='between(t\,1.4\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Circle D Stages - ONENESS':fontsize=22:fontcolor=white@0.75:x=56:y=48:enable='between(t\,0.5\,8)',format=yuv420p
'@ | Set-Content $vfPath -Encoding ascii -NoNewline
Write-Log 'part1 burn-in'
& ffmpeg -y -hide_banner -loglevel error -i $p1raw -filter_script:v $vfPath -c:v libx264 -preset ultrafast -crf 20 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k $p1
if ($LASTEXITCODE -ne 0) { throw 'part1 burn fail' }

Write-Log ("part2 ss={0} t={1}" -f $part2Start, $part2Dur)
& ffmpeg -y -hide_banner -loglevel error -ss $part2Start -i $src169 -t $part2Dur -c:v libx264 -preset ultrafast -crf 20 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k $p2
if ($LASTEXITCODE -ne 0) { throw 'part2 fail' }

Write-Log 'merge part1+part2'
$fcMerge = '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]'
& ffmpeg -y -hide_banner -loglevel error -i $p1 -i $p2 -filter_complex $fcMerge -map '[v]' -map '[a]' -c:v libx264 -preset ultrafast -crf 20 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k $body
if ($LASTEXITCODE -ne 0) { throw 'merge fail' }

$out169 = Join-Path $tmp "01_${safe}_ONENESS_Stages_16x9.mp4"
$out916 = Join-Path $tmp "01_${safe}_ONENESS_Stages_9x16.mp4"
$thumb = Join-Path $tmp "01_${safe}_thumb.jpg"
$fc = '[0:v]fps=60000/1001,setpts=PTS-STARTPTS,format=yuv420p[v0];[0:a]aresample=48000:async=1:first_pts=0,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a0];[1:v]fps=60000/1001,setpts=PTS-STARTPTS,format=yuv420p[v1];[1:a]aresample=48000:async=1:first_pts=0,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
Write-Log 'concat intro+body'
& ffmpeg -y -hide_banner -loglevel error -i $intro -i $body -filter_complex $fc -map '[v]' -map '[a]' -c:v libx264 -preset ultrafast -crf 20 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k $out169
if ($LASTEXITCODE -ne 0) { throw 'final concat fail' }
Write-Log '9x16'
& ffmpeg -y -hide_banner -loglevel error -i $out169 -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=60000/1001,format=yuv420p' -c:v libx264 -preset ultrafast -crf 21 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k $out916
& ffmpeg -y -hide_banner -loglevel error -ss 25 -i $body -frames:v 1 -q:v 2 $thumb

foreach ($base in @(
    (Join-Path $OutRoot "04_videos_compressed\Artists\$slug"),
    (Join-Path $OutRoot "05_Format_Drafts\Circle_D_Stages\02_Artists\$slug"),
    (Join-Path $OutRoot "06_drive_ready\Circle_D_Stages\Artists\$slug")
  )) {
  New-Item -ItemType Directory -Force -Path $base | Out-Null
  Copy-Item $out169, $out916, $thumb $base -Force
}

@(
  'Artist: Baseck & Edoardo & Joao',
  'IG: @basseck.mankabu',
  'Source: Finale package - removed 00:01:10 to 00:03:12',
  'Intro: Baseck & Edoardo & Joao',
  'Stages: 16x9 + 9x16'
) | Set-Content (Join-Path $OutRoot "04_videos_compressed\Artists\$slug\ARTIST_INFO.txt") -Encoding UTF8

'READY' | Set-Content (Join-Path $logs 'Finale_Baseck_FIX_READY.flag')
$outDur = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $out169
Write-Log "READY Finale fix dur=$outDur"
Write-Host 'AGENT_LOOP_WAKE_finale_fix {"prompt":"Finale Baseck fix ready"}'
