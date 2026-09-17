# After resume finishes: run --fix-labels for Mr.Isaac / Manu
$ErrorActionPreference = 'Continue'
$env:LAPA71_SRC = 'F:\Part4'
$env:LAPA71_OUT = 'D:\Wakungo_Content_Studio\Lapa71'
$env:LAPA71_FAST = '1'
$logDir = Join-Path $env:LAPA71_OUT '00_logs'
$log = Join-Path $logDir 'part4_master.log'
$py = 'D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.py'
$resumePidFile = Join-Path $logDir 'resume_pid.txt'

function W([string]$m) {
    $line = "[{0:yyyy-MM-dd HH:mm:ss}] LABEL-WATCH {1}" -f (Get-Date), $m
    Write-Host $line
    Add-Content -Path $log -Value $line
}

$resumePid = $null
if (Test-Path $resumePidFile) {
    $t = Get-Content $resumePidFile -Raw
    if ($t -match 'resume_pid=(\d+)') { $resumePid = [int]$Matches[1] }
}

W "waiting for resume pid=$resumePid (and ffmpeg idle) before fix-labels"

# Wait until resume process gone OR PART4 done flag, and no lapa71 faces python
while ($true) {
    $resumeAlive = $false
    if ($resumePid) { $resumeAlive = [bool](Get-Process -Id $resumePid -EA SilentlyContinue) }
    $facesPy = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -EA SilentlyContinue |
        Where-Object { $_.CommandLine -match 'lapa71_tagus_pipeline.*--faces' }
    $ff = @(Get-Process ffmpeg -EA SilentlyContinue)
    if (-not $resumeAlive -and -not $facesPy -and $ff.Count -eq 0) { break }
    if ((Test-Path (Join-Path $logDir 'PART4_ORDERED_DONE.flag')) -and $ff.Count -eq 0 -and -not $facesPy) { break }
    Start-Sleep -Seconds 45
}

if (Test-Path (Join-Path $logDir 'LABELS_FIXED.flag')) {
    W "LABELS_FIXED already present - skip"
    exit 0
}

W "running --fix-labels"
& python $py --fix-labels
W ("fix-labels exit=" + $LASTEXITCODE)
exit $LASTEXITCODE
