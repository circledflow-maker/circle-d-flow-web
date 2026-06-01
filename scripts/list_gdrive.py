import re
import json
import urllib.request

url = "https://drive.google.com/drive/folders/15uz3yZYpc_ZrcWweedLGtZA1dECCjrgQ?usp=drive_link"
folder_id = re.search(r'folders/([^?]+)', url).group(1)

# gdown uses a specific URL to list folder contents:
list_url = f"https://drive.google.com/drive/folders/{folder_id}"

import gdown
from gdown.download_folder import get_id_from_url, download_folder

res = download_folder(url, quiet=True, use_cookies=False, remaining_ok=True)
print(res)
