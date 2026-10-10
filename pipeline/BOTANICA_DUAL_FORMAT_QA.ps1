#Requires -Version 5.1
# QA-only for already-rendered Botanica dual-format 12s previews (no re-encode).
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File pipeline\BOTANICA_DUAL_FORMAT_QA.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File pipeline\BOTANICA_DUAL_FORMAT_QA.ps1 -Stamp 20261010_215349

param(
  [string]$Stamp = "20261010_215349"
)

$ErrorActionPreference = "Stop"

$OutDir = "D:\Wakungo_Content_Studio\Botanica\00_work\test_render"
$Out16 = Join-Path $OutDir ("BOTANICA_12s_YT16x9_1280x720_" + $Stamp + ".mp4")
$Out9 = Join-Path $OutDir ("BOTANICA_12s_SOCIAL9x16_720x1280_" + $Stamp + ".mp4")
$Preserve = Join-Path $OutDir "BOTANICA_12s_PREVIEW_720x1280_20261010_213305.mp4"

function Test-Blackish([string]$path) {
  $tmp = [IO.Path]::GetTempFileName()
  $outNull = [IO.Path]::GetTempFileName()
  try {
    $args = @(
      "-hide_banner", "-v", "info", "-ss", "0.3", "-i", $path,
      "-frames:v", "6", "-vf", "blackframe=amount=98:threshold=24",
      "-f", "null", "-"
    )
    $p = Start-Process -FilePath "ffmpeg" -ArgumentList $args -NoNewWindow -Wait -PassThru `
      -RedirectStandardError $tmp -RedirectStandardOutput $outNull
    $r = ""
    if (Test-Path -LiteralPath $tmp) { $r = [IO.File]::ReadAllText($tmp) }
    if ($p.ExitCode -ne 0 -and -not $r) { return $false }
  } catch {
    return $false
  } finally {
    Remove-Item -LiteralPath $tmp,$outNull -Force -ErrorAction SilentlyContinue
  }
  $hits = ([regex]::Matches($r, "pblack:9[0-9]")).Count + ([regex]::Matches($r, "pblack:100")).Count
  return ($hits -ge 5)
}

function Probe-Out([string]$path, [int]$expectW, [int]$expectH) {
  if (-not (Test-Path -LiteralPath $path)) { throw ("MISSING: " + $path) }
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
  $aDur = $null
  if ($a -and $a.duration) { $aDur = [double]$a.duration }
  elseif ($a) {
    # fall back to format duration when stream duration omitted
    $aDur = $dur
  }
  if ($aDur -and ($aDur -lt 11.5)) { $ok = $false; $notes.Add("audio truncated: " + $aDur) | Out-Null }
  if (Test-Blackish $path) { $notes.Add("WARN possible black frames") | Out-Null }
  return [pscustomobject]@{
    path = $path; ok = $ok; duration = $dur; width = [int]$v.width; height = [int]$v.height
    fps = [string]$v.r_frame_rate; video = [string]$v.codec_name
    audio = $(if ($a) { [string]$a.codec_name } else { "none" })
    audio_duration = $aDur
    bytes = $size; notes = ($notes -join "; ")
  }
}

Write-Host "=== Botanica dual-format QA (no re-encode) ==="
Write-Host ("Stamp: " + $Stamp)
$qa16 = Probe-Out $Out16 1280 720
$qa9 = Probe-Out $Out9 720 1280
$preserveStill = Test-Path -LiteralPath $Preserve

$result = [ordered]@{
  created_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  stamp = $Stamp
  status = $(if ($qa16.ok -and $qa9.ok) { "ok" } else { "qa_flags" })
  preserve_213305 = $preserveStill
  youtube_16x9 = $qa16
  social_9x16 = $qa9
}

$reportJson = Join-Path $OutDir ("BOTANICA_DUAL_FORMAT_RESULT_" + $Stamp + ".json")
$reportMd = Join-Path $OutDir ("BOTANICA_DUAL_FORMAT_RESULT_" + $Stamp + ".md")
($result | ConvertTo-Json -Depth 8) | Set-Content -Path $reportJson -Encoding UTF8

$md = @(
  "# Botanica dual-format 12s - RESULT (QA)",
  "",
  ("- Status: " + $result.status),
  ("- Stamp: " + $Stamp),
  ("- Preserve 213305: " + $preserveStill),
  "",
  "## YouTube 16:9",
  ("- Path: " + $qa16.path),
  ("- OK: " + $qa16.ok),
  ("- Dur/Res/FPS: " + $qa16.duration + " / " + $qa16.width + "x" + $qa16.height + " / " + $qa16.fps),
  ("- Codecs: " + $qa16.video + " + " + $qa16.audio + " (a_dur=" + $qa16.audio_duration + ")"),
  ("- Bytes: " + $qa16.bytes),
  ("- Notes: " + $qa16.notes),
  "",
  "## Social 9:16",
  ("- Path: " + $qa9.path),
  ("- OK: " + $qa9.ok),
  ("- Dur/Res/FPS: " + $qa9.duration + " / " + $qa9.width + "x" + $qa9.height + " / " + $qa9.fps),
  ("- Codecs: " + $qa9.video + " + " + $qa9.audio + " (a_dur=" + $qa9.audio_duration + ")"),
  ("- Bytes: " + $qa9.bytes),
  ("- Notes: " + $qa9.notes),
  "",
  "STOP - no full recap / no upload."
)
$md -join "`r`n" | Set-Content -Path $reportMd -Encoding UTF8

Write-Host ""
Write-Host "RESULT"
Write-Host ("YT16=" + $Out16)
Write-Host ("YT_OK=" + $qa16.ok + " DUR=" + $qa16.duration + " RES=" + $qa16.width + "x" + $qa16.height + " BYTES=" + $qa16.bytes + " A_DUR=" + $qa16.audio_duration)
Write-Host ("SOCIAL9=" + $Out9)
Write-Host ("SOCIAL_OK=" + $qa9.ok + " DUR=" + $qa9.duration + " RES=" + $qa9.width + "x" + $qa9.height + " BYTES=" + $qa9.bytes + " A_DUR=" + $qa9.audio_duration)
Write-Host ("PRESERVE_213305=" + $preserveStill)
Write-Host ("REPORT=" + $reportMd)
Write-Host "STOP - QA complete. No re-encode. No full recap."

if (-not ($qa16.ok -and $qa9.ok)) { exit 2 }
exit 0
