/**
 * THE ARENA: Tournament Manifest
 * Controls the active state of the Obsidian Colosseum.
 */

window.TournamentManifest = {
    season: "Season 1: Genesis",
    stage: "Qualifiers", // Qualifiers, Top 32, Top 16, Top 8, Semis, Finals, Champion
    status: "LIVE", // LIVE, PAUSED, CONCLUDED
    nextMatch: "2026-03-01T20:00:00",
    entrants: 12,
    
    // Simulate Bracket Data (for now)
    brackets: [
        { id: 1, p1: "Neon_Ghost", p2: "Bass_Slayer", winner: null },
        { id: 2, p1: "Flow_Master", p2: "Rhythm_Rogue", winner: null }
    ]
};

// Auto-Load Logic
(function initTournament() {
    const currentTourney = JSON.parse(localStorage.getItem('cdf_tournament') || 'null');
    
    if (!currentTourney) {
        console.log("[Arena] Injecting Tournament Manifest...");
        localStorage.setItem('cdf_tournament', JSON.stringify(window.TournamentManifest));
    } else {
        // Sync Window Object with LocalStorage (Single Source of Truth)
        window.TournamentManifest = currentTourney;
    }
})();
