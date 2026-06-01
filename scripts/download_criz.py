import os
import subprocess
import sys

def install_and_run():
    subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
    import gdown
    url = 'https://drive.google.com/drive/folders/15uz3yZYpc_ZrcWweedLGtZA1dECCjrgQ?usp=drive_link'
    output = 'D:/circle-d-flow-web/Assets/C_Riz_Portfolio'
    os.makedirs(output, exist_ok=True)
    gdown.download_folder(url=url, output=output, quiet=False, use_cookies=False)

if __name__ == '__main__':
    install_and_run()
