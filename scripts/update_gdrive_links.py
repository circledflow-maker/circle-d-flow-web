import re

hempy_link = "https://drive.google.com/drive/folders/1nB5AHnpyzyTki1AOhBomnxL3eoZpMy02?usp=drive_link"
secret_garden_link = "https://drive.google.com/drive/folders/11oNl9_wgJVrXTfPn5Sf2YkQiYfL65BjV?usp=sharing"

# 1. Update bantaba.html
bantaba_path = r"D:\circle-d-flow-web\pages\bantaba.html"
with open(bantaba_path, 'r', encoding='utf-8') as f:
    b_content = f.read()

# Replace HempyRoots portfolio link
b_content = re.sub(r'(<h3[^>]*>HempyRoots</h3>.*?<a href="#" target="_blank" class="text-\[#d4af37\] font-mono text-sm \n?hover:text-white transition ml-2">\[ PORTFOLIO \])', 
                   lambda m: m.group(1).replace('href="#"', f'href="{hempy_link}"'), 
                   b_content, flags=re.DOTALL)

# Replace Secret Garden LX portfolio link
b_content = re.sub(r'(<h3[^>]*>Secret Garden LX</h3>.*?<a href="#" target="_blank" class="text-\[#d4af37\] font-mono text-sm \n?hover:text-white transition ml-2">\[ PORTFOLIO \])', 
                   lambda m: m.group(1).replace('href="#"', f'href="{secret_garden_link}"'), 
                   b_content, flags=re.DOTALL)

with open(bantaba_path, 'w', encoding='utf-8') as f:
    f.write(b_content)


# 2. Update partners.html
partners_path = r"D:\circle-d-flow-web\pages\partners.html"
with open(partners_path, 'r', encoding='utf-8') as f:
    p_content = f.read()

p_content = re.sub(r'(<h3[^>]*>Hempy Roots</h3>.*?onclick="alert\(\'Bitte Google Drive Link für Partner einfügen\'\)">)\[ PORTFOLIO \]',
                   lambda m: m.group(1).replace('href="#"', f'href="{hempy_link}"').replace('onclick="alert(\'Bitte Google Drive Link für Partner einfügen\')"', '') + '[ PORTFOLIO ]',
                   p_content, flags=re.DOTALL)

p_content = re.sub(r'(<h3[^>]*>Secret Garden LX</h3>.*?onclick="alert\(\'Bitte Google Drive Link für Partner einfügen\'\)">)\[ PORTFOLIO \]',
                   lambda m: m.group(1).replace('href="#"', f'href="{secret_garden_link}"').replace('onclick="alert(\'Bitte Google Drive Link für Partner einfügen\')"', '') + '[ PORTFOLIO ]',
                   p_content, flags=re.DOTALL)

with open(partners_path, 'w', encoding='utf-8') as f:
    f.write(p_content)

print("Updated links successfully.")
