/**
 * THE MAP SCANNER AGENT (The Cartographer)
 * Manages the "Living Map" of Lisbon and Hidden Spots.
 */
class MapScannerAgent {
    constructor() {
        this.locations = [
            { id: 'lx_factory', name: 'LX Factory', type: 'art', coords: { x: 200, y: 300 }, locked: false, desc: "The industrial heart of creativity." },
            { id: 'graca', name: 'Miradouro da Graca', type: 'chill', coords: { x: 500, y: 150 }, locked: true, desc: "Where the poets gather at sunset." },
            { id: 'underdogs', name: 'Underdogs Gallery', type: 'art', coords: { x: 600, y: 400 }, locked: true, desc: "Home of the visual vanguard." }
        ];
        this.init();
    }

    init() {
        console.log("🗺️ [MapScanner] Scanning Sector LX...");
        // In a real app, this would use Canvas or Leaflet.
        // For now, it manages the data logic.
    }

    toggle() {
        let mapEl = document.getElementById('living-map-overlay');
        if (!mapEl) {
            // Create Overlay
            mapEl = document.createElement('div');
            mapEl.id = 'living-map-overlay';
            mapEl.className = 'fixed inset-0 bg-black/90 z-[60] flex items-center justify-center hidden';
            mapEl.innerHTML = `
                <div class="relative w-full max-w-4xl h-[80vh] bg-[#E3D4B5] rounded-xl overflow-hidden border-4 border-[#1A1622] p-8">
                    <button onclick="MapScanner.toggle()" class="absolute top-4 right-4 text-black hover:text-red-600"><span class="material-symbols-outlined text-4xl">close</span></button>
                    <h2 class="text-4xl font-serif font-bold text-[#1A1622] mb-4 text-center">The Living Map (Lisbon)</h2>
                    <div class="grid grid-cols-3 gap-4 h-full pb-12">
                        ${this.locations.map(loc => `
                            <div class="border-2 border-black p-4 flex flex-col items-center justify-center relative group hover:bg-black/5 transition-colors cursor-pointer">
                                <span class="material-symbols-outlined text-4xl mb-2 ${loc.locked ? 'text-gray-400' : 'text-amber-600'}">${loc.locked ? 'lock' : 'location_on'}</span>
                                <h3 class="font-bold text-lg text-black">${loc.name}</h3>
                                <p class="text-xs text-center text-black/60">${loc.desc}</p>
                                ${loc.locked ? '<div class="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center"><span class="bg-black text-white px-2 py-1 text-xs uppercase font-bold">Locked</span></div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(mapEl);
        }
        mapEl.classList.toggle('hidden');
    }

    unlockLocation(locationId) {
        const spot = this.locations.find(l => l.id === locationId);
        if (spot && spot.locked) {
            spot.locked = false;
            // Persistence
            this.saveState();
            return spot;
        }
        return null;
    }

    saveState() {
        // Save unlocked spots to localStorage
        localStorage.setItem('cdf_map_state', JSON.stringify(this.locations));
    }
}

window.MapScanner = new MapScannerAgent();
