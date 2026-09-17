from pathlib import Path

p = Path(r"D:/circle-d-flow-web/scripts/lapa71_editorial/assemble_directed_youtube.py")
text = p.read_text(encoding="utf-8")
start = text.find("def stage_hero(")
end = text.find("\ndef pill_still_card(")
if start < 0 or end < 0:
    raise SystemExit(f"markers missing {start} {end}")

new = '''def stage_hero(
    main: Path,
    out_fs: Path,
    out_pip: Path | None,
    take: float,
    *,
    handle: str,
    line2: str | None,
    guest: Path | None,
    ss: float = 4.0,
    used_guest: set[str],
) -> list[Path]:
    """Artist stage: clean FS first 3s (no ViV), then FS+handle, then guest PiP."""
    outs: list[Path] = []
    d = probe_dur(main)
    take = min(take, max(8.0, d - ss - 0.2))
    t_open = min(3.0, max(2.0, take * 0.12))
    t_fs = max(t_open + 4.0, take * 0.55)
    if t_fs >= take:
        t_fs = max(t_open + 3.0, take * 0.6)
    t_pip = take - t_fs
    out_open = out_fs.with_name(out_fs.name.replace("_fs", "_open"))
    if out_open == out_fs:
        out_open = out_fs.with_name(out_fs.stem + "_open" + out_fs.suffix)
    # Clean opening: no PiP for first ~3s
    outs.append(render_plain(main, out_open, ss, t_open))
    outs.append(render_plain(
        main, out_fs, ss + t_open, max(0.5, t_fs - t_open),
        vf_extra=draw_ig(handle, line2) if handle else "",
    ))
    if out_pip and guest and t_pip >= 6:
        key = str(guest.resolve())
        if key not in used_guest:
            used_guest.add(key)
            outs.append(render_float_ig(
                main, guest, out_pip, t_pip,
                main_ss=ss + t_fs,
                handle=handle,
                line2=line2,
                corner="br" if hash(handle) % 2 == 0 else "tl",
            ))
        else:
            outs.append(render_plain(
                main, out_pip, ss + t_fs, t_pip,
                vf_extra=draw_ig(handle, line2) if handle else "",
            ))
    return outs


'''
p.write_text(text[:start] + new + text[end:], encoding="utf-8")
print("ok")
