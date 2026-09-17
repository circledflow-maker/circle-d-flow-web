$ErrorActionPreference = 'SilentlyContinue'
$results = @()
$totalFreed = 0L

function Get-FolderSizeBytes {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return 0L }
    try {
        $sum = (Get-ChildItem -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue |
            Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        if ($null -eq $sum) { return 0L }
        return [long]$sum
    } catch { return 0L }
}

function Remove-SafeFolderContents {
    param(
        [string]$Path,
        [string]$Label,
        [switch]$ThumbnailOnly
    )
    if (-not (Test-Path -LiteralPath $Path)) {
        return [PSCustomObject]@{ Label = $Label; Path = $Path; BeforeGB = 0; FreedGB = 0; Status = 'missing' }
    }
    $before = Get-FolderSizeBytes -Path $Path
    $freed = 0L
    $status = 'ok'
    try {
        if ($ThumbnailOnly) {
            Get-ChildItem -LiteralPath $Path -Filter 'thumbcache_*.db' -Force -ErrorAction SilentlyContinue |
                ForEach-Object {
                    try { Remove-Item -LiteralPath $_.FullName -Force -ErrorAction Stop; $freed += $_.Length } catch {}
                }
        } else {
            Get-ChildItem -LiteralPath $Path -Force -ErrorAction SilentlyContinue | ForEach-Object {
                try {
                    $itemSize = if ($_.PSIsContainer) { Get-FolderSizeBytes -Path $_.FullName } else { [long]$_.Length }
                    Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop
                    $freed += $itemSize
                } catch {}
            }
        }
    } catch { $status = 'partial' }

    $script:totalFreed += $freed
    [PSCustomObject]@{
        Label    = $Label
        Path     = $Path
        BeforeGB = [math]::Round($before / 1GB, 3)
        FreedGB  = [math]::Round($freed / 1GB, 3)
        Status   = $status
    }
}

function Clear-RecycleBinSafe {
    $shell = New-Object -ComObject Shell.Application
    $rb = $shell.NameSpace(0xA)
    if ($null -eq $rb) { return [PSCustomObject]@{ Label = 'Recycle Bin'; Path = 'RecycleBin'; BeforeGB = 0; FreedGB = 0; Status = 'missing' } }
    $before = 0L
    foreach ($item in $rb.Items()) {
        try { $before += [long]$item.Size } catch {}
    }
    try {
        Clear-RecycleBin -Force -ErrorAction Stop
        $script:totalFreed += $before
        [PSCustomObject]@{ Label = 'Recycle Bin'; Path = 'RecycleBin'; BeforeGB = [math]::Round($before / 1GB, 3); FreedGB = [math]::Round($before / 1GB, 3); Status = 'ok' }
    } catch {
        [PSCustomObject]@{ Label = 'Recycle Bin'; Path = 'RecycleBin'; BeforeGB = [math]::Round($before / 1GB, 3); FreedGB = 0; Status = 'failed' }
    }
}

function Clear-DownloadsEncodeJunk {
    $dl = 'C:\Users\user\Downloads'
    if (-not (Test-Path $dl)) { return @() }
    $patterns = @('*tmp*', '*ffmpeg*', '*proxy*', '*encode*')
    $rows = @()
    foreach ($pat in $patterns) {
        Get-ChildItem -Path $dl -Filter $pat -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
            $sz = if ($_.PSIsContainer) { Get-FolderSizeBytes -Path $_.FullName } else { [long]$_.Length }
            try {
                Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop
                $script:totalFreed += $sz
                $rows += [PSCustomObject]@{ Label = 'Downloads junk'; Path = $_.FullName; BeforeGB = [math]::Round($sz / 1GB, 3); FreedGB = [math]::Round($sz / 1GB, 3); Status = 'ok' }
            } catch {}
        }
    }
    return $rows
}

$drive = Get-PSDrive C
$beforeFreeGB = [math]::Round($drive.Free / 1GB, 2)
Write-Output "=== DISK BEFORE ==="
Write-Output "FREE_GB=$beforeFreeGB"

