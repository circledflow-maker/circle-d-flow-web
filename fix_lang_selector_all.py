import os
import glob
import re

html_files = glob.glob(r'D:\circle-d-flow-web\pages\*.html')
html_files.append(r'D:\circle-d-flow-web\index.html')

replacement = """<!-- Language Selector -->
    <div class="absolute top-6 right-6 z-[100]">
        <select onchange="changeLanguage(this.value)" id="lang-select" class="bg-black border border-[#d4af37]/50 text-[#d4af37] px-3 py-1 text-sm cinzel focus:outline-none focus:border-[#d4af37] cursor-pointer">
            <option value="de">DE</option>
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="pt">PT</option>
        </select>
    </div>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const currentLang = localStorage.getItem('cqr_lang') || 'de';
            const select = document.getElementById('lang-select');
            if (select) select.value = currentLang;
        });
    </script>"""

for path in html_files:
    if not os.path.exists(path): continue
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the old complex language selector
        new_content = re.sub(
            r'<!-- Language Selector -->\s*<div[^>]*>.*?</div>\s*</div>',
            replacement,
            content,
            flags=re.DOTALL
        )
        
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated language selector in {os.path.basename(path)}")
    except Exception as e:
        print(f"Error {path}: {e}")
