import re

file_path = r'D:\circle-d-flow-web\pages\portfolio_anime_reality.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# --- 1. Swap Portfolio and About Us ---
# Find "The Portfolio Archive" block
portfolio_start_str = '''<h1 class="text-3xl md:text-5xl cinzel text-white mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">The Portfolio Archive</h1>'''
portfolio_end_str = '''</div>
    </div>

    <!-- Media Player Overlay -->'''

p_start = content.find(portfolio_start_str)
p_end = content.find(portfolio_end_str)

if p_start != -1 and p_end != -1:
    portfolio_html = content[p_start:p_end]
    # Remove portfolio from current location
    content = content[:p_start] + content[p_end:]
    
    # Find insertion point (right before "<!-- Manga Cover & Origin Section -->")
    insert_pos = content.find('<!-- Manga Cover & Origin Section -->')
    if insert_pos != -1:
        # Wrap portfolio in a div for layout if needed, but it already has its own layout classes.
        # Actually it's just raw h1 and grid inside "pt-[40px]" div.
        content = content[:insert_pos] + portfolio_html + "\n\n        " + content[insert_pos:]

# --- 2. Replace Manga Panels with the 4 Philosophy of Flow panels ---
manga_start = content.find('<!-- The Title Area -->')
manga_end = content.find('<!-- About Us Empathic Call to Action -->')

