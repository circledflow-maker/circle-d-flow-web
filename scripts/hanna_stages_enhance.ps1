# Hanna & Mr Isaac — Circle D Stages enhance for DSC_0158..0161
# Regelwerk: Fake Multi-Cam + Club-Grade + Music audio + compact 1080p YouTube-ready
param(
  [string]$Source = "F:\DCIM\Hanna and Mr Isaac",
  [string]$OutRoot = "D:\Wakungo_Content_Studio\hanna_mr_isaac",
  [string[]]$Only = @("DSC_0158","DSC_0159","DSC_0160","DSC_0161"),
  [string]$Artist = "Hanna & Mr Isaac",
  [string]$Subtitle = "Live Performance"
)

$ErrorActionPreference = "Continue"

$compDir = Join-Path $OutRoot "02_videos_compressed"
$editDir = Join-Path $OutRoot "03_videos_edited"
$mastDir = Join-Path $OutRoot "04_videos_mastered"
$expDir  = Join-Path $OutRoot "05_exports"
$thumbDir = Join-Path $OutRoot "06_thumbnails"
$logs = Join-Path $OutRoot "00_logs"
@($compDir,$editDir,$mastDir,$expDir,$thumbDir,$logs) | ForEach-Object {
  if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

$logFile = Join-Path $logs ("stages_enhance_{0:yyyyMMdd_HHmmss}.log" -f (Get-Date))
function Write-Log([string]$msg) {
  $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $msg
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

function Get-Dur([string]$path) {
  try {
    $r = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $path 2>$null
    if ([string]::IsNullOrWhiteSpace($r)) { return 0 }
    return [double]$r
  } catch { return 0 }
}

function Test-Ok([string]$path, [double]$exp) {
  if (-not (Test-Path $path)) { return $false }
  if ((Get-Item $path).Length -lt 800KB) { return $false }
  $d = Get-Dur $path
  if ($d -le 0) { return $false }
  if ($exp -gt 2 -and $d -lt ($exp * 0.90)) { return $false }
  return $true
}

function Run-FF([string[]]$a) {
  & ffmpeg @a
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg exit $LASTEXITCODE" }
}

# Club/red light grade: lift shadows, tame red, denoise, mild contrast
$grade = "hqdn3d=2.2:1.6:3.5:2.8,eq=contrast=1.08:brightness=0.025:saturation=0.92:gamma=1.06"

# Music / Stages audio — full, balanced (afftdn nf <= -20)
$afMusic = @(
  "highpass=f=50",
  "lowpass=f=16000",
  "afftdn=nf=-22:nt=w:tn=1:om=o",
  "equalizer=f=80:t=q:w=1:g=1.6",
  "equalizer=f=180:t=q:w=1:g=1.2",
  "equalizer=f=350:t=q:w=1:g=-1",
  "equalizer=f=900:t=q:w=1:g=-0.8",
  "equalizer=f=2500:t=q:w=1.1:g=1.0",
  "equalizer=f=5500:t=q:w=1:g=-1.5",
  "acompressor=threshold=-18dB:ratio=1.9:attack=22:release=260:makeup=2.2:knee=8",
  "alimiter=limit=0.96:attack=6:release=55",
  "loudnorm=I=-14:TP=-1.5:LRA=10"
) -join ","

# Fake Multi-Cam overlays (1080p source): cycle every 28s
# 0-7 Totale | 7-14 Medium | 14-21 Left CU | 21-28 Right CU
$multiCam = @"
split=4[f][m][l][r];
[f]null[full];
[m]crop=iw*0.72:ih*0.70:(iw-ow)/2:(ih-oh)*0.35,scale=1920:1080:flags=lanczos,setsar=1[med];
[l]crop=iw*0.52:ih*0.68:iw*0.02:ih*0.14,scale=1920:1080:flags=lanczos,setsar=1[left];
[r]crop=iw*0.52:ih*0.68:iw*0.46:ih*0.14,scale=1920:1080:flags=lanczos,setsar=1[right];
[full][med]overlay=0:0:enable='gte(mod(t\,28)\,7)*lt(mod(t\,28)\,14)'[v1];
[v1][left]overlay=0:0:enable='gte(mod(t\,28)\,14)*lt(mod(t\,28)\,21)'[v2];
[v2][right]overlay=0:0:enable='gte(mod(t\,28)\,21)*lt(mod(t\,28)\,28)'[base]
"@ -replace "`r?`n",""

Write-Log "Stages enhance | Source=$Source | Out=$OutRoot"
Write-Log "Clips: $($Only -join ', ')"

foreach ($stem in $Only) {
  $src = Join-Path $Source ("{0}.MOV" -f $stem)
  if (-not (Test-Path $src)) {
    Write-Log "MISSING: $src"
    continue
  }

  $dur = Get-Dur $src
  Write-Log ("--- {0} ({1}s / {2} MB) ---" -f $stem, [math]::Round($dur,1), [math]::Round((Get-Item $src).Length/1MB,1))

  $comp = Join-Path $compDir ("{0}_compressed.mp4" -f $stem)
  $edit = Join-Path $editDir ("{0}_stages_edited.mp4" -f $stem)
  $mast = Join-Path $mastDir ("{0}_stages_mastered.mp4" -f $stem)
  $yt   = Join-Path $expDir ("{0}_youtube_1080.mp4" -f $stem)
  $thumb = Join-Path $thumbDir ("{0}_thumb.jpg" -f $stem)

  # A) Playable compact compress (H.264 CRF20, AAC 160k) — small + quality
  if (-not (Test-Ok $comp $dur)) {
    if (Test-Path $comp) { Remove-Item $comp -Force }
    Write-Log "  compress (playable, compact)..."
    try {
      Run-FF @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-fflags","+genpts+discardcorrupt","-err_detect","ignore_err","-max_error_rate","1.0",
        "-i",$src,
        "-map","0:v:0","-map","0:a:0?",
        "-c:v","libx264","-preset","faster","-crf","20","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","160k","-ar","48000",
        "-movflags","+faststart",
        $comp
      )
    } catch {
      Write-Log ("  compress WARN: {0}" -f $_.Exception.Message)
      if (-not (Test-Ok $comp ($dur * 0.5))) { Write-Log "  skip clip"; continue }
    }
  } else { Write-Log "  compress skip" }

  $work = if (Test-Ok $comp $dur) { $comp } else { $src }
  $fadeOut = [math]::Max(0, $dur - 2.5)

  # Escaped drawtext
  $artistEsc = $Artist -replace "'","\\'" -replace ":","\:"
  $subEsc = $Subtitle -replace "'","\\'" -replace ":","\:"

  # B) Stages edit: grade + fake multicam + intro lower third + outro fade
  if (-not (Test-Ok $edit $dur)) {
    if (Test-Path $edit) { Remove-Item $edit -Force }
    Write-Log "  stages edit (multicam + grade + lower third)..."
    $fc = @"
[0:v]$multiCam;
[base]$grade,fade=t=in:st=0:d=0.6,fade=t=out:st=${fadeOut}:d=2.2,
drawtext=fontfile=/Windows/Fonts/arialbd.ttf:text='${artistEsc}':fontsize=44:fontcolor=white:borderw=2:bordercolor=black@0.6:x=56:y=h-140:enable='between(t\,1.2\,9)',
drawtext=fontfile=/Windows/Fonts/arial.ttf:text='${subEsc}':fontsize=28:fontcolor=white@0.92:borderw=1:bordercolor=black@0.5:x=56:y=h-88:enable='between(t\,1.5\,9)'[vout]
"@ -replace "`r?`n",""
    try {
      Run-FF @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-i",$work,
        "-filter_complex",$fc,
        "-map","[vout]","-map","0:a:0?",
        "-af",$afMusic,
        "-c:v","libx264","-preset","faster","-crf","19","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","192k","-ar","48000",
        "-movflags","+faststart",
        $edit
      )
    } catch {
      Write-Log ("  multicam failed, fallback grade-only: {0}" -f $_.Exception.Message)
      $vf = "$grade,fade=t=in:st=0:d=0.6,fade=t=out:st=${fadeOut}:d=2.2,drawtext=fontfile=/Windows/Fonts/arialbd.ttf:text='${artistEsc}':fontsize=44:fontcolor=white:borderw=2:bordercolor=black@0.6:x=56:y=h-140:enable='between(t\,1.2\,9)'"
      Run-FF @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-i",$work,
        "-vf",$vf,
        "-af",$afMusic,
        "-c:v","libx264","-preset","faster","-crf","19","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","192k","-ar","48000",
        "-movflags","+faststart",
        $edit
      )
    }
  } else { Write-Log "  edit skip" }

  # C) Mastered = same as edit for Stages (already audio mastered)
  if ((Test-Ok $edit $dur) -and -not (Test-Ok $mast $dur)) {
    Copy-Item $edit $mast -Force
    Write-Log "  master = stages edit copy"
  }

  # D) YouTube compact export (same picture, slightly smaller bitrate target)
  if ((Test-Ok $edit $dur) -and -not (Test-Ok $yt $dur)) {
    Write-Log "  youtube 1080 export..."
    Run-FF @(
      "-y","-hide_banner","-loglevel","error","-stats",
      "-i",$edit,
      "-c:v","libx264","-preset","faster","-crf","21","-pix_fmt","yuv420p",
      "-c:a","aac","-b:a","160k",
      "-movflags","+faststart",
      $yt
    )
  }

  # E) Thumbnail from ~40% mark, brightened
  if ((Test-Ok $edit $dur) -and (-not (Test-Path $thumb) -or (Get-Item $thumb).Length -lt 20KB)) {
    $ss = [math]::Max(2, [math]::Round($dur * 0.4, 1))
    Write-Log "  thumbnail @ ${ss}s..."
    Run-FF @(
      "-y","-hide_banner","-loglevel","error",
      "-ss",$ss.ToString([Globalization.CultureInfo]::InvariantCulture),
      "-i",$edit,
      "-frames:v","1",
      "-vf","eq=contrast=1.15:brightness=0.06:saturation=1.05,unsharp=5:5:0.6:5:5:0.0",
      "-q:v","2",
      $thumb
    )
  }

  if (Test-Path $comp) { Write-Log ("  sizes: compress={0}MB edit={1}MB yt={2}MB" -f [math]::Round((Get-Item $comp).Length/1MB,1), $(if(Test-Path $edit){[math]::Round((Get-Item $edit).Length/1MB,1)}else{0}), $(if(Test-Path $yt){[math]::Round((Get-Item $yt).Length/1MB,1)}else{0})) }
}

Write-Log "DONE Stages enhance. Outputs: $OutRoot"
