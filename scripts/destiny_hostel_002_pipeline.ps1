# Destiny Hostel 31 July — compress 106NZ502 for edit/share/Drive
# Quality-preserving: H.264 CRF18, AAC 192k, +faststart; photos q=2 polish
param(
  [string]$Source = "F:\DCIM\106NZ502",
  [string]$OutRoot = "D:\Wakungo_Content_Studio\Destiny Hostel\31July\002"
)

$ErrorActionPreference = "Continue"

$rawV   = Join-Path $OutRoot "01_raw_video"
$rawP   = Join-Path $OutRoot "02_raw_photos"
$photoC = Join-Path $OutRoot "03_photos_compressed"
$vidC   = Join-Path $OutRoot "04_videos_compressed"
$vidM   = Join-Path $OutRoot "05_videos_mastered"
$drive  = Join-Path $OutRoot "06_drive_ready"
$logs   = Join-Path $OutRoot "00_logs"

@($rawV,$rawP,$photoC,$vidC,$vidM,$drive,$logs) | ForEach-Object {
  if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

$logFile = Join-Path $logs ("compress_{0:yyyyMMdd_HHmmss}.log" -f (Get-Date))
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

# Mild polish — no heavy look change (ready to edit)
$photoVf = "hqdn3d=1.8:1.4:3.0:2.4,eq=contrast=1.04:brightness=0.01:saturation=1.04:gamma=1.02"
$videoVf = "hqdn3d=1.6:1.2:2.8:2.2,eq=contrast=1.05:brightness=0.012:saturation=1.05:gamma=1.02,format=yuv420p"

# Balanced event audio (Stages/music default) — afftdn nf <= -20
$af = @(
  "highpass=f=55",
  "lowpass=f=15500",
  "afftdn=nf=-22:nt=w:tn=1:om=o",
  "equalizer=f=90:t=q:w=1:g=1.4",
  "equalizer=f=200:t=q:w=1:g=1.0",
  "equalizer=f=900:t=q:w=1:g=-1.0",
  "equalizer=f=2800:t=q:w=1.1:g=0.8",
  "equalizer=f=5500:t=q:w=1:g=-1.2",
  "acompressor=threshold=-18dB:ratio=2.0:attack=20:release=240:makeup=2.2:knee=7",
  "alimiter=limit=0.96:attack=6:release=55",
  "loudnorm=I=-14:TP=-1.5:LRA=10"
) -join ","

Write-Log "Source: $Source"
Write-Log "Out:    $OutRoot"

if (-not (Test-Path $Source)) { throw "Source missing: $Source" }

# Photos: copy small JPGs to raw + polish (videos encoded FROM SD — no 93GB raw copy)
Write-Log "1) Photos copy + compress/polish..."
$jpgs = @(Get-ChildItem $Source -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg)$' } | Sort-Object Name)
$movs = @(Get-ChildItem $Source -File | Where-Object { $_.Extension -match '^\.(mov|mp4)$' } | Sort-Object Name)
Write-Log ("   JPG={0} MOV={1} (videos encode direct from SD)" -f $jpgs.Count, $movs.Count)

$i = 0
foreach ($jpg in $jpgs) {
  $i++
  $rawDest = Join-Path $rawP $jpg.Name
  if (-not ((Test-Path $rawDest) -and ((Get-Item $rawDest).Length -eq $jpg.Length))) {
    Copy-Item $jpg.FullName $rawDest -Force
  }
  $out = Join-Path $photoC ("{0}_compressed.jpg" -f $jpg.BaseName)
  if ((Test-Path $out) -and ((Get-Item $out).Length -gt 100KB)) {
    Write-Log ("  skip photo {0}/{1}" -f $i, $jpgs.Count)
    continue
  }
  Write-Log ("  photo {0}/{1} {2}" -f $i, $jpgs.Count, $jpg.Name)
  try {
    Run-FF @("-y","-hide_banner","-loglevel","error","-i",$jpg.FullName,"-vf",$photoVf,"-q:v","2",$out)
  } catch {
    Write-Log ("  photo WARN: {0}" -f $_.Exception.Message)
  }
}

# Videos: single quality pass (CRF18 grade+audio) = compress + master + drive-ready
# Avoid double encode + huge raw copy (93GB HEVC on F:)
Write-Log ("2) Videos single-pass master from SD: {0}" -f $movs.Count)
$n = 0
foreach ($mov in $movs) {
  $n++
  $dur = Get-Dur $mov.FullName
  $stem = $mov.BaseName
  Write-Log ("--- [{0}/{1}] {2} ({3}s / {4:N0} MB) ---" -f $n, $movs.Count, $mov.Name, [math]::Round($dur,1), ($mov.Length/1MB))

  $comp = Join-Path $vidC ("{0}_compressed.mp4" -f $stem)
  $mast = Join-Path $vidM ("{0}_mastered.mp4" -f $stem)
  $share = Join-Path $drive ("{0}_share.mp4" -f $stem)
  $preset = if ($dur -ge 120) { "veryfast" } else { "faster" }
  $fadeOut = [math]::Max(0, $dur - 1.2)
  $vf = "$videoVf,fade=t=in:st=0:d=0.4,fade=t=out:st=${fadeOut}:d=1.0"

  # Mastered = primary deliverable (quality-preserving + light grade + audio)
  if (-not (Test-Ok $mast $dur)) {
    if (Test-Path $mast) { Remove-Item $mast -Force }
    Write-Log "  master CRF18 (grade+audio) from SD..."
    try {
      Run-FF @(
        "-y","-hide_banner","-loglevel","error","-stats",
        "-fflags","+genpts+discardcorrupt","-err_detect","ignore_err","-max_error_rate","1.0",
        "-i",$mov.FullName,
        "-map","0:v:0","-map","0:a:0?",
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

  # Compressed folder = same file link/copy for editors who look in 04_
  if ((Test-Ok $mast $dur) -and -not (Test-Ok $comp $dur)) {
    Write-Log "  compress folder = master copy"
    Copy-Item $mast $comp -Force
  }

  # Drive share
  if ((Test-Ok $mast $dur) -and (-not (Test-Path $share) -or (Get-Item $share).Length -lt 1MB)) {
    $mb = [math]::Round((Get-Item $mast).Length / 1MB, 1)
    if ($mb -le 900) {
      Write-Log "  drive share = master copy"
      Copy-Item $mast $share -Force
    } else {
      # Long takes: ~4min segments for Drive upload limits
      $segLen = 240
      $parts = [math]::Max(1, [math]::Ceiling($dur / $segLen))
      Write-Log ("  drive segments: {0} x ~4min" -f $parts)
      for ($p = 0; $p -lt $parts; $p++) {
        $start = $p * $segLen
        if (($start + 2) -ge $dur) { break }
        $label = if ($parts -eq 1) { "{0}_share.mp4" -f $stem } else { "{0}_part{1:00}_share.mp4" -f $stem, ($p + 1) }
        $outSeg = Join-Path $drive $label
        if ((Test-Path $outSeg) -and ((Get-Item $outSeg).Length -gt 1MB)) { continue }
        Run-FF @(
          "-y","-hide_banner","-loglevel","error",
          "-ss",$start.ToString([Globalization.CultureInfo]::InvariantCulture),
          "-i",$mast,
          "-t",$segLen.ToString([Globalization.CultureInfo]::InvariantCulture),
          "-c","copy","-movflags","+faststart",
          $outSeg
        )
      }
    }
  }
}

$readme = @"
# Destiny Hostel — 31 July — 002

Source: $Source
Processed: $(Get-Date -Format 'yyyy-MM-dd HH:mm')

## Folders
- 02_raw_photos — JPG originals from SD
- 03_photos_compressed — polished JPG (edit/share)
- 04_videos_compressed — same as mastered (editor path)
- 05_videos_mastered — H.264 CRF18 + light grade + audio master
- 06_drive_ready — Google Drive upload (long clips split ~4 min)

Videos encoded direct from SD (no full raw video copy — saves ~90GB).
Keep F:\DCIM\106NZ502 inserted until pipeline finishes.
"@
Set-Content -Path (Join-Path $OutRoot "README.md") -Value $readme -Encoding UTF8
Write-Log "DONE. Outputs: $OutRoot"
New-Item -ItemType File -Path (Join-Path $logs "PIPELINE_COMPLETE.flag") -Force | Out-Null
Set-Content (Join-Path $logs "AGENT_LOOP_WAKE_destiny_002.txt") ("READY $(Get-Date -Format o)")
