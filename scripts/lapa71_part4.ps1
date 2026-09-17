$ErrorActionPreference = 'Continue'
$env:TF_CPP_MIN_LOG_LEVEL = '2'
$env:TF_ENABLE_ONEDNN_OPTS = '0'
$env:LAPA71_SRC = 'F:\Part4'
$env:LAPA71_OUT = 'D:\Wakungo_Content_Studio\Lapa71'
$log = Join-Path $env:LAPA71_OUT '00_logs\part4_runner.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

function L($m) {
    $line = "[{0:HH:mm:ss}] {1}" -f (Get-Date), $m
    Write-Host $line
    Add-Content -Path $log -Value $line
}

L 'Lapa71 part4 FAST — photos, then compress, then faces'
& powershell -NoProfile -ExecutionPolicy Bypass -File 'D:\circle-d-flow-web\scripts\lapa71_fast_workflow.ps1'
$code = $LASTEXITCODE
L "exit=$code"
exit $code
