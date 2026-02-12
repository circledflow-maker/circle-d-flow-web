/**
 * THE CODEX: Quest Manifest
 * Initial loadout for the QuestBot.
 */

window.QuestManifest = [
    // --- TUTORIAL / GRAND MASTER ---
    // --- TUTORIAL / GRAND MASTER ---
    {
        id: "Q-INIT-001",
        type: "System",
        title: "Say Hello (System Sync)",
        description: "Verify your connection to the Apex Matrix. Click COMPLETE to construct the bridge.",
        xp: 100,
        karma: 10,
        icon: "icon-gye-nyame",
        actionLink: "manual_Trigger" // Intentionally manual
    },
    {
        id: "Q-INIT-002",
        type: "Identity",
        title: "Identify Yourself",
        description: "Open your Profile and verify your Hunter Identity.",
        xp: 150,
        karma: 20,
        icon: "icon-duafe",
        actionLink: "profile_trigger" 
    },

    // --- VISUAL ---
    {
        id: "Q-VIS-101",
        type: "Visual",
        title: "Witness the Flow",
        description: "Explore the 'In Flow' gallery in the Museum.",
        xp: 100,
        karma: 25,
        icon: "icon-duafe",
        actionLink: "museum.html"
    },
    {
        id: "Q-VIS-102",
        type: "Visual",
        title: "Neon Gaze",
        description: "Find the 'Cyber-Wolf' hidden in the Bazaar Preview.",
        xp: 150,
        karma: 30,
        icon: "icon-duafe",
        actionLink: "marketplace.html"
    },

    // --- SOCIAL ---
    {
        id: "Q-SOC-201",
        type: "Social",
        title: "Signal Boost",
        description: "Send a 'High Frequency' message to a fellow Hunter.",
        xp: 75,
        karma: 50,
        icon: "icon-mmate",
        actionLink: "network_trigger"
    },
    {
        id: "Q-SOC-202",
        type: "Social",
        title: "Community Bond",
        description: "Initiate a 'Resonance' link with a new connection.",
        xp: 200,
        karma: 100,
        icon: "icon-mmate",
        actionLink: "network_trigger"
    }
];

// Auto-Load Logic
const currentQuests = JSON.parse(localStorage.getItem('cdf_quests') || '[]');
if (currentQuests.length === 0) {
    console.log("[Codex] Injecting Quest Manifest...");
    localStorage.setItem('cdf_quests', JSON.stringify(window.QuestManifest));
}
