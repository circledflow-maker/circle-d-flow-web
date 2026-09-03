# DSC_0322 Stages queue — work/temps on D: (FAT32-safe), encode from SD F:
# D: max file 4GB: encoded bodies/packages stay under that; no full master cache on D:/C:
param(
  [switch]$GuestManuOnly,
  [switch]$SocialOnly
)
$ErrorActionPreference = 'Continue'
$SdRoot = 'F:\DCIM\106NZ502'
$OutRoot = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003'
$WorkRoot = Join-Path $OutRoot '00_work'
$logs = Join-Path $OutRoot '00_logs'
$env:FONTCONFIG_FILE = 'D:\circle-d-flow-web\scripts\fonts\fonts.conf'
$env:FONTCONFIG_PATH = 'D:\circle-d-flow-web\scripts\fonts'

function Write-Log($m) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $m"
  Write-Host $line
  Add-Content (Join-Path $logs 'stages_queue.log') $line
}

function Get-Dur([string]$p) {
  $r = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $p 2>$null
  if ([string]::IsNullOrWhiteSpace($r)) { return 0.0 }
  return [double]$r
}

function New-Intro([string]$tmp, [string]$title, [string]$ig) {
  $intro = Join-Path $tmp 'intro60.mp4'
  $vf = "drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Circle D Stages presents':fontsize=36:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.22,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Wako Kungo  ONENESS':fontsize=52:fontcolor=#E8C547:x=(w-text_w)/2:y=h*0.34,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Sunset Destination Hostel - Cais do Sodre':fontsize=30:fontcolor=white@0.85:x=(w-text_w)/2:y=h*0.48,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='$title':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=h*0.68,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='$ig - Live':fontsize=28:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.80,format=yuv420p"
  & ffmpeg -y -hide_banner -loglevel error -f lavfi -i "color=c=0x0A0A0F:s=1920x1080:d=7:r=60000/1001" -f lavfi -i "anullsrc=r=48000:cl=stereo" -t 7 -vf $vf -c:v libx264 -preset veryfast -crf 18 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k -shortest $intro
  return $intro
}

