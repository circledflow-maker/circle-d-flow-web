import re

about_html_path = r'D:\circle-d-flow-web\pages\about.html'
with open(about_html_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "url('../Assets/lightroom_sync/98f625618feaf3e39ea0cda06e862613.jpg')": "url('../C-RIZ/DSC_6730_1.JPG')",
    "url('../Assets/lightroom_sync/0fb23a52ea5279321f0d56c682b46aaa.jpg')": "url('../Portfolio_Content/Source_Drive/105NZ502/DSC_3614.JPG')",
    "url('../Assets/lightroom_sync/32ab0c46493045b0e5f765df3ecd682a.jpg')": "url('../Portfolio_Content/Source_Drive/105NZ502/DSC_3615.JPG')"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(about_html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated about.html images correctly")
