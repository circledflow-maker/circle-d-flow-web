import subprocess
from pathlib import Path

test = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\002\00_logs\_intro_py_test.mp4")
if test.exists():
    test.unlink()

# Working format from PowerShell test: C\:/Windows/Fonts/arialbd.ttf
fonts = [
    r"C\:/Windows/Fonts/arialbd.ttf",
    r"C:/Windows/Fonts/arialbd.ttf",
]
for font in fonts:
    # Avoid spaces in text first
    vf = f"drawtext=fontfile={font}:text='TEST':fontsize=24:fontcolor=white:x=10:y=10"
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", "color=c=black:s=640x360:d=1",
        "-vf", vf,
        "-c:v", "libx264", "-preset", "ultrafast",
        str(test),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print("font", font, "rc", r.returncode, "err", (r.stderr or "")[-200:], "size", test.stat().st_size if test.exists() else 0)
    if test.exists() and test.stat().st_size > 1000:
        # now with spaces via textfile
        tf = Path(r"D:\Wakungo_Content_Studio\Destiny Hostel\31July\002\00_logs\_text.txt")
        tf.write_text("TEST ONENESS", encoding="utf-8")
        vf2 = f"drawtext=fontfile={font}:textfile='{tf.as_posix()}':fontsize=24:fontcolor=white:x=10:y=10"
        # textfile path with spaces needs care - use short path without spaces
        tf2 = Path(r"D:\circle-d-flow-web\scripts\_drawtext_tmp.txt")
        tf2.write_text("TEST ONENESS", encoding="utf-8")
        vf3 = f"drawtext=fontfile={font}:textfile={tf2.as_posix()}:fontsize=24:fontcolor=white:x=10:y=10"
        if test.exists():
            test.unlink()
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "lavfi", "-i", "color=c=black:s=640x360:d=1",
            "-vf", vf3,
            "-c:v", "libx264", "-preset", "ultrafast",
            str(test),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True)
        print("textfile", font, "rc", r.returncode, "err", (r.stderr or "")[-300:], "size", test.stat().st_size if test.exists() else 0)
        if test.exists() and test.stat().st_size > 1000:
            print("SUCCESS", font)
            break
