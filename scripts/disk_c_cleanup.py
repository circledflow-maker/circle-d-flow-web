#!/usr/bin/env python3
"""Analyze C: vs D: duplicates for Circle D Flow / dev caches. Dry-run by default."""
import hashlib
import json
import os
import shutil
from pathlib import Path

DRY_RUN = os.environ.get("CDF_EXECUTE", "0") != "1"
REPORT = Path(r"D:\circle-d-flow-web\scripts\disk_cleanup_report.json")

SCAN_PAIRS = [
    (Path(os.environ.get("LOCALAPPDATA", r"C:\Users\user\AppData\Local")) / "npm-cache", Path(r"D:\npm-cache")),
    (Path(r"C:\Users\user\.cursor\projects"), Path(r"D:\circle-d-flow-web\.cursor-projects-mirror")),
    (Path(r"C:\Users\user\AppData\Roaming\Cursor\User\workspaceStorage"), None),
]

PROJECT_NAMES = {"circle-d-flow-web", "d-circle-d-flow-web", "circle-d-flow-dashboard"}


def file_hash(path: Path, chunk=1024 * 1024) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            b = f.read(chunk)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def dir_size(path: Path) -> int:
    total = 0
    if not path.exists():
        return 0
    for root, _, files in os.walk(path):
        for name in files:
            try:
                total += (Path(root) / name).stat().st_size
            except OSError:
                pass
    return total


def find_project_copies() -> list[dict]:
    hits = []
    for base in [Path(r"C:\Users\user"), Path(r"C:\Users\user\Documents"), Path(r"C:\Users\user\Desktop")]:
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_dir() and p.name in PROJECT_NAMES and "node_modules" not in str(p):
                hits.append({"path": str(p), "size_mb": round(dir_size(p) / 1024 / 1024, 1)})
    canonical = Path(r"D:\circle-d-flow-web")
    for h in hits:
        h["is_canonical"] = str(canonical).lower() == h["path"].lower()
        h["duplicate_of_d"] = not h["is_canonical"] and canonical.exists()
    return hits


def compare_dirs(a: Path, b: Path, max_files=500) -> dict:
    if not a.exists() or not b.exists():
        return {"error": "missing", "a": str(a), "b": str(b)}
    a_files = {f.name: f for f in a.rglob("*") if f.is_file()}
    b_files = {f.name: f for f in b.rglob("*") if f.is_file()}
    common = set(a_files) & set(b_files)
    dupes = []
    for name in list(common)[:max_files]:
        fa, fb = a_files[name], b_files[name]
        if fa.stat().st_size == fb.stat().st_size:
            dupes.append(name)
    return {
        "a": str(a), "b": str(b),
        "a_mb": round(dir_size(a) / 1024 / 1024, 1),
        "b_mb": round(dir_size(b) / 1024 / 1024, 1),
        "same_name_same_size": len(dupes),
        "sample_dupes": dupes[:20],
    }


def main():
    dry = os.environ.get("CDF_EXECUTE", "0") != "1"
    report = {
        "dry_run": dry,
        "c_free_hint": shutil.disk_usage("C:/").free // (1024 ** 3) if os.path.exists("C:/") else None,
        "d_free_hint": shutil.disk_usage("D:/").free // (1024 ** 3) if os.path.exists("D:/") else None,
        "project_copies": find_project_copies(),
        "comparisons": [],
        "actions": [],
    }

    npm_c = Path(os.environ.get("LOCALAPPDATA", "")) / "npm-cache"
    npm_d = Path(r"D:\npm-cache")
    if npm_c.exists() and npm_d.exists():
        report["comparisons"].append(compare_dirs(npm_c, npm_d))
        if report["comparisons"][-1]["a_mb"] > 50 and dry:
            report["actions"].append({
                "action": "clear_c_npm_cache",
                "path": str(npm_c),
                "reason": "D:\\npm-cache exists; set npm config cache to D and remove C cache",
                "cmd": "npm config set cache D:\\npm-cache && rmdir /s /q \"%LOCALAPPDATA%\\npm-cache\"",
            })

    for copy in report["project_copies"]:
        if copy.get("duplicate_of_d"):
            report["actions"].append({
                "action": "remove_duplicate_project_on_c",
                "path": copy["path"],
                "reason": "Canonical repo is D:\\circle-d-flow-web",
            })
            if not dry:
                shutil.rmtree(copy["path"], ignore_errors=True)

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"\nReport: {REPORT}")
    if dry:
        print("DRY RUN — set CDF_EXECUTE=1 to delete confirmed C duplicates only.")


if __name__ == "__main__":
    main()
