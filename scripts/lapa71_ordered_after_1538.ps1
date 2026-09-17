# After DSC_1538: small clips -> face/sort/cuts -> DSC_1511 last -> reel agents
$ErrorActionPreference = 'Continue'
$env:TF_CPP_MIN_LOG_LEVEL = '2'
$env:TF_ENABLE_ONEDNN_OPTS = '0'
$env:LAPA71_SRC = 'F:\Part4'
$env:LAPA71_OUT = 'D:\Wakungo_Content_Studio\Lapa71'
$env:LAPA71_FAST = '1'
$py = 'D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.py'
$ft = Join-Path $env:LAPA71_OUT '04_videos_compressed\Full_Takes'
$log = Join-Path $env:LAPA71_OUT '00_logs\part4_ordered.log'
$p1538 = Join-Path $ft 'DSC_1538_proxy_1080p.mp4'
$p1511 = Join-Path $ft 'DSC_1511_proxy_1080p.mp4'

function L($m) {
    $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $m
    Write-Host $line
    Add-Content -Path $log -Value $line
}

New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
L "ORDERED workflow: wait 1538 -> small -> faces -> 1511 -> faces 1511 -> agents"

# --- wait for 1538 ---
while (-not (Test-Path $p1538)) {
    $ff = Get-Process ffmpeg -EA SilentlyContinue | Select-Object -First 1
    $partial = Join-Path $env:TEMP 'lapa71_proxies\DSC_1538_proxy_1080p.partial.mp4'
    $mb = if (Test-Path $partial) { [math]::Round((Get-Item $partial).Length / 1MB, 0) } else { 0 }
    $who = ''
    if ($ff) {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($ff.Id)" -EA SilentlyContinue).CommandLine
        if ($cmd -match 'DSC_(\d+)') { $who = $Matches[1] }
    }
    L "waiting 1538 | partial ${mb}MB | ffmpeg DSC_$who"
    if ($who -eq '1511') {
        L "block early 1511 encode - kill ffmpeg/python"
        Get-Process ffmpeg -EA SilentlyContinue | Stop-Process -Force
        Get-CimInstance Win32_Process -Filter "Name='python.exe'" -EA SilentlyContinue |
            Where-Object { $_.CommandLine -match 'lapa71_tagus_pipeline' } |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -EA SilentlyContinue }
        Remove-Item (Join-Path $env:TEMP 'lapa71_proxies\DSC_1511_proxy_1080p.partial.mp4') -Force -EA SilentlyContinue
    }
    Start-Sleep -Seconds 45
}
L "1538 proxy ready"

# stop compress python so it cannot start 1511
Get-CimInstance Win32_Process -Filter "Name='python.exe'" -EA SilentlyContinue |
    Where-Object { $_.CommandLine -match 'lapa71_tagus_pipeline' } |
    ForEach-Object { L ("stop pipeline pid " + $_.ProcessId); Stop-Process -Id $_.ProcessId -Force -EA SilentlyContinue }
Start-Sleep -Seconds 2
$ff = Get-Process ffmpeg -EA SilentlyContinue | Select-Object -First 1
if ($ff) {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($ff.Id)" -EA SilentlyContinue).CommandLine
    if ($cmd -match 'DSC_1511') {
        L "kill 1511 ffmpeg"
        Stop-Process -Id $ff.Id -Force
        Remove-Item (Join-Path $env:TEMP 'lapa71_proxies\DSC_1511_proxy_1080p.partial.mp4') -Force -EA SilentlyContinue
    }
}

# --- small DSCs ---
L "phase A: compress small missing DSC_0941 0944 0956"
& python $py --compress dsc_0941 dsc_0944 dsc_0956
L ("small compress exit=" + $LASTEXITCODE)

# --- face/sort/cut for everything that has a proxy (1511 skipped automatically) ---
L "phase B: face-sort + Stages cuts into artist folders"
& python $py --faces
L ("faces exit=" + $LASTEXITCODE)
"phase_B_faces_done $(Get-Date -Format o)" | Set-Content (Join-Path $env:LAPA71_OUT '00_logs\PHASE_B_FACES_DONE.flag') -Encoding UTF8
L "PHASE B DONE - artist cuts ready (without 1511)"

# --- 1511 last ---
L "phase C: compress DSC_1511 last"
& python $py --compress dsc_1511
L ("1511 compress exit=" + $LASTEXITCODE)
L "phase C2: face-sort DSC_1511"
& python $py --faces dsc_1511
L ("1511 faces exit=" + $LASTEXITCODE)

# --- agents ---
L "phase D: wakungo reel agents"
& python "D:\circle-d-flow-web\scripts\wakungo_reel\run.py"
L ("agents exit=" + $LASTEXITCODE)
"all_done $(Get-Date -Format o)" | Set-Content (Join-Path $env:LAPA71_OUT '00_logs\PART4_ORDERED_DONE.flag') -Encoding UTF8
L "ORDERED workflow complete"
exit 0