if manga_start != -1 and manga_end != -1:
    new_manga_section = '''<!-- The Title Area -->
            <div id="about" class="text-center mb-12 scroll-mt-24 pt-16 mt-16 border-t border-white/10">
                <h1 class="text-4xl md:text-6xl lg:text-7xl cinzel text-transparent bg-clip-text bg-gradient-to-r from-[var(--haki-gold)] to-[#FFAE42] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] font-bold uppercase tracking-widest mb-4">The Philosophy of Flow</h1>
                <h2 class="mono text-xs md:text-sm text-white/70 tracking-[0.3em] uppercase">Healing Through Expression</h2>
                <p class="mono text-xs md:text-sm text-white/80 leading-relaxed max-w-4xl mx-auto mt-6" data-i18n="about_intro">
                    Wir glauben, dass echte Kunst mehr ist als Ästhetik – sie ist psychologische Befreiung und spirituelle Heilung. In einer lauten, fragmentierten Welt erschaffen wir einen radikalen "Safe Space". Unsere Mission ist es, durch echten Ausdruck eine Welle der Bewusstwerdung in Lissabon und der ganzen Welt auszulösen.
                </p>
            </div>

            <!-- The Manga Origin Panels -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-[1400px] mx-auto pb-16">
                <!-- Panel 1: Spiegel der Seele -->
                <div class="manga-panel relative group border-2 border-white/20 hover:border-[#FFAE42] p-2 bg-black overflow-hidden transition-all duration-500 transform hover:-translate-y-2">
                    <div class="absolute top-0 right-0 bg-[#FFAE42] text-black mono text-[9px] font-bold px-2 py-1 z-10 border-b-2 border-l-2 border-black">PANEL 01</div>
                    <div class="w-full h-48 md:h-64 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" style="background-image: url('../assets/images/lome.jpg'); background-color: #333;"></div>
                    <div class="mt-4 pb-2 border-b-2 border-dashed border-white/20">
                        <h3 class="cinzel text-xl text-[var(--haki-gold)]" data-i18n="panel1_title">Spiegel der Seele</h3>
                    </div>
                    <p class="mono text-[10px] md:text-xs text-white/60 mt-3 leading-relaxed text-left" data-i18n="panel1_desc">
                        Fotografie & Wahrhaftigkeit: Wir erfassen nicht das Äußere, sondern den unsichtbaren Moment, in dem die Seele atmet. Fotografie ist unsere spirituelle Sprache, um die echte, verletzliche Essenz eines jeden Künstlers angstfrei einzufangen.
                    </p>
                </div>
                
                <!-- Panel 2: Ego-Auflösung -->
                <div class="manga-panel relative group border-2 border-white/20 hover:border-[#FFAE42] p-2 bg-black overflow-hidden transition-all duration-500 transform hover:translate-y-2 lg:mt-8">
                    <div class="absolute top-0 right-0 bg-[#FFAE42] text-black mono text-[9px] font-bold px-2 py-1 z-10 border-b-2 border-l-2 border-black">PANEL 02</div>
                    <div class="w-full h-48 md:h-64 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" style="background-image: url('../assets/images/munich.jpg'); background-color: #444;"></div>
                    <div class="mt-4 pb-2 border-b-2 border-dashed border-white/20">
                        <h3 class="cinzel text-xl text-[var(--haki-gold)]" data-i18n="panel2_title">Ego-Auflösung & The Zone</h3>
                    </div>
                    <p class="mono text-[10px] md:text-xs text-white/60 mt-3 leading-relaxed text-left" data-i18n="panel2_desc">
                        Mihaly Csikszentmihalyi: Wir leiten Menschen an, in ihren "Flow" zu treten. Psychologisch gesehen ist dies der heilige Raum, in dem das bewertende Ego stirbt, Raum und Zeit verschmelzen und reine, angstfreie Präsenz entsteht.
                    </p>
                </div>

                <!-- Panel 3: Kollektive Heilung -->
                <div class="manga-panel relative group border-2 border-white/20 hover:border-[#FFAE42] p-2 bg-black overflow-hidden transition-all duration-500 transform hover:-translate-y-2">
                    <div class="absolute top-0 right-0 bg-[#FFAE42] text-black mono text-[9px] font-bold px-2 py-1 z-10 border-b-2 border-l-2 border-black">PANEL 03</div>
                    <div class="w-full h-48 md:h-64 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" style="background-image: url('../assets/images/lisbon.jpg'); background-color: #555;"></div>
                    <div class="mt-4 pb-2 border-b-2 border-dashed border-white/20">
                        <h3 class="cinzel text-xl text-[var(--haki-gold)]" data-i18n="panel3_title">Kollektive Heilung</h3>
                    </div>
                    <p class="mono text-[10px] md:text-xs text-white/60 mt-3 leading-relaxed text-left" data-i18n="panel3_desc">
                        Wu Wei & Hip Hop: Die fünf Säulen der Hip-Hop-Kultur vereinen sich mit der taoistischen Praxis des Wu Wei. Wir durchbrechen soziale Isolation, indem wir eine Gemeinschaft formen, die im Moment fließt und urteilsfrei wächst.
                    </p>
                </div>
                
                <!-- Panel 4: Impact auf die Welt -->
                <div class="manga-panel relative group border-2 border-white/20 hover:border-[#FFAE42] p-2 bg-black overflow-hidden transition-all duration-500 transform hover:translate-y-2 lg:mt-8">
                    <div class="absolute top-0 right-0 bg-[#FFAE42] text-black mono text-[9px] font-bold px-2 py-1 z-10 border-b-2 border-l-2 border-black">PANEL 04</div>
                    <div class="w-full h-48 md:h-64 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" style="background-image: url('../Assets/images/Logo.png'); background-color: #111;"></div>
                    <div class="mt-4 pb-2 border-b-2 border-dashed border-white/20">
                        <h3 class="cinzel text-xl text-[var(--haki-gold)]" data-i18n="panel4_title">Impact auf die Welt</h3>
                    </div>
                    <p class="mono text-[10px] md:text-xs text-white/60 mt-3 leading-relaxed text-left" data-i18n="panel4_desc">
                        The Will of D & Musashi: Mit der Struktur von Musashis Fünf Ringen entfachen wir ein Lauffeuer des intrinsischen Willens. Wir geben Künstlern den Mut, ihre einzigartige Frequenz zu finden, um als leuchtende Vorbilder die Welt zu formen.
                    </p>
                </div>
            </div>
            
            <!-- About Us Empathic Call to Action -->'''
    
    content = content[:manga_start] + new_manga_section + content[manga_end + len('<!-- About Us Empathic Call to Action -->'):]

