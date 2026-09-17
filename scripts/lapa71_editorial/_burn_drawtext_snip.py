def burn_logos_and_ass(base: Path, ass: Path, out: Path) -> Path:
    """ASS karaoke typewriter + corner logos + KH Flow Creator seal (no rotate — fast)."""
    if out.exists() and out.stat().st_size > 500_000:
        try:
            if probe_dur(out) > 60:
                return out
        except Exception:
            out.unlink(missing_ok=True)

    kh = ASSETS / "kh_logo_rgba.png"
    wako = ASSETS / "wako_logo_rgba.png"
    mude = ASSETS / "mude_logo_rgba.png"
    humble = ASSETS / "humble_logo_rgba.png"
    stamp = make_flow_creator_stamp(ASSETS / "flow_creator_stamp.png")

    total = probe_dur(base)
    chunk_len = 45.0
    chunks: list[Path] = []
    idx = 0
    t0 = 0.0
    while t0 < total - 0.05:
        t1 = min(total, t0 + chunk_len)
        cout = WORK / f"_burn_chunk_{idx:02d}.mp4"
        if cout.exists() and cout.stat().st_size > 80_000:
            try:
                if probe_dur(cout) > 2:
                    chunks.append(cout)
                    idx += 1
                    t0 = t1
                    continue
            except Exception:
                cout.unlink(missing_ok=True)

        print(f"  burn chunk {idx} {t0:.0f}-{t1:.0f}s", flush=True)
        cass = WORK / f"_burn_chunk_{idx:02d}.ass"
        shift_ass(ass, cass, t0, t1)
        ass_esc = str(cass).replace("\\", "/").replace(":", "\\:")
        hits = [(a, b) for a, b in FLOW_STAMP_HITS if b > t0 and a < t1]
        ens = "+".join(
            f"between(t\\,{max(0.0, a - t0):.2f}\\,{max(0.05, min(t1 - t0, b - t0)):.2f})"
            for a, b in hits
        ) or "0"

        if t0 < 40:
            fc = (
                f"[1:v]scale=90:-1,format=rgba[kh];"
                f"[2:v]scale=240:-1,format=rgba[mudec];"
                f"[2:v]scale=90:-1,format=rgba[mudes];"
                f"[3:v]scale=90:-1,format=rgba[wk];"
                f"[4:v]format=rgba,scale=280:-1[st];"
                f"[0:v]setsar=1,ass='{ass_esc}'[base];"
                f"[base][kh]overlay=40:40:enable='gte(t,{max(0, 6 - t0):.2f})'[v1];"
                f"[v1][mudec]overlay=(W-w)/2:(H-h)/2:enable='between(t,{max(0, 25 - t0):.2f},{max(0.05, 28 - t0):.2f})'[v2];"
                f"[v2][mudes]overlay=W-w-40:40:enable='gte(t,{max(0, 28 - t0):.2f})'[v3];"
                f"[v3][wk]overlay=W-w-40:140:enable='gte(t,{max(0, 35 - t0):.2f})'[v4];"
                f"[v4][st]overlay=W-w-340:H-h-110:enable='{ens}'[v]"
            )
            inputs = [
                "-ss", f"{t0:.2f}", "-t", f"{t1 - t0:.2f}", "-i", str(base),
                "-loop", "1", "-i", str(kh),
                "-loop", "1", "-i", str(mude),
                "-loop", "1", "-i", str(wako),
                "-loop", "1", "-i", str(stamp),
            ]
        else:
            fc = (
                f"[1:v]scale=90:-1,format=rgba[kh];"
                f"[2:v]scale=90:-1,format=rgba[wk];"
                f"[3:v]scale=90:-1,format=rgba[hum];"
                f"[4:v]format=rgba,scale=280:-1[st];"
                f"[0:v]setsar=1,ass='{ass_esc}'[base];"
                f"[base][kh]overlay=40:40[v1];"
                f"[v1][wk]overlay=W-w-40:40[v2];"
                f"[v2][hum]overlay=W-w-40:130:enable='gte(t,{max(0, 326 - t0):.2f})'[v3];"
                f"[v3][st]overlay=W-w-340:H-h-110:enable='{ens}'[v]"
            )
            inputs = [
                "-ss", f"{t0:.2f}", "-t", f"{t1 - t0:.2f}", "-i", str(base),
                "-loop", "1", "-i", str(kh),
                "-loop", "1", "-i", str(wako),
                "-loop", "1", "-i", str(humble),
                "-loop", "1", "-i", str(stamp),
            ]

        try:
            run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-nostats",
                *inputs,
                "-filter_complex", fc,
                "-map", "[v]", "-map", "0:a",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "21", "-threads", THREADS,
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                str(cout),
            ])
            # validate moov
            probe_dur(cout)
        except Exception:
            cout.unlink(missing_ok=True)
            raise
        chunks.append(cout)
        idx += 1
        t0 = t1

    lst = WORK / "_burn_concat.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in chunks), encoding="utf-8")
    print(f"  concat {len(chunks)} burn chunks", flush=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(lst),
        "-c", "copy", str(out),
    ])
    return out

