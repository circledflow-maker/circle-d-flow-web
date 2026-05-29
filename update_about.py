import re
import json

# 1. Update translations.js
trans_path = r'D:\circle-d-flow-web\js\translations.js'
with open(trans_path, 'r', encoding='utf-8') as f:
    t_content = f.read()

# Replace translations for nav items in "de"
t_content = re.sub(r'"nav_orbit":\s*"[^"]*"', '"nav_orbit": "Zum Orbit"', t_content)
t_content = re.sub(r'"nav_guild_board":\s*"[^"]*"', '"nav_guild_board": "Nach Bantaba"', t_content)
# nav_about is already "About us" in most places, but let's ensure:
t_content = re.sub(r'"nav_about":\s*"[^"]*"', '"nav_about": "About Us"', t_content)

with open(trans_path, 'w', encoding='utf-8') as f:
    f.write(t_content)


# 2. Update about.html
about_path = r'D:\circle-d-flow-web\pages\about.html'
with open(about_path, 'r', encoding='utf-8') as f:
    a_content = f.read()

manga_panels = '''
    <!-- The Title Area -->
    <div id="about" class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20 text-center w-full">
        <div class="text-center mb-12 scroll-mt-24 pt-16 border-white/10 w-full">
            <h1 class="text-4xl md:text-6xl lg:text-7xl cinzel text-transparent bg-clip-text bg-gradient-to-r from-[var(--haki-gold)] to-[#FFAE42] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] font-bold uppercase tracking-widest mb-4">The Philosophy of Flow</h1>
            <h2 class="mono text-xs md:text-sm text-white/70 tracking-[0.3em] uppercase">Healing Through Expression</h2>
            <p class="mono text-xs md:text-sm text-white/80 leading-relaxed max-w-4xl mx-auto mt-6" data-i18n="about_intro">
                Wir glauben, dass echte Kunst mehr ist als Ästhetik – sie ist psychologische Befreiung und spirituelle Heilung. In einer lauten, fragmentierten Welt erschaffen wir einen radikalen "Safe Space". Unsere Mission ist es, durch echten Ausdruck eine Welle der Bewusstwerdung in Lissabon und der ganzen Welt auszulösen.
            </p>
        </div>

        <!-- The Manga Origin Panels -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-[1400px] mx-auto pb-16 w-full">
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
        
        <button class="mt-12 bg-transparent border border-[#d4af37] text-[#d4af37] px-8 py-3 font-mono hover:bg-[#d4af37] hover:text-black transition-all duration-300" onclick="window.location.href='bantaba.html'" data-i18n="btn_back">
            ← Zurück zum Eingang
        </button>
    </div>
'''

# Replace Main Content block in about.html
content_pattern = r'<!-- Main Content -->.*?<!-- Scripts -->'
a_content = re.sub(content_pattern, "<!-- Main Content -->\n" + manga_panels + "\n    <!-- Scripts -->", a_content, flags=re.DOTALL)

with open(about_path, 'w', encoding='utf-8') as f:
    f.write(a_content)

print("Updated translations and about.html")
