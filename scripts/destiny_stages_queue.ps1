# Destiny Stages queue: after Heike → C-Riz → Arpanito → Elisa(60fps) → social moments
$ErrorActionPreference = 'Continue'
$logs = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\002\00_logs'
$master = 'F:\DCIM\106NZ502\DSC_0324.MOV'
$root = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\002'
$env:FONTCONFIG_FILE = 'D:\circle-d-flow-web\scripts\fonts\fonts.conf'
$env:FONTCONFIG_PATH = 'D:\circle-d-flow-web\scripts\fonts'

function Write-Log($m) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $m"
  Write-Output $line
  Add-Content "$logs\stages_queue.log" $line
}

function New-Intro([string]$tmp, [string]$title, [string]$ig) {
  $intro = Join-Path $tmp 'intro60.mp4'
  $vf = "drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Circle D Stages presents':fontsize=36:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.22,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Wako Kungo  ONENESS':fontsize=52:fontcolor=#E8C547:x=(w-text_w)/2:y=h*0.34,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Destiny Hostel - Cais do Sodre':fontsize=30:fontcolor=white@0.85:x=(w-text_w)/2:y=h*0.48,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='$title':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=h*0.68,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='$ig - Live':fontsize=28:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.80,format=yuv420p"
  & ffmpeg -y -hide_banner -loglevel error -f lavfi -i "color=c=0x0A0A0F:s=1920x1080:d=7:r=60000/1001" -f lavfi -i "anullsrc=r=48000:cl=stereo" -t 7 -vf $vf -c:v libx264 -preset veryfast -crf 18 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k -shortest $intro
  return $intro
}

