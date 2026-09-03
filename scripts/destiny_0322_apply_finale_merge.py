#!/usr/bin/env python3
"""Re-apply Finale merge on face_segments_0322.json (Baseck+Edoardo+Joao together)."""
from __future__ import annotations

import json
from pathlib import Path

from destiny_0322_face_assign import nudge_segments

LOGS = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\003\00_logs")
SEG = LOGS / "face_segments_0322.json"
MASTER_DUR = 2693.9


def main() -> int:
    if not SEG.exists():
        print("no segments yet")
        return 1
    segs = json.loads(SEG.read_text(encoding="utf-8"))
    fixed = nudge_segments(segs, MASTER_DUR)
    SEG.write_text(json.dumps(fixed, indent=2), encoding="utf-8")
    for s in fixed:
        print(f"  {s['artist']}: {s['start']:.0f}-{s['end']:.0f}s ({s['dur']:.0f}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
