# After Finale_Baseck READY: stop old queue (wrong Manu_0325/0326 labels),
# then encode Guest (no name) + Manu_Allegro and social moments.
$ErrorActionPreference = 'Continue'
$logs = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003\00_logs'
$work = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003\00_work'
$queueScript = 'D:\circle-d-flow-web\scripts\destiny_0322_stages_queue.ps1'
$watchLog = Join-Path $logs 'auto_continue.log'
$doneFlag = Join-Path $logs 'AUTO_CONTINUE_DONE.flag'
$runningFlag = Join-Path $logs 'AUTO_CONTINUE_RUNNING.flag'

function Write-Log($m) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $m"
  Write-Host $line
  Add-Content $watchLog $line
}

if (Test-Path $doneFlag) {
  Write-Log 'Already done (AUTO_CONTINUE_DONE.flag) — exit'
  exit 0
}

'RUNNING' | Set-Content $runningFlag
Write-Log 'Watcher armed: wait for READY Finale_Baseck, then Guest+Manu+Socials'

$finaleFlag = Join-Path $logs 'Finale_Baseck_PACKAGE_READY.flag'
$queueLog = Join-Path $logs 'stages_queue.log'

while (-not (Test-Path $finaleFlag)) {
  if ((Test-Path $queueLog) -and (Select-String -Path $queueLog -Pattern 'READY Finale_Baseck' -Quiet)) {
    Write-Log 'saw READY Finale_Baseck in stages_queue.log'
    break
  }
  $body = Join-Path $work 'Finale_Baseck\body.mp4'
  $sz = if (Test-Path $body) { [math]::Round((Get-Item $body).Length / 1MB) } else { 0 }
  Write-Log "waiting Finale… body=${sz}MB"
  Start-Sleep -Seconds 90
}

# Brief settle so concat/9x16 can finish if log line appeared early
$deadline = (Get-Date).AddMinutes(90)
while (-not (Test-Path $finaleFlag) -and (Get-Date) -lt $deadline) {
  Write-Log 'Finale body done — waiting package flag…'
  Start-Sleep -Seconds 30
}

if (-not (Test-Path $finaleFlag)) {
  Write-Log 'WARN: no PACKAGE_READY flag yet — continuing carefully after READY log'
}

Write-Log 'Stop old stages_queue + any wrong Manu_0325/0326 encodes'
Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and (
    $_.CommandLine -match 'destiny_0322_stages_queue\.ps1' -and
    $_.CommandLine -notmatch 'GuestManuOnly|SocialOnly|auto_continue'
  )
} | ForEach-Object {
  Write-Log "kill old queue PID $($_.ProcessId)"
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

Get-CimInstance Win32_Process -Filter "Name='ffmpeg.exe'" | Where-Object {
  $_.CommandLine -match 'Manu_0325|Manu_0326'
} | ForEach-Object {
  Write-Log "kill wrong ffmpeg PID $($_.ProcessId)"
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 3

# Remove wrong-label partials / flags so correct Guest+Manu can run
foreach ($bad in @('Manu_0325', 'Manu_0326')) {
  $bf = Join-Path $logs "${bad}_PACKAGE_READY.flag"
  if (Test-Path $bf) {
    Remove-Item $bf -Force
    Write-Log "removed wrong flag $bad"
  }
  $bw = Join-Path $work $bad
  if (Test-Path $bw) {
    Remove-Item $bw -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "cleared wrong work $bad"
  }
}

Write-Log 'START GuestManuOnly (Guest Special Performance + Manu Allegro)'
& powershell -NoProfile -ExecutionPolicy Bypass -File $queueScript -GuestManuOnly
$gmExit = $LASTEXITCODE
Write-Log "GuestManuOnly exit=$gmExit"

Write-Log 'START SocialOnly'
& powershell -NoProfile -ExecutionPolicy Bypass -File $queueScript -SocialOnly
$soExit = $LASTEXITCODE
Write-Log "SocialOnly exit=$soExit"

'COMPLETE' | Set-Content (Join-Path $logs 'STAGES_QUEUE_COMPLETE.flag')
'COMPLETE' | Set-Content $doneFlag
Remove-Item $runningFlag -Force -ErrorAction SilentlyContinue
Write-Log 'AUTO CONTINUE COMPLETE'
Write-Host 'AGENT_LOOP_WAKE_finale_continue {"prompt":"Finale done — Guest/Manu/Socials finished; report status"}'
exit 0
