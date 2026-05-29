import os

pages = [
    r"D:\circle-d-flow-web\pages\orbit.html",
    r"D:\circle-d-flow-web\pages\bantaba.html",
    r"D:\circle-d-flow-web\pages\archive.html",
    r"D:\circle-d-flow-web\pages\portfolio_anime_reality.html",
    r"D:\circle-d-flow-web\pages\heart.html",
    r"D:\circle-d-flow-web\pages\luvo.html"
]

script_tag = '    <script type="module" src="../js/agents/flowee_2026.js"></script>\n'

for page in pages:
    if not os.path.exists(page):
        print(f"Skipping {page}, does not exist.")
        continue
    
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "flowee_2026.js" not in content:
        content = content.replace("</body>", script_tag + "</body>")
        with open(page, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Injected Flowee into {page}")
    else:
        print(f"Flowee already in {page}")
