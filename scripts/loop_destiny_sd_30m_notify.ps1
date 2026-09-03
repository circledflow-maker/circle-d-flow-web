Write-Host 'armed_monitored_30m_loop'
while ($true) {
  Start-Sleep -Seconds 1800
  $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Write-Output ("AGENT_LOOP_TICK_destiny_sd {0}" -f ('{"prompt":"Check Destiny Hostel pipeline at ' + $stamp + '. Face DSC_0324 + full SD. Report ETA, restart if dead. Keep F connected."}'))
}
