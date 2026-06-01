import re

# 1. Update bantaba.html (Alliance grid)
bantaba_path = r"D:\circle-d-flow-web\pages\bantaba.html"
with open(bantaba_path, 'r', encoding='utf-8') as f:
    b_content = f.read()

# Replace [ CONNECT ] with [ INFO ] and add [ PORTFOLIO ]
def replace_connect(match):
    href = match.group(1)
    classes = match.group(2)
    return f'<a href="{href}" target="_blank" {classes}>[ INFO ]</a>\n                                  <a href="#" target="_blank" class="text-[#d4af37] font-mono text-sm hover:text-white transition ml-2">[ PORTFOLIO ]</a>'

b_content = re.sub(r'<a href="([^"]+)" target="_blank" ([^>]+)>\[ CONNECT \]</a>', replace_connect, b_content)

with open(bantaba_path, 'w', encoding='utf-8') as f:
    f.write(b_content)

# 2. Update partners.html (Partner List and Tabs)
partners_path = r"D:\circle-d-flow-web\pages\partners.html"
with open(partners_path, 'r', encoding='utf-8') as f:
    p_content = f.read()

# Replace Visit Instagram with [ INFO ] and add [ PORTFOLIO ]
def replace_instagram(match):
    href = match.group(1)
    return f'''<div class="flex gap-4 mt-2">
                      <a class="text-primary hover:underline text-sm font-semibold inline-flex items-center gap-1"
                          href="{href}" target="_blank">[ INFO ]
                          <span class="material-symbols-outlined text-base">arrow_forward</span></a>
                      <a class="text-[#d4af37] hover:underline text-sm font-semibold inline-flex items-center gap-1"
                          href="#" target="_blank" onclick="alert('Bitte Google Drive Link für Partner einfügen')">[ PORTFOLIO ]
                          <span class="material-symbols-outlined text-base">folder_open</span></a>
                  </div>'''

p_content = re.sub(r'<a class="text-primary hover:underline text-sm font-semibold mt-2 inline-flex items-center gap-1"\s*href="([^"]+)" target="_blank">Visit Instagram\s*<span[^>]*>arrow_forward</span></a>', replace_instagram, p_content)


# Add Tabs for "Partners" and "Souls" and the Souls Grid
tabs_html = '''
        <!-- TABS -->
        <div class="flex justify-center gap-4 mb-8">
            <button id="tab-btn-partners" class="border border-amber-500 bg-amber-500/20 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest hover:bg-amber-500 transition-all" onclick="showTab('partners')">Partners</button>
            <button id="tab-btn-souls" class="border border-[#d4af37] bg-transparent text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest hover:bg-[#d4af37] transition-all" onclick="showTab('souls')">Souls</button>
        </div>
        
        <script>
            function showTab(tab) {
                if (tab === 'partners') {
                    document.getElementById('partners-view').classList.remove('hidden');
                    document.getElementById('souls-view').classList.add('hidden');
                    document.getElementById('tab-btn-partners').classList.replace('bg-transparent', 'bg-amber-500/20');
                    document.getElementById('tab-btn-souls').classList.replace('bg-[#d4af37]/20', 'bg-transparent');
                } else {
                    document.getElementById('partners-view').classList.add('hidden');
                    document.getElementById('souls-view').classList.remove('hidden');
                    document.getElementById('tab-btn-souls').classList.replace('bg-transparent', 'bg-[#d4af37]/20');
                    document.getElementById('tab-btn-partners').classList.replace('bg-amber-500/20', 'bg-transparent');
                }
            }
        </script>
        
        <!-- PARTNERS VIEW -->
        <div id="partners-view">
'''

# We need to wrap the existing map and partner list in #partners-view
p_content = p_content.replace('<!-- Map Container -->', tabs_html + '\n          <!-- Map Container -->')

souls_html = '''
        </div>
        
        <!-- SOULS VIEW -->
        <div id="souls-view" class="hidden">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- C-RIZ Soul Card -->
                <div class="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-[#d4af37]/30 hover:border-[#d4af37] transition-colors cursor-pointer" onclick="window.location.href='portfolio_criz.html'">
                    <div class="flex-shrink-0 size-16 bg-center bg-no-repeat bg-cover rounded-lg bg-background-dark flex items-center justify-center overflow-hidden">
                        <img src="../Assets/Portfolio/Artist/artist_1.jpg" alt="C-Riz" class="w-full h-full object-cover">
                    </div>
                    <div class="flex flex-col justify-center h-full">
                        <h3 class="text-[#d4af37] font-bold text-xl uppercase tracking-widest">C-Riz</h3>
                        <p class="text-white/70 text-sm mt-1">Artist / DJ</p>
                        <span class="text-[#d4af37] text-xs font-mono mt-2 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">visibility</span> View Portfolio
                        </span>
                    </div>
                </div>
            </div>
        </div>
'''

# The end of the partner list grid is right before </main> or </div>... Let's find the end.
# In partners.html, we have `</main>`.
p_content = p_content.replace('</main>', souls_html + '\n    </main>')

with open(partners_path, 'w', encoding='utf-8') as f:
    f.write(p_content)

print("Updated bantaba.html and partners.html successfully.")
