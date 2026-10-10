#Requires -Version 5.1
# Botanica 12s preview render - AUTHORIZED TEST ONLY
# Implements pipeline/reports/BOTANICA_TEST_RENDER_PLAN.md
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File pipeline\BOTANICA_TEST_RENDER_12S.ps1

$ErrorActionPreference = "Stop"

$Root = "D:\Wakungo_Content_Studio\Botanica"
$SrcDir = Join-Path $Root "DRIVE_UPLOAD\Wako Kungo"
$OutDir = Join-Path $Root "00_work\test_render"
$Candidates = @(
  "DSC_1552.MOV",
  "DSC_1568.MOV",
  "DSC_1580.MOV",
  "DSC_1590.MOV",
  "DSC_1598.MOV"
)

function Assert-Cmd([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw ("MISSING command on PATH: " + $name)
  }
}

function Get-Duration([string]$path) {
  $d = & ffprobe -v quiet -show_entries format=duration -of csv=p=0 -- $path 2>$null
  if (-not $d) { throw ("ffprobe failed for " + $path) }
  return [double]::Parse(([string]$d).Trim(), [System.Globalization.CultureInfo]::InvariantCulture)
}

function Get-MidBandIn([double]$dur, [double]$frac, [double]$length) {
  $usableStart = [Math]::Max(1.0, 0.12 * $dur)
  $usableEnd = [Math]::Max($usableStart + 3.0, 0.88 * $dur)
  $span = [Math]::Max(2.0, $usableEnd - $usableStart)
  $t0 = $usableStart + $span * $frac
  if (($t0 + $length) -gt ($dur - 0.15)) {
    $t0 = [Math]::Max($usableStart, $dur - 0.15 - $length)
  }
  if ($t0 -lt 0) { throw "Invalid in-point" }
  return [Math]::Round($t0, 3)
}

function Find-NearestDsc([string]$dir, [string]$wantedName) {
  $want = [int](($wantedName -replace '[^\d]', ''))
  $files = Get-ChildItem -Path $dir -Filter "DSC_*.MOV" -File -ErrorAction SilentlyContinue
  if (-not $files) { return $null }
  $best = $null
  $bestDelta = [int]::MaxValue
  foreach ($f in $files) {
    if ($f.Name -match 'DSC_(\d+)') {
      $n = [int]$Matches[1]
      $delta = [Math]::Abs($n - $want)
      if ($delta -lt $bestDelta) {
        $bestDelta = $delta
        $best = $f
      }
    }
  }
  return $best
}

function Inv([double]$n) {
  return $n.ToString([System.Globalization.CultureInfo]::InvariantCulture)
}

Write-Host "=== Botanica 12s TEST RENDER (authorized preview only) ==="
Write-Host ("Root: " + $Root)
Assert-Cmd ffmpeg
Assert-Cmd ffprobe

if (-not (Test-Path -LiteralPath $Root)) { throw ("PREFLIGHT FAIL: missing root " + $Root) }
if (-not (Test-Path -LiteralPath $SrcDir)) { throw ("PREFLIGHT FAIL: missing source dir " + $SrcDir) }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$testWrite = Join-Path $OutDir "_write_test.tmp"
Set-Content -Path $testWrite -Value "ok" -Encoding ASCII
Remove-Item -LiteralPath $testWrite -Force

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Out = Join-Path $OutDir ("BOTANICA_12s_PREVIEW_720x1280_" + $stamp + ".mp4")
if (Test-Path -LiteralPath $Out) { throw ("PREFLIGHT FAIL: output already exists " + $Out) }
$Work = Join-Path $OutDir ("parts_" + $stamp)
New-Item -ItemType Directory -Force -Path $Work | Out-Null

