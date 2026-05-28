import re

with open('D:/circle-d-flow-web/pages/portfolio_anime_reality.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the first // --- DYNAMIC TABS LOGIC ---
first_tabs_idx = content.find('// --- DYNAMIC TABS LOGIC ---')
# Find the second one
second_tabs_idx = content.find('// --- DYNAMIC TABS LOGIC ---', first_tabs_idx + 1)

if second_tabs_idx != -1:
    # Find the end of DOMContentLoaded (the '});' after second_tabs_idx)
    # The actual end of DOMContentLoaded is just before <!-- Radial Circle Menu (B2B / Archives) -->
    # Let's just find the closing tag or where radial menu starts
    end_idx = content.find('<!-- Radial Circle Menu', second_tabs_idx)
    if end_idx == -1:
        end_idx = content.find('</script>', second_tabs_idx)
    
    # Actually, we just want to remove from second_tabs_idx up to the closing }); of the DOMContentLoaded.
    # A safe way is to find the LAST }); before <!-- Radial Circle Menu
    part1 = content[:second_tabs_idx]
    
    # We need to ensure DOMContentLoaded is closed.
    # The first block probably didn't close it if the duplicate was inside.
    # Let's just append '});' to part1 and then the rest of the file from end_idx
    
    part2 = '\n        });\n\n        ' + content[end_idx:]
    
    new_content = part1 + part2
    
    with open('D:/circle-d-flow-web/pages/portfolio_anime_reality.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Fixed duplicates.')
else:
    print('No duplicates found.')
