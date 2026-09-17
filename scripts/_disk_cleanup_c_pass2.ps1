$ErrorActionPreference = 'SilentlyContinue'
$totalFreed = 0L

function Get-FolderSizeBytes {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return 0L }
    $sum = (Get-ChildItem -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue |
        Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    if ($null -eq $sum) { return 0L }
    return [long]$sum
}

function Clear-Contents {
    param([string]$Path, [string]$Label)
    if (-not (Test-Path -LiteralPath $Path)) { return }
    $before = Get-FolderSizeBytes -Path $Path
    $freed = 0L
    Get-ChildItem -LiteralPath $Path -Force -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $sz = if ($_.PSIsContainer) { Get-FolderSizeBytes -Path $_.FullName } else { [long]$_.Length }
            Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop
            $freed += $sz
        } catch {}
    }
    $script:totalFreed += $freed
    Write-Output ("{0}: before={1}GB freed={2}GB" -f $Label, [math]::Round($before/1GB,3), [math]::Round($freed/1GB,3))
}

$beforeFree = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
Write-Output "PASS2_BEFORE_FREE_GB=$beforeFree"

$targets = @(
    @{ P = "$env:LOCALAPPDATA\Cursor\Cache"; L = 'Cursor Cache' },
    @{ P = "$env:LOCALAPPDATA\Cursor\CachedData"; L = 'Cursor CachedData' },
    @{ P = "$env:LOCALAPPDATA\Cursor\Code Cache"; L = 'Cursor Code Cache' },
    @{ P = "$env:LOCALAPPDATA\Cursor\GPUCache"; L = 'Cursor GPUCache' },
    @{ P = "$env:LOCALAPPDATA\Cursor\logs"; L = 'Cursor logs' },
    @{ P = "$env:LOCALAPPDATA\Cursor\Service Worker\CacheStorage"; L = 'Cursor SW Cache' },
    @{ P = "$env:LOCALAPPDATA\CrashDumps"; L = 'CrashDumps' },
    @{ P = "$env:LOCALAPPDATA\ms-playwright-go"; L = 'Playwright cache' },
    @{ P = "$env:LOCALAPPDATA\Package Cache"; L = 'Package Cache' },
    @{ P = "$env:LOCALAPPDATA\Microsoft\Windows\INetCache"; L = 'INetCache' },
    @{ P = "$env:LOCALAPPDATA\Microsoft\Windows\WebCache"; L = 'WebCache' },
    @{ P = "$env:LOCALAPPDATA\Microsoft\Windows\DeliveryOptimization\Cache"; L = 'DeliveryOpt' },
    @{ P = 'C:\Windows\Temp'; L = 'Windows Temp' },
    @{ P = 'C:\Users\user\AppData\Local\Temp'; L = 'Local Temp' },
    @{ P = "$env:LOCALAPPDATA\pip\cache"; L = 'pip cache' },
    @{ P = "$env:USERPROFILE\.cache\huggingface"; L = 'huggingface' },
    @{ P = "$env:USERPROFILE\.cache\pip"; L = 'pip user cache' },
    @{ P = "$env:LOCALAPPDATA\torch"; L = 'torch' },
    @{ P = "$env:TEMP\destiny_master_cache"; L = 'destiny_master_cache' }
)

Write-Output "=== SIZES BEFORE ==="
foreach ($t in $targets) {
    $gb = [math]::Round((Get-FolderSizeBytes -Path $t.P) / 1GB, 3)
    if ($gb -gt 0) { Write-Output ("{0,8} GB  [{1}] {2}" -f $gb, $t.L, $t.P) }
}

Write-Output "=== CLEANUP ==="
foreach ($t in $targets) { Clear-Contents -Path $t.P -Label $t.L }

# Thumbnail cache
$explorer = "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"
$thumbFreed = 0L
Get-ChildItem -LiteralPath $explorer -Filter 'thumbcache_*.db' -Force -ErrorAction SilentlyContinue | ForEach-Object {
    try { $thumbFreed += $_.Length; Remove-Item $_.FullName -Force } catch {}
}
$totalFreed += $thumbFreed
Write-Output ("Thumbnail cache: freed={0}GB" -f [math]::Round($thumbFreed/1GB,3))

# Recycle Bin - try multiple methods
$rbBefore = 0L
try {
    $shell = New-Object -ComObject Shell.Application
    foreach ($item in $shell.NameSpace(0xA).Items()) { $rbBefore += [long]$item.Size }
} catch {}
Write-Output ("Recycle Bin before={0}GB" -f [math]::Round($rbBefore/1GB,3))

$rbFreed = 0L
try {
    Clear-RecycleBin -Force -ErrorAction Stop
    $rbFreed = $rbBefore
} catch {
    # fallback: rd each drive recycle folder
    Get-ChildItem 'C:\`$Recycle.Bin' -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Get-ChildItem $_.FullName -Force -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $sz = if ($_.PSIsContainer) { Get-FolderSizeBytes $_.FullName } else { [long]$_.Length }
                Remove-Item $_.FullName -Recurse -Force -ErrorAction Stop
                $rbFreed += $sz
            } catch {}
        }
    }
}
$totalFreed += $rbFreed
Write-Output ("Recycle Bin freed={0}GB" -f [math]::Round($rbFreed/1GB,3))

# Windows Update downloads retry
$wu = 'C:\Windows\SoftwareDistribution\Download'
Clear-Contents -Path $wu -Label 'Win Update Downloads'

Start-Sleep -Seconds 2
$afterFree = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
Write-Output "PASS2_AFTER_FREE_GB=$afterFree"
Write-Output ("PASS2_TRACKED_FREED_GB={0}" -f [math]::Round($totalFreed/1GB,2))
Write-Output ("PASS2_DELTA_GB={0}" -f [math]::Round($afterFree - $beforeFree, 2))