$Shots = @(
  @{ Name = "01_env";   File = $Candidates[0]; Len = 2.4; Frac = 0.20; Cw = 0.92; Ch = 0.58; Cx = 0.04; Cy = 0.04 },
  @{ Name = "02_med";   File = $Candidates[1]; Len = 2.4; Frac = 0.35; Cw = 0.78; Ch = 0.78; Cx = 0.11; Cy = 0.10 },
  @{ Name = "03_close"; File = $Candidates[2]; Len = 2.6; Frac = 0.50; Cw = 0.58; Ch = 0.58; Cx = 0.21; Cy = 0.14 },
  @{ Name = "04_trans"; File = $Candidates[3]; Len = 2.2; Frac = 0.55; Cw = 0.78; Ch = 0.78; Cx = 0.16; Cy = 0.10 },
  @{ Name = "05_wide";  File = $Candidates[4]; Len = 2.4; Frac = 0.70; Cw = 1.00; Ch = 1.00; Cx = 0.00; Cy = 0.00 }
)

$resolved = New-Object System.Collections.Generic.List[object]
Write-Host ""
Write-Host "--- Preflight sources ---"
foreach ($s in $Shots) {
  $path = Join-Path $SrcDir $s.File
  $usedName = $s.File
  if (-not (Test-Path -LiteralPath $path)) {
    $near = Find-NearestDsc $SrcDir $s.File
    if (-not $near) { throw ("PREFLIGHT FAIL: missing " + $s.File + " and no DSC_*.MOV in " + $SrcDir) }
    Write-Host ("SUBSTITUTE " + $s.File + " -> " + $near.Name)
    $path = $near.FullName
    $usedName = $near.Name
  }
  $dur = Get-Duration $path
  if ($dur -lt ($s.Len + 1.0)) { throw ("PREFLIGHT FAIL: " + $usedName + " duration too short") }
  $t0 = Get-MidBandIn $dur $s.Frac $s.Len
  if (($t0 + $s.Len) -gt ($dur - 0.05)) { throw ("PREFLIGHT FAIL: timecode out of range for " + $usedName) }
  Write-Host ("OK " + $usedName + " dur=" + (Inv $dur) + "s in=" + (Inv $t0) + " len=" + (Inv $s.Len))
  $resolved.Add([pscustomobject]@{
    Name = $s.Name
    Path = $path
    UsedName = $usedName
    Dur = $dur
    T0 = $t0
    Len = $s.Len
    Cw = $s.Cw
    Ch = $s.Ch
    Cx = $s.Cx
    Cy = $s.Cy
  }) | Out-Null
}

Write-Host ""
Write-Host "PREFLIGHT OK - starting lightweight 12s preview encode"
$renderStart = Get-Date
$partFiles = New-Object System.Collections.Generic.List[string]
$i = 0
foreach ($r in $resolved) {
  $i++
  $part = Join-Path $Work (("{0:D2}_{1}.mp4" -f $i, $r.Name))
  $vf = "crop=w=iw*" + (Inv $r.Cw) + ":h=ih*" + (Inv $r.Ch) + ":x=iw*" + (Inv $r.Cx) + ":y=ih*" + (Inv $r.Cy) + ",scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,eq=contrast=1.06:brightness=0.02:saturation=0.95,fps=30"
  Write-Host ("ffmpeg part " + $i + " : " + $r.UsedName)
  # Put -ss AFTER -i for accurate cuts on MOV edit-lists / sparse keyframes.
  $ffArgs = @(
    "-hide_banner", "-loglevel", "warning", "-y", "-threads", "2",
    "-i", $r.Path,
    "-ss", (Inv $r.T0),
    "-t", (Inv $r.Len),
    "-vf", $vf,
    "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    $part
  )
  & ffmpeg @ffArgs
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $part)) {
    throw ("RENDER FAIL: part " + $i)
  }
  $partFiles.Add($part) | Out-Null
}

$listPath = Join-Path $Work "list.txt"
$listLines = @()
foreach ($pf in $partFiles) {
  $listLines += ("file '" + [IO.Path]::GetFileName($pf) + "'")
}
Set-Content -Path $listPath -Value $listLines -Encoding ASCII