function Encode-StagesPackage {
  param(
    [string]$source,
    [string]$tmp,
    [string]$slug,
    [string]$title,
    [string]$ig,
    [double]$start,
    [double]$dur,
    [string]$folderSlug,
    [string]$performanceLabel = 'Live Performance'
  )
  $flag = Join-Path $logs "${slug}_PACKAGE_READY.flag"
  if (Test-Path $flag) { Write-Log "skip $slug (flag)"; return }

  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  $intro = New-Intro $tmp $title $ig
  $body = Join-Path $tmp 'body.mp4'
  $fadeOut = [math]::Max(0, $dur - 2.2)
  $vfPath = Join-Path $tmp 'vf.txt'
  $afPath = Join-Path $tmp 'af.txt'
  $vfBody = @"
scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,eq=contrast=1.07:brightness=0.015:saturation=0.98:gamma=1.03,fade=t=in:st=0:d=0.45,fade=t=out:st=${fadeOut}:d=2.0,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='$title':fontsize=46:fontcolor=white:borderw=2:bordercolor=black@0.65:x=56:y=h-168:enable='between(t\,1.0\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='$performanceLabel':fontsize=28:fontcolor=white@0.92:borderw=1:bordercolor=black@0.5:x=56:y=h-112:enable='between(t\,1.2\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='$ig':fontsize=24:fontcolor=#E8C547:borderw=1:bordercolor=black@0.5:x=56:y=h-72:enable='between(t\,1.4\,10)',drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Circle D Stages - ONENESS':fontsize=22:fontcolor=white@0.75:x=56:y=48:enable='between(t\,0.5\,8)',format=yuv420p
"@
  Set-Content -Path $vfPath -Value $vfBody -Encoding ascii -NoNewline
  Set-Content -Path $afPath -Value 'highpass=f=60,acompressor=threshold=-18dB:ratio=2:attack=20:release=200:makeup=1.5,alimiter=limit=0.97,aresample=48000:async=1:first_pts=0' -Encoding ascii -NoNewline
  $logf = Join-Path $logs "${slug}_body_encode.log"
  Write-Log "encode body $slug ${dur}s @ $start (work=$tmp)"
  # No +faststart on FAT32 work files (avoids rewrite needing 2x size)
  & ffmpeg -y -hide_banner -loglevel info -stats -hwaccel d3d11va -ss $start -i $source -t $dur -filter_script:v $vfPath -filter_script:a $afPath -c:v libx264 -preset ultrafast -crf 22 -r 60000/1001 -fps_mode cfr -c:a aac -b:a 192k -ar 48000 -ac 2 $body 2>$logf
  if ($LASTEXITCODE -ne 0) { throw "body fail $slug" }
  $bodyMB = [math]::Round((Get-Item $body).Length / 1MB)
  if ($bodyMB -gt 3800) { throw "body too large for FAT32 ($bodyMB MB) $slug" }
  Write-Log "body ok dur=$(Get-Dur $body) size=${bodyMB}MB"

  $safe = $slug -replace '_', '-'
  $out169 = Join-Path $tmp "01_${safe}_ONENESS_Stages_16x9.mp4"
  $out916 = Join-Path $tmp "01_${safe}_ONENESS_Stages_9x16.mp4"
  $thumb = Join-Path $tmp "01_${safe}_thumb.jpg"
  $fc = '[0:v]fps=60000/1001,setpts=PTS-STARTPTS,format=yuv420p[v0];[0:a]aresample=48000:async=1:first_pts=0,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a0];[1:v]fps=60000/1001,setpts=PTS-STARTPTS,format=yuv420p[v1];[1:a]aresample=48000:async=1:first_pts=0,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
  Write-Log "concat $slug"
  & ffmpeg -y -hide_banner -loglevel error -i $intro -i $body -filter_complex $fc -map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 20 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k $out169
  Write-Log "9x16 $slug"
  & ffmpeg -y -hide_banner -loglevel error -i $out169 -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=60000/1001,format=yuv420p' -c:v libx264 -preset veryfast -crf 21 -r 60000/1001 -fps_mode cfr -c:a aac -ar 48000 -ac 2 -b:a 192k $out916
  & ffmpeg -y -hide_banner -loglevel error -ss 40 -i $body -frames:v 1 -q:v 2 $thumb

  foreach ($base in @(
      "$OutRoot\04_videos_compressed\Artists\$folderSlug",
      "$OutRoot\05_Format_Drafts\Circle_D_Stages\02_Artists\$folderSlug",
      "$OutRoot\06_drive_ready\Circle_D_Stages\Artists\$folderSlug"
    )) {
    New-Item -ItemType Directory -Force -Path $base | Out-Null
    Copy-Item $out169, $out916, $thumb $base -Force
  }
  # Keep body for social moments; delete only after socials (or next artist if space tight)
  @(
    "Artist: $title",
    "IG: $ig",
    "Source: $([IO.Path]::GetFileName($source))",
    "Range: $([int]$start)s + ${dur}s",
    "Work: $tmp",
    "Performance: $performanceLabel",
    "Stages: 60fps intro + body, 16x9 + 9x16"
  ) | Set-Content (Join-Path "$OutRoot\04_videos_compressed\Artists\$folderSlug" 'ARTIST_INFO.txt') -Encoding UTF8
  'READY' | Set-Content $flag
  Write-Log "READY $slug"
}

$ROSTER = @{
  'Nicke_Klein'      = @('Nicke Klein', '@nickeklein')
  'July_Tilie'       = @('July Tilie', '@julytilie')
  'Mistah_Isaac'     = @('Mr. Isaac', '@mistah_isaac')
  'C-Riz'            = @('C-Riz', '@c_riz.official')
  'Finale_Baseck'    = @('Baseck & Edoardo & Joao', '@basseck.mankabu')
  'Guest_Artist'     = @('Special Performance', 'ONENESS - Sunset Destination Hostel')
  'Manu_Allegro'     = @('Manu Allegro', '@manuallegro')
  'Wako_Kungo'       = @('Wako Kungo', '@wako.kungo')
}

New-Item -ItemType Directory -Force -Path $logs, $WorkRoot | Out-Null

if ($SocialOnly) {
  $env:DESTINY_0322_WORK = $WorkRoot
  Write-Log 'Social moments only (3x 9x16 per artist)'
  & python 'D:\circle-d-flow-web\scripts\destiny_0322_social_moments.py'
  Write-Log 'SOCIAL MOMENTS COMPLETE'
  exit 0
}

if (-not $GuestManuOnly) {
Write-Log 'STAGES QUEUE start (DSC_0322 - work on D:, source SD F:)'

$master = Join-Path $SdRoot 'DSC_0322.MOV'
if (-not (Test-Path $master)) { Write-Log 'ERROR F: DSC_0322 missing'; exit 3 }

$segFile = Join-Path $logs 'face_segments_0322.json'
if (-not (Test-Path $segFile)) { Write-Log 'ERROR face segments missing'; exit 4 }

$segments = Get-Content $segFile -Raw | ConvertFrom-Json
Write-Log ("segments loaded: $($segments.Count)")

foreach ($seg in $segments) {
  $slug = $seg.artist
  if ($slug -eq 'Wako_Kungo') { continue }
  if (-not $ROSTER.ContainsKey($slug)) { Write-Log "skip unknown $slug"; continue }
  $title = $ROSTER[$slug][0]
  $ig = $ROSTER[$slug][1]
  $start = [double]$seg.start
  $dur = [double]$seg.dur
  if ($dur -lt 30) { Write-Log "skip short $slug"; continue }
  $tmpPath = Join-Path $WorkRoot $slug
  try {
    Encode-StagesPackage -source $master -tmp $tmpPath -slug $slug -title $title -ig $ig -start $start -dur $dur -folderSlug $slug
  } catch {
    Write-Log "ERROR $slug : $_"
    exit 1
  }
}
} else {
  Write-Log 'GUEST + MANU only (DSC_0325 guest / DSC_0326 Manu)'
}

foreach ($m in @(
  @{ slug = 'Guest_Artist'; file = 'DSC_0325.MOV'; folder = 'Guest_Artist'; title = 'Special Performance'; ig = 'ONENESS - Sunset Destination Hostel'; performance = 'Guest Set' }
  @{ slug = 'Manu_Allegro'; file = 'DSC_0326.MOV'; folder = 'Manu_Allegro'; title = 'Manu Allegro'; ig = '@manuallegro'; performance = 'Sing & Rap' }
)) {
  $src = Join-Path $SdRoot $m.file
  if (-not (Test-Path $src)) { Write-Log "SKIP $($m.file)"; continue }
  $dur = Get-Dur $src
  try {
    Encode-StagesPackage -source $src -tmp (Join-Path $WorkRoot $m.slug) -slug $m.slug -title $m.title -ig $m.ig -start 0 -dur $dur -folderSlug $m.folder -performanceLabel $m.performance
  } catch {
    Write-Log "ERROR $($m.slug): $_"
  }
}

if (-not $GuestManuOnly) {
# Point social script at D: work bodies via env
$env:DESTINY_0322_WORK = $WorkRoot
Write-Log 'Social moments (3x 9x16 per artist)'
& python 'D:\circle-d-flow-web\scripts\destiny_0322_social_moments.py'
Write-Log 'STAGES QUEUE COMPLETE'
'COMPLETE' | Set-Content (Join-Path $logs 'STAGES_QUEUE_COMPLETE.flag')
}
