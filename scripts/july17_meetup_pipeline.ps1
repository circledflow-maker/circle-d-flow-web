param(
  [string]$Source = "D:\Wakungo_Content_Studio\17 july meet up",
  [string]$OutRoot = "D:\Wakungo_Content_Studio\17 july meet up\_studio",
  [ValidateSet("all", "photos", "videos", "short", "long")]
  [string]$Mode = "all",
  [int]$SegmentMinutes = 4,
  [switch]$ForceRemaster
)

$ErrorActionPreference = "Continue"

$photoComp   = Join-Path $OutRoot "01_photos_compressed"
$portraits   = Join-Path $OutRoot "02_portraits_selected"
$vidComp     = Join-Path $OutRoot "03_videos_compressed"
$vidEdit     = Join-Path $OutRoot "04_videos_edited"
$vidMaster   = Join-Path $OutRoot "05_videos_mastered"
$driveReady  = Join-Path $OutRoot "06_drive_ready"
$akademie    = Join-Path $driveReady "Circle_Akademie"
$flowTalk    = Join-Path $driveReady "FlowTalk"
$stage       = Join-Path $driveReady "Circle_D_Stage"
$logs        = Join-Path $OutRoot "00_logs"

@($photoComp, $portraits, $vidComp, $vidEdit, $vidMaster, $akademie, $flowTalk, $stage, $logs) | ForEach-Object {
  if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

$logFile = Join-Path $logs ("meetup_{0:yyyyMMdd_HHmmss}.log" -f (Get-Date))
function Write-Log([string]$msg) {
  $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $msg
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

function Run-FFMpeg([string[]]$FFmpegArgs, [string]$OutPath = $null, [double]$ExpectedDur = 0) {
  & ffmpeg @FFmpegArgs
  $code = $LASTEXITCODE
  if ($code -eq 0) { return }
  # Corrupt-source encodes often exit non-zero even when a usable file was written
  if ($OutPath -and (Test-OutputComplete $OutPath ([math]::Max(2, $ExpectedDur * 0.45)))) {
    Write-Log ("  ffmpeg exit {0} but output usable - continue" -f $code)
    return
  }
  throw "ffmpeg failed ($code)"
}

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
  if ((Get-Item $path).Length -lt 500KB) { return $false }
  $d = Get-MediaDuration $path
  if ($d -le 0) { return $false }
  if ($expectedDur -gt 2 -and $d -lt ($expectedDur * 0.90)) { return $false }
  return $true
}

function Get-ContentKind([string]$name) {
  $n = $name.ToLowerInvariant()
  if ($n -match 'akademie|wisdom|word of the day|plan of wakungo|value to achive|mission|cooperation|graduated|learn how to dance|fotography|photography|studiy|study subject') {
    return 'interview'
  }
  if ($n -match 'song|musicproduction|violett|poem|creating a new|reaggea|reggae|jam|give a flow|originals') {
    return 'music'
  }
  if ($n -match 'flow talk') { return 'interview' }
  return 'session'
}

function Get-DriveBucket([string]$name) {
  $n = $name.ToLowerInvariant()
  if ($n -match 'akademie|wisdom|word of the day|freedom|liberty') { return $akademie }
  if ($n -match 'flow talk|plan of wakungo|value to|mission|cooperation|caiou way|graduated') { return $flowTalk }
  return $stage
}

function Get-SafeStem([string]$name) {
  $s = [IO.Path]::GetFileNameWithoutExtension($name)
  $s = $s -replace '[^\w\- ]', '' -replace '\s+', '_'
  if ($s.Length -gt 80) { $s = $s.Substring(0, 80) }
  return $s
}

# Color grade - cinematic but natural (no heavy denoise; keeps encode speed usable)
$videoVf = "eq=contrast=1.07:brightness=0.015:saturation=1.10:gamma=1.02,unsharp=5:5:0.45:5:5:0.0,format=yuv420p"

# Interview / FlowTalk / Akademie - voice clear + warm body, BG noise down (less hollow/"schal")
$afInterview = @(
  "highpass=f=70",
  "lowpass=f=13500",
  "afftdn=nf=-30:nt=w:tn=1:om=o",
  "anlmdn=s=0.0012:p=0.0025:r=0.002:m=16",
  "equalizer=f=110:t=q:w=1:g=-2",
  "equalizer=f=220:t=q:w=1.1:g=2.2",
  "equalizer=f=450:t=q:w=1:g=1.2",
  "equalizer=f=900:t=q:w=1:g=-2",
  "equalizer=f=2200:t=q:w=1.1:g=1.8",
  "equalizer=f=3500:t=q:w=1.2:g=1.2",
  "equalizer=f=6500:t=q:w=1.2:g=-2.5",
  "equalizer=f=9000:t=q:w=1:g=-1.5",
  "acompressor=threshold=-22dB:ratio=2.4:attack=15:release=200:makeup=3.2:knee=7",
  "alimiter=limit=0.95:attack=6:release=55",
  "loudnorm=I=-16:TP=-1.5:LRA=8"
) -join ","

# Music / jam - full body, voice+instruments in balance (no thin/harsh scoop)
$afMusic = @(
  "highpass=f=45",
  "lowpass=f=16500",
  "afftdn=nf=-22:nt=w:tn=1:om=o",
  "equalizer=f=70:t=q:w=1:g=1.8",
  "equalizer=f=160:t=q:w=1:g=1.4",
  "equalizer=f=350:t=q:w=1:g=-1.2",
  "equalizer=f=900:t=q:w=1:g=-0.8",
  "equalizer=f=2400:t=q:w=1.1:g=1.2",
  "equalizer=f=4800:t=q:w=1:g=-1.8",
  "equalizer=f=8000:t=q:w=1:g=-1",
  "acompressor=threshold=-18dB:ratio=1.9:attack=25:release=280:makeup=2.2:knee=8",
  "alimiter=limit=0.96:attack=6:release=60",
  "loudnorm=I=-14:TP=-1.5:LRA=10"
) -join ","

Write-Log "Source: $Source"
Write-Log "Out:    $OutRoot"
Write-Log "Mode:   $Mode"

# --- PHOTOS via Python ---
if ($Mode -in @("all", "photos")) {
  Write-Log "1) Photos + portrait selection (Python/OpenCV)..."
  & python "d:\circle-d-flow-web\scripts\july17_meetup_portraits.py"
  if ($LASTEXITCODE -ne 0) { throw "portrait script failed" }
}

# --- VIDEOS ---
if ($Mode -in @("all", "videos", "short", "long")) {
  $movs = @(Get-ChildItem -Path $Source -File | Where-Object {
    $_.Extension -match '^\.(mov|mp4)$'
  } | Sort-Object Name)
  $jobs = @()
  foreach ($mov in $movs) {
    $dur = Get-MediaDuration $mov.FullName
    $isLong = $dur -ge 90
    if ($Mode -eq "short" -and $isLong) { continue }
    if ($Mode -eq "long" -and -not $isLong) { continue }
    $stem = Get-SafeStem $mov.Name
    $kind = Get-ContentKind $mov.Name
    $bucket = Get-DriveBucket $mov.Name
    $jobs += [pscustomobject]@{
      Src = $mov.FullName
      Name = $mov.Name
      Stem = $stem
      Dur = [math]::Round($dur, 1)
      IsLong = $isLong
      Kind = $kind
      Bucket = $bucket
      Comp = Join-Path $vidComp ("{0}_compressed.mp4" -f $stem)
      Edit = Join-Path $vidEdit ("{0}_edited.mp4" -f $stem)
      Mast = Join-Path $vidMaster ("{0}_mastered.mp4" -f $stem)
    }
  }

  Write-Log ("2) Videos: {0} (interview={1}, music={2}, session={3})" -f `
    $jobs.Count, `
    @($jobs | Where-Object Kind -eq 'interview').Count, `
    @($jobs | Where-Object Kind -eq 'music').Count, `
    @($jobs | Where-Object Kind -eq 'session').Count)

  $n = 0
  # libx264: CRF18 + veryfast/faster ≈ visually near-lossless, workable on 4K HEVC
  foreach ($job in $jobs) {
    $n++
    Write-Log ("--- [{0}/{1}] {2} | {3} | {4}s ---" -f $n, $jobs.Count, $job.Name, $job.Kind, $job.Dur)
    # music = balanced mix; interview + session/talk = voice-forward, low BG noise
    $af = if ($job.Kind -eq 'music') { $afMusic } else { $afInterview }
    $preset = if ($job.IsLong) { "veryfast" } else { "faster" }

    if ($ForceRemaster) {
      Write-Log "  ForceRemaster: clear mastered/edit/drive shares"
      @($job.Mast, $job.Edit) | ForEach-Object { if (Test-Path $_) { Remove-Item $_ -Force } }
      Get-ChildItem -Path $job.Bucket -File -Filter ("{0}*_share.mp4" -f $job.Stem) -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item $_.FullName -Force }
    }

    # A) Compress (archive, no grade)
    if (-not (Test-OutputComplete $job.Comp $job.Dur)) {
      if (Test-Path $job.Comp) { Remove-Item $job.Comp -Force }
      Write-Log "  compress..."
      try {
        Run-FFMpeg -FFmpegArgs @(
          "-y","-hide_banner","-loglevel","error","-stats",
          "-fflags","+genpts+discardcorrupt","-err_detect","ignore_err","-max_error_rate","1.0",
          "-i",$job.Src,
          "-map","0:v:0","-map","0:a:0?",
          "-c:v","libx264","-preset",$preset,"-crf","18","-pix_fmt","yuv420p",
          "-c:a","aac","-b:a","256k","-ar","48000",
          "-movflags","+faststart",
          $job.Comp
        ) -OutPath $job.Comp -ExpectedDur $job.Dur
      } catch {
        Write-Log ("  compress WARN: {0}" -f $_.Exception.Message)
        if (-not ((Test-Path $job.Comp) -and ((Get-Item $job.Comp).Length -gt 1MB))) {
          Write-Log "  compress incomplete - skip file"
          continue
        }
        Write-Log "  compress partial kept - try master"
      }
    } else { Write-Log "  compress skip" }

    $srcEdit = if (Test-OutputComplete $job.Comp $job.Dur) { $job.Comp } else { $job.Src }

    # B) Mastered = color grade + type-aware audio (single encode)
    if (-not (Test-OutputComplete $job.Mast $job.Dur)) {
      if (Test-Path $job.Mast) { Remove-Item $job.Mast -Force }
      Write-Log ("  master grade+{0} audio..." -f $job.Kind)
      $fadeOut = [math]::Max(0, $job.Dur - 1.0)
      $vf = "$videoVf,fade=t=in:st=0:d=0.4,fade=t=out:st=${fadeOut}:d=0.9"
      try {
        Run-FFMpeg -FFmpegArgs @(
          "-y","-hide_banner","-loglevel","error","-stats",
          "-fflags","+genpts+discardcorrupt","-err_detect","ignore_err","-max_error_rate","1.0",
          "-i",$srcEdit,
          "-vf",$vf,
          "-af",$af,
          "-c:v","libx264","-preset",$preset,"-crf","18",
          "-c:a","aac","-b:a","320k","-ar","48000",
          "-movflags","+faststart",
          $job.Mast
        ) -OutPath $job.Mast -ExpectedDur $job.Dur
      } catch {
        Write-Log ("  master WARN: {0}" -f $_.Exception.Message)
        if (-not ((Test-Path $job.Mast) -and ((Get-Item $job.Mast).Length -gt 1MB))) {
          Write-Log "  master incomplete - skip file"
          continue
        }
      }
    } else { Write-Log "  master skip" }

    # C) Edited folder = graded master copy (same picture/audio for review)
    if ((Test-OutputComplete $job.Mast $job.Dur) -and -not (Test-OutputComplete $job.Edit $job.Dur)) {
      Write-Log "  edit = master copy..."
      Copy-Item -Path $job.Mast -Destination $job.Edit -Force
    } elseif (Test-OutputComplete $job.Edit $job.Dur) {
      Write-Log "  edit skip"
    }

    # D) Drive-ready segments (for sharing / upload size)
    if (Test-OutputComplete $job.Mast $job.Dur) {
      $segLen = $SegmentMinutes * 60
      $parts = [math]::Max(1, [math]::Ceiling($job.Dur / $segLen))
      Write-Log ("  drive segments: {0} x ~{1}min -> {2}" -f $parts, $SegmentMinutes, (Split-Path $job.Bucket -Leaf))
      for ($i = 0; $i -lt $parts; $i++) {
        $start = $i * $segLen
        $label = if ($parts -eq 1) { "{0}_share.mp4" -f $job.Stem } else { "{0}_part{1:00}_share.mp4" -f $job.Stem, ($i + 1) }
        $outSeg = Join-Path $job.Bucket $label
        if ((Test-Path $outSeg) -and ((Get-Item $outSeg).Length -gt 1MB) -and -not $ForceRemaster) { continue }
        $segArgs = @(
          "-y","-hide_banner","-loglevel","error",
          "-ss",$start.ToString([Globalization.CultureInfo]::InvariantCulture),
          "-i",$job.Mast,
          "-t",$segLen.ToString([Globalization.CultureInfo]::InvariantCulture),
          "-c","copy","-movflags","+faststart",
          $outSeg
        )
        if (($start + 2) -ge $job.Dur) { break }
        Run-FFMpeg -FFmpegArgs $segArgs -OutPath $outSeg -ExpectedDur 0
      }
    }
  }
}

$readme = @"
# 17 July Meetup - Studio Exports

Source: $Source
Processed: $(Get-Date -Format 'yyyy-MM-dd HH:mm')

## Folders
- 01_photos_compressed - all JPG polished + high-quality compress
- 02_portraits_selected - face-forward portrait edits for sharing
- 03_videos_compressed - CRF17 H.264 / AAC (near-lossless look)
- 04_videos_edited - color graded
- 05_videos_mastered - audio mastered (interview voice-forward / music balanced)
- 06_drive_ready/
  - Circle_Akademie
  - FlowTalk
  - Circle_D_Stage
  (segmented ~${SegmentMinutes} min parts for Drive upload)

## Upload tip
Prefer files in 06_drive_ready for Google Drive sharing.
"@
Set-Content -Path (Join-Path $OutRoot "README.md") -Value $readme -Encoding UTF8
Write-Log "DONE. Outputs: $OutRoot"