$audioSrc = $resolved[2]
$audioPath = Join-Path $Work "bed.m4a"
Write-Host ("ffmpeg audio bed from " + $audioSrc.UsedName)
$ffAudio = @(
  "-hide_banner", "-loglevel", "warning", "-y", "-threads", "2",
  "-i", $audioSrc.Path,
  "-ss", (Inv $audioSrc.T0),
  "-t", "12",
  "-vn",
  "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.4,afade=t=out:st=10.5:d=1.5",
  "-c:a", "aac", "-b:a", "160k",
  $audioPath
)
& ffmpeg @ffAudio
if ($LASTEXITCODE -ne 0) { throw "RENDER FAIL: audio bed" }

Write-Host ("ffmpeg concat + mux -> " + $Out)
Push-Location $Work
try {
  $ffMux = @(
    "-hide_banner", "-loglevel", "warning", "-y", "-threads", "2",
    "-f", "concat", "-safe", "0", "-i", "list.txt",
    "-i", $audioPath,
    "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
    "-t", "12",
    "-movflags", "+faststart",
    $Out
  )
  & ffmpeg @ffMux
} finally {
  Pop-Location
}
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $Out)) {
  throw "RENDER FAIL: final mux"
}

$renderEnd = Get-Date
$wallSec = [Math]::Round(($renderEnd - $renderStart).TotalSeconds, 1)

Write-Host ""
Write-Host "--- ffprobe validation ---"
$probeJson = & ffprobe -v quiet -print_format json -show_format -show_streams -- $Out
$probe = $probeJson | ConvertFrom-Json
$v = $probe.streams | Where-Object { $_.codec_type -eq "video" } | Select-Object -First 1
$a = $probe.streams | Where-Object { $_.codec_type -eq "audio" } | Select-Object -First 1
$durOut = [double]$probe.format.duration
$size = (Get-Item -LiteralPath $Out).Length
$fps = [string]$v.r_frame_rate
$audioLabel = "MISSING"
if ($a) { $audioLabel = [string]$a.codec_name }

$srcList = @()
foreach ($r in $resolved) {
  $srcList += @{
    file = $r.UsedName
    path = $r.Path
    in = $r.T0
    len = $r.Len
    source_duration = $r.Dur
  }
}

$result = [ordered]@{
  created_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  status = "ok"
  output = $Out
  wall_seconds = $wallSec
  file_bytes = $size
  duration = $durOut
  width = [int]$v.width
  height = [int]$v.height
  fps = $fps
  video_codec = [string]$v.codec_name
  audio_codec = $audioLabel
  has_audio = [bool]$a
  sources = $srcList
  notes = @(
    "720x1280 preview only",
    "No Drive / ARTISTS / EXPORT / full recap",
    "artist_id null"
  )
}

$reportJson = Join-Path $OutDir ("BOTANICA_12s_PREVIEW_RESULT_" + $stamp + ".json")
$reportMd = Join-Path $OutDir ("BOTANICA_12s_PREVIEW_RESULT_" + $stamp + ".md")
($result | ConvertTo-Json -Depth 6) | Set-Content -Path $reportJson -Encoding UTF8

$mdLines = @(
  "# Botanica 12s preview - RESULT",
  "",
  "- Status: ok",
  ("- Output: " + $Out),
  ("- Wall time: " + $wallSec + "s"),
  ("- Size: " + $size + " bytes"),
  ("- Duration: " + $durOut),
  ("- Resolution: " + $v.width + "x" + $v.height),
  ("- FPS: " + $fps),
  ("- Video: " + $v.codec_name),
  ("- Audio: " + $audioLabel),
  "",
  "STOP - no further render/upload."
)
$mdLines -join "`r`n" | Set-Content -Path $reportMd -Encoding UTF8

Write-Host ""
Write-Host "RESULT OK"
Write-Host ("OUT=" + $Out)
Write-Host ("BYTES=" + $size + " DUR=" + $durOut + " RES=" + $v.width + "x" + $v.height + " FPS=" + $fps + " V=" + $v.codec_name + " A=" + $audioLabel)
Write-Host ("WALL_SECONDS=" + $wallSec)
Write-Host ("REPORT=" + $reportMd)
Write-Host "STOP - authorized test complete. No upload / no further render."
