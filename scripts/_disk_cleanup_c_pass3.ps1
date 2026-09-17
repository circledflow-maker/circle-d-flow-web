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
    if ($before -gt 1MB) {
        Write-Output ("{0}: before={1}GB freed={2}GB" -f $Label, [math]::Round($before/1GB,3), [math]::Round($freed/1GB,3))
    }
}

$beforeFree = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
Write-Output "PASS3_BEFORE_FREE_GB=$beforeFree"

# Chrome / Google regenerable caches
$chromeRoots = Get-ChildItem "$env:LOCALAPPDATA\Google\Chrome\User Data" -Directory -ErrorAction SilentlyContinue
foreach ($profile in $chromeRoots) {
    if ($profile.Name -match '^(Default|Profile \d+)$') {
        Clear-Contents -Path (Join-Path $profile.FullName 'Cache') -Label ("Chrome Cache " + $profile.Name)
        Clear-Contents -Path (Join-Path $profile.FullName 'Code Cache') -Label ("Chrome Code Cache " + $profile.Name)
        Clear-Contents -Path (Join-Path $profile.FullName 'GPUCache') -Label ("Chrome GPUCache " + $profile.Name)
        Clear-Contents -Path (Join-Path $profile.FullName 'Service Worker\CacheStorage') -Label ("Chrome SW " + $profile.Name)
    }
}
Clear-Contents -Path "$env:LOCALAPPDATA\Google\Chrome\User Data\GrShaderCache" -Label 'Chrome GrShaderCache'
Clear-Contents -Path "$env:LOCALAPPDATA\Google\Chrome\User Data\ShaderCache" -Label 'Chrome ShaderCache'

# Edge cache if present
Clear-Contents -Path "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache" -Label 'Edge Cache'
Clear-Contents -Path "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache" -Label 'Edge Code Cache'

# Retry temp folders
Clear-Contents -Path $env:TEMP -Label 'User TEMP retry'
Clear-Contents -Path 'C:\Users\user\AppData\Local\Temp' -Label 'Local Temp retry'

# antigravity-updater cache (updater artifacts)
Clear-Contents -Path "$env:LOCALAPPDATA\antigravity-updater" -Label 'antigravity-updater'

Write-Output "=== REMAINING TOP AppData\Local ==="
Get-ChildItem 'C:\Users\user\AppData\Local' -Directory -ErrorAction SilentlyContinue |
    ForEach-Object {
        $s = Get-FolderSizeBytes -Path $_.FullName
        [PSCustomObject]@{ GB = [math]::Round($s / 1GB, 2); FullPath = $_.FullName }
    } |
    Sort-Object GB -Descending |
    Select-Object -First 15 |
    ForEach-Object { Write-Output ("{0,8} GB  {1}" -f $_.GB, $_.FullPath) }

$afterFree = [math]::Round((Get-PSDrive C).Free / 1GB, 2)
Write-Output "PASS3_AFTER_FREE_GB=$afterFree"
Write-Output ("PASS3_TRACKED_FREED_GB={0}" -f [math]::Round($totalFreed/1GB,2))
Write-Output ("PASS3_DELTA_GB={0}" -f [math]::Round($afterFree - $beforeFree, 2))
