const fs = require('fs');
let html = fs.readFileSync('pages/marketplace.html', 'utf8');

const replacement = `    <!-- NAV (Synchronized Horizon Bar) -->
    <header class="fixed top-0 w-full z-[100] h-16 flex items-center justify-between px-2 lg:px-8 bg-black/90 border-b border-[#FFAE42]/20 backdrop-blur-md">
        <div class="flex items-center gap-2">
            <!-- Mobile Burger Menu Button moved into Header -->
            <button id="burger-btn" class="w-8 h-8 flex flex-col justify-center items-center gap-1 bg-black border border-[#d4af37]/50 rounded cursor-pointer lg:hidden relative z-[1001]">
                <span class="w-4 h-[2px] bg-[#d4af37] transition-all duration-300"></span>
                <span class="w-4 h-[2px] bg-[#d4af37] transition-all duration-300"></span>
                <span class="w-4 h-[2px] bg-[#d4af37] transition-all duration-300"></span>
            </button>
            <a href="../index.html" class="flex items-center gap-1 text-white/70 hover:text-[#FFAE42] transition-colors">
                <span class="material-symbols-outlined text-lg">arrow_back</span>
                <span class="text-[9px] font-bold uppercase tracking-tighter hidden sm:inline">Orbit</span>
            </a>
        </div>

        <div class="absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none">
            <h1 class="font-cinzel font-bold text-sm lg:text-lg tracking-[0.2em] lg:tracking-[0.4em] text-[#FFAE42] m-0 text-center whitespace-nowrap">BAZAAR</h1>
        </div>

        <div class="flex items-center justify-end gap-1 lg:gap-2">
            <div class="flex gap-1 lg:gap-2 items-center">
                <a href="marketplace-stall.html" class="px-2 py-1 lg:px-3 lg:py-1.5 border border-[#5A2A84] text-[#FFAE42] text-[8px] lg:text-[9px] font-bold uppercase rounded hover:bg-[#5A2A84]/20 transition-all">STALL</a>
                <a href="marketplace-upload.html" class="px-2 py-1 lg:px-3 lg:py-1.5 bg-[#FFAE42]/20 border border-[#FFAE42] text-[#FFAE42] text-[8px] lg:text-[9px] font-bold uppercase rounded shadow-[0_0_10px_rgba(255,174,64,0.3)] hover:bg-[#FFAE42] hover:text-black transition-all">FORGE</a>
            </div>
        </div>
    </header>`;

// Remove the mangled header and replace it with the correct one.
html = html.replace(/<!-- NAV \(Synchronized Horizon Bar\) -->[\s\S]*?<\/header>/, replacement);
fs.writeFileSync('pages/marketplace.html', html);
console.log("Header fixed!");
