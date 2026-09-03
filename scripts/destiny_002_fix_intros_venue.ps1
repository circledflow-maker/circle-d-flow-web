# Batch 002 intros: Sunset Destination Hostel + Nicke Klein; ASCII-only (no middot -> no ??)
$ErrorActionPreference = 'Stop'
$OutRoot = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\002'
$logs = Join-Path $OutRoot '00_logs'
$drive = Join-Path $OutRoot '06_drive_ready\Circle_D_Stages\Artists'
$artists = Join-Path $OutRoot '04_videos_compressed\Artists'
$drafts = Join-Path $OutRoot '05_Format_Drafts\Circle_D_Stages\02_Artists'
$tmpRoot = Join-Path $env:TEMP 'destiny_002_intro_venue_fix'
$env:FONTCONFIG_FILE = 'D:\circle-d-flow-web\scripts\fonts\fonts.conf'
$env:FONTCONFIG_PATH = 'D:\circle-d-flow-web\scripts\fonts'
$introDur = 7.0

function Write-Log([string]$m) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $m"
  Write-Host $line
  Add-Content (Join-Path $logs 'fix_intros_venue_002.log') $line
}

function Ascii-Draw([string]$s) {
  # Strip chars that break under ASCII filter files (middot becomes ??)
  $s = $s -replace [char]0x00B7, '-'   # ·
  $s = $s -replace [char]0x2022, '-'   # bullet
  $s = $s -replace [char]0x2013, '-'   # en-dash
  $s = $s -replace [char]0x2014, '-'   # em-dash
  $s = $s -replace '\?+', '-'
  $s = $s -replace '\s+-\s+', ' - '
  $s = $s -replace '\\', '\\'
  $s = $s -replace '&', '\&'
  return $s
}

$roster = @(
  @{ folder = 'Nicke_Klein'; file = '01_Heike_Klein_ONENESS_Stages_16x9.mp4'; title = 'Nicke Klein'; ig = '@nickeklein - Live Performance'; titleSize = 56 }
  @{ folder = 'Arpanito'; file = '01_Arpanito_ONENESS_Stages_16x9.mp4'; title = 'Arpanito'; ig = 'Live Performance'; titleSize = 56 }
  @{ folder = 'Elisa'; file = '01_Elisa_A_ONENESS_Stages_16x9.mp4'; title = 'Elisa'; ig = 'Live Performance'; titleSize = 56 }
  @{ folder = 'Elisa'; file = '01_Elisa_B_ONENESS_Stages_16x9.mp4'; title = 'Elisa'; ig = 'Live Performance'; titleSize = 56 }
  @{ folder = 'Elisa'; file = '01_Elisa_Free-as-A-Bird_ONENESS_Stages_16x9.mp4'; title = 'Elisa'; ig = 'Free as A Bird - Live'; titleSize = 52 }
  @{ folder = 'C-Riz'; file = '01_CRiz_ONENESS_Stages_16x9.mp4'; title = 'C-Riz'; ig = 'Live Performance'; titleSize = 56 }
  @{ folder = 'Willpower'; file = '01_Willpower_ONENESS_Stages_16x9.mp4'; title = 'Willpower'; ig = 'Live Performance'; titleSize = 56 }
)

New-Item -ItemType Directory -Force -Path $logs, $tmpRoot | Out-Null
Write-Log 'INTRO VENUE FIX 002 (ASCII) start -> Sunset Destination Hostel - Cais do Sodre'