function Encode-ArtistBody {
  param($tmp, $slug, $title, $ig, $start, $dur, $folderSlug)
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  $intro = New-Intro $tmp $title $ig
  $body = Join-Path $tmp 'body.mp4'
  $fadeOut = [math]::Max(0, $dur - 2.2)
  $vfPath = Join-Path $tmp 'vf.txt'
  $afPath = Join-Path $tmp 'af.txt'
  $vfBody = @"
scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,eq=contrast=1.07:brightness=0.015:saturation=0.98:gamma=1.03,fade=t=in:st=0:d=0.45,fade=t=out:st=${fadeOut}:d=2.0,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='$title':fontsize=46:fontcolor=white:borderw=2:bordercolor=black@0.65:x=56:y=h-168:enable='between(t\,1.0\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Live Performance':fontsize=28:fontcolor=white@0.92:borderw=1:bordercolor=black@0.5:x=56:y=h-112:enable='between(t\,1.2\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='$ig':fontsize=24:fontcolor=#E8C547:borderw=1:bordercolor=black@0.5:x=56:y=h-72:enable='between(t\,1.4\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Circle D Stages - ONENESS':fontsize=22:fontcolor=white@0.75:x=56:y=48:enable='between(t\,0.5\,8)',format=yuv420p
"@
  Set-Content -Path $vfPath -Value $vfBody -Encoding ascii -NoNewline
  Set-Content -Path $afPath -Value 'highpass=f=60,acompressor=threshold=-18dB:ratio=2:attack=20:release=200:makeup=1.5,alimiter=limit=0.97,aresample=48000:async=1:first_pts=0' -Encoding ascii -NoNewline
  $logf = Join-Path $logs "${slug}_body_encode.log"
  Write-Log "encode body $slug ${dur}s @ $start"
  & ffmpeg -y -hide_banner -loglevel info -stats -hwaccel d3d11va -ss $start -i $master -t $dur -filter_script:v $vfPath -filter_script:a $afPath -c:v libx264 -preset ultrafast -crf 22 -r 60000/1001 -fps_mode cfr -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart $body 2>$logf
  if ($LASTEXITCODE -ne 0) { throw "body fail $slug" }
  $durP = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $body
  Write-Log "body ok dur=$durP"

  $out169 = Join-Path $tmp "01_${slug}_ONENESS_Stages_16x9.mp4"
  $out916 = Join-Path $tmp "01_${slug}_ONENESS_Stages_9x16.mp4"
  $thumb = Join-Path $tmp "01_${slug}_thumb.jpg"
  $fc = '[0:v]fps=60000/1001,setpts=PTS-STARTPTS,format=yuv420p[v0];[0:a]aresample=48000:async=1:first_pts=0,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a0];[1:v]fps=60000/1001,setpts=PTS-STARTPTS,format=yuv420p[v1];[1:a]aresample=48000:async=1:first_pts=0,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
  Write-Log "concat $slug"
  & ffmpeg -y -hide_banner -loglevel error -i $intro -i $body -filter_complex $fc -map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 20 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k -movflags +faststart $out169
  Write-Log "9x16 $slug"
  & ffmpeg -y -hide_banner -loglevel error -i $out169 -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=60000/1001,format=yuv420p' -c:v libx264 -preset veryfast -crf 21 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k -movflags +faststart $out916
  & ffmpeg -y -hide_banner -loglevel error -ss 40 -i $body -frames:v 1 -q:v 2 $thumb

  foreach ($base in @(
      "$root\04_videos_compressed\Artists\$folderSlug",
      "$root\05_Format_Drafts\Circle_D_Stages\02_Artists\$folderSlug",
      "$root\06_drive_ready\Circle_D_Stages\Artists\$folderSlug"
    )) {
    New-Item -ItemType Directory -Force -Path $base | Out-Null
    Copy-Item $out169, $out916, $thumb $base -Force
  }
  "READY $(Get-Date -Format o)" | Set-Content (Join-Path $logs "${slug}_PACKAGE_READY.flag")
  Write-Log "READY $slug"
}

New-Item -ItemType Directory -Force -Path $logs | Out-Null
Write-Log 'QUEUE start - wait Heike'

# Wait for Heike package (or body complete + existing watcher)
$deadline = (Get-Date).AddHours(10)
while ((Get-Date) -lt $deadline) {
  if (Test-Path "$logs\HEIKE_PACKAGE_READY.flag") { Write-Log 'Heike READY'; break }
  # if heike body done but watcher stuck, we can still proceed after body probe
  $hb = 'C:\Users\user\AppData\Local\Temp\destiny_heike\body.mp4'
  if ((Test-Path $hb) -and -not (Get-Process ffmpeg -EA SilentlyContinue)) {
    $d = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $hb 2>$null
    if ($d -and [double]$d -gt 300) {
      Write-Log "Heike body present dur=$d - wait watcher up to 3h more for package"
    }
  }
  Start-Sleep 90
}
if (-not (Test-Path "$logs\HEIKE_PACKAGE_READY.flag")) {
  # If watcher failed but body ok, package Heike here
  $hb = 'C:\Users\user\AppData\Local\Temp\destiny_heike\body.mp4'
  $d = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $hb 2>$null
  if ($d -and [double]$d -gt 300) {
    Write-Log 'Heike watcher missed - packaging from body'
    Encode-ArtistBody -tmp 'C:\Users\user\AppData\Local\Temp\destiny_heike' -slug 'Heike' -title 'Heike Klein' -ig '@nickeklein' -start 840 -dur 358 -folderSlug 'Nicke_Klein'
  } else {
    Write-Log 'ERROR Heike not ready'; exit 2
  }
}

if (-not (Test-Path 'F:\DCIM\106NZ502\DSC_0324.MOV')) { Write-Log 'ERROR F: missing'; exit 3 }

# C-Riz 20:00-26:00 soft
if (-not (Test-Path "$logs\CRiz_PACKAGE_READY.flag")) {
  Encode-ArtistBody -tmp 'C:\Users\user\AppData\Local\Temp\destiny_criz' -slug 'CRiz' -title 'C-Riz' -ig '@c_riz.official' -start 1198 -dur 360 -folderSlug 'C-Riz'
}

# Arpanito 32:00-end soft
if (-not (Test-Path "$logs\Arpanito_PACKAGE_READY.flag")) {
  Encode-ArtistBody -tmp 'C:\Users\user\AppData\Local\Temp\destiny_arpanito' -slug 'Arpanito' -title 'Arpanito' -ig '@arpan.k_' -start 1918 -dur 281 -folderSlug 'Arpanito'
}

# Elisa full 0-14:00 with 60fps intro (fix 25fps) - split into 2 parts under 4GB FAT32
if (-not (Test-Path "$logs\ELISA_PACKAGE_READY.flag")) {
  $elisaDir = "$root\04_videos_compressed\Artists\Elisa"
  if (-not (Test-Path "$logs\Elisa_A_PACKAGE_READY.flag")) {
    Write-Log 'Elisa part A 0-420'
    Encode-ArtistBody -tmp 'C:\Users\user\AppData\Local\Temp\destiny_elisa_a' -slug 'Elisa_A' -title 'Elisa' -ig '@elisa.cas8' -start 0 -dur 420 -folderSlug 'Elisa'
  } else {
    Write-Log 'Elisa_A already READY - skip'
  }
  if (Test-Path "$elisaDir\01_Elisa_A_ONENESS_Stages_16x9.mp4") {
    Rename-Item "$elisaDir\01_Elisa_A_ONENESS_Stages_16x9.mp4" '01_Elisa_ONENESS_part1_0-7min_16x9.mp4' -Force -EA SilentlyContinue
    Rename-Item "$elisaDir\01_Elisa_A_ONENESS_Stages_9x16.mp4" '01_Elisa_ONENESS_part1_0-7min_9x16.mp4' -Force -EA SilentlyContinue
  }
  if (-not (Test-Path "$logs\Elisa_B_PACKAGE_READY.flag")) {
    Write-Log 'Elisa part B 420-840'
    Encode-ArtistBody -tmp 'C:\Users\user\AppData\Local\Temp\destiny_elisa_b' -slug 'Elisa_B' -title 'Elisa' -ig '@elisa.cas8' -start 420 -dur 420 -folderSlug 'Elisa'
  } else {
    Write-Log 'Elisa_B already READY - skip'
  }
  Get-ChildItem $elisaDir -Filter '01_Elisa_B*' -EA SilentlyContinue | ForEach-Object {
    $nn = $_.Name -replace 'Elisa_B_ONENESS_Stages', 'Elisa_ONENESS_part2_7-14min'
    Rename-Item $_.FullName $nn -Force -EA SilentlyContinue
  }
  'READY' | Set-Content "$logs\ELISA_PACKAGE_READY.flag"
  Write-Log 'ELISA READY two parts 60fps'
}

Write-Log 'Social moments for all artists'
& python 'D:\circle-d-flow-web\scripts\destiny_social_moments.py'
Write-Log 'QUEUE COMPLETE'
'COMPLETE' | Set-Content "$logs\STAGES_QUEUE_COMPLETE.flag"
