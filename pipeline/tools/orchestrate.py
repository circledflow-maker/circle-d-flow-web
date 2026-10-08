#!/usr/bin/env python3
"""
Phase 4 — Thin Content Pipeline orchestrator (REUSE ONLY).

Calls existing scripts from pipeline/config/orchestrator.json.
Default mode: dry-run (print plan, run metadata-only stages).
Heavy render stages require --allow-render --execute.

Does NOT replace agents. Does NOT modify Google Drive.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
CFG_PATH = ROOT / "pipeline" / "config" / "orchestrator.json"
DATA = ROOT / "pipeline" / "data"
REPORTS = ROOT / "pipeline" / "reports"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_cfg() -> dict[str, Any]:
    return json.loads(CFG_PATH.read_text(encoding="utf-8"))


def fill(args: list[str], variables: dict[str, str]) -> list[str]:
    out = []
    for a in args:
        s = a
        for k, v in variables.items():
            s = s.replace("{" + k + "}", v)
        if "{" in s and "}" in s:
            # unresolved optional args — skip whole stage later
            out.append(s)
        else:
            out.append(s)
    return out


def has_unresolved(args: list[str]) -> bool:
    return any("{" in a and "}" in a for a in args)


def project_detect() -> dict[str, Any]:
    fm_path = DATA / "folder_map.json"
    inv_path = DATA / "drive_inventory.json"
    result: dict[str, Any] = {
        "created_at": utc_now(),
        "projects": [],
        "artists_roots": [],
        "source": str(fm_path) if fm_path.exists() else None,
    }
    if not fm_path.exists() and not inv_path.exists():
        result["error"] = "Run Drive Discovery first (stage 1)"
        return result

    inv = json.loads(inv_path.read_text(encoding="utf-8")) if inv_path.exists() else {"folders": []}
    folders = inv.get("folders") or []
    # Prefer top-level known projects
    wanted = {"Planning", "Lapa71", "Botanica", "Content Pipeline"}
    for f in folders:
        path = f.get("path") or ""
        name = f.get("folder_name") or ""
        if path in wanted or name in wanted:
            result["projects"].append(
                {
                    "name": name,
                    "path": path,
                    "folder_id": f.get("folder_id"),
                    "classification": f.get("classification"),
                    "files": f.get("number_of_files"),
                    "subfolders": f.get("number_of_subfolders"),
                }
            )
        if f.get("folder_id") in (
            "1OLOk__QJ2TWVvcgnhu9wEV4rYF6ALc7Q",
            "1Ss3ypxTiJgTCW-ucsLLbjEbG653RuRbk",
        ) or path in ("Artists", "BotanicaArtistPack"):
            result["artists_roots"].append(
                {
                    "name": name,
                    "path": path,
                    "folder_id": f.get("folder_id"),
                    "files": f.get("number_of_files"),
                    "subfolders": f.get("number_of_subfolders"),
                }
            )

    # Arpan schema check
    arpan = [f for f in folders if (f.get("path") or "").startswith("Artists/Arpan")]
    result["arpan_schema_nodes"] = [
        {"path": f.get("path"), "files": f.get("number_of_files"), "subs": f.get("number_of_subfolders")}
        for f in sorted(arpan, key=lambda x: x.get("path") or "")
    ]
    out = DATA / "project_detection.json"
    out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def qa_gate() -> dict[str, Any]:
    manifest_path = DATA / "media_manifest.json"
    intake_path = DATA / "intake_plan.json"
    gate: dict[str, Any] = {
        "created_at": utc_now(),
        "ok": True,
        "checks": [],
        "blockers": [],
        "warnings": [],
    }

    def check(name: str, ok: bool, detail: str, blocker: bool = False) -> None:
        gate["checks"].append({"name": name, "ok": ok, "detail": detail})
        if not ok:
            gate["ok"] = False if blocker else gate["ok"]
            (gate["blockers"] if blocker else gate["warnings"]).append(f"{name}: {detail}")

    if manifest_path.exists():
        m = json.loads(manifest_path.read_text(encoding="utf-8"))
        total = m.get("meta", {}).get("total_media") or len(m.get("media") or [])
        check("media_manifest_present", True, f"media={total}")
        check("media_non_zero", total > 0, f"total_media={total}", blocker=False)
    else:
        check("media_manifest_present", False, "missing — run stage 1", blocker=True)

    if intake_path.exists():
        plan = json.loads(intake_path.read_text(encoding="utf-8"))
        summary = plan.get("summary") or {}
        check("intake_plan_present", True, json.dumps(summary))
        creates = plan.get("drive_create_proposals") or []
        if creates:
            gate["warnings"].append(f"drive_create_proposals={len(creates)} (not executed)")
    else:
        check("intake_plan_present", False, "missing — run stage 3 when local source available", blocker=False)

    # Conflict guard reminders
    gate["canonical_locks"] = {
        "social_export": "v25_revised_shorts_agent.py",
        "recap": "run_botanica_recap.py",
        "youtube": "run_botanica_recap_16x9.py",
    }
    out = DATA / "qa_gate.json"
    out.write_text(json.dumps(gate, indent=2), encoding="utf-8")
    return gate


def write_run_report(run: dict[str, Any]) -> Path:
    REPORTS.mkdir(parents=True, exist_ok=True)
    path = REPORTS / "orchestrator_run_report.md"
    lines = [
        "# Content Pipeline — Orchestrator Run Report",
        "",
        f"**Created:** {run.get('created_at')}",
        f"**Mode:** {run.get('mode')}",
        f"**Allow render:** {run.get('allow_render')}",
        f"**Execute:** {run.get('execute')}",
        "",
        "## Stages",
        "",
    ]
    for s in run.get("stages") or []:
        lines.append(
            f"- **{s.get('id')}. {s.get('name')}** — `{s.get('status')}`"
            + (f" — {s.get('detail')}" if s.get("detail") else "")
        )
        if s.get("cmd"):
            lines.append(f"  - cmd: `{' '.join(s['cmd'][:12])}{' …' if len(s['cmd'])>12 else ''}`")
    lines += [
        "",
        "## Policy",
        "- Existing agents only (no replacements)",
        "- Drive not modified by orchestrator",
        "- Render stages gated by `--allow-render --execute`",
        "",
        "### STOP",
        "Approve before enabling render stages on production media.",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def run_cmd(cmd: list[str], dry: bool) -> tuple[int, str]:
    if dry:
        return 0, "dry_run"
    try:
        r = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
        detail = (r.stderr or r.stdout or "")[-500:]
        return r.returncode, detail
    except Exception as e:  # noqa: BLE001
        return 2, str(e)


def main() -> int:
    ap = argparse.ArgumentParser(description="Thin CDF content pipeline orchestrator")
    ap.add_argument("--execute", action="store_true", help="Actually run enabled stages (still respects render gate)")
    ap.add_argument("--allow-render", action="store_true", help="Permit high-cost render stages")
    ap.add_argument("--only", type=str, default="", help="Comma-separated stage ids to run (e.g. 1,2,5,11)")
    ap.add_argument("--list", action="store_true", help="List stages and exit")
    ap.add_argument(
        "--local-root",
        type=str,
        default=os.environ.get("BOTANICA_ROOT") or r"D:\Wakungo_Content_Studio\Botanica",
        help="Local project root for intake/recap stages",
    )
    ap.add_argument("--event-name", type=str, default="Botanica 90s")
    ap.add_argument("--internal-project-detect", action="store_true")
    ap.add_argument("--internal-qa", action="store_true")
    ap.add_argument("--internal-report", action="store_true")
    args = ap.parse_args()

    if args.internal_project_detect:
        print(json.dumps(project_detect(), indent=2))
        return 0
    if args.internal_qa:
        print(json.dumps(qa_gate(), indent=2))
        return 0
    if args.internal_report:
        path = write_run_report(
            {
                "created_at": utc_now(),
                "mode": "report_only",
                "allow_render": False,
                "execute": False,
                "stages": [],
            }
        )
        print(path)
        return 0

    cfg = load_cfg()
    stages = cfg.get("stages") or []
    if args.list:
        for s in stages:
            flags = []
            if s.get("metadata_only"):
                flags.append("meta")
            if s.get("requires_render"):
                flags.append("render")
            if not s.get("enabled_by_default"):
                flags.append("opt-in")
            print(f"{s['id']:2}  {s['name']:32} cost={s.get('cost'):12} {' '.join(flags)}")
        return 0

    only: Optional[set[int]] = None
    if args.only.strip():
        only = {int(x.strip()) for x in args.only.split(",") if x.strip()}

    variables = {
        "local_project_root": args.local_root,
        "event_name": args.event_name,
        "sample_media_path": "",  # optional; stage 4 skipped unless provided via env
    }
    if os.environ.get("CDF_SAMPLE_MEDIA"):
        variables["sample_media_path"] = os.environ["CDF_SAMPLE_MEDIA"]

    dry = not args.execute
    run: dict[str, Any] = {
        "created_at": utc_now(),
        "mode": "dry_run" if dry else "execute",
        "allow_render": bool(args.allow_render),
        "execute": bool(args.execute),
        "local_root": args.local_root,
        "event_name": args.event_name,
        "stages": [],
    }

    print(f"Orchestrator mode={'DRY-RUN' if dry else 'EXECUTE'} allow_render={args.allow_render}")
    print(f"Config: {CFG_PATH}")

    for s in stages:
        sid = int(s["id"])
        if only is not None and sid not in only:
            continue

        status = "planned"
        detail = ""
        cmd: list[str] = []

        # Gates
        if s.get("requires_render") and not args.allow_render:
            status = "skipped_needs_allow_render"
            detail = s.get("requires_flag") or "--allow-render"
            run["stages"].append({"id": sid, "name": s["name"], "status": status, "detail": detail})
            print(f"[{sid}] SKIP (render gated): {s['name']}")
            continue

        if not s.get("enabled_by_default") and only is None and not (s.get("requires_render") and args.allow_render):
            # opt-in render stages already handled; other opt-ins skip unless --only
            if s.get("requires_render"):
                pass
            else:
                status = "skipped_opt_in"
                run["stages"].append({"id": sid, "name": s["name"], "status": status})
                print(f"[{sid}] SKIP (opt-in): {s['name']}")
                continue

        callable_ = s.get("callable") or {}
        script = callable_.get("script")
        if not script:
            status = "error_no_script"
            run["stages"].append({"id": sid, "name": s["name"], "status": status})
            continue

        # Internal stages
        if script.endswith("orchestrate.py") and "--internal-project-detect" in (callable_.get("args") or []):
            # Safe metadata derive — always compute from existing inventory
            pd = project_detect()
            status = "ok" if not pd.get("error") else "needs_discovery"
            detail = f"projects={len(pd.get('projects') or [])} arpan_nodes={len(pd.get('arpan_schema_nodes') or [])}"
            run["stages"].append({"id": sid, "name": s["name"], "status": status, "detail": detail})
            print(f"[{sid}] {status}: {s['name']} {detail}")
            continue

        if script.endswith("orchestrate.py") and "--internal-qa" in (callable_.get("args") or []):
            if dry:
                # still useful to compute QA in dry-run from existing artifacts
                g = qa_gate()
                status = "ok_dry_computed"
                detail = f"ok={g.get('ok')} blockers={len(g.get('blockers') or [])}"
            else:
                g = qa_gate()
                status = "ok" if g.get("ok") else "qa_failed"
                detail = f"blockers={len(g.get('blockers') or [])}"
            run["stages"].append({"id": sid, "name": s["name"], "status": status, "detail": detail})
            print(f"[{sid}] {status}: {s['name']} {detail}")
            continue

        if script.endswith("orchestrate.py") and "--internal-report" in (callable_.get("args") or []):
            # Always materialized at end via write_run_report() — not a failure.
            status = "ok_end"
            detail = "report written after stage loop"
            run["stages"].append({"id": sid, "name": s["name"], "status": status, "detail": detail})
            print(f"[{sid}] ok: {s['name']} (finalized at end)")
            continue

        if callable_.get("mode") == "per_file_optional" and not variables.get("sample_media_path"):
            status = "skipped_no_sample"
            detail = "set CDF_SAMPLE_MEDIA or rely on intake_sort"
            run["stages"].append({"id": sid, "name": s["name"], "status": status, "detail": detail})
            print(f"[{sid}] SKIP: {s['name']} ({detail})")
            continue

        raw_args = list(callable_.get("args") or [])
        stage_args = fill(raw_args, variables)
        if has_unresolved(stage_args):
            status = "skipped_unresolved_args"
            detail = "missing variables for args"
            run["stages"].append({"id": sid, "name": s["name"], "status": status, "detail": detail, "args": stage_args})
            print(f"[{sid}] SKIP: {s['name']} unresolved args")
            continue

        script_path = ROOT / script
        cmd = [sys.executable, str(script_path), *stage_args]
        if not script_path.exists():
            status = "missing_script"
            detail = script
            run["stages"].append({"id": sid, "name": s["name"], "status": status, "detail": detail, "cmd": cmd})
            print(f"[{sid}] MISSING: {script}")
            continue

        # Metadata-only / enabled stages run in dry-run as print; with --execute they run
        # For dry-run: still allow stage 1 discovery? User may want refresh — only if --execute
        code, detail = run_cmd(cmd, dry=dry)
        status = "dry_run" if dry else ("ok" if code == 0 else f"exit_{code}")
        run["stages"].append(
            {"id": sid, "name": s["name"], "status": status, "detail": detail, "cmd": cmd, "cost": s.get("cost")}
        )
        print(f"[{sid}] {status}: {s['name']}")

    # Always write run report
    report_path = write_run_report(run)
    run_path = DATA / "orchestrator_last_run.json"
    DATA.mkdir(parents=True, exist_ok=True)
    run_path.write_text(json.dumps(run, indent=2), encoding="utf-8")
    print(f"\nRun JSON → {run_path}")
    print(f"Report  → {report_path}")
    print("STOP: render stages remain gated unless --allow-render --execute")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
