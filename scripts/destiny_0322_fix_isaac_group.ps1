# Rebuild Mistah_Isaac: start 00:01:20, credit Mr Isaac & Joao & Edo & C-Riz
# Copy source to NTFS, stream-copy trim (avoids reencode hang), then burn-in + packages
$ErrorActionPreference = 'Stop'
$OutRoot = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003'
$logs = Join-Path $OutRoot '00_logs'
$tmp = Join-Path $env:TEMP 'destiny_isaac_fix'
$env:FONTCONFIG_FILE = 'D:\circle-d-flow-web\scripts\fonts\fonts.conf'
$env:FONTCONFIG_PATH = 'D:\circle-d-flow-web\scripts\fonts'

$srcD = Join-Path $OutRoot '06_drive_ready\Circle_D_Stages\Artists\Mistah_Isaac\01_Mistah-Isaac_ONENESS_Stages_16x9.mp4'
if (-not (Test-Path $srcD)) {
  $srcD = Join-Path $OutRoot '06_drive_ready\Circle_D_Stages\Artists\Mistah_Isaac_OLD_solo\01_Mistah-Isaac_ONENESS_Stages_16x9.mp4'
}
$oldSlug = 'Mistah_Isaac'
$slug = 'Mr_Isaac_Joao_Edo_C-Riz'
$safe = 'Mr-Isaac-Joao-Edo-C-Riz'
$startSec = 80.0

function Write-Log([string]$m) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $m"
  Write-Host $line
  Add-Content (Join-Path $logs 'fix_isaac_group.log') $line
}

if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force -EA SilentlyContinue }
New-Item -ItemType Directory -Force -Path $tmp, $logs | Out-Null
if (-not (Test-Path $srcD)) { throw 'missing Mistah_Isaac 16x9 source' }

Write-Log 'copy source D: -> C: TEMP'
$src = Join-Path $tmp 'src_Mistah_Isaac_16x9.mp4'
Copy-Item $srcD $src -Force

$srcDur = [double](& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $src)
# leave 1s headroom; stream-copy is keyframe-aligned
$dur = [math]::Max(1.0, $srcDur - $startSec - 1.0)
Write-Log ("stream-copy trim ss={0} t={1}" -f $startSec, $dur)

$raw = Join-Path $tmp 'raw.mp4'
& ffmpeg -y -hide_banner -loglevel error -ss $startSec -i $src -t $dur -c copy $raw
if ($LASTEXITCODE -ne 0) { throw 'stream-copy trim fail' }
$rawDur = [double](& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $raw)
Write-Log ("trim ok dur={0} MB={1}" -f $rawDur, [math]::Round((Get-Item $raw).Length/1MB))

$intro = Join-Path $tmp 'intro60.mp4'
$introVf = Join-Path $tmp 'intro_vf.txt'
@'
drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Circle D Stages presents':fontsize=36:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.22,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Wako Kungo  ONENESS':fontsize=52:fontcolor=#E8C547:x=(w-text_w)/2:y=h*0.34,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Sunset Destination Hostel - Cais do Sodre':fontsize=30:fontcolor=white@0.85:x=(w-text_w)/2:y=h*0.48,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Mr Isaac & Joao & Edo & C-Riz':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=h*0.66,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='ONENESS Live':fontsize=28:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.80,format=yuv420p
'@ | Set-Content $introVf -Encoding ascii -NoNewline
& ffmpeg -y -hide_banner -loglevel error -f lavfi -i "color=c=0x0A0A0F:s=1920x1080:d=7:r=60000/1001" -f lavfi -i "anullsrc=r=48000:cl=stereo" -t 7 -filter_script:v $introVf -c:v libx264 -preset ultrafast -crf 18 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k -shortest $intro
if ($LASTEXITCODE -ne 0) { throw 'intro fail' }

$body = Join-Path $tmp 'body.mp4'
$fadeOut = [math]::Max(0, $rawDur - 2.2)
$vfPath = Join-Path $tmp 'vf.txt'
$vfBody = "fade=t=in:st=0:d=0.35,fade=t=out:st=${fadeOut}:d=2.0,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Mr Isaac \& Joao \& Edo \& C-Riz':fontsize=40:fontcolor=white:borderw=2:bordercolor=black@0.65:x=56:y=h-168:enable='between(t\,1.0\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Live Performance':fontsize=28:fontcolor=white@0.92:borderw=1:bordercolor=black@0.5:x=56:y=h-112:enable='between(t\,1.2\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='ONENESS Live':fontsize=24:fontcolor=#E8C547:borderw=1:bordercolor=black@0.5:x=56:y=h-72:enable='between(t\,1.4\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Circle D Stages - ONENESS':fontsize=22:fontcolor=white@0.75:x=56:y=48:enable='between(t\,0.5\,8)',format=yuv420p"
Set-Content -Path $vfPath -Value $vfBody -Encoding ascii -NoNewline
Write-Log 'burn-in lower third'
& ffmpeg -y -hide_banner -loglevel info -stats -i $raw -filter_script:v $vfPath -c:v libx264 -preset ultrafast -crf 20 -c:a aac -b:a 192k -ar 48000 -ac 2 $body 2>(Join-Path $logs 'fix_isaac_pass2.log')
if ($LASTEXITCODE -ne 0) { throw 'burn-in fail' }
Write-Log ("body ok MB={0}" -f [math]::Round((Get-Item $body).Length/1MB))

