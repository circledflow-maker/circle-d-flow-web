document.addEventListener('DOMContentLoaded', () => {
    console.log("System Status: ONLINE");
    document.body.style.cursor = 'auto'; // Maus sicherstellen
    
    // Check: Sind wir auf dem Dashboard?
    if (window.location.pathname.includes('dashboard')) {
        initGameProtocol();
    }
});

function initGameProtocol() {
    console.log("🎲 Initializing Game Protocol...");

    // Prüfen: War der Spieler schon hier?
    const hasVisited = localStorage.getItem('player_initialized');

    if (!hasVisited) {
        // Wenn NEIN: Zeige Begrüßung
        showWelcomeOverlay();
    }
}

function showWelcomeOverlay() {
    // Erstellt den schwarzen Begrüßungs-Screen
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500';
    overlay.innerHTML = `
        <div class="max-w-md w-full space-y-6">
            <h1 class="text-4xl font-bold text-white tracking-wider mb-2">SYSTEM UNLOCKED</h1>
            <p class="text-gray-400 text-lg">Identity verified.<br>Welcome to the Flow Network.</p>
            
            <div class="bg-gray-900/50 p-6 rounded-2xl border border-white/10 text-left">
                <p class="text-xs text-yellow-500 font-bold mb-2 uppercase tracking-widest">Current Objective</p>
                <p class="text-white text-md">Dein Dashboard ist deine Zentrale. Wähle unten deine <span class="text-blue-400">Klasse</span>, um deine Reise zu beginnen.</p>
            </div>
            
            <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('player_initialized', 'true');" 
                class="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-105 transition-transform text-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                ENTER THE LOOP
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}