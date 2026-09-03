# Circle D Flow — Phase 0 health check (read-only)
$ErrorActionPreference = 'Continue'
$repo = Split-Path $PSScriptRoot -Parent

Write-Host "=== Circle D Flow Phase 0 Check ===" -ForegroundColor Cyan
Write-Host ""

# Disks
foreach ($letter in @('C','D','F')) {
    if (Test-Path "${letter}:\") {
        $v = Get-Volume -DriveLetter $letter -EA SilentlyContinue
        $free = [math]::Round($v.SizeRemaining / 1GB, 1)
        $label = if ($v.FileSystemLabel) { $v.FileSystemLabel } else { '-' }
        Write-Host "${letter}: $free GB free | $($v.FileSystem) | $label"
    } else {
        Write-Host "${letter}: not mounted"
    }
}

Write-Host ""
Write-Host "--- Repo ---" -ForegroundColor Yellow
Write-Host "Path: $repo"
$apiCount = @(Get-ChildItem (Join-Path $repo 'api') -Filter '*.js' -EA SilentlyContinue).Count
Write-Host "API routes: $apiCount (Vercel Hobby limit: 12)"
if ($apiCount -gt 12) { Write-Host "WARN: merge API handlers or upgrade Vercel plan" -ForegroundColor Red }

@(
    'js/cdf_runtime_config.js',
    'vercel.json',
    'CIRCLE_D_FLOW_PHASE0.md',
    'pages/lapa71_register.html',
    'pages/admin_registrations.html',
    'pages/kyh/index.html'
) | ForEach-Object {
    $p = Join-Path $repo $_
    if (Test-Path $p) { Write-Host "OK   $_" } else { Write-Host "MISSING $_" }
}

Write-Host ""
Write-Host "--- D: masters ---" -ForegroundColor Yellow
@('D:\CircleDFlow', 'D:\KissYourHeart', 'D:\Wakungo_Content_Studio\Lapa71') | ForEach-Object {
    if (Test-Path $_) { Write-Host "OK   $_" } else { Write-Host "MISSING $_" }
}

Write-Host ""
Write-Host "--- Video pipeline ---" -ForegroundColor Yellow
$ft = 'D:\Wakungo_Content_Studio\Lapa71\04_videos_compressed\Full_Takes'
if (Test-Path $ft) {
    $n = (Get-ChildItem $ft -Filter '*.mp4' -EA SilentlyContinue).Count
    Write-Host "Proxies: $n / 80 target"
    foreach ($id in @('1507','1508','1509','1510')) {
        $f = Join-Path $ft "DSC_${id}_proxy_1080p.mp4"
        if (Test-Path $f) { Write-Host "  DSC_$id : done" } else { Write-Host "  DSC_$id : pending" }
    }
}
$ff = @(Get-Process ffmpeg -EA SilentlyContinue).Count
$py = @(Get-Process python -EA SilentlyContinue).Count
Write-Host "Active: ffmpeg=$ff python=$py"

Write-Host ""
Write-Host "--- Env template ---" -ForegroundColor Yellow
$ex = Join-Path $repo '.env.example'
if (Test-Path $ex) {
    Get-Content $ex | Where-Object { $_ -match '^[A-Z_]+=' -and $_ -notmatch '^#' } | ForEach-Object {
        $name = ($_ -split '=', 2)[0]
        Write-Host "  $name (set in Vercel / local .env)"
    }
}

Write-Host ""
Write-Host "Full checklist: CIRCLE_D_FLOW_PHASE0.md" -ForegroundColor Green
