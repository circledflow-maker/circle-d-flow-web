param(
  [string]$Source = "F:\DCIM\Hanna and Mr Isaac",
  [string]$OutRoot = "D:\Wakungo_Content_Studio\hanna_mr_isaac",
  [ValidateSet("all", "photos", "videos", "short", "long")]
  [string]$Mode = "all",
  [int]$MaxParallel = 1
)

$ErrorActionPreference = "Stop"

$photoCompressed = Join-Path $OutRoot "01_photos_compressed"
$videoCompressed = Join-Path $OutRoot "02_videos_compressed"
$videoEdited     = Join-Path $OutRoot "03_videos_edited"
$videoMastered   = Join-Path $OutRoot "04_videos_mastered"
$exports         = Join-Path $OutRoot "05_exports"
$logs            = Join-Path $OutRoot "00_logs"

@($photoCompressed, $videoCompressed, $videoEdited, $videoMastered, $exports, $logs) | ForEach-Object {
  if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

$logFile = Join-Path $logs ("pipeline_{0:yyyyMMdd_HHmmss}.log" -f (Get-Date))
function Write-Log([string]$msg) {
  $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $msg
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

function Run-FFMpeg([string[]]$FfmpegArgs) {
  & ffmpeg @FfmpegArgs
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed ($LASTEXITCODE): $($FfmpegArgs -join ' ')" }
}

# Near-lossless visual compress (CRF 17–18) + high-quality AAC
$videoVf = "hqdn3d=1.8:1.4:3.2:2.6,eq=contrast=1.06:brightness=0.012:saturation=1.08:gamma=1.02,unsharp=5:5:0.55:5:5:0.0"
# Performance audio master: cut rumble, denoise chatter/room, balance voice+instruments, loudness
$audioAf = @(
  "highpass=f=85",
  "lowpass=f=14500",
  "afftdn=nf=-28:nt=w:tn=1:om=o",
  "anlmdn=s=0.0008:p=0.002:r=0.002:m=15",
  "equalizer=f=180:t=q:w=1.1:g=2.2",
  "equalizer=f=900:t=q:w=1.0:g=-2.5",
  "equalizer=f=2800:t=q:w=1.3:g=-3.5",
  "equalizer=f=4500:t=q:w=1.1:g=1.8",
  "equalizer=f=6500:t=q:w=1.0:g=1.2",
  "acompressor=threshold=-18dB:ratio=2.8:attack=12:release=220:makeup=4:knee=6",
  "alimiter=limit=0.95:attack=5:release=50",
  "loudnorm=I=-14:TP=-1.5:LRA=10"
) -join ","

$photoVf = "hqdn3d=2.5:1.8:4:3,eq=contrast=1.05:brightness=0.01:saturation=1.08:gamma=1.02,unsharp=5:5:0.6:5:5:0.0"

function Get-MediaDuration([string]$path) {
  if (-not (Test-Path $path)) { return 0 }
  try {
    $raw = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $path 2>$null
    if ([string]::IsNullOrWhiteSpace($raw)) { return 0 }
    return [double]$raw
  } catch { return 0 }
}

function Test-OutputComplete([string]$path, [double]$expectedDur) {
  if (-not (Test-Path $path)) { return $false }
  if ((Get-Item $path).Length -lt 1MB) { return $false }
  $d = Get-MediaDuration $path
  if ($d -le 0) { return $false }
  if ($expectedDur -gt 0 -and $d -lt ($expectedDur * 0.92)) { return $false }
  return $true
}

Write-Log "Source: $Source"
Write-Log "Out:    $OutRoot"
Write-Log "Mode:   $Mode"

# --- PHOTOS ---
if ($Mode -in @("all", "photos")) {
  Write-Log "1) Compressing / polishing JPG photos (quality-preserving)..."
  $jpgs = Get-ChildItem -Path $Source -Filter *.JPG
  $i = 0
  foreach ($jpg in $jpgs) {
    $i++
    $out = Join-Path $photoCompressed ("{0}_compressed.jpg" -f $jpg.BaseName)
    if ((Test-Path $out) -and ((Get-Item $out).Length -gt 200KB)) {
      Write-Log "  skip photo $i/$($jpgs.Count): $($jpg.Name)"
      continue
    }
    Write-Log "  photo $i/$($jpgs.Count): $($jpg.Name)"
    Run-FFMpeg @(
      "-y","-hide_banner","-loglevel","error",
      "-i",$jpg.FullName,
      "-vf",$photoVf,
      "-q:v","2",
      $out
    )
  }
  Write-Log "Photos done: $($jpgs.Count)"
}

# --- VIDEOS ---
if ($Mode -in @("all", "videos", "short", "long")) {
  $movs = Get-ChildItem -Path $Source -Filter *.MOV | Sort-Object Name
  $jobs = @()

  foreach ($mov in $movs) {
    $dur = 0.0
    try {
      $dur = [double](& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $mov.FullName)
    } catch { $dur = 0 }

    $isLong = $dur -ge 60
    if ($Mode -eq "short" -and $isLong) { continue }
    if ($Mode -eq "long" -and -not $isLong) { continue }

    $base = $mov.BaseName
    $comp = Join-Path $videoCompressed ("{0}_compressed.mp4" -f $base)
    $edit = Join-Path $videoEdited ("{0}_edited.mp4" -f $base)
    $mast = Join-Path $videoMastered ("{0}_mastered.mp4" -f $base)

    $jobs += [pscustomobject]@{
      Src = $mov.FullName
      Name = $mov.Name
      Dur = [math]::Round($dur, 1)
      Comp = $comp
      Edit = $edit
      Mast = $mast
      IsLong = $isLong
    }
  }

  Write-Log ("2) Videos to process: {0} (short={1}, long={2})" -f `
    $jobs.Count, `
    @($jobs | Where-Object { -not $_.IsLong }).Count, `
    @($jobs | Where-Object { $_.IsLong }).Count)

  $n = 0
  foreach ($job in $jobs) {
    $n++
    Write-Log ("--- [{0}/{1}] {2} ({3}s) ---" -f $n, $jobs.Count, $job.Name, $job.Dur)

    # A) Compressed — near-lossless visual, AAC audio (size down from PCM+HEVC)
    $srcForEdit = $job.Src
    if (-not (Test-OutputComplete $job.Comp $job.Dur)) {
      if (Test-Path $job.Comp) {
        Write-Log "  compress incomplete/corrupt — redoing..."
        Remove-Item $job.Comp -Force -ErrorAction SilentlyContinue
      } else {
        Write-Log "  compress..."
      }
      Run-FFMpeg @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-i",$job.Src,
        "-map","0:v:0","-map","0:a:0?",
        "-c:v","libx264","-preset",$(if ($job.IsLong) { "faster" } else { "medium" }),"-crf","17","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","256k","-ar","48000",
        "-movflags","+faststart",
        $job.Comp
      )
    } else {
      Write-Log "  compress skip (exists)"
    }
    if ((Test-OutputComplete $job.Comp $job.Dur) -and $job.IsLong) { $srcForEdit = $job.Comp }

    # B) Edited — mild grade + denoise + light audio cleanup
    if (-not (Test-OutputComplete $job.Edit $job.Dur)) {
      if (Test-Path $job.Edit) {
        Write-Log "  edit incomplete/corrupt — redoing..."
        Remove-Item $job.Edit -Force -ErrorAction SilentlyContinue
      } else {
        Write-Log "  edit (grade + light cleanup)..."
      }
      $fadeOutStart = [math]::Max(0, $job.Dur - 1.2)
      $vfEdit = "$videoVf,fade=t=in:st=0:d=0.6,fade=t=out:st=${fadeOutStart}:d=1.0"
      Run-FFMpeg @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-i",$srcForEdit,
        "-vf",$vfEdit,
        "-af","highpass=f=90,afftdn=nf=-22:nt=w:tn=1,acompressor=threshold=-18dB:ratio=2.2:attack=20:release=250:makeup=2",
        "-c:v","libx264","-preset",$(if ($job.IsLong) { "faster" } else { "medium" }),"-crf","17","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","256k","-ar","48000",
        "-movflags","+faststart",
        $job.Edit
      )
    } else {
      Write-Log "  edit skip (exists)"
    }

    # C) Mastered — full audio master for performance (chatter down, mix balanced)
    if (-not (Test-OutputComplete $job.Mast $job.Dur)) {
      if (Test-Path $job.Mast) {
        Write-Log "  master incomplete/corrupt — redoing..."
        Remove-Item $job.Mast -Force -ErrorAction SilentlyContinue
      } else {
        Write-Log "  master audio (denoise + balance + loudnorm)..."
      }
      $fadeOutStart = [math]::Max(0, $job.Dur - 1.2)
      $vfMast = "$videoVf,fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeOutStart}:d=1.0"
      $srcForMaster = if ($job.IsLong -and (Test-OutputComplete $job.Comp $job.Dur)) { $job.Comp } else { $job.Src }
      Run-FFMpeg @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-i",$srcForMaster,
        "-vf",$vfMast,
        "-af",$audioAf,
        "-c:v","libx264","-preset",$(if ($job.IsLong) { "faster" } else { "medium" }),"-crf","17","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","320k","-ar","48000",
        "-movflags","+faststart",
        $job.Mast
      )
    } else {
      Write-Log "  master skip (exists)"
    }
  }

  # Export a short highlight reel from short mastered clips
  Write-Log "3) Building highlight export from short mastered clips..."
  $shortMasters = Get-ChildItem $videoMastered -Filter "*_mastered.mp4" | Where-Object {
    try {
      $d = [double](& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $_.FullName)
      $d -lt 60
    } catch { $false }
  } | Sort-Object Name

  $concatList = Join-Path $exports "highlight_concat.txt"
  if (Test-Path $concatList) { Remove-Item $concatList -Force }
  foreach ($c in $shortMasters) {
    $p = ($c.FullName -replace "\\", "/")
    Add-Content -Path $concatList -Value ("file '{0}'" -f $p)
  }

  $highlight = Join-Path $exports "Hanna_MrIsaac_highlights_mastered.mp4"
  if ($shortMasters.Count -gt 0) {
    Run-FFMpeg @(
      "-y","-hide_banner","-loglevel","error",
      "-f","concat","-safe","0","-i",$concatList,
      "-c","copy",
      "-movflags","+faststart",
      $highlight
    )
    Write-Log "Highlight: $highlight"
  }

  # README
  $readme = @"
# Hanna & Mr Isaac — Wakungo Content Studio

Source: $Source
Processed: $(Get-Date -Format 'yyyy-MM-dd HH:mm')

## Folders
- 01_photos_compressed — JPG polished + high-quality compress (q=2)
- 02_videos_compressed — size-down H.264 CRF17 / AAC 256k (near-lossless look)
- 03_videos_edited — color grade + light denoise + fades
- 04_videos_mastered — full audio master (chatter/room reduced, voice+instruments balanced) + grade
- 05_exports — highlight reel from short takes

## Audio master chain
highpass → FFT denoise → NL-means denoise → EQ (cut chatter band, lift music/voice) → compressor → limiter → loudnorm (-14 LUFS)
"@
  Set-Content -Path (Join-Path $OutRoot "README.md") -Value $readme -Encoding UTF8
}

Write-Log "DONE."
Write-Log "Outputs in: $OutRoot"
