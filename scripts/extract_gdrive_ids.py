import requests
import re
import json

url = 'https://drive.google.com/drive/folders/15uz3yZYpc_ZrcWweedLGtZA1dECCjrgQ'
res = requests.get(url)
text = res.text

# Try to find file metadata JSON objects in the page source
ids = re.findall(r'\["([a-zA-Z0-9_-]{28,33})","([^"]+\.[a-zA-Z]{3,4})"', text, re.IGNORECASE)

print("Found files:", len(ids))
unique_files = list({(i, n) for i, n in ids})
for file_id, name in unique_files[:15]:
    print(file_id, name)
