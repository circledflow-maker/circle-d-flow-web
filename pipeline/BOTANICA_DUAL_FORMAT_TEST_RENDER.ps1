#Requires -Version 5.1
# Botanica dual-format 12s preview - AUTHORIZED TEST ONLY
# 16:9 1280x720 + 9:16 720x1280; audio from DSC_1598; no -shortest
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File pipeline\BOTANICA_DUAL_FORMAT_TEST_RENDER.ps1

$ErrorActionPreference = "Stop"

$Root = "D:\Wakungo_Content_Studio\Botanica"
$SrcDir = Join-Path $Root "DRIVE_UPLOAD\Wako Kungo"
$OutDir = Join-Path $Root "00_work\test_render"
$PreservePreview = "BOTANICA_12s_PREVIEW_720x1280_20261010_213305.mp4"

$Shots = @(
  @{ File = "DSC_1552.MOV"; Ss = 1.53;   Len = 2.4; Cw = 0.92; Ch = 0.58; Cx = 0.04; Cy = 0.04 },
  @{ File = "DSC_1568.MOV"; Ss = 5.28;   Len = 2.4; Cw = 0.78; Ch = 0.78; Cx = 0.11; Cy = 0.10 },
  @{ File = "DSC_1580.MOV"; Ss = 6.18;   Len = 2.6; Cw = 0.58; Ch = 0.58; Cx = 0.21; Cy = 0.14 },
  @{ File = "DSC_1590.MOV"; Ss = 28.536; Len = 2.2; Cw = 0.78; Ch = 0.78; Cx = 0.16; Cy = 0.10 },
  @{ File = "DSC_1598.MOV"; Ss = 122.524; Len = 2.4; Cw = 1.00; Ch = 1.00; Cx = 0.00; Cy = 0.00 }
)

$AudioFile = "DSC_1598.MOV"
$AudioSs = 40.0
$AudioLen = 12.0

function Inv([double]$n) {
  return $n.ToString([System.Globalization.CultureInfo]::InvariantCulture)
}

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

