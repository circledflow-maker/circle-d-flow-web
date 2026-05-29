import re

about_html_path = r'D:\circle-d-flow-web\pages\about.html'
with open(about_html_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "url('../C-RIZ/DSC_6730_1.JPG')": "url('../Assets/images/DSC_6730_1.JPG')",
    "url('../Portfolio_Content/Source_Drive/105NZ502/DSC_3614.JPG')": "url('../Assets/images/DSC_3614.JPG')",
    "url('../C-RIZ/DSC_6821.JPG')": "url('../Assets/images/DSC_6821.JPG')",
    "url('../Portfolio_Content/Source_Drive/105NZ502/DSC_3615.JPG')": "url('../Assets/images/DSC_3615.JPG')"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(about_html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated about.html images correctly")
