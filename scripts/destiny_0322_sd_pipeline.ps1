# Destiny Hostel — SD F: encode DSC_0322 artist cuts + Guest (0325) + Manu (0326) + moment frame per artist
# Note: DSC_0321 on card is ~22s B-roll only; main set timeline is DSC_0322 (~45min).
param(
  [string]$SdRoot = 'F:\DCIM\106NZ502',
  [string]$OutRoot = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003',
  [switch]$MomentsOnly,
  [switch]$SkipManu
)

$ErrorActionPreference = 'Continue'
$env:FONTCONFIG_FILE = 'D:\circle-d-flow-web\scripts\fonts\fonts.conf'
$env:FONTCONFIG_PATH = 'D:\circle-d-flow-web\scripts\fonts'

$logs = Join-Path $OutRoot '00_logs'
$artists = Join-Path $OutRoot '04_videos_compressed\Artists'
$moments = Join-Path $OutRoot '04_videos_compressed\Moment_Frames'
$photos = Join-Path $OutRoot '03_photos_compressed'
$drafts = Join-Path $OutRoot '05_Format_Drafts\Circle_D_Stages\02_Artists'
$drive = Join-Path $OutRoot '06_drive_ready\Circle_D_Stages\Artists'
$tmpRoot = Join-Path $env:TEMP 'destiny_0322_sd'

@($logs, $artists, $moments, $photos, $drafts, $drive, $tmpRoot) | ForEach-Object {
  New-Item -ItemType Directory -Force -Path $_ | Out-Null
}

function Write-Log([string]$m) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $m"
  Write-Output $line
  Add-Content (Join-Path $logs 'sd_0322_pipeline.log') $line
}

function Get-Dur([string]$p) {
  $r = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $p 2>$null
  if ([string]::IsNullOrWhiteSpace($r)) { return 0.0 }
  return [double]$r
}

$vf = 'hqdn3d=1.6:1.2:2.8:2.2,eq=contrast=1.07:brightness=0.015:saturation=0.98:gamma=1.03,format=yuv420p'
$af = 'highpass=f=50,lowpass=f=16000,afftdn=nf=-22:nt=w:tn=1:om=o,acompressor=threshold=-18dB:ratio=1.9:attack=20:release=250:makeup=2.2,alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10,aresample=48000:async=1:first_pts=0'
$vfFrame = 'eq=contrast=1.08:brightness=0.02:saturation=1.02,format=yuv420p'

# slug, display, ig, source file name, start_sec, end_sec (0 = full file)
$cuts = @(
  @{ slug = 'Nicke_Klein'; display = 'Nicke Klein'; ig = '@nickeklein'; file = 'DSC_0322.MOV'; start = 0; end = 900 }
  @{ slug = 'July_Tilie'; display = 'July Tilie'; ig = '@julytilie'; file = 'DSC_0322.MOV'; start = 900; end = 1440 }
  @{ slug = 'Mistah_Isaac'; display = 'Mr. Isaac'; ig = '@mistah_isaac'; file = 'DSC_0322.MOV'; start = 1440; end = 1800 }
  @{ slug = 'C-Riz'; display = 'C-Riz'; ig = '@c_riz.official'; file = 'DSC_0322.MOV'; start = 1800; end = 1980 }
  @{ slug = 'Basseck_Mankabu'; display = 'Baseck'; ig = '@basseck.mankabu'; file = 'DSC_0322.MOV'; start = 1980; end = 2218 }
  @{ slug = 'Edoardo_Statuto'; display = 'Edoardo'; ig = '@_edoardostatuto_'; file = 'DSC_0322.MOV'; start = 2218; end = 2456 }
  @{ slug = 'Joao_Redondo'; display = 'Joao'; ig = '@joaoredondomaia'; file = 'DSC_0322.MOV'; start = 2456; end = 0 }
)

$manuCuts = @(
  @{ slug = 'Guest_Artist'; display = 'Special Performance'; ig = 'ONENESS - Sunset Destination Hostel'; file = 'DSC_0325.MOV'; start = 0; end = 0; tag = '' }
  @{ slug = 'Manu_Allegro'; display = 'Manu Allegro'; ig = '@manuallegro'; file = 'DSC_0326.MOV'; start = 0; end = 0; tag = '' }
)