$out169 = Join-Path $tmp "01_${safe}_ONENESS_Stages_16x9.mp4"
$out916 = Join-Path $tmp "01_${safe}_ONENESS_Stages_9x16.mp4"
$thumb = Join-Path $tmp "01_${safe}_thumb.jpg"
$fc = '[0:v]setpts=PTS-STARTPTS,format=yuv420p[v0];[0:a]aresample=48000:async=1:first_pts=0,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS,format=yuv420p[v1];[1:a]aresample=48000:async=1:first_pts=0,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
Write-Log 'concat intro+body'
& ffmpeg -y -hide_banner -loglevel error -i $intro -i $body -filter_complex $fc -map '[v]' -map '[a]' -c:v libx264 -preset ultrafast -crf 20 -c:a aac -ar 48000 -ac 2 -b:a 192k $out169
if ($LASTEXITCODE -ne 0) { throw 'concat fail' }
Write-Log '9x16'
& ffmpeg -y -hide_banner -loglevel error -i $out169 -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p' -c:v libx264 -preset ultrafast -crf 21 -c:a aac -ar 48000 -ac 2 -b:a 192k $out916
& ffmpeg -y -hide_banner -loglevel error -ss 20 -i $body -frames:v 1 -q:v 2 $thumb

Write-Log 'copy finals to D:'
foreach ($base in @(
    (Join-Path $OutRoot "04_videos_compressed\Artists\$slug"),
    (Join-Path $OutRoot "05_Format_Drafts\Circle_D_Stages\02_Artists\$slug"),
    (Join-Path $OutRoot "06_drive_ready\Circle_D_Stages\Artists\$slug")
  )) {
  New-Item -ItemType Directory -Force -Path $base | Out-Null
  Copy-Item $out169, $out916, $thumb $base -Force
  $credSrc = Join-Path $OutRoot "04_videos_compressed\Artists\$oldSlug"
  if (-not (Test-Path $credSrc)) { $credSrc = Join-Path $OutRoot "04_videos_compressed\Artists\${oldSlug}_OLD_solo" }
  Get-ChildItem $credSrc -Filter '99_*' -EA SilentlyContinue | Copy-Item -Destination $base -Force
  Get-ChildItem $credSrc -Filter 'CREDITS_INFO.txt' -EA SilentlyContinue | Copy-Item -Destination $base -Force
}

@(
  'Artist: Mr Isaac & Joao & Edo & C-Riz',
  'IG: ONENESS Live',
  'Source: Mistah_Isaac package trimmed at 00:01:20',
  'Stages: new intro + body from 80s, 16x9 + 9x16'
) | Set-Content (Join-Path $OutRoot "04_videos_compressed\Artists\$slug\ARTIST_INFO.txt") -Encoding UTF8

foreach ($root in @(
    (Join-Path $OutRoot '04_videos_compressed\Artists'),
    (Join-Path $OutRoot '05_Format_Drafts\Circle_D_Stages\02_Artists'),
    (Join-Path $OutRoot '06_drive_ready\Circle_D_Stages\Artists')
  )) {
  $old = Join-Path $root $oldSlug
  $bak = Join-Path $root "${oldSlug}_OLD_solo"
  if (Test-Path $old) {
    if (Test-Path $bak) { Remove-Item $bak -Recurse -Force -EA SilentlyContinue }
    Rename-Item $old $bak
    Write-Log 'renamed Mistah_Isaac to OLD_solo'
  }
}

'READY' | Set-Content (Join-Path $logs 'Mr_Isaac_Joao_Edo_C-Riz_PACKAGE_READY.flag')
'COMPLETE' | Set-Content (Join-Path $logs 'ISAAC_GROUP_FIX_DONE.flag')
'COMPLETE' | Set-Content (Join-Path $logs 'POST_QUEUE_FIXES_DONE.flag')
Write-Log "READY $slug"
Write-Host 'AGENT_LOOP_WAKE_isaac_fix {"prompt":"Isaac group package ready"}'