# --- 3. Insert Burger Menu and UI at the top of body ---
ui_elements = '''
    <!-- Language Selector -->
    <div class="absolute top-6 right-6 z-[100] group font-mono text-sm hidden md:block">
        <button class="bg-[#111] border border-[#d4af37]/50 text-[#d4af37] px-3 py-1 rounded hover:bg-white/10 transition flex items-center gap-1">
            <span id="current-lang-display">DE</span>
            <span class="text-[10px]">▼</span>
        </button>
        <div class="absolute right-0 mt-2 bg-black/90 border border-[#d4af37]/50 rounded shadow-xl hidden group-hover:block w-full text-center divide-y divide-[#d4af37]/20">
            <button onclick="if(window.changeLanguage) changeLanguage('en')" class="w-full text-gray-400 hover:text-[#d4af37] py-2 hover:bg-white/5 transition block">EN</button>
            <button onclick="if(window.changeLanguage) changeLanguage('de')" class="w-full text-gray-400 hover:text-[#d4af37] py-2 hover:bg-white/5 transition block">DE</button>
            <button onclick="if(window.changeLanguage) changeLanguage('fr')" class="w-full text-gray-400 hover:text-[#d4af37] py-2 hover:bg-white/5 transition block">FR</button>
            <button onclick="if(window.changeLanguage) changeLanguage('pt')" class="w-full text-gray-400 hover:text-[#d4af37] py-2 hover:bg-white/5 transition block">PT</button>
        </div>
    </div>

    <!-- Hamburger Menu Button -->
    <button id="burger-btn" class="absolute top-6 left-6 z-[100] focus:outline-none flex flex-col gap-1.5 p-2 bg-black/50 border border-[#d4af37]/30 rounded hover:bg-[#d4af37]/10 transition">
        <span class="block w-6 h-0.5 bg-[#d4af37] transition-all duration-300"></span>
        <span class="block w-6 h-0.5 bg-[#d4af37] transition-all duration-300"></span>
        <span class="block w-6 h-0.5 bg-[#d4af37] transition-all duration-300"></span>
    </button>
    
    <!-- Fullscreen Menu Overlay -->
    <div id="mobile-menu" class="fixed inset-0 bg-black/95 z-[90] flex flex-col items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300 backdrop-blur-md">
        <nav class="flex flex-col gap-8 text-center">
            <a href="../index.html" class="cinzel text-2xl text-white hover:text-[#d4af37] transition gold-glow" data-i18n="nav_orbit">Return to Orbit</a>
            <a href="bantaba.html#board" class="cinzel text-2xl text-white hover:text-[#d4af37] transition gold-glow" data-i18n="nav_guild_board">Nach Bantaba</a>
            <a href="#about" onclick="document.getElementById('burger-btn').click();" class="cinzel text-2xl text-white hover:text-[#d4af37] transition gold-glow" data-i18n="nav_about">About Us</a>
        </nav>
        
        <div class="mt-12 flex gap-4 md:hidden">
            <button onclick="if(window.changeLanguage) changeLanguage('en'); document.getElementById('burger-btn').click();" class="text-gray-400 hover:text-[#d4af37]">EN</button>
            <button onclick="if(window.changeLanguage) changeLanguage('de'); document.getElementById('burger-btn').click();" class="text-gray-400 hover:text-[#d4af37]">DE</button>
            <button onclick="if(window.changeLanguage) changeLanguage('fr'); document.getElementById('burger-btn').click();" class="text-gray-400 hover:text-[#d4af37]">FR</button>
            <button onclick="if(window.changeLanguage) changeLanguage('pt'); document.getElementById('burger-btn').click();" class="text-gray-400 hover:text-[#d4af37]">PT</button>
        </div>
    </div>
'''

content = content.replace('<body>', '<body>\n' + ui_elements)

# Remove the old `top-nav` (lines 402-420) since we are replacing it with the burger menu 
# (and the logo/Back to Board would clash with Burger Menu).
# Let's see if we should just remove it.
top_nav_start = content.find('<!-- Navigation -->')
top_nav_end = content.find('<!-- Header Section -->')
if top_nav_start != -1 and top_nav_end != -1:
    content = content[:top_nav_start] + content[top_nav_end:]

# --- 4. Add Burger Menu logic and translations script ---
script_injection = '''
    <script>
        // Burger Menu Logic
        const burgerBtn = document.getElementById('burger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const spans = burgerBtn.querySelectorAll('span');
        let menuOpen = false;

        burgerBtn.addEventListener('click', () => {
            menuOpen = !menuOpen;
            if(menuOpen) {
                mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
                spans[0].style.transform = 'translateY(8px) rotate(45deg)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
            } else {
                mobileMenu.classList.add('opacity-0', 'pointer-events-none');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Basic Language Switching logic for this page
        window.changeLanguage = function(lang) {
            document.getElementById('current-lang-display').innerText = lang.toUpperCase();
            // If there's a global translation script, it will take over. 
            // If not, you might want to call the global one from here.
            if(window.applyTranslations) window.applyTranslations(lang);
        }
    </script>
</body>'''

content = content.replace('</body>', script_injection)

# Add the i18n script to the head or body if it's not there.
# It seems translation logic might be handled by translations.js. 
# Let's just make sure it's linked if needed, or rely on it being loaded elsewhere.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully.")
