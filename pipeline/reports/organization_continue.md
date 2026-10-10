# Continue — fix ears float crash + proxy path

**Updated:** 2026-10-10T18:54:00Z

## What broke
1. Stage 4 `exit_1`: `ears.py` `ValueError: could not convert string to float: '-'` (ffmpeg astats prints `-` for RMS/Peak on some clips).
2. `03_Proxies_Compressed` **does not exist** on this PC — do not pass that path.

## Windows
```powershell
git fetch origin cursor/phase5-intake-sort-exit1-f46a
git checkout -f origin/cursor/phase5-intake-sort-exit1-f46a -- pipeline scripts/content_pipeline
pipeline\PHASE5_EARS_OPTIONAL.cmd
```

No args needed (uses `D:\Wakungo_Content_Studio\Botanica`, auto-upgrades only if a proxy dir exists).

Optional real proxy/pack root if you have one:
```powershell
pipeline\PHASE5_EARS_OPTIONAL.cmd D:\path\to\real\proxies
```

## Still gated
- Drive CREATE: skip (ENSURE done)
- Render 6–10: gated
