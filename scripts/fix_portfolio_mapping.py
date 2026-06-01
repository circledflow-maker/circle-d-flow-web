import re

path = r"D:\circle-d-flow-web\pages\portfolio_anime_reality.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

mapping_code = '''
                    let matchedAssets = [];
                    // Map German elements to English categories
                    const categoryMapping = {
                        'Feuer': 'Event',
                        'Wasser': 'Nature',
                        'Erde': 'Realm',
                        'Luft': 'Artist'
                    };
                    let searchCategory = categoryMapping[activeCategory] || activeCategory;
                    
                    // Try exact match or case-insensitive match
                    if (window.PortfolioData[searchCategory]) {
                        matchedAssets = window.PortfolioData[searchCategory];
                    } else {
                        const catLower = searchCategory.toLowerCase();
                        const exactKey = Object.keys(window.PortfolioData).find(k => k.toLowerCase() === catLower);
                        if (exactKey) {
                            matchedAssets = window.PortfolioData[exactKey];
                        } else {
                            matchedAssets = window.PortfolioData["Event"] || [];
                        }
                    }
'''

content = re.sub(r'let matchedAssets = \[\];\s*// Try exact match or case-insensitive match\s*if \(window\.PortfolioData\[activeCategory\]\) \{.*?matchedAssets = window\.PortfolioData\["Feuer"\] \|\| \[\];\s*\}\s*\}', mapping_code, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated portfolio_anime_reality.html mapping")
