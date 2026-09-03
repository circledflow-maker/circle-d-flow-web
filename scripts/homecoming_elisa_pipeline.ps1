# Homecoming Host Elisa — copy already done; compress + grade + audio master
# Regelwerk: quality-preserving compress, club/event grade, balanced music audio (default Stages/event)
param(
  [string]$OutRoot = "D:\Homecoming. Host.Elisa",
  [string]$Artist = "Homecoming Host Elisa",
  [string]$Subtitle = "Live Performance"
)

$ErrorActionPreference = "Continue"

$rawV   = Join-Path $OutRoot "01_Raw_Video"
$rawP   = Join-Path $OutRoot "02_Raw_Photos"
$photoC = Join-Path $OutRoot "03_photos_compressed"
$vidC   = Join-Path $OutRoot "04_videos_compressed"
$vidE   = Join-Path $OutRoot "05_videos_edited"
$vidM   = Join-Path $OutRoot "06_videos_mastered"
$exp    = Join-Path $OutRoot "07_exports"
$thumbs = Join-Path $OutRoot "08_thumbnails"
$logs   = Join-Path $OutRoot "00_logs"

@($rawV,$rawP,$photoC,$vidC,$vidE,$vidM,$exp,$thumbs,$logs) | ForEach-Object {
  if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

$logFile = Join-Path $logs ("pipeline_{0:yyyyMMdd_HHmmss}.log" -f (Get-Date))
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
  if ((Get-Item $path).Length -lt 400KB) { return $false }
  $d = Get-Dur $path
  if ($d -le 0) { return $false }
  if ($exp -gt 2 -and $d -lt ($exp * 0.90)) { return $false }
  return $true
}

function Run-FF([string[]]$a) {
  & ffmpeg @a
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg exit $LASTEXITCODE" }
}

# Photos: denoise + mild polish, high JPEG quality
$photoVf = "hqdn3d=2.2:1.6:3.5:2.8,eq=contrast=1.06:brightness=0.015:saturation=1.05:gamma=1.03,unsharp=5:5:0.5:5:5:0.0"

# Videos: lift shadows, tame red, denoise, mild contrast (Stages/event)
$videoGrade = "hqdn3d=2.0:1.5:3.2:2.6,eq=contrast=1.08:brightness=0.02:saturation=0.95:gamma=1.05"

# Music/event audio — full, balanced (afftdn nf <= -20)
$afMusic = @(
  "highpass=f=50",
  "lowpass=f=16000",
  "afftdn=nf=-22:nt=w:tn=1:om=o",
  "equalizer=f=80:t=q:w=1:g=1.5",
  "equalizer=f=180:t=q:w=1:g=1.2",
  "equalizer=f=350:t=q:w=1:g=-1",
  "equalizer=f=900:t=q:w=1:g=-0.8",
  "equalizer=f=2500:t=q:w=1.1:g=1.0",
  "equalizer=f=5500:t=q:w=1:g=-1.5",
  "acompressor=threshold=-18dB:ratio=1.9:attack=22:release=260:makeup=2.2:knee=8",
  "alimiter=limit=0.96:attack=6:release=55",
  "loudnorm=I=-14:TP=-1.5:LRA=10"
) -join ","

# Interview/talk fallback (short clips with speech-heavy feel still get warm voice)
$afTalk = @(
  "highpass=f=70",
  "lowpass=f=13500",
  "afftdn=nf=-28:nt=w:tn=1:om=o",
  "equalizer=f=220:t=q:w=1.1:g=2.0",
  "equalizer=f=450:t=q:w=1:g=1.0",
  "equalizer=f=900:t=q:w=1:g=-1.5",
  "equalizer=f=2200:t=q:w=1.1:g=1.5",
  "equalizer=f=6500:t=q:w=1.2:g=-2",
  "acompressor=threshold=-22dB:ratio=2.4:attack=15:release=200:makeup=3:knee=7",
  "alimiter=limit=0.95:attack=6:release=55",
  "loudnorm=I=-16:TP=-1.5:LRA=8"
) -join ","

Write-Log "Homecoming pipeline | Out=$OutRoot"

# --- PHOTOS ---
$jpgs = @(Get-ChildItem $rawP -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg)$' })
Write-Log ("Photos: {0}" -f $jpgs.Count)
$i = 0
foreach ($jpg in $jpgs) {
  $i++
  $out = Join-Path $photoC ("{0}_compressed.jpg" -f $jpg.BaseName)
  if ((Test-Path $out) -and ((Get-Item $out).Length -gt 150KB)) {
    Write-Log ("  skip photo {0}/{1} {2}" -f $i, $jpgs.Count, $jpg.Name)
    continue
  }
  Write-Log ("  photo {0}/{1} {2}" -f $i, $jpgs.Count, $jpg.Name)
  try {
    Run-FF @(
      "-y","-hide_banner","-loglevel","error",
      "-i",$jpg.FullName,
      "-vf",$photoVf,
      "-q:v","2",
      $out
    )
  } catch {
    Write-Log ("  photo WARN: {0}" -f $_.Exception.Message)
  }
}