function Export-MomentFrame {
  param($src, [double]$ss, [string]$outJpg, [string]$label)
  if ((Test-Path $outJpg) -and (Get-Item $outJpg).Length -gt 80KB) { return }
  & ffmpeg -y -hide_banner -loglevel error -hwaccel d3d11va -ss $ss -i $src -frames:v 1 -vf $vfFrame -q:v 2 $outJpg
  if ($LASTEXITCODE -ne 0) { Write-Log "WARN moment fail $label" }
  else { Write-Log "moment $label -> $([IO.Path]::GetFileName($outJpg))" }
}

function Export-ArtistCut {
  param($row, [string]$suffix = '')
  $src = Join-Path $SdRoot $row.file
  if (-not (Test-Path $src)) { Write-Log "SKIP missing $($row.file)"; return }

  $slug = $row.slug
  if ($suffix) { $slug = "${slug}_${suffix}" }
  $durTotal = Get-Dur $src
  $start = [double]$row.start
  $end = if ($row.end -gt 0) { [double]$row.end } else { $durTotal }
  if ($end -le $start) { Write-Log "SKIP bad range $slug"; return }
  $dur = $end - $start

  $outDir = Join-Path $artists $slug
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $outMp4 = Join-Path $outDir ("01_{0}_Stages_16x9.mp4" -f ($slug -replace '_','-'))
  $outJpg = Join-Path $moments ("{0}_moment.jpg" -f $slug)
  $flag = Join-Path $logs ("{0}_READY.flag" -f $slug)

  $momentSs = $start + ($dur * 0.35)
  Export-MomentFrame -src $src -ss $momentSs -outJpg $outJpg -label $slug

  if ($MomentsOnly) { return }
  if ((Test-Path $outMp4) -and (Get-Item $outMp4).Length -gt 2MB) {
    $pd = Get-Dur $outMp4
    if ($pd -gt ($dur * 0.88)) { Write-Log "skip encode $slug (exists)"; 'READY' | Set-Content $flag; return }
  }

  Write-Log "encode $slug ${dur}s @ $start from $($row.file)"
  $logf = Join-Path $logs ("encode_${slug}${suffix}.log")
  & ffmpeg -y -hide_banner -loglevel error -stats -hwaccel d3d11va -ss $start -i $src -t $dur `
    -vf $vf -af $af -c:v libx264 -preset veryfast -crf 20 -r 60000/1001 -fps_mode cfr `
    -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart $outMp4 2>$logf
  if ($LASTEXITCODE -ne 0) { Write-Log "FAIL $slug"; return }

  foreach ($dest in @($drafts, $drive)) {
    $d = Join-Path $dest $slug
    New-Item -ItemType Directory -Force -Path $d | Out-Null
    Copy-Item $outMp4, $outJpg $d -Force -EA SilentlyContinue
  }
  @(
    "Artist: $($row.display)",
    "IG: $($row.ig)",
    "Source: $($row.file)",
    "Range: $([int]$start)s - $([int]$end)s",
    "Moment frame: $([IO.Path]::GetFileName($outJpg))"
  ) | Set-Content (Join-Path $outDir 'ARTIST_INFO.txt') -Encoding UTF8
  'READY' | Set-Content $flag
  Write-Log "READY $slug"
}

Write-Log 'PIPELINE start DSC_0322 artist cuts + moments'
$master0322 = Join-Path $SdRoot 'DSC_0322.MOV'
if (Test-Path $master0322) {
  $d = Get-Dur $master0322
  Write-Log ("DSC_0322 dur={0:N1}s (~{1:N0}min)" -f $d, ($d / 60))
  # patch Joao end to file duration
  $cuts[-1].end = 0
}

# DSC_0321 short B-roll note
$broll = Join-Path $SdRoot 'DSC_0321.MOV'
if (Test-Path $broll) {
  $bd = Get-Dur $broll
  Write-Log ("NOTE DSC_0321 is only {0:N1}s - timeline uses DSC_0322" -f $bd)
}

foreach ($c in $cuts) { Export-ArtistCut -row $c }

if (-not $SkipManu) {
  foreach ($m in $manuCuts) {
    Export-ArtistCut -row $m -suffix $m.tag
  }
}

# DSC_0332.JPG -> Manu photo moment
$jpg = Join-Path $SdRoot 'DSC_0332.JPG'
if (Test-Path $jpg) {
  $dest = Join-Path $moments 'Manu_0332_photo.jpg'
  Copy-Item $jpg $dest -Force
  Copy-Item $jpg (Join-Path $photos 'DSC_0332.jpg') -Force
  Write-Log 'copied DSC_0332.JPG -> Manu moment photo'
}

Write-Log 'PIPELINE pass done'
'COMPLETE' | Set-Content (Join-Path $logs 'SD_0322_PIPELINE_COMPLETE.flag')
