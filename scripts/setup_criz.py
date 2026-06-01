import re

html_path = r"D:\circle-d-flow-web\pages\portfolio_criz.html"
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove category buttons
content = re.sub(r'<div class="flex flex-wrap justify-center gap-4 mb-16 category-tabs">.*?</div>', '', content, flags=re.DOTALL)

# 2. Update title/banner
content = re.sub(r'DIESE WOCHE IM<br>FOKUS: NATURE', 'C-RIZ<br>PORTFOLIO', content)
content = re.sub(r'Curated by the Archive Poet', 'The Genesis of the New Wave', content)

# 3. Replace portfolio_data.js with inline data
criz_data = []
for i in range(1, 14):
    criz_data.append({
        "id": f"criz_{i}",
        "name": f"artist_{i}.jpg",
        "professional_name": "C-Riz Collection",
        "url": f"../Assets/Portfolio/Artist/artist_{i}.jpg",
        "tags": ["criz", "portfolio"]
    })

import json
data_script = f'''
<script>
window.PortfolioData = {{ "C-Riz": {json.dumps(criz_data)} }};
let activeCategory = 'C-Riz';
</script>
'''

content = re.sub(r'<script src="../js/data/portfolio_data\.js(\?.*?)?"></script>', '', content)
# Inject our script before the closing body
content = content.replace('</body>', data_script + '\n</body>')

# 4. Modify activeCategory logic
content = re.sub(r"let activeCategory = 'All';", "let activeCategory = 'C-Riz';", content)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated portfolio_criz.html")