function Test-Blackish([string]$path) {
  # Sample a few frames; best-effort warning only.
  # PS 5.1 + ErrorActionPreference=Stop treats ffmpeg stderr as terminating NativeCommandError.
  $tmp = [IO.Path]::GetTempFileName()
  try {
    $args = @(
      "-hide_banner", "-v", "info", "-ss", "0.3", "-i", $path,
      "-frames:v", "6", "-vf", "blackframe=amount=98:threshold=24",
      "-f", "null", "-"
    )
    $p = Start-Process -FilePath "ffmpeg" -ArgumentList $args -NoNewWindow -Wait -PassThru `
      -RedirectStandardError $tmp -RedirectStandardOutput ([IO.Path]::GetTempFileName())
    $r = ""
    if (Test-Path -LiteralPath $tmp) {
      $r = [IO.File]::ReadAllText($tmp)
    }
    if ($p.ExitCode -ne 0 -and -not $r) { return $false }
  } catch {
    return $false
  } finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
  }
  $hits = ([regex]::Matches($r, "pblack:9[0-9]")).Count + ([regex]::Matches($r, "pblack:100")).Count
  return ($hits -ge 5)
}

Write-Host "=== Botanica DUAL-FORMAT 12s TEST (authorized) ==="
Write-Host ("Root: " + $Root)
Assert-Cmd ffmpeg
Assert-Cmd ffprobe

if (-not (Test-Path -LiteralPath $Root)) { throw ("PREFLIGHT FAIL: missing root " + $Root) }
if (-not (Test-Path -LiteralPath $SrcDir)) { throw ("PREFLIGHT FAIL: missing " + $SrcDir) }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$preservePath = Join-Path $OutDir $PreservePreview
if (Test-Path -LiteralPath $preservePath) {
  Write-Host ("PRESERVE ok: " + $PreservePreview)
} else {
  Write-Host ("WARN: prior preview not found (ok to continue): " + $PreservePreview)
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Out16 = Join-Path $OutDir ("BOTANICA_12s_YT16x9_1280x720_" + $stamp + ".mp4")
$Out9 = Join-Path $OutDir ("BOTANICA_12s_SOCIAL9x16_720x1280_" + $stamp + ".mp4")
foreach ($o in @($Out16, $Out9)) {
  if (Test-Path -LiteralPath $o) { throw ("PREFLIGHT FAIL: output exists " + $o) }
}

Write-Host ""
Write-Host "--- Preflight picture sources ---"
$resolved = New-Object System.Collections.Generic.List[object]
foreach ($s in $Shots) {
  $path = Join-Path $SrcDir $s.File
  if (-not (Test-Path -LiteralPath $path)) { throw ("PREFLIGHT FAIL: missing " + $path) }
  $dur = Get-Duration $path
  if (($s.Ss + $s.Len) -gt ($dur - 0.05)) {
    throw ("PREFLIGHT FAIL: timecode OOB " + $s.File + " dur=" + (Inv $dur))
  }
  Write-Host ("OK " + $s.File + " dur=" + (Inv $dur) + " in=" + (Inv $s.Ss) + " len=" + (Inv $s.Len))
  $resolved.Add([pscustomobject]@{
    File = $s.File; Path = $path; Dur = $dur; Ss = $s.Ss; Len = $s.Len
    Cw = $s.Cw; Ch = $s.Ch; Cx = $s.Cx; Cy = $s.Cy
  }) | Out-Null
}

$audioPath = Join-Path $SrcDir $AudioFile
if (-not (Test-Path -LiteralPath $audioPath)) { throw ("PREFLIGHT FAIL: missing audio " + $audioPath) }
$audioDur = Get-Duration $audioPath
$audioRemain = $audioDur - $AudioSs
if ($audioRemain -lt $AudioLen) {
  throw ("PREFLIGHT FAIL: audio remainder " + (Inv $audioRemain) + "s < 12s (ss=" + (Inv $AudioSs) + " dur=" + (Inv $audioDur) + ")")
}
Write-Host ("OK audio " + $AudioFile + " remain=" + (Inv $audioRemain) + "s after ss=" + (Inv $AudioSs))

Write-Host ""
Write-Host "PREFLIGHT OK - encoding both formats"

$wallStart = Get-Date
$Bed = Join-Path $OutDir ("bed_12s_" + $stamp + ".m4a")
Write-Host "ffmpeg audio bed"
$ffBed = @(
  "-hide_banner", "-loglevel", "warning", "-y", "-threads", "2",
  "-i", $audioPath,
  "-ss", (Inv $AudioSs),
  "-t", (Inv $AudioLen),
  "-vn",
  "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.4,afade=t=out:st=10.5:d=1.5",
  "-c:a", "aac", "-b:a", "160k",
  $Bed
)
& ffmpeg @ffBed
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $Bed)) { throw "RENDER FAIL: audio bed" }
$bedDur = Get-Duration $Bed
if ($bedDur -lt 11.5) { throw ("RENDER FAIL: audio bed too short " + (Inv $bedDur)) }
Write-Host ("audio bed duration=" + (Inv $bedDur))

function Render-Format {
  param(
    [string]$Label,
    [string]$Work,
    [string]$OutFile,
    [string]$Mode  # "16x9" or "9x16"
  )
  New-Item -ItemType Directory -Force -Path $Work | Out-Null
  $i = 0
  $parts = New-Object System.Collections.Generic.List[string]
  foreach ($r in $resolved) {
    $i++
    $part = Join-Path $Work (("{0:D2}.mp4" -f $i))
    if ($Mode -eq "16x9") {
      $vf = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,eq=contrast=1.06:brightness=0.02:saturation=0.95,fps=30"
    } else {
      $vf = "crop=w=iw*" + (Inv $r.Cw) + ":h=ih*" + (Inv $r.Ch) + ":x=iw*" + (Inv $r.Cx) + ":y=ih*" + (Inv $r.Cy) + ",scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,eq=contrast=1.06:brightness=0.02:saturation=0.95,fps=30"
    }
    Write-Host ("ffmpeg " + $Label + " part " + $i + " : " + $r.File)
    $ff = @(
      "-hide_banner", "-loglevel", "warning", "-y", "-threads", "2",
      "-i", $r.Path,
      "-ss", (Inv $r.Ss),
      "-t", (Inv $r.Len),
      "-vf", $vf,
      "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
      $part
    )
    & ffmpeg @ff
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $part)) {
      throw ("RENDER FAIL: " + $Label + " part " + $i)
    }
    $parts.Add($part) | Out-Null
  }

  $listPath = Join-Path $Work "list.txt"
  $lines = @()
  foreach ($p in $parts) { $lines += ("file '" + [IO.Path]::GetFileName($p) + "'") }
  Set-Content -Path $listPath -Value $lines -Encoding ASCII

  Write-Host ("ffmpeg " + $Label + " concat+mux -> " + $OutFile)
  Push-Location $Work
  try {
    $ffMux = @(
      "-hide_banner", "-loglevel", "warning", "-y", "-threads", "2",
      "-f", "concat", "-safe", "0", "-i", "list.txt",
      "-i", $Bed,
      "-c:v", "copy",
      "-c:a", "aac", "-b:a", "160k",
      "-t", "12",
      "-fflags", "+genpts",
      "-avoid_negative_ts", "make_zero",
      "-movflags", "+faststart",
      $OutFile
    )
    & ffmpeg @ffMux
  } finally {
    Pop-Location
  }
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $OutFile)) {
    throw ("RENDER FAIL: " + $Label + " mux")
  }
}

$t16 = Get-Date
Render-Format -Label "16x9" -Work (Join-Path $OutDir ("parts_16x9_" + $stamp)) -OutFile $Out16 -Mode "16x9"
$sec16 = [Math]::Round(((Get-Date) - $t16).TotalSeconds, 1)

$t9 = Get-Date
Render-Format -Label "9x16" -Work (Join-Path $OutDir ("parts_9x16_" + $stamp)) -OutFile $Out9 -Mode "9x16"
$sec9 = [Math]::Round(((Get-Date) - $t9).TotalSeconds, 1)

$wallTotal = [Math]::Round(((Get-Date) - $wallStart).TotalSeconds, 1)

function Probe-Out([string]$path, [int]$expectW, [int]$expectH) {
  $probeJson = & ffprobe -v quiet -print_format json -show_format -show_streams -- $path
  $probe = $probeJson | ConvertFrom-Json
  $v = $probe.streams | Where-Object { $_.codec_type -eq "video" } | Select-Object -First 1
  $a = $probe.streams | Where-Object { $_.codec_type -eq "audio" } | Select-Object -First 1
  $dur = [double]$probe.format.duration
  $size = (Get-Item -LiteralPath $path).Length
  $ok = $true
  $notes = New-Object System.Collections.Generic.List[string]
  if ($dur -lt 11.5 -or $dur -gt 12.5) { $ok = $false; $notes.Add("duration out of range: " + $dur) | Out-Null }
  if ([int]$v.width -ne $expectW -or [int]$v.height -ne $expectH) { $ok = $false; $notes.Add("resolution mismatch") | Out-Null }
  if ([string]$v.codec_name -ne "h264") { $ok = $false; $notes.Add("video codec not h264") | Out-Null }
  if (-not $a -or [string]$a.codec_name -ne "aac") { $ok = $false; $notes.Add("audio missing or not aac") | Out-Null }
  if (Test-Blackish $path) { $notes.Add("WARN possible black frames") | Out-Null }
  return [pscustomobject]@{
    path = $path; ok = $ok; duration = $dur; width = [int]$v.width; height = [int]$v.height
    fps = [string]$v.r_frame_rate; video = [string]$v.codec_name
    audio = $(if ($a) { [string]$a.codec_name } else { "none" })
    bytes = $size; notes = $notes
  }
}

Write-Host ""
Write-Host "--- QA ffprobe ---"
$qa16 = Probe-Out $Out16 1280 720
$qa9 = Probe-Out $Out9 720 1280

# Preserve check
$preserveStill = Test-Path -LiteralPath $preservePath

$result = [ordered]@{
  created_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  status = $(if ($qa16.ok -and $qa9.ok) { "ok" } else { "ok_with_qa_flags" })
  wall_seconds_total = $wallTotal
  wall_seconds_16x9 = $sec16
  wall_seconds_9x16 = $sec9
  audio_bed = $Bed
  audio_source = $audioPath
  audio_ss = $AudioSs
  preserve_213305 = $preserveStill
  youtube_16x9 = $qa16
  social_9x16 = $qa9
}

$reportJson = Join-Path $OutDir ("BOTANICA_DUAL_FORMAT_RESULT_" + $stamp + ".json")
$reportMd = Join-Path $OutDir ("BOTANICA_DUAL_FORMAT_RESULT_" + $stamp + ".md")
($result | ConvertTo-Json -Depth 8) | Set-Content -Path $reportJson -Encoding UTF8

$md = @(
  "# Botanica dual-format 12s - RESULT",
  "",
  ("- Status: " + $result.status),
  ("- Wall total: " + $wallTotal + "s (16x9=" + $sec16 + "s, 9x16=" + $sec9 + "s)"),
  ("- Preserve 213305: " + $preserveStill),
  "",
  "## YouTube 16:9",
  ("- Path: " + $qa16.path),
  ("- OK: " + $qa16.ok),
  ("- Dur/Res/FPS: " + $qa16.duration + " / " + $qa16.width + "x" + $qa16.height + " / " + $qa16.fps),
  ("- Codecs: " + $qa16.video + " + " + $qa16.audio),
  ("- Bytes: " + $qa16.bytes),
  "",
  "## Social 9:16",
  ("- Path: " + $qa9.path),
  ("- OK: " + $qa9.ok),
  ("- Dur/Res/FPS: " + $qa9.duration + " / " + $qa9.width + "x" + $qa9.height + " / " + $qa9.fps),
  ("- Codecs: " + $qa9.video + " + " + $qa9.audio),
  ("- Bytes: " + $qa9.bytes),
  "",
  "STOP - no full recap / no upload."
)
$md -join "`r`n" | Set-Content -Path $reportMd -Encoding UTF8

Write-Host ""
Write-Host "RESULT"
Write-Host ("YT16=" + $Out16)
Write-Host ("YT_OK=" + $qa16.ok + " DUR=" + $qa16.duration + " RES=" + $qa16.width + "x" + $qa16.height + " BYTES=" + $qa16.bytes + " WALL=" + $sec16)
Write-Host ("SOCIAL9=" + $Out9)
Write-Host ("SOCIAL_OK=" + $qa9.ok + " DUR=" + $qa9.duration + " RES=" + $qa9.width + "x" + $qa9.height + " BYTES=" + $qa9.bytes + " WALL=" + $sec9)
Write-Host ("PRESERVE_213305=" + $preserveStill)
Write-Host ("REPORT=" + $reportMd)
Write-Host "STOP - dual-format authorized test complete. No full recap."

if (-not ($qa16.ok -and $qa9.ok)) { exit 2 }
exit 0
