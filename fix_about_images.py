import re

about_html_path = r'D:\circle-d-flow-web\pages\about.html'
with open(about_html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define new image paths
img1 = "/C-RIZ/DSC_6730_1.JPG"
img2 = "/Portfolio_Content/Source_Drive/105NZ502/DSC_3614.JPG"
img3 = "/C-RIZ/DSC_6821.JPG"
img4 = "/Portfolio_Content/Source_Drive/105NZ502/DSC_3615.JPG"

# Let's replace whatever images are in the panel divs
content = re.sub(r'id="panel1-img" src="[^"]+"', f'id="panel1-img" src="{img1}"', content)
content = re.sub(r'id="panel2-img" src="[^"]+"', f'id="panel2-img" src="{img2}"', content)
content = re.sub(r'id="panel3-img" src="[^"]+"', f'id="panel3-img" src="{img3}"', content)
content = re.sub(r'id="panel4-img" src="[^"]+"', f'id="panel4-img" src="{img4}"', content)

# Sometimes the class or id might differ, let's also do a generic replace in manga panels
# Look for <img src="..."> inside elements that look like manga panels
# Actually, the python script earlier probably didn't work because the regex was too strict.

with open(about_html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated about.html images")
