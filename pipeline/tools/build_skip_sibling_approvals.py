#!/usr/bin/env python3
"""
Build MEDIUM approvals for UNASSIGNED skips that have a single sibling artist.

Does not execute moves. Writes pipeline/data/unassigned_skip_sibling_approvals.json

Ambiguous / no-sibling clusters (DSC_1568, DSC_1601, mixed 1565) stay out.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"
SRC = DATA / "unassigned_approvals.json"
OUT = DATA / "unassigned_skip_sibling_approvals.json"

DSC = re.compile(r"DSC[_-]?(\d+)", re.I)

SUB_FOR = {
    "video": "01_VIDEOS_PERFORMANCE",
    "photo": "02_PORTRAITS",
    "frame": "03_FRAMES",
}


def kind(name: str) -> str:
    n = name.lower()
    if n.endswith((".mp4", ".mov", ".m4v")) or "unassigned_stable" in n:
        return "video"
    if "_edit" in n:
        return "photo"
    return "frame"


def main() -> int:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    by_dsc: dict[int, list] = defaultdict(list)
    for a in data["assignments"]:
        m = DSC.search(a["name"] or "")
        if m:
            by_dsc[int(m.group(1))].append(a)

    proposals = []
    held = []
    for a in data["assignments"]:
        if a.get("action") != "skip":
            continue
        m = DSC.search(a["name"] or "")
        n = int(m.group(1)) if m else None
        sib_packs = sorted(
            {
                x.get("pack_folder")
                for x in by_dsc.get(n or -1, [])
                if x.get("action") == "move" and x.get("pack_folder")
            }
        )
        if len(sib_packs) != 1:
            held.append(
                {
                    "file_id": a["file_id"],
                    "name": a["name"],
                    "reason": "ambiguous_or_no_sibling",
                    "sibling_packs": sib_packs,
                }
            )
            continue
        pack = sib_packs[0]
        k = kind(a["name"])
        # Prefer Artists/Botanica for Felippe/Wako; pack for others
        prefer = pack in ("10_wako.kungo_Wako_Kungo", "11_filipesax_Felippe_Sax")
        artists = {
            "09_edoardostatuto_Edo_Edoardo_Statuto": "Edo",
            "02_noua_Noua": "Noua",
            "05_joaoredondomaia_Joao_Redondo_Maia": "João Redondo Maia",
            "10_wako.kungo_Wako_Kungo": "Wako Kungo",
            "11_filipesax_Felippe_Sax": "Felippe Sax",
        }.get(pack)
        proposals.append(
            {
                "file_id": a["file_id"],
                "name": a["name"],
                "action": "move",
                "pack_folder": pack,
                "pack_subfolder": SUB_FOR[k],
                "artists_folder": artists,
                "prefer_artists_botanica": prefer,
                "confidence": "MEDIUM",
                "reason": f"Single sibling artist on DSC_{n}: {pack}",
            }
        )

    out = {
        "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "skip_sibling_inference",
        "policy": "MEDIUM — single-sibling skips only; human may edit before execute",
        "assignments": proposals,
        "held_for_review": held,
    }
    OUT.write_text(json.dumps(out, indent=2), encoding="utf-8")
    lines = [
        "# Skip-sibling approvals (MEDIUM)",
        "",
        f"**Created:** {out['created_at']}",
        f"**Proposed moves:** {len(proposals)}",
        f"**Still held:** {len(held)} (DSC_1568 / DSC_1601 / mixed)",
        "",
        "## Proposed",
        "",
    ]
    for p in proposals:
        lines.append(f"- `{p['name']}` → `{p['pack_folder']}` ({p['reason']})")
    lines += ["", "## Held", ""]
    for h in held:
        lines.append(f"- `{h['name']}` — {h['reason']} {h.get('sibling_packs')}")
    lines += [
        "",
        "## Execute",
        "```bat",
        "copy /Y pipeline\\data\\unassigned_skip_sibling_approvals.json pipeline\\data\\unassigned_approvals.json",
        "pipeline\\EXECUTE_UNASSIGNED_APPROVALS.cmd",
        "```",
        "",
    ]
    (REPORTS / "unassigned_skip_sibling.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Proposed: {len(proposals)}  Held: {len(held)}")
    print(f"Wrote {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
