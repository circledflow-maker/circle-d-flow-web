#!/usr/bin/env python3
"""Run Editorial Engine: 30s IG/YT exemplars + chronological YouTube."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main() -> int:
    for script in (
        "ingest_guest_broll.py",
        "assemble_editorial_30s.py",
        "assemble_chronological_youtube.py",
    ):
        print(f"== {script} ==", flush=True)
        r = subprocess.call([sys.executable, str(HERE / script)])
        if r != 0:
            return r
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
