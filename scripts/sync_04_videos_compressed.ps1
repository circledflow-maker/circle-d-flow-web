# Sync completed encodes into 04_videos_compressed while face job runs (old process lacks VC paths)
$root = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\002'
$vc = Join-Path $root '04_videos_compressed'
$log = Join-Path $root '00_logs\sync_04_videos.log'
function L($m) { $l = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $m; Add-Content $log $l; Write-Host $l }

L 'sync_04 watcher start'
while ($true) {
  $maps = @(
    @{ Src = Join-Path $root '05_Format_Drafts\Circle_D_Stages\00_full_takes'; Dst = Join-Path $vc 'Full_Takes'; Recurse = $false },
    @{ Src = Join-Path $root '05_Format_Drafts\Circle_D_Stages\03_Shorts_Moments'; Dst = Join-Path $vc 'Shorts'; Recurse = $false },
    @{ Src = Join-Path $root '05_videos_mastered'; Dst = Join-Path $vc 'Mastered'; Recurse = $false },
    @{ Src = Join-Path $root '05_Format_Drafts\Circle_D_Stages\04_Social_16x9'; Dst = Join-Path $vc 'Social_16x9'; Recurse = $false },
    @{ Src = Join-Path $root '05_Format_Drafts\Circle_D_Stages\05_Social_9x16'; Dst = Join-Path $vc 'Social_9x16'; Recurse = $false }
  )
  $copied = 0
  foreach ($m in $maps) {
    if (-not (Test-Path $m.Src)) { continue }
    if (-not (Test-Path $m.Dst)) { New-Item -ItemType Directory -Path $m.Dst -Force | Out-Null }
    Get-ChildItem $m.Src -File -Filter *.mp4 -EA SilentlyContinue | ForEach-Object {
      if ($_.Length -lt 5MB) { return }
      $dest = Join-Path $m.Dst $_.Name
      if (-not (Test-Path $dest) -or ((Get-Item $dest).Length + 1MB) -lt $_.Length) {
        try { Copy-Item $_.FullName $dest -Force; $copied++ } catch {}
      }
    }
  }
  # Artists tree
  $artSrc = Join-Path $root '05_Format_Drafts\Circle_D_Stages\02_Artists'
  $artDst = Join-Path $vc 'Artists'
  if (Test-Path $artSrc) {
    Get-ChildItem $artSrc -Directory -EA SilentlyContinue | ForEach-Object {
      $sub = Join-Path $artDst $_.Name
      if (-not (Test-Path $sub)) { New-Item -ItemType Directory -Path $sub -Force | Out-Null }
      Get-ChildItem $_.FullName -File -Filter *.mp4 -EA SilentlyContinue | ForEach-Object {
        if ($_.Length -lt 5MB) { return }
        $dest = Join-Path $sub $_.Name
        if (-not (Test-Path $dest) -or ((Get-Item $dest).Length + 1MB) -lt $_.Length) {
          try { Copy-Item $_.FullName $dest -Force; $copied++ } catch {}
        }
      }
    }
  }
  if ($copied -gt 0) { L "synced $copied file(s) into 04_videos_compressed" }
  # stop when face complete AND no ffmpeg for destiny
  $done = Test-Path (Join-Path $root '00_logs\DSC0324_FACE_COMPLETE.flag')
  $ff = @(Get-CimInstance Win32_Process -Filter "Name='ffmpeg.exe'" | Where-Object { $_.CommandLine -match 'Destiny Hostel|DSC_0324|106NZ502' })
  $face = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'destiny_0324_face_assign' })
  if ($done -and $ff.Count -eq 0 -and $face.Count -eq 0) {
    L 'face pipeline complete — final sync then exit'
    break
  }
  Start-Sleep -Seconds 120
}
L 'sync_04 watcher exit'
