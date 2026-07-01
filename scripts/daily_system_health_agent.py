#!/usr/bin/env python3
"""
Daily system health agent — lightweight Lighthouse-style page scan.
Writes data/system_health_latest.json and optional Supabase system_reports row.
Run via cron / Task Scheduler once per day.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "system_health_latest.json"

BASE = os.environ.get("CDF_HEALTH_BASE", "https://circle-d-flow-web.vercel.app")

PAGES = [
    "/pages/dashboard.html",
    "/pages/quest_map.html",
    "/pages/quest_board.html",
    "/pages/marketplace.html",
    "/pages/artist_sanctuary.html",
    "/pages/high_palast.html",
    "/pages/vision_oasis.html",
    "/pages/colosseum.html",
]


def check_url(path: str) -> dict:
    url = BASE.rstrip("/") + path
    try:
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "CDF-Health-Agent/1.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            ok = 200 <= resp.status < 400
            return {"path": path, "status": resp.status, "ok": ok}
    except urllib.error.HTTPError as e:
        return {"path": path, "status": e.code, "ok": False, "error": str(e)}
    except Exception as e:
        return {"path": path, "status": 0, "ok": False, "error": str(e)}


def main() -> int:
    results = [check_url(p) for p in PAGES]
    failed = [r for r in results if not r["ok"]]
    report = {
        "scan_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "base_url": BASE,
        "pages_checked": len(results),
        "errors_open": len(failed),
        "fixed_count": 0,
        "failures": failed,
        "all": results,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} — {len(failed)} failure(s)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
