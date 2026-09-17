# Resume Lapa71 from current state: 0956 -> faces -> 1511 -> faces 1511 -> agents
# Skips existing proxies (0941/0944/1538 already done).

$ErrorActionPreference = 'Continue'
$env:LAPA71_SRC = 'F:\Part4'
$env:LAPA71_OUT = 'D:\Wakungo_Content_Studio\Lapa71'
$env:LAPA71_FAST = '1'
$env:TF_CPP_MIN_LOG_LEVEL = '2'
$env:TF_ENABLE_ONEDNN_OPTS = '0'

$py = 'D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.py'
$agents = 'D:\circle-d-flow-web\scripts\wakungo_reel\run.py'
$logDir = Join-Path $env:LAPA71_OUT '00_logs'
$ft = Join-Path $env:LAPA71_OUT '04_videos_compressed\Full_Takes'
$log = Join-Path $logDir 'part4_master.log'
New-Item -ItemType Directory -Force -Path $logDir, (Join-Path $env:LAPA71_OUT '00_work\proxy_tmp') | Out-Null

function Write-MasterLog([string]$m) {
    $line = "[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $m
    Write-Host $line
    Add-Content -Path $log -Value $line
}

function Test-GoodProxy([string]$stem) {
    foreach ($name in @("$stem`_proxy_1080p.mp4", "$stem`_D850_proxy_1080p.mp4")) {
        $p = Join-Path $ft $name
        if (Test-Path $p) {
            $len = (Get-Item $p).Length
            if ($len -gt 50MB) { return $true }
        }
    }
    return $false
}

function Invoke-Pipeline([string[]]$PyArgs) {
    $n = @(Get-Process ffmpeg -EA SilentlyContinue).Count
    if ($n -gt 1) {
        Write-MasterLog "ABORT: $n ffmpeg - refuse parallel"
        exit 3
    }
    Write-MasterLog ("RUN python " + ($PyArgs -join ' '))
    & python $py @PyArgs
    $code = $LASTEXITCODE
    Write-MasterLog ("EXIT $code :: " + ($PyArgs -join ' '))
    return $code
}

Write-MasterLog "=== RESUME START (0956 -> faces -> 1511 -> agents) ==="
Write-MasterLog ("C freeGB=" + [math]::Round((Get-PSDrive C).Free/1GB, 1) + " D freeGB=" + [math]::Round((Get-PSDrive D).Free/1GB, 1))

if (-not (Test-Path $env:LAPA71_SRC)) {
    Write-MasterLog "ABORT: F:\Part4 missing"
    exit 2
}

# Status snapshot
foreach ($s in @('DSC_0941','DSC_0944','DSC_0956','DSC_1538','DSC_1511')) {
    Write-MasterLog ("proxy $s = " + (Test-GoodProxy $s))
}

# A2: 0956 only
if (-not (Test-GoodProxy 'DSC_0956')) {
    Write-MasterLog "PHASE A2: compress dsc_0956"
    $c = Invoke-Pipeline @('--compress', 'dsc_0956')
    Start-Sleep -Seconds 2
    if (-not (Test-GoodProxy 'DSC_0956')) {
        Write-MasterLog "WARN: 0956 still missing after exit=$c - continue (faces can skip)"
    }
} else {
    Write-MasterLog "PHASE A2: skip 0956"
}

# C: faces (1538+small present; 1511 skipped if missing)
Write-MasterLog "PHASE C: faces"
[void](Invoke-Pipeline @('--faces'))
"phase_C_faces_done $(Get-Date -Format o)" | Set-Content (Join-Path $logDir 'PHASE_B_FACES_DONE.flag') -Encoding UTF8

# D: 1511 fat32-safe (pipeline auto)
if (-not (Test-GoodProxy 'DSC_1511')) {
    Write-MasterLog "PHASE D: compress dsc_1511 (720p bitrate-capped for FAT32)"
    $c = Invoke-Pipeline @('--compress', 'dsc_1511')
    Start-Sleep -Seconds 2
    if (-not (Test-GoodProxy 'DSC_1511')) {
        Write-MasterLog "WARN: 1511 failed exit=$c - continue to label fix + agents"
    }
} else {
    Write-MasterLog "PHASE D: skip 1511"
}

# E
if (Test-GoodProxy 'DSC_1511') {
    Write-MasterLog "PHASE E: faces dsc_1511"
    [void](Invoke-Pipeline @('--faces', 'dsc_1511'))
}

# E2: correct Mr. Isaac / Manu folder names + rebuild intros
Write-MasterLog "PHASE E2: fix-labels Mr.Isaac + Manu"
[void](Invoke-Pipeline @('--fix-labels'))

# F
Write-MasterLog "PHASE F: wakungo agents"
& python $agents
Write-MasterLog ("agents exit=" + $LASTEXITCODE)
"all_done $(Get-Date -Format o)" | Set-Content (Join-Path $logDir 'PART4_ORDERED_DONE.flag') -Encoding UTF8
Write-MasterLog "=== RESUME COMPLETE ==="
exit 0
