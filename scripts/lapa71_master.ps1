# Lapa71 MASTER - one ffmpeg, resume-safe, efficient order
# A small -> B 1538 -> C faces -> D 1511 -> E faces 1511 -> F agents
# Rules: F:\Part4 mounted, TEMP on NTFS, never 2x ffmpeg

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
$myPid = $PID
New-Item -ItemType Directory -Force -Path $logDir, $ft, (Join-Path $env:TEMP 'lapa71_proxies') | Out-Null

function Write-MasterLog([string]$m) {
    $line = "[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $m
    Write-Host $line
    Add-Content -Path $log -Value $line
}

function Assert-SingleFfmpeg {
    $n = @(Get-Process ffmpeg -EA SilentlyContinue).Count
    if ($n -gt 1) {
        Write-MasterLog "ABORT: $n ffmpeg processes - refuse parallel encode"
        exit 3
    }
}

function Test-ProxyStem([string]$stem) {
    foreach ($name in @(($stem + '_proxy_1080p.mp4'), ($stem + '_D850_proxy_1080p.mp4'))) {
        $p = Join-Path $ft $name
        if ((Test-Path -LiteralPath $p) -and ((Get-Item -LiteralPath $p).Length -gt 50MB)) {
            return $true
        }
    }
    return $false
}

function Invoke-Pipeline {
    param([Parameter(Mandatory=$true)][string[]]$PyArgs)
    Assert-SingleFfmpeg
    Write-MasterLog ("RUN python " + ($PyArgs -join ' '))
    & python $py @PyArgs
    $c = $LASTEXITCODE
    Write-MasterLog ("EXIT $c :: " + ($PyArgs -join ' '))
    return $c
}

Write-MasterLog "=== MASTER START pid=$myPid ==="
Write-MasterLog "SRC=$($env:LAPA71_SRC) OUT=$($env:LAPA71_OUT) FAST=$($env:LAPA71_FAST)"

if (-not (Test-Path $env:LAPA71_SRC)) {
    Write-MasterLog "ABORT: source missing $($env:LAPA71_SRC) - keep drive mounted"
    exit 2
}

if ($env:LAPA71_MASTER_RESET -eq '1') {
    Write-MasterLog "RESET: stop prior lapa71 workers (keep this pid $myPid)"
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -EA SilentlyContinue |
        Where-Object {
            $_.ProcessId -ne $myPid -and
            $_.CommandLine -match 'lapa71_(restart_ordered|ordered_after_1538|master)'
        } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -EA SilentlyContinue }
    Get-CimInstance Win32_Process -Filter "Name='python.exe'" -EA SilentlyContinue |
        Where-Object { $_.CommandLine -match 'lapa71_tagus_pipeline' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -EA SilentlyContinue }
    Get-Process ffmpeg -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue
    Start-Sleep -Seconds 2
    $p1538 = Join-Path $env:TEMP 'lapa71_proxies\DSC_1538_proxy_1080p.partial.mp4'
    if (Test-Path $p1538) {
        $mb = [math]::Round((Get-Item $p1538).Length / 1MB, 1)
        if ($mb -lt 50) {
            Write-MasterLog "remove stuck 1538 partial ${mb}MB"
            Remove-Item $p1538 -Force -EA SilentlyContinue
        } else {
            Write-MasterLog "keep 1538 partial ${mb}MB until phase B re-encode (incomplete mp4 not usable)"
        }
    }
}

# A: small first
$small = @('dsc_0941', 'dsc_0944', 'dsc_0956')
$needSmall = @()
foreach ($s in $small) {
    if (-not (Test-ProxyStem $s.ToUpper())) { $needSmall += $s }
}
if ($needSmall.Count -gt 0) {
    Write-MasterLog ("PHASE A: compress small " + ($needSmall -join ','))
    [void](Invoke-Pipeline -PyArgs (@('--compress') + $needSmall))
} else {
    Write-MasterLog "PHASE A: skip - small proxies exist"
}
"phase_A_done $(Get-Date -Format o)" | Set-Content (Join-Path $logDir 'PHASE_A_SMALL_DONE.flag') -Encoding UTF8

# B: 1538
if (-not (Test-ProxyStem 'DSC_1538')) {
    Write-MasterLog "PHASE B: compress DSC_1538"
    $c = Invoke-Pipeline -PyArgs @('--compress', 'dsc_1538')
    if ($c -ne 0 -or -not (Test-ProxyStem 'DSC_1538')) {
        Write-MasterLog "ABORT: DSC_1538 failed"
        exit 1
    }
} else {
    Write-MasterLog "PHASE B: skip - DSC_1538 proxy exists"
}
"phase_B_1538_done $(Get-Date -Format o)" | Set-Content (Join-Path $logDir 'PHASE_B_1538_DONE.flag') -Encoding UTF8

# C: faces
Write-MasterLog "PHASE C: face-sort + Stages cuts"
[void](Invoke-Pipeline -PyArgs @('--faces'))
"phase_C_faces_done $(Get-Date -Format o)" | Set-Content (Join-Path $logDir 'PHASE_B_FACES_DONE.flag') -Encoding UTF8
Write-MasterLog "PHASE C done"

# D: 1511 last
if (-not (Test-ProxyStem 'DSC_1511')) {
    Write-MasterLog "PHASE D: compress DSC_1511 (monster last)"
    [void](Invoke-Pipeline -PyArgs @('--compress', 'dsc_1511'))
} else {
    Write-MasterLog "PHASE D: skip - DSC_1511 proxy exists"
}
"phase_D_1511_done $(Get-Date -Format o)" | Set-Content (Join-Path $logDir 'PHASE_D_1511_DONE.flag') -Encoding UTF8

# E: faces 1511
if (Test-ProxyStem 'DSC_1511') {
    Write-MasterLog "PHASE E: face-sort DSC_1511"
    [void](Invoke-Pipeline -PyArgs @('--faces', 'dsc_1511'))
} else {
    Write-MasterLog "PHASE E: skip - no 1511 proxy"
}

# F: agents
Write-MasterLog "PHASE F: wakungo reel agents"
Assert-SingleFfmpeg
& python $agents
Write-MasterLog ("agents exit=" + $LASTEXITCODE)

"all_done $(Get-Date -Format o)" | Set-Content (Join-Path $logDir 'PART4_ORDERED_DONE.flag') -Encoding UTF8
Write-MasterLog "=== MASTER COMPLETE ==="
exit 0
