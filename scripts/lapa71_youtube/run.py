#!/usr/bin/env python3
"""Run Lapa71 YouTube multi-cam MVP: ingest → assemble."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main() -> int:
    for script in ("ingest.py", "assemble_youtube.py"):
        print(f"== {script} ==", flush=True)
        r = subprocess.call([sys.executable, str(HERE / script)])
        if r != 0:
            return r
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
