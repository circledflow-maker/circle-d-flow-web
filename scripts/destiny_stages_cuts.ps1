# Destiny Hostel - Circle D Stages: categorize + cut on artist-change gaps + Drive export
# Detects quiet/applause gaps (silencedetect) as artist-change points on long stage takes.
param(
  [string]$Source = "F:\DCIM\106NZ502",
  [string]$OutRoot = "D:\Wakungo_Content_Studio\Destiny Hostel\31July\002",
  [double]$MinSetSeconds = 45,
  [double]$SilenceDb = -38,
  [double]$SilenceDur = 2.5,
  [switch]$SkipCompress
)

$ErrorActionPreference = "Continue"

$photoC = Join-Path $OutRoot "03_photos_compressed"
$stages = Join-Path $OutRoot "05_Format_Drafts\Circle_D_Stages"
$stagesFull = Join-Path $stages "00_full_takes"
$stagesCuts = Join-Path $stages "01_artist_cuts"
$stagesArtists = Join-Path $stages "02_Artists"
$stagesShorts = Join-Path $stages "03_Shorts_Moments"
$driveStages = Join-Path $OutRoot "06_drive_ready\Circle_D_Stages"
$driveArtists = Join-Path $driveStages "Artists"
$driveShorts = Join-Path $driveStages "Shorts"
$drivePhotos = Join-Path $OutRoot "06_drive_ready\Photos"
$logs = Join-Path $OutRoot "00_logs"
$vidM = Join-Path $OutRoot "05_videos_mastered"
$rawCache = Join-Path $OutRoot "01_raw_cache"
$vc = Join-Path $OutRoot "04_videos_compressed"
$vcFull = Join-Path $vc "Full_Takes"
$vcShorts = Join-Path $vc "Shorts"
$vcMast = Join-Path $vc "Mastered"
$vcArtists = Join-Path $vc "Artists"

