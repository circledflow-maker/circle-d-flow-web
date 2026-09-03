# Safe C: cleanup after outputs are on D: (video pipeline + dev caches)
# Skips active ffmpeg partials. Run anytime; safe during encode.
param(
    [switch]$Execute,
    [switch]$IncludeCursorSandbox
)

$ErrorActionPreference = 'Continue'
$PROXY_OUT = 'D:\Wakungo_Content_Studio\Lapa71\04_videos_compressed\Full_Takes'
$TMP_LAPA = Join-Path $env:TEMP 'lapa71_proxies'
$NPM_D = 'D:\npm-cache'
$freed = 0

function Add-Freed($bytes) { script:freed += [int64]$bytes }

function Remove-SafeItem($path) {
    if (-not (Test-Path $path)) { return }
    try {
        $size = if ((Get-Item $path).PSIsContainer) {
            (Get-ChildItem $path -Recurse -File -Force -EA SilentlyContinue | Measure-Object Length -Sum).Sum
        } else { (Get-Item $path).Length }
        if ($Execute) {
            Remove-Item $path -Recurse -Force -EA Stop
            Add-Freed $size
            Write-Host "removed: $path ($([math]::Round($size/1MB,1)) MB)"
        } else {
            Write-Host "would remove: $path ($([math]::Round($size/1MB,1)) MB)"
            Add-Freed $size
        }
    } catch {
        Write-Host "skip (locked): $path - $($_.Exception.Message)"
    }
}

function Get-ActivePartialNames {
    $names = @()
    Get-Process ffmpeg -EA SilentlyContinue | ForEach-Object {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -EA SilentlyContinue).CommandLine
        if ($cmd -match '([^\\/]+\.partial\.mp4)') { $names += $Matches[1] }
    }
    return $names | Select-Object -Unique
}

Write-Host "=== Pipeline C: cleanup $(if ($Execute) { 'EXECUTE' } else { 'DRY-RUN' }) ==="
$cBefore = (Get-PSDrive C).Free

# 1) Lapa71 temp — remove partials whose proxy already exists on D: (not active)
if (Test-Path $TMP_LAPA) {
    $active = Get-ActivePartialNames
    Get-ChildItem $TMP_LAPA -Filter '*.partial.mp4' -EA SilentlyContinue | ForEach-Object {
        if ($active -contains $_.Name) {
            Write-Host "keep active partial: $($_.Name)"
            return
        }
        $stem = $_.Name -replace '\.partial\.mp4$',''
        $proxy = Join-Path $PROXY_OUT $stem
        if (-not (Test-Path $proxy) -and $stem -match '^(.*)\.partial$') {
            $proxy = Join-Path $PROXY_OUT ($Matches[1] + '.mp4')
        }
        if (-not (Test-Path $proxy)) {
            $proxy = Join-Path $PROXY_OUT ($stem -replace '\.partial$','.mp4')
        }
        if (Test-Path $proxy) {
            Remove-SafeItem $_.FullName
        } else {
            Write-Host "keep partial (no D proxy yet): $($_.Name)"
        }
    }
}

# 2) Other pipeline temp folders (encode caches — safe if empty or stale > 2 days)
@('destiny_sd_proxies', 'on_tour_kw29_proxies', 'destiny_master_cache') | ForEach-Object {
    $p = Join-Path $env:TEMP $_
    if (-not (Test-Path $p)) { return }
    $old = (Get-ChildItem $p -Recurse -File -EA SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
    if (-not $old -or $old.LastWriteTime -lt (Get-Date).AddDays(-2)) {
        Remove-SafeItem $p
    } else {
        Write-Host "skip recent temp: $_"
    }
}

# 3) Stale VS Code update caches on C:
Get-ChildItem $env:TEMP -Directory -Filter 'vscode-stable-user-x64-*' -EA SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } |
    ForEach-Object { Remove-SafeItem $_.FullName }

# 4) npm cache → D: then clear C duplicate
if ($Execute) {
    New-Item -ItemType Directory -Force -Path $NPM_D | Out-Null
    npm config set cache $NPM_D 2>$null | Out-Null
}
$npmC = Join-Path $env:LOCALAPPDATA 'npm-cache'
if (Test-Path $npmC) { Remove-SafeItem $npmC }

# 5) pip cache (re-downloads on demand)
if ($Execute) {
    pip cache purge 2>$null | Out-Null
    Write-Host 'pip cache purged'
} else {
    $pipDir = Join-Path $env:LOCALAPPDATA 'pip\Cache'
    if (Test-Path $pipDir) {
        $sz = (Get-ChildItem $pipDir -Recurse -File -EA SilentlyContinue | Measure-Object Length -Sum).Sum
        Write-Host "would purge pip cache ($([math]::Round($sz/1MB,0)) MB)"
        Add-Freed $sz
    }
}

# 6) Optional: Cursor sandbox cache (only with flag)
if ($IncludeCursorSandbox) {
    Remove-SafeItem (Join-Path $env:TEMP 'cursor-sandbox-cache')
}

$cAfter = if ($Execute) { (Get-PSDrive C).Free } else { $cBefore }
Write-Host "C: free before: $([math]::Round($cBefore/1GB,2)) GB"
if ($Execute) {
    Write-Host "C: free after:  $([math]::Round($cAfter/1GB,2)) GB"
    Write-Host "Freed approx:   $([math]::Round(($cAfter - $cBefore)/1GB,2)) GB"
} else {
    Write-Host "Would free approx: $([math]::Round($freed/1GB,2)) GB - re-run with -Execute"
}
