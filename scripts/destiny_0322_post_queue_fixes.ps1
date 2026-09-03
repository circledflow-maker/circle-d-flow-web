# Run Finale then Isaac fixes (after main queue)
$ErrorActionPreference = 'Continue'
$logs = 'D:\Wakungo_Content_Studio\Destiny Hostel\31July\003\00_logs'
$watchLog = Join-Path $logs 'post_queue_fixes.log'
$finaleScript = 'D:\circle-d-flow-web\scripts\destiny_0322_fix_finale_baseck.ps1'
$isaacScript = 'D:\circle-d-flow-web\scripts\destiny_0322_fix_isaac_group.ps1'

function Write-Log([string]$m) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $m"
  Write-Host $line
  Add-Content $watchLog $line
}

# Clear stale "done" from failed empty run
Remove-Item (Join-Path $logs 'POST_QUEUE_FIXES_DONE.flag') -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $logs 'ISAAC_GROUP_FIX_DONE.flag') -Force -ErrorAction SilentlyContinue

Write-Log 'Queue complete - Finale Baseck fix first'
& powershell -NoProfile -ExecutionPolicy Bypass -File $finaleScript
$fe = $LASTEXITCODE
Write-Log "finale fix exit=$fe"
if ($fe -ne 0) { exit $fe }

Write-Log 'Isaac group fix next'
& powershell -NoProfile -ExecutionPolicy Bypass -File $isaacScript
$ie = $LASTEXITCODE
Write-Log "isaac fix exit=$ie"
if ($ie -ne 0) { exit $ie }

'COMPLETE' | Set-Content (Join-Path $logs 'POST_QUEUE_FIXES_DONE.flag')
'COMPLETE' | Set-Content (Join-Path $logs 'ISAAC_GROUP_FIX_DONE.flag')
Write-Log 'POST QUEUE FIXES COMPLETE'
Write-Host 'AGENT_LOOP_WAKE_post_fixes {"prompt":"Post-queue Finale+Isaac fixes finished; report status"}'
exit 0