@($photoC,$stages,$stagesFull,$stagesCuts,$stagesArtists,$stagesShorts,$driveStages,$driveArtists,$driveShorts,$drivePhotos,$logs,$vidM,$rawCache,$vc,$vcFull,$vcShorts,$vcMast,$vcArtists) | ForEach-Object {
  if (!(Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

$logFile = Join-Path $logs ("stages_cuts_{0:yyyyMMdd_HHmmss}.log" -f (Get-Date))
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
  if ((Get-Item $path).Length -lt 500KB) { return $false }
  $d = Get-Dur $path
  if ($d -le 0) { return $false }
  if ($exp -gt 2 -and $d -lt ($exp * 0.88)) { return $false }
  return $true
}

function Run-FF([string[]]$a) {
  & ffmpeg @a
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg exit $LASTEXITCODE" }
}

# Stages look: energy, mild shadow lift, music-balanced audio
$vf = "hqdn3d=1.6:1.2:2.8:2.2,eq=contrast=1.07:brightness=0.015:saturation=0.98:gamma=1.03,format=yuv420p"
$af = @(
  "highpass=f=50",
  "lowpass=f=16000",
  "afftdn=nf=-22:nt=w:tn=1:om=o",
  "equalizer=f=80:t=q:w=1:g=1.5",
  "equalizer=f=200:t=q:w=1:g=1.0",
  "equalizer=f=900:t=q:w=1:g=-0.8",
  "equalizer=f=2800:t=q:w=1:g=0.8",
  "equalizer=f=5500:t=q:w=1:g=-1.2",
  "acompressor=threshold=-18dB:ratio=1.9:attack=20:release=250:makeup=2.2:knee=7",
  "alimiter=limit=0.96:attack=6:release=55",
  "loudnorm=I=-14:TP=-1.5:LRA=10"
) -join ","

function Get-ArtistCutPoints([string]$path, [double]$dur) {
  # Returns sorted cut times (seconds) BETWEEN artists - silence/applause gaps
  $ends = @()
  $raw = & ffmpeg -hide_banner -i $path -af "silencedetect=noise=${SilenceDb}dB:d=$SilenceDur" -f null - 2>&1
  foreach ($line in $raw) {
    if ("$line" -match 'silence_end:\s*([0-9.]+)') {
      $t = [double]$Matches[1]
      if ($t -gt 15 -and $t -lt ($dur - 15)) { $ends += $t }
    }
  }
  # Merge cuts closer than 40s (same transition)
  $merged = @()
  foreach ($t in ($ends | Sort-Object)) {
    if ($merged.Count -eq 0 -or ($t - $merged[-1]) -ge 40) { $merged += $t }
  }
  return ,$merged
}

function Export-Segment([string]$src, [double]$start, [double]$len, [string]$outPath, [string]$preset) {
  if ((Test-Path $outPath) -and ((Get-Item $outPath).Length -gt 1MB)) {
    $od = Get-Dur $outPath
    if ($od -ge ($len * 0.88)) { return }
    Remove-Item $outPath -Force -EA SilentlyContinue
  }
  $fadeOut = [math]::Max(0, $len - 1.0)
  $vfSeg = if ($len -ge 90) {
    "eq=contrast=1.06:brightness=0.012:saturation=0.98:gamma=1.02,format=yuv420p,fade=t=in:st=0:d=0.35,fade=t=out:st=${fadeOut}:d=0.9"
  } else {
    "$vf,fade=t=in:st=0:d=0.35,fade=t=out:st=${fadeOut}:d=0.9"
  }
  $afSeg = if ($len -ge 90) {
    "highpass=f=55,afftdn=nf=-22:nt=w:tn=1:om=o,acompressor=threshold=-18dB:ratio=2:attack=20:release=240:makeup=2,alimiter=limit=0.96,loudnorm=I=-14:TP=-1.5:LRA=10"
  } else { $af }
  $pre = if ($len -ge 90) { "ultrafast" } else { $preset }
  Run-FF @(
    "-y","-hide_banner","-loglevel","error","-stats",
    "-ss",$start.ToString([Globalization.CultureInfo]::InvariantCulture),
    "-i",$src,
    "-t",$len.ToString([Globalization.CultureInfo]::InvariantCulture),
    "-vf",$vfSeg,
    "-af",$afSeg,
    "-c:v","libx264","-preset",$pre,"-crf","19","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","192k","-ar","48000",
    "-movflags","+faststart",
    $outPath
  )
}

function New-ArtistFolder([int]$num) {
  $name = "Artist_{0:D2}" -f $num
  $dir = Join-Path $stagesArtists $name
  $driveDir = Join-Path $driveArtists $name
  New-Item -ItemType Directory -Path $dir,$driveDir -Force | Out-Null
  # placeholder readme for later rename
  $note = Join-Path $dir "RENAME_ME.txt"
  if (-not (Test-Path $note)) {
    Set-Content $note ("Placeholder: rename this folder ({0}) to the real artist name when known." -f $name) -Encoding UTF8
  }
  return @{ Name = $name; Dir = $dir; Drive = $driveDir }
}

function Save-Performance([string]$srcFile, [string]$fileName, $artist, [bool]$isShort) {
  if ($isShort) {
    $dest = Join-Path $stagesShorts $fileName
    $driveDest = Join-Path $driveShorts $fileName
    $flat = Join-Path $stagesCuts $fileName
    $vcDest = Join-Path $vcShorts $fileName
  } else {
    $dest = Join-Path $artist.Dir $fileName
    $driveDest = Join-Path $artist.Drive $fileName
    $flat = Join-Path $stagesCuts $fileName
    $vcSub = Join-Path $vcArtists $artist.Name
    if (!(Test-Path $vcSub)) { New-Item -ItemType Directory -Path $vcSub -Force | Out-Null }
    $vcDest = Join-Path $vcSub $fileName
  }
  if ((Test-Path $srcFile) -and ((Get-Item $srcFile).Length -gt 500KB)) {
    foreach ($p in @($dest, $driveDest, $flat, $vcDest)) {
      try { Copy-Item $srcFile $p -Force -EA Stop } catch { Write-Log ("  copy WARN {0}: {1}" -f (Split-Path $p -Leaf), $_.Exception.Message) }
    }
  }
}

function Ensure-LocalSource([string]$srcPath, [string]$stem, [double]$dur) {
  # Long HEVC from SD is ~30x slower to decode; copy once to D: then encode locally
  if ($dur -lt 90) { return $srcPath }
  $cache = Join-Path $rawCache ("{0}_raw.mov" -f $stem)
  if ((Test-Path $cache) -and ((Get-Item $cache).Length -gt 5MB)) {
    $cd = Get-Dur $cache
    if ($cd -ge ($dur * 0.95)) { return $cache }
  }
  Write-Log ("  cache long take to D: ({0:N0}s, file copy)..." -f $dur)
  try {
    if (Test-Path $cache) { Remove-Item $cache -Force -EA SilentlyContinue }
    Copy-Item -LiteralPath $srcPath -Destination $cache -Force
    if ((Test-Path $cache) -and ((Get-Item $cache).Length -gt 5MB)) {
      Write-Log ("  cached OK ({0:N0} MB)" -f ((Get-Item $cache).Length / 1MB))
      return $cache
    }
  } catch {
    Write-Log ("  cache WARN: {0} (encode from SD)" -f $_.Exception.Message)
  }
  return $srcPath
}

Write-Log "Circle D Stages | Source=$Source | Out=$OutRoot"

if (-not (Test-Path $Source)) { throw "SD missing: $Source - keep F: connected" }

# Finish ALL photos from SD (complete card compress)
Write-Log "0) Compress ALL photos from SD..."
$photoVf = "hqdn3d=1.8:1.4:3.0:2.4,eq=contrast=1.04:brightness=0.01:saturation=1.04:gamma=1.02"
$jpgs = @(Get-ChildItem $Source -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg)$' } | Sort-Object Name)
$pi = 0
foreach ($jpg in $jpgs) {
  $pi++
  $outJpg = Join-Path $photoC ("{0}_compressed.jpg" -f $jpg.BaseName)
  if ((Test-Path $outJpg) -and ((Get-Item $outJpg).Length -gt 100KB)) { continue }
  Write-Log ("  photo {0}/{1} {2}" -f $pi, $jpgs.Count, $jpg.Name)
  try {
    Run-FF @("-y","-hide_banner","-loglevel","error","-i",$jpg.FullName,"-vf",$photoVf,"-q:v","2",$outJpg)
  } catch {
    Write-Log ("  photo WARN: {0}" -f $_.Exception.Message)
  }
}
Get-ChildItem $photoC -Filter *_compressed.jpg -File -EA SilentlyContinue | ForEach-Object {
  $d = Join-Path $drivePhotos $_.Name
  if (-not (Test-Path $d)) { Copy-Item $_.FullName $d -Force }
}
Write-Log ("  photos ready: {0}" -f @(Get-ChildItem $photoC -Filter *_compressed.jpg -File).Count)

$movs = @(Get-ChildItem $Source -File | Where-Object { $_.Extension -match '^\.(mov|mp4)$' } | Sort-Object Name)
Write-Log ("Videos to categorize as Circle D Stages: {0}" -f $movs.Count)

$n = 0
$cutIndex = 0
$artistIndex = 0
foreach ($mov in $movs) {
  $n++
  $dur = Get-Dur $mov.FullName
  $stem = $mov.BaseName
  $preset = if ($dur -ge 90) { "ultrafast" } else { "faster" }
  # Long takes: light grade + simple audio (heavy denoise/loudnorm only on artist cuts)
  $vfUse = if ($dur -ge 90) {
    "eq=contrast=1.06:brightness=0.012:saturation=0.98:gamma=1.02,format=yuv420p"
  } else { $vf }
  $afUse = if ($dur -ge 90) {
    "highpass=f=55,acompressor=threshold=-18dB:ratio=2:attack=20:release=240:makeup=2,alimiter=limit=0.96"
  } else { $af }
  Write-Log ("--- [{0}/{1}] {2} ({3:N0}s) ---" -f $n, $movs.Count, $mov.Name, $dur)

  $fullOut = Join-Path $stagesFull ("{0}_stages_full.mp4" -f $stem)
  $mastOut = Join-Path $vidM ("{0}_mastered.mp4" -f $stem)
  $encodeSrc = Ensure-LocalSource $mov.FullName $stem $dur

  # Full take master (unless exists)
  if (-not $SkipCompress) {
    if (-not (Test-Ok $fullOut $dur)) {
      if (Test-Path $fullOut) {
        $partial = Get-Dur $fullOut
        if ($partial -gt 0 -and $partial -lt ($dur * 0.90)) {
          Write-Log ("  remove incomplete full ({0:N0}s/{1:N0}s)" -f $partial, $dur)
          Remove-Item $fullOut -Force
        }
      }
      Write-Log ("  encode full Stages take (preset={0}, src={1})..." -f $preset, ($(if ($encodeSrc -like '*01_raw_cache*') { 'D-cache' } else { 'SD' })))
      $fadeOut = [math]::Max(0, $dur - 1.2)
      $vfilter = "$vfUse,fade=t=in:st=0:d=0.4,fade=t=out:st=${fadeOut}:d=1.0"
      try {
        $ffArgs = @(
          "-y","-hide_banner","-loglevel","error","-stats",
          "-fflags","+genpts+discardcorrupt","-err_detect","ignore_err","-max_error_rate","1.0"
        )
        if ($dur -ge 90) { $ffArgs += @("-hwaccel","d3d11va") }
        $ffArgs += @(
          "-i",$encodeSrc,
          "-map","0:v:0","-map","0:a:0?",
          "-vf",$vfilter,"-af",$afUse,
          "-c:v","libx264","-preset",$preset,"-crf","19","-pix_fmt","yuv420p",
          "-c:a","aac","-b:a","192k","-ar","48000",
          "-movflags","+faststart",
          $fullOut
        )
        Run-FF $ffArgs
      } catch {
        Write-Log ("  full WARN: {0}" -f $_.Exception.Message)
        if (-not (Test-Ok $fullOut ($dur * 0.5))) { continue }
      }
    } else { Write-Log "  full skip" }
    if ((Test-Ok $fullOut $dur) -and -not (Test-Ok $mastOut $dur)) {
      try { Copy-Item $fullOut $mastOut -Force } catch { Write-Log ("  mast copy WARN: {0}" -f $_.Exception.Message) }
    }
    # Always mirror compressed full take into 04_videos_compressed
    if (Test-Ok $fullOut 2) {
      try {
        Copy-Item $fullOut (Join-Path $vcFull (Split-Path $fullOut -Leaf)) -Force
        Copy-Item $fullOut (Join-Path $vcMast ("{0}_mastered.mp4" -f $stem)) -Force
      } catch { Write-Log ("  vc copy WARN: {0}" -f $_.Exception.Message) }
    }
  }

  $work = if (Test-Ok $fullOut 2) { $fullOut } elseif (Test-Ok $mastOut 2) { $mastOut } else { $encodeSrc }
  $workDur = Get-Dur $work
  if ($workDur -le 0) { $workDur = $dur }

  # Short clips: moments -> Shorts folder (not a full artist set)
  if ($workDur -lt ($MinSetSeconds * 2)) {
    $cutIndex++
    $label = "Stages_{0:D2}_{1}_share.mp4" -f $cutIndex, $stem
    $tmp = Join-Path $stagesCuts $label
    Write-Log ("  short moment -> Shorts/{0}" -f $label)
    if (-not (Test-Ok $tmp $workDur)) {
      if ($work -eq $mov.FullName) {
        Export-Segment $work 0 $workDur $tmp $preset
      } else {
        Copy-Item $work $tmp -Force
      }
    }
    Save-Performance $tmp $label $null $true
    continue
  }

  # Long stage takes: detect artist-change gaps -> Artist_XX folders
  Write-Log "  detect artist-change gaps (silence/applause)..."
  $cuts = @(Get-ArtistCutPoints $work $workDur)
  Write-Log ("  cut points: {0}" -f ($(if ($cuts.Count) { ($cuts | ForEach-Object { [math]::Round($_,1) }) -join ', ' } else { '(none - single set)' })))

  $bounds = @([double]0) + $cuts + @($workDur)
  $segNum = 0
  for ($i = 0; $i -lt ($bounds.Count - 1); $i++) {
    $start = $bounds[$i]
    $end = $bounds[$i + 1]
    $len = $end - $start
    if ($len -lt $MinSetSeconds) {
      Write-Log ("  skip tiny gap segment {0:N1}s" -f $len)
      continue
    }
    $segNum++
    $cutIndex++
    $artistIndex++
    $artist = New-ArtistFolder $artistIndex
    $label = "performance_{0}_from_{1}_set{2:D2}.mp4" -f $artist.Name, $stem, $segNum
    $tmp = Join-Path $artist.Dir ("_tmp_{0}" -f $label)
    $finalInArtist = Join-Path $artist.Dir $label
    Write-Log ("  ARTIST {0}: {1:N0}s-{2:N0}s ({3:N0}s) -> {4}/{5}" -f $artist.Name, $start, $end, $len, $artist.Name, $label)
    try {
      if (-not (Test-Ok $finalInArtist $len)) {
        Export-Segment $work $start $len $finalInArtist $(if ($len -ge 120) { "veryfast" } else { "faster" })
      }
      Save-Performance $finalInArtist $label $artist $false
      # also flat name in cuts for overview
      $flatLabel = "Stages_{0:D2}_{1}_set{2:D2}_share.mp4" -f $cutIndex, $stem, $segNum
      Copy-Item $finalInArtist (Join-Path $stagesCuts $flatLabel) -Force
    } catch {
      Write-Log ("  cut WARN: {0}" -f $_.Exception.Message)
    }
  }

  # If no valid sets produced, one Artist folder for whole take
  $produced = @(Get-ChildItem $stagesArtists -Recurse -Filter ("*from_{0}_*" -f $stem) -File -EA SilentlyContinue)
  if ($produced.Count -eq 0 -and (Test-Ok $work 2)) {
    $cutIndex++
    $artistIndex++
    $artist = New-ArtistFolder $artistIndex
    $label = "performance_{0}_from_{1}_full.mp4" -f $artist.Name, $stem
    $finalInArtist = Join-Path $artist.Dir $label
    Copy-Item $work $finalInArtist -Force
    Save-Performance $finalInArtist $label $artist $false
    Write-Log ("  fallback -> {0} (full take = 1 artist)" -f $artist.Name)
  }
}

$readme = @"
# Destiny Hostel 31 July - Circle D Stages

Source: $Source
Processed: $(Get-Date -Format 'yyyy-MM-dd HH:mm')
External drive: D:\ (VERBATIM HD)

## Category
**Circle D Stages** - live performances.
- Long takes split at artist-change gaps (silence/applause)
- Each performance in ``Artists/Artist_XX/`` (rename when you know names)
- Short clips in ``Shorts``

## Folders on D:
``05_Format_Drafts/Circle_D_Stages/``
- 00_full_takes - full mastered card takes
- 01_artist_cuts - flat overview of all shares
- 02_Artists/Artist_01..NN - one folder per performance (unnamed)
- 03_Shorts_Moments - brief clips

``06_drive_ready/Circle_D_Stages/`` - Google Drive (Artists + Shorts)
``06_drive_ready/Photos`` - compressed photos

## Tip
Rename ``Artist_01`` etc. to real names later. Keep SD inserted until DONE.
"@
Set-Content (Join-Path $OutRoot "README_STAGES.md") -Value $readme -Encoding UTF8
Write-Log ("DONE. Artists={0} Drive={1}" -f $artistIndex, $driveArtists)
New-Item -ItemType File -Path (Join-Path $logs "STAGES_COMPLETE.flag") -Force | Out-Null
Set-Content (Join-Path $logs "AGENT_LOOP_WAKE_destiny_stages.txt") ("READY $(Get-Date -Format o)`nartists=$artistIndex")
