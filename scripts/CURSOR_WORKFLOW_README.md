# Cursor Workflow Scripts (safe copies)

These files were created by Cursor. They **do not** replace Antigravity originals.

| File | Purpose |
|------|---------|
| `gemini_helper_cursor_workflow.py` | API key check + model fallback |
| `test_models_cursor_workflow.py` | List working Gemini models |
| `ig_30_days_griot_cursor_workflow.py` | 30-day IG prep → `Assets/IG_30_Days_cursor_workflow/` |

## Before running

1. Renew your Gemini key at https://aistudio.google.com/apikey if you see `API_KEY_INVALID` or `expired`.
2. Update **`GEMINI_API_KEY` in `.env` yourself** (Cursor does not edit `.env`).

## Commands (from `D:\circle-d-flow-web`)

```powershell
cd D:\circle-d-flow-web
python scripts\test_models_cursor_workflow.py
python scripts\ig_30_days_griot_cursor_workflow.py
```

Optional: force one model:

```powershell
$env:GEMINI_MODEL = "gemini-2.5-flash"
python scripts\ig_30_days_griot_cursor_workflow.py
```

## Original vs workflow

| Original (Antigravity) | Cursor workflow |
|------------------------|-----------------|
| `ig_30_days_griot.py` | `ig_30_days_griot_cursor_workflow.py` |
| `Assets/IG_30_Days/` | `Assets/IG_30_Days_cursor_workflow/` |
