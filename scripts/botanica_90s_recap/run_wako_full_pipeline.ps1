﻿# Tiny launcher - all logic is in run_wako_full_pipeline.py
# Avoids Windows PowerShell 5.1 parse issues with longer scripts.
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)
python .\run_wako_full_pipeline.py
exit $LASTEXITCODE