Write-Output ""
Write-Output "=== TOP 15 AppData\Local (before) ==="
Get-ChildItem 'C:\Users\user\AppData\Local' -Directory -ErrorAction SilentlyContinue |
    ForEach-Object {
        $s = Get-FolderSizeBytes -Path $_.FullName
        [PSCustomObject]@{ GB = [math]::Round($s / 1GB, 2); FullPath = $_.FullName }
    } |
    Sort-Object GB -Descending |
    Select-Object -First 15 |
    ForEach-Object { Write-Output ("{0,8} GB  {1}" -f $_.GB, $_.FullPath) }

Write-Output ""
Write-Output "=== CLEANUP ACTIONS ==="

$results += Remove-SafeFolderContents -Path $env:TEMP -Label 'User TEMP'
$results += Remove-SafeFolderContents -Path 'C:\Users\user\AppData\Local\Temp' -Label 'Local Temp'
$results += Remove-SafeFolderContents -Path 'C:\Windows\Temp' -Label 'Windows Temp'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\pip\cache" -Label 'pip cache (Local)'
$results += Remove-SafeFolderContents -Path "$env:USERPROFILE\.cache\pip" -Label 'pip cache (User)'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\npm-cache" -Label 'npm cache (Local)'
$results += Remove-SafeFolderContents -Path "$env:APPDATA\npm-cache" -Label 'npm cache (Roaming)'
$results += Remove-SafeFolderContents -Path "$env:USERPROFILE\.npm\_cacache" -Label 'npm _cacache'
$results += Remove-SafeFolderContents -Path "$env:USERPROFILE\.cache\huggingface" -Label 'huggingface cache'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\torch" -Label 'torch cache (Local)'
$results += Remove-SafeFolderContents -Path "$env:USERPROFILE\.cache\torch" -Label 'torch cache (User)'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\Cursor\Cache" -Label 'Cursor Cache'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\Cursor\CachedData" -Label 'Cursor CachedData'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\Cursor\Code Cache" -Label 'Cursor Code Cache'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\Cursor\GPUCache" -Label 'Cursor GPUCache'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\Cursor\logs" -Label 'Cursor logs'
$results += Remove-SafeFolderContents -Path "$env:TEMP\destiny_master_cache" -Label 'destiny_master_cache'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\Microsoft\Windows\DeliveryOptimization\Cache" -Label 'Delivery Optimization'
$results += Remove-SafeFolderContents -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer" -Label 'Thumbnail cache' -ThumbnailOnly

if (Get-Command npm -ErrorAction SilentlyContinue) { npm cache clean --force 2>$null | Out-Null }
if (Get-Command pip -ErrorAction SilentlyContinue) { pip cache purge 2>$null | Out-Null }

$wuPath = 'C:\Windows\SoftwareDistribution\Download'
if ((Get-FolderSizeBytes -Path $wuPath) -gt 100MB) {
    $results += Remove-SafeFolderContents -Path $wuPath -Label 'Win Update Downloads'
}

$results += Clear-RecycleBinSafe
$results += Clear-DownloadsEncodeJunk

foreach ($r in $results) {
    if ($r.FreedGB -gt 0 -or $r.BeforeGB -gt 0) {
        Write-Output ("{0}: before={1}GB freed={2}GB status={3}" -f $r.Label, $r.BeforeGB, $r.FreedGB, $r.Status)
    }
}

Start-Sleep -Seconds 2
$afterFreeGB = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
$freedReported = [math]::Round($totalFreed / 1GB, 2)
$deltaFree = [math]::Round($afterFreeGB - $beforeFreeGB, 2)

Write-Output ""
Write-Output "=== DISK AFTER ==="
Write-Output "FREE_GB=$afterFreeGB"
Write-Output "FREED_TRACKED_GB=$freedReported"
Write-Output "DELTA_FREE_GB=$deltaFree"
