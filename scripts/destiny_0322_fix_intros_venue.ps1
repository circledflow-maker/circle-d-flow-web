# Replace intro venue on all batch-003 Stages packages: Sunset Destination Hostel
# Work on C: TEMP (no -r/fps_mode cfr — that hangs). Skip Mistah_Isaac_OLD_solo.
$ErrorActionPreference = 'Stop'
$OutRoot = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003'
$logs = Join-Path $OutRoot '00_logs'
$drive = Join-Path $OutRoot '06_drive_ready\Circle_D_Stages\Artists'
$artists = Join-Path $OutRoot '04_videos_compressed\Artists'
$drafts = Join-Path $OutRoot '05_Format_Drafts\Circle_D_Stages\02_Artists'
$tmpRoot = Join-Path $env:TEMP 'destiny_intro_venue_fix'
$env:FONTCONFIG_FILE = 'D:\circle-d-flow-web\scripts\fonts\fonts.conf'
$env:FONTCONFIG_PATH = 'D:\circle-d-flow-web\scripts\fonts'
$introDur = 7.0
$venue = 'Sunset Destination Hostel - Cais do Sodre'

function Write-Log([string]$m) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $m"
  Write-Host $line
  Add-Content (Join-Path $logs 'fix_intros_venue.log') $line
}

# folder -> title, subtitle/ig line
$roster = @(
  @{ folder = 'Nicke_Klein'; file = '01_Nicke-Klein_ONENESS_Stages_16x9.mp4'; title = 'Nicke Klein'; ig = '@nickeklein - Live'; titleSize = 52 }
  @{ folder = 'July_Tilie'; file = '01_July-Tilie_ONENESS_Stages_16x9.mp4'; title = 'July Tilie'; ig = '@julytilie - Live'; titleSize = 52 }
  @{ folder = 'Mr_Isaac_Joao_Edo_C-Riz'; file = '01_Mr-Isaac-Joao-Edo-C-Riz_ONENESS_Stages_16x9.mp4'; title = 'Mr Isaac & Joao & Edo & C-Riz'; ig = 'ONENESS Live'; titleSize = 40 }
  @{ folder = 'C-Riz'; file = '01_C-Riz_ONENESS_Stages_16x9.mp4'; title = 'C-Riz'; ig = '@c_riz.official - Live'; titleSize = 52 }
  @{ folder = 'Finale_Baseck'; file = '01_Finale-Baseck_ONENESS_Stages_16x9.mp4'; title = 'Baseck & Edoardo & Joao'; ig = 'basseck.mankabu - Live'; titleSize = 44 }
  @{ folder = 'Guest_Artist'; file = '01_Guest-Artist_ONENESS_Stages_16x9.mp4'; title = 'Special Performance'; ig = 'ONENESS Live'; titleSize = 48 }
  @{ folder = 'Manu_Allegro'; file = '01_Manu-Allegro_ONENESS_Stages_16x9.mp4'; title = 'Manu Allegro'; ig = '@manuallegro - Live'; titleSize = 52 }
)

New-Item -ItemType Directory -Force -Path $logs, $tmpRoot | Out-Null
Write-Log "INTRO VENUE FIX start -> $venue"