foreach ($r in $roster) {
  $src = Join-Path $drive (Join-Path $r.folder $r.file)
  if (-not (Test-Path $src)) { $src = Join-Path $artists (Join-Path $r.folder $r.file) }
  if (-not (Test-Path $src)) { $src = Join-Path $drafts (Join-Path $r.folder $r.file) }
  if (-not (Test-Path $src)) { Write-Log "SKIP missing $($r.folder)/$($r.file)"; continue }

  $workKey = ($r.file -replace '\.mp4$', '')
  $work = Join-Path $tmpRoot $workKey
  if (Test-Path $work) { Remove-Item $work -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $work | Out-Null

  Write-Log "=== $($r.folder) / $($r.file) ==="
  $localSrc = Join-Path $work 'src16x9.mp4'
  Write-Log 'copy src to TEMP'
  Copy-Item $src $localSrc -Force

  $body = Join-Path $work 'body.mp4'
  Write-Log "stream-copy body from ${introDur}s"
  & ffmpeg -y -hide_banner -loglevel error -ss $introDur -i $localSrc -c copy $body
  if ($LASTEXITCODE -ne 0) { throw "body trim fail $($r.file)" }

  $intro = Join-Path $work 'intro.mp4'
  $vfPath = Join-Path $work 'intro_vf.txt'
  $titleEsc = Ascii-Draw $r.title
  $igEsc = Ascii-Draw $r.ig
  $ts = $r.titleSize
  $vfTemplate = @'
drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Circle D Stages presents':fontsize=36:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.22,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Wako Kungo  ONENESS':fontsize=52:fontcolor=#E8C547:x=(w-text_w)/2:y=h*0.34,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Sunset Destination Hostel - Cais do Sodre':fontsize=28:fontcolor=white@0.85:x=(w-text_w)/2:y=h*0.48,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Lisboa - 31 July':fontsize=26:fontcolor=white@0.7:x=(w-text_w)/2:y=h*0.56,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='{0}':fontsize={1}:fontcolor=white:x=(w-text_w)/2:y=h*0.70,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='{2}':fontsize=28:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.80,format=yuv420p
'@
  ($vfTemplate -f $titleEsc, $ts, $igEsc) | Set-Content $vfPath -Encoding ascii -NoNewline

  & ffmpeg -y -hide_banner -loglevel error -f lavfi -i "color=c=0x0A0A0F:s=1920x1080:d=7:r=60000/1001" -f lavfi -i "anullsrc=r=48000:cl=stereo" -t 7 -filter_script:v $vfPath -c:v libx264 -preset ultrafast -crf 18 -c:a aac -ar 48000 -ac 2 -b:a 192k -shortest $intro
  if ($LASTEXITCODE -ne 0) { throw "intro fail $($r.file)" }

  $out169 = Join-Path $work $r.file
  $out916 = Join-Path $work ($r.file -replace '_16x9', '_9x16')
  Write-Log 'concat intro+body'
  $fc = '[0:v]setpts=PTS-STARTPTS,format=yuv420p[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS,format=yuv420p[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
  & ffmpeg -y -hide_banner -loglevel error -i $intro -i $body -filter_complex $fc -map '[v]' -map '[a]' -c:v libx264 -preset ultrafast -crf 20 -c:a aac -b:a 192k -ar 48000 -ac 2 $out169
  if ($LASTEXITCODE -ne 0) { throw "concat fail $($r.file)" }

  Write-Log '9x16'
  & ffmpeg -y -hide_banner -loglevel error -i $out169 -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p' -c:v libx264 -preset ultrafast -crf 21 -c:a aac -b:a 192k -ar 48000 -ac 2 $out916
  if ($LASTEXITCODE -ne 0) { throw "9x16 fail $($r.file)" }

  $thumb = Join-Path $work ($r.file -replace '_ONENESS_Stages_16x9\.mp4$', '_thumb.jpg')
  & ffmpeg -y -hide_banner -loglevel error -ss 20 -i $out169 -frames:v 1 -q:v 2 $thumb

  Write-Log 'copy to Artists / drafts / drive_ready'
  foreach ($base in @(
      (Join-Path $artists $r.folder),
      (Join-Path $drafts $r.folder),
      (Join-Path $drive $r.folder)
    )) {
    New-Item -ItemType Directory -Force -Path $base | Out-Null
    Copy-Item $out169, $out916 $base -Force
    if (Test-Path $thumb) { Copy-Item $thumb $base -Force }
  }

  if ($r.folder -eq 'Nicke_Klein') {
    @(
      'Artist: Nicke Klein',
      'IG: @nickeklein',
      'Venue: Sunset Destination Hostel - Cais do Sodre',
      'Intro: Nicke Klein (ASCII separators, no special chars)'
    ) | Set-Content (Join-Path (Join-Path $artists 'Nicke_Klein') 'ARTIST_INFO.txt') -Encoding UTF8
  }

  Write-Log "READY $($r.file) dur=$((& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $out169))"
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
}

'COMPLETE' | Set-Content (Join-Path $logs 'INTRO_VENUE_FIX_002_DONE.flag')
Write-Log 'ALL INTRO VENUE FIXES 002 COMPLETE (ASCII)'
Write-Host 'AGENT_LOOP_WAKE_intro_venue_002 {"prompt":"Batch 002 intros ASCII-fixed (no ??); report status"}'
