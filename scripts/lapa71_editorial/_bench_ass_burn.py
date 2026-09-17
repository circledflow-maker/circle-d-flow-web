#!/usr/bin/env python3
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assemble_directed_polish_v5 import (
    ASSETS, FLOW_STAMP_HITS, WORK, build_ass, make_flow_creator_stamp, probe_dur, run,
)

ass = build_ass({})
print("ass dialogues", sum(1 for l in ass.read_text(encoding="utf-8").splitlines() if l.startswith("Dialogue")))
src = WORK / "head_src.mp4"
kh = ASSETS / "kh_logo_rgba.png"
wako = ASSETS / "wako_logo_rgba.png"
mude = ASSETS / "mude_logo_rgba.png"
humble = ASSETS / "humble_logo_rgba.png"
stamp = make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")
ass_esc = str(ass).replace("\\", "/").replace(":", "\\:")
ens = "+".join(f"between(t\\,{a:.2f}\\,{b:.2f})" for a, b in FLOW_STAMP_HITS if a < 340)
fc = (
    "[1:v]scale=90:-1,format=rgba[kh];"
    "[2:v]scale=240:-1,format=rgba[mudec];"
    "[2:v]scale=90:-1,format=rgba[mudes];"
    "[3:v]scale=90:-1,format=rgba[wk];"
    "[4:v]scale=90:-1,format=rgba[hum];"
    "[5:v]format=rgba,scale=300:-1[st];"
    f"[0:v]ass='{ass_esc}'[base];"
    "[base][kh]overlay=40:40:enable='gte(t,6)'[v1];"
    "[v1][mudec]overlay=(W-w)/2:(H-h)/2:enable='between(t,25,28)'[v2];"
    "[v2][mudes]overlay=W-w-40:40:enable='gte(t,28)'[v3];"
    "[v3][wk]overlay=W-w-40:140:enable='gte(t,35)'[v4];"
    "[v4][hum]overlay=W-w-40:130:enable='gte(t,326)'[v5];"
    f"[v5][st]overlay=W-w-360:H-h-120:enable='{ens}'[v]"
)
out = WORK / "_ass_head_test.mp4"
t0 = time.time()
run([
    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
    "-t", "30", "-i", str(src),
    "-loop", "1", "-i", str(kh),
    "-loop", "1", "-i", str(mude),
    "-loop", "1", "-i", str(wako),
    "-loop", "1", "-i", str(humble),
    "-loop", "1", "-i", str(stamp),
    "-filter_complex", fc,
    "-map", "[v]", "-map", "0:a",
    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "21", "-threads", "1",
    "-c:a", "aac", "-b:a", "192k", "-shortest", str(out),
])
print("30s elapsed", round(time.time() - t0, 1), "out", probe_dur(out))
