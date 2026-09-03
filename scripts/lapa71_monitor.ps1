# Lapa71 pipeline monitor — stall detect + optional auto-resume
$ErrorActionPreference = 'Continue'
$Out = 'D:\Wakungo_Content_Studio\Lapa71'
$Log = Join-Path $Out '00_logs\lapa71_pipeline.log'
$StateFile = Join-Path $Out '00_logs\monitor_state.json'
$Runner = 'D:\circle-d-flow-web\scripts\lapa71_tagus_pipeline.ps1'
$TotalMovs = 30

function Get-Status {
    $proxies = @(Get-ChildItem (Join-Path $Out '04_videos_compressed\Full_Takes\*.mp4') -EA SilentlyContinue)
    $stages = @(Get-ChildItem (Join-Path $Out '04_Artists') -Recurse -Filter '*Stages*.mp4' -EA SilentlyContinue)
    $faces = @(Get-ChildItem (Join-Path $Out '00_logs\face_done_*.flag') -EA SilentlyContinue)
    $logLine = ''
    $logMtime = $null
    if (Test-Path $Log) {
        $logMtime = (Get-Item $Log).LastWriteTime
        $logLine = (Get-Content $Log -Tail 1 -EA SilentlyContinue) -join ''
    }
    $ff = @(Get-Process ffmpeg -EA SilentlyContinue)
    $py = @(Get-Process python -EA SilentlyContinue)
    $encoding = if ($ff.Count -gt 0) {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($ff[0].Id)" -EA SilentlyContinue).CommandLine
        if ($cmd -match 'DSC_\d+') { $Matches[0] } else { 'ffmpeg' }
    } else { $null }
    [ordered]@{
        time       = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        proxies    = $proxies.Count
        stages     = $stages.Count
        faces      = $faces.Count
        log_mtime  = if ($logMtime) { $logMtime.ToString('o') } else { $null }
        last_log   = $logLine
        ffmpeg     = $ff.Count
        python     = $py.Count
        encoding   = $encoding
    }
}

function Save-State($s) { $s | ConvertTo-Json | Set-Content $StateFile -Encoding UTF8 }

$cur = Get-Status
$prev = $null
if (Test-Path $StateFile) {
    try { $prev = Get-Content $StateFile -Raw | ConvertFrom-Json } catch {}
}

$stalled = $false
$reason = ''
if ($prev) {
    $noProgress = ($cur.proxies -eq $prev.proxies) -and ($cur.stages -eq $prev.stages) -and ($cur.faces -eq $prev.faces)
    $idle = ($cur.ffmpeg -eq 0) -and ($cur.python -eq 0)
    if ($noProgress -and $idle -and $cur.proxies -lt $TotalMovs) {
        $stalled = $true
        $reason = 'no progress + no ffmpeg/python'
    }
}

$resumed = $false
if ($stalled) {
    Start-Process powershell -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $Runner
    ) -WindowStyle Hidden
    $resumed = $true
    Start-Sleep -Seconds 3
    $cur = Get-Status
}

Save-State $cur

$pct = [math]::Round(100 * $cur.proxies / $TotalMovs, 0)
$msg = @(
    "Lapa71 Monitor $pct% | Proxies $($cur.proxies)/$TotalMovs | Stages $($cur.stages) | Face $($cur.faces)"
    if ($cur.encoding) { "Encoding: $($cur.encoding)" }
    elseif ($cur.ffmpeg -gt 0) { 'Encoding: ffmpeg active' }
    elseif ($cur.python -gt 0) { 'Face/compress: python active' }
    else { 'Idle' }
    "Last: $($cur.last_log)"
    if ($stalled) { "STALL detected ($reason) - pipeline RESUMED" }
) -join ' | '

Write-Output $msg
return @{ status = $cur; stalled = $stalled; resumed = $resumed }