foreach ($r in $roster) {
  $src = Join-Path $drive (Join-Path $r.folder $r.file)
  if (-not (Test-Path $src)) {
    Write-Log "SKIP missing $($r.folder)"
    continue
  }
  $work = Join-Path $tmpRoot $r.folder
  if (Test-Path $work) { Remove-Item $work -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $work | Out-Null

  Write-Log "=== $($r.folder) ==="
  # Copy source to NTFS first
  $localSrc = Join-Path $work 'src16x9.mp4'
  Write-Log 'copy src to TEMP'
  Copy-Item $src $localSrc -Force

  # Stream-copy body after old intro
  $body = Join-Path $work 'body.mp4'
  Write-Log "stream-copy body from ${introDur}s"
  & ffmpeg -y -hide_banner -loglevel error -ss $introDur -i $localSrc -c copy $body
  if ($LASTEXITCODE -ne 0) { throw "body trim fail $($r.folder)" }

  # New intro
  $intro = Join-Path $work 'intro.mp4'
  $vfPath = Join-Path $work 'intro_vf.txt'
  $titleEsc = ($r.title -replace '\\', '\\' -replace '&', '\&')
  $igEsc = ($r.ig -replace '\\', '\\' -replace '&', '\&')
  $ts = $r.titleSize
  # Single-quoted here-string so PowerShell does not expand; then inject via -f after escaping
  $vfTemplate = @'
drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Circle D Stages presents':fontsize=36:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.22,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='Wako Kungo  ONENESS':fontsize=52:fontcolor=#E8C547:x=(w-text_w)/2:y=h*0.34,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='Sunset Destination Hostel - Cais do Sodre':fontsize=28:fontcolor=white@0.85:x=(w-text_w)/2:y=h*0.48,drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':text='{0}':fontsize={1}:fontcolor=white:x=(w-text_w)/2:y=h*0.66,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='{2}':fontsize=28:fontcolor=white@0.9:x=(w-text_w)/2:y=h*0.80,format=yuv420p
'@
  ($vfTemplate -f $titleEsc, $ts, $igEsc) | Set-Content $vfPath -Encoding ascii -NoNewline

  & ffmpeg -y -hide_banner -loglevel error -f lavfi -i "color=c=0x0A0A0F:s=1920x1080:d=7:r=60000/1001" -f lavfi -i "anullsrc=r=48000:cl=stereo" -t 7 -filter_script:v $vfPath -c:v libx264 -preset ultrafast -crf 18 -c:a aac -ar 48000 -ac 2 -b:a 192k -shortest $intro
  if ($LASTEXITCODE -ne 0) { throw "intro fail $($r.folder)" }

  $safe = ($r.file -replace '_ONENESS_Stages_16x9\.mp4$', '')
  $out169 = Join-Path $work "$safe`_ONENESS_Stages_16x9.mp4"
  $out916 = Join-Path $work "$safe`_ONENESS_Stages_9x16.mp4"
  # Keep original filenames
  $out169 = Join-Path $work $r.file
  $out916 = Join-Path $work ($r.file -replace '_16x9', '_9x16')

  Write-Log 'concat intro+body (no forced cfr)'
  $fc = '[0:v]setpts=PTS-STARTPTS,format=yuv420p[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS,format=yuv420p[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
  & ffmpeg -y -hide_banner -loglevel error -i $intro -i $body -filter_complex $fc -map '[v]' -map '[a]' -c:v libx264 -preset ultrafast -crf 20 -c:a aac -b:a 192k -ar 48000 -ac 2 $out169
  if ($LASTEXITCODE -ne 0) { throw "concat fail $($r.folder)" }

  Write-Log '9x16'
  & ffmpeg -y -hide_banner -loglevel error -i $out169 -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p' -c:v libx264 -preset ultrafast -crf 21 -c:a aac -b:a 192k -ar 48000 -ac 2 $out916
  if ($LASTEXITCODE -ne 0) { throw "9x16 fail $($r.folder)" }

  $thumbName = ($r.file -replace '_ONENESS_Stages_16x9\.mp4$', '_thumb.jpg')
  if ($thumbName -eq $r.file) { $thumbName = 'thumb.jpg' }
  # Prefer existing naming pattern 01_*-thumb or 01_*_thumb
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
  Write-Log "READY $($r.folder) dur=$((& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $out169))"
}

'COMPLETE' | Set-Content (Join-Path $logs 'INTRO_VENUE_FIX_DONE.flag')
Write-Log 'ALL INTRO VENUE FIXES COMPLETE'
Write-Host 'AGENT_LOOP_WAKE_intro_venue {"prompt":"All intros updated to Sunset Destination Hostel — report"}'
