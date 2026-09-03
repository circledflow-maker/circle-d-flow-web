# 30-minute Lapa71 pipeline monitor loop
$ErrorActionPreference = 'Continue'
while ($true) {
    Start-Sleep -Seconds 1800
    $r = & 'D:\circle-d-flow-web\scripts\lapa71_monitor.ps1'
    Write-Output 'AGENT_LOOP_TICK_lapa71 {"prompt":"Lapa71 30min monitor: run monitor, report progress to user"}'
    Write-Output $r
}