# --- VIDEOS ---
$movs = @(Get-ChildItem $rawV -File | Where-Object { $_.Extension -match '^\.(mov|mp4)$' } | Sort-Object Name)
Write-Log ("Videos: {0}" -f $movs.Count)
$n = 0
foreach ($mov in $movs) {
  $n++
  $dur = Get-Dur $mov.FullName
  $stem = $mov.BaseName
  Write-Log ("--- [{0}/{1}] {2} ({3}s) ---" -f $n, $movs.Count, $mov.Name, [math]::Round($dur,1))

  $comp = Join-Path $vidC ("{0}_compressed.mp4" -f $stem)
  $edit = Join-Path $vidE ("{0}_edited.mp4" -f $stem)
  $mast = Join-Path $vidM ("{0}_mastered.mp4" -f $stem)
  $yt   = Join-Path $exp ("{0}_share.mp4" -f $stem)
  $thumb = Join-Path $thumbs ("{0}_thumb.jpg" -f $stem)

  $af = if ($dur -ge 45) { $afMusic } else { $afTalk }
  $preset = if ($dur -ge 90) { "veryfast" } else { "faster" }

  # A) Compress — playable H.264, near-lossless look CRF18
  if (-not (Test-Ok $comp $dur)) {
    if (Test-Path $comp) { Remove-Item $comp -Force }
    Write-Log "  compress..."
    try {
      Run-FF @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-fflags","+genpts+discardcorrupt","-err_detect","ignore_err","-max_error_rate","1.0",
        "-i",$mov.FullName,
        "-map","0:v:0","-map","0:a:0?",
        "-c:v","libx264","-preset",$preset,"-crf","18","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","192k","-ar","48000",
        "-movflags","+faststart",
        $comp
      )
    } catch {
      Write-Log ("  compress WARN: {0}" -f $_.Exception.Message)
      if (-not (Test-Ok $comp ($dur * 0.5))) { continue }
    }
  } else { Write-Log "  compress skip" }

  $work = if (Test-Ok $comp $dur) { $comp } else { $mov.FullName }
  $fadeOut = [math]::Max(0, $dur - 1.5)

  # B) Edited grade + fades
  if (-not (Test-Ok $edit $dur)) {
    if (Test-Path $edit) { Remove-Item $edit -Force }
    Write-Log "  edit/grade..."
    $vf = "$videoGrade,fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeOut}:d=1.2"
    try {
      Run-FF @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-i",$work,
        "-vf",$vf,
        "-af","highpass=f=60,afftdn=nf=-22:nt=w:tn=1,acompressor=threshold=-18dB:ratio=2:attack=20:release=220:makeup=2",
        "-c:v","libx264","-preset",$preset,"-crf","18","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","192k","-ar","48000",
        "-movflags","+faststart",
        $edit
      )
    } catch {
      Write-Log ("  edit WARN: {0}" -f $_.Exception.Message)
    }
  } else { Write-Log "  edit skip" }

  # C) Mastered — full audio master + grade
  if (-not (Test-Ok $mast $dur)) {
    if (Test-Path $mast) { Remove-Item $mast -Force }
    Write-Log "  master audio..."
    $vf = "$videoGrade,fade=t=in:st=0:d=0.4,fade=t=out:st=${fadeOut}:d=1.2"
    try {
      Run-FF @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-i",$work,
        "-vf",$vf,
        "-af",$af,
        "-c:v","libx264","-preset",$preset,"-crf","18","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","256k","-ar","48000",
        "-movflags","+faststart",
        $mast
      )
    } catch {
      Write-Log ("  master WARN: {0}" -f $_.Exception.Message)
      if (-not (Test-Ok $mast ($dur * 0.5))) { continue }
    }
  } else { Write-Log "  master skip" }

  # D) Share export (slightly smaller)
  if ((Test-Ok $mast $dur) -and -not (Test-Ok $yt $dur)) {
    Write-Log "  share export..."
    Run-FF @(
      "-y","-hide_banner","-loglevel","error","-stats",
      "-i",$mast,
      "-c:v","libx264","-preset","faster","-crf","20","-pix_fmt","yuv420p",
      "-c:a","aac","-b:a","160k",
      "-movflags","+faststart",
      $yt
    )
  }

  # E) Thumbnail
  if ((Test-Ok $mast $dur) -and (-not (Test-Path $thumb) -or (Get-Item $thumb).Length -lt 20KB)) {
    $ss = [math]::Max(1, [math]::Round($dur * 0.35, 1))
    Write-Log "  thumbnail..."
    Run-FF @(
      "-y","-hide_banner","-loglevel","error",
      "-ss",$ss.ToString([Globalization.CultureInfo]::InvariantCulture),
      "-i",$mast,
      "-frames:v","1",
      "-vf","eq=contrast=1.12:brightness=0.05:saturation=1.05",
      "-q:v","2",
      $thumb
    )
  }
}

$readme = @"
# Homecoming Host Elisa — Studio

Processed: $(Get-Date -Format 'yyyy-MM-dd HH:mm')
Artist label: $Artist / $Subtitle

## Folders
- 01_Raw_Video / 02_Raw_Photos — originals from camera
- 03_photos_compressed — polished JPG (q=2)
- 04_videos_compressed — H.264 CRF18 / AAC (playable, quality-preserving)
- 05_videos_edited — color grade + denoise + fades
- 06_videos_mastered — audio master (event/music balanced; short=talk profile)
- 07_exports — share-ready CRF20
- 08_thumbnails
"@
Set-Content -Path (Join-Path $OutRoot "README.md") -Value $readme -Encoding UTF8
Write-Log "DONE. Outputs: $OutRoot"
Set-Content (Join-Path $logs "PIPELINE_COMPLETE.flag") ("DONE $(Get-Date -Format o)")
