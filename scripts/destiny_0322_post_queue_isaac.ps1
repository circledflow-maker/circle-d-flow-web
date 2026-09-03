# After AUTO_CONTINUE_DONE: run Isaac group fix (trim 1:20 + multi credit)
$ErrorActionPreference = 'Continue'
$logs = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003\00_logs'
$done = Join-Path $logs 'AUTO_CONTINUE_DONE.flag'
$queueDone = Join-Path $logs 'STAGES_QUEUE_COMPLETE.flag'
$fixDone = Join-Path $logs 'ISAAC_GROUP_FIX_DONE.flag'
$watchLog = Join-Path $logs 'post_queue_isaac.log'
$fixScript = 'D:\circle-d-flow-web\scripts\destiny_0322_fix_isaac_group.ps1'

function Write-Log($m) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $m"
  Write-Host $line
  Add-Content $watchLog $line
}

if (Test-Path $fixDone) {
  Write-Log 'Isaac fix already done — exit'
  exit 0
}

Write-Log 'Waiting for Guest/Manu/Socials (AUTO_CONTINUE_DONE)…'
while (-not ((Test-Path $done) -or (Test-Path $queueDone))) {
  Start-Sleep -Seconds 60
  Write-Log 'still waiting for queue complete…'
}

Write-Log 'Queue complete — starting Isaac group fix'
& powershell -NoProfile -ExecutionPolicy Bypass -File $fixScript
$ex = $LASTEXITCODE
Write-Log "fix script exit=$ex"
if ($ex -eq 0) {
  'COMPLETE' | Set-Content $fixDone
  Write-Log 'ISAAC GROUP FIX COMPLETE'
}
Write-Host 'AGENT_LOOP_WAKE_isaac_fix {"prompt":"Post-queue Isaac fix finished; report status"}'
exit $ex
