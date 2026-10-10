#!/usr/bin/env python3
"""
Summarize pipeline/data/intake_plan.json for human approval.

Read-only. Does not touch Drive. Does not render.
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"
PLAN = DATA / "intake_plan.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main() -> int:
    plan_path = Path(sys.argv[1]) if len(sys.argv) > 1 else PLAN
    if not plan_path.exists():
        print(f"MISSING: {plan_path}")
        print("Run pipeline\\PHASE5_EARS_OPTIONAL.cmd first (writes intake_plan.json).")
        return 1

    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    items = plan.get("items") or []
    summary = plan.get("summary") or {}
    creates = plan.get("drive_create_proposals") or []

    by_action = Counter(it.get("action") for it in items)
    by_artist = Counter(it.get("artist") for it in items)
    by_ears = Counter((it.get("ears") or {}).get("class") for it in items)

    lines = [
        "# Intake plan review",
        "",
        f"**Reviewed:** {utc_now()}",
        f"**Source plan:** `{plan_path}`",
        f"**Event:** {plan.get('event')}",
        f"**Local source:** {plan.get('source')}",
        f"**Listen:** {plan.get('listen')}",
        "",
        "## Summary",
        "",
        "```json",
        json.dumps(summary, indent=2),
        "```",
        "",
        "## By action",
        "",
    ]
    for k, n in by_action.most_common():
        lines.append(f"- `{k}`: {n}")

    lines += ["", "## Ears classes", ""]
    for k, n in by_ears.most_common():
        lines.append(f"- `{k}`: {n}")

    lines += ["", "## Top artists / buckets", ""]
    for k, n in by_artist.most_common(20):
        lines.append(f"- **{k}**: {n}")

    lines += [
        "",
        "## Drive CREATE proposals (NOT executed)",
        "",
        f"Count: **{len(creates)}**",
        "",
    ]
    for d in creates:
        lines.append(f"- Artists/`{d.get('name')}`/ (mirror {d.get('mirror')}, status={d.get('status')})")

    review_items = [it for it in items if it.get("action") == "review"]
    lines += ["", f"## Review queue (`_UNASSIGNED_REVIEW`) — {len(review_items)}", ""]
    for it in review_items[:40]:
        ear = (it.get("ears") or {}).get("class")
        lines.append(f"- `{it.get('name')}` kind={it.get('kind')} ears={ear}")
    if len(review_items) > 40:
        lines.append(f"- … +{len(review_items) - 40} more")

    lines += [
        "",
        "## STOP",
        "",
        "- Approve before any Drive folder creation.",
        "- Approve before `--allow-render --execute`.",
        "- Local hardlink staging only with `intake_sort.py --apply` (never Drive mutate).",
        "",
    ]

    REPORTS.mkdir(parents=True, exist_ok=True)
    out_md = REPORTS / "intake_plan_review.md"
    out_json = DATA / "intake_plan_review.json"
    out_md.write_text("\n".join(lines), encoding="utf-8")
    out_json.write_text(
        json.dumps(
            {
                "created_at": utc_now(),
                "plan": str(plan_path),
                "summary": summary,
                "by_action": dict(by_action),
                "by_ears": dict(by_ears),
                "by_artist": dict(by_artist.most_common(50)),
                "drive_create_proposals": creates,
                "review_count": len(review_items),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print(f"Plan items: {len(items)}")
    print(f"Summary: {json.dumps(summary)}")
    print(f"Drive CREATE proposals: {len(creates)} (not executed)")
    print(f"Review queue: {len(review_items)}")
    print(f"Report -> {out_md}")
    print(f"JSON   -> {out_json}")
    print("STOP: awaiting approval before Drive create or render.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
