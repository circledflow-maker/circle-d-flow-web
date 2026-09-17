from pathlib import Path

p = Path(r"D:/circle-d-flow-web/scripts/lapa71_editorial/assemble_directed_polish_v5.py")
text = p.read_text(encoding="utf-8")
start = text.find("def burn_logos_and_ass(")
end = text.find("\ndef burn_tail_artist_cards(")
if end < 0:
    end = text.find("\ndef build_tail_block(")
if start < 0 or end < 0:
    raise SystemExit(f"markers missing {start} {end}")
new = Path(r"D:/circle-d-flow-web/scripts/lapa71_editorial/_burn_drawtext_snip.py").read_text(encoding="utf-8")
p.write_text(text[:start] + new + text[end:], encoding="utf-8")
print("patched", start, end)
