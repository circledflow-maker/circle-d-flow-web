/**
 * THE CODEX: Item Manifest
 * Initial stock for the Marketplace (MerchantAgent).
 */

window.ItemManifest = [
    // --- AUDIO (Beats) ---
    {
        id: "ITM-AUD-001",
        name: "Neon Pulse Pack",
        title: "Neon Pulse Pack", // Mapping for Merchant
        type: "Audio",
        rarity: "Rare",
        price: 500, // Euro/Flow Token
        currency: "FLOW",
        image: "../Assets/images/logo.png", // Placeholder
        description: "A collection of 10 High-Energy Synthwave loops perfect for combat flow.",
        owner: "Killa_Beat",
        stock: 50
    },
    {
        id: "ITM-AUD-002",
        name: "Deep Roots Bass",
        title: "Deep Roots Bass", // Mapping for Merchant
        type: "Audio",
        rarity: "Epic",
        price: 1200,
        currency: "FLOW",
        image: "../Assets/images/logo.png", // Placeholder
        description: "Heavy Sub-Bass lines inspired by the ancient drums of Zion.",
        owner: "Killa_Beat",
        stock: 10
    },
    {
        id: "ITM-AUD-003",
        name: "Lofi Study Session",
        title: "Lofi Study Session", // Mapping for Merchant
        type: "Audio",
        rarity: "Common",
        price: 100,
        currency: "FLOW",
        image: "../Assets/images/logo.png", // Placeholder
        description: "Chill beats to code/relax to. Infinite loop enabled.",
        owner: "Killa_Beat",
        stock: 999
    },

    // --- VISUAL (LUTs / Presets) ---
    {
        id: "ITM-VIS-101",
        name: "Cyber-Noir LUT",
        title: "Cyber-Noir LUT", // Mapping for Merchant
        type: "Visual",
        rarity: "Rare",
        price: 450,
        currency: "FLOW",
        image: "../Assets/images/logo.png", // Placeholder
        description: "Color grading preset for that rainy, neon-soaked aesthetic.",
        owner: "Sage_Nova",
        stock: 25
    },
    {
        id: "ITM-VIS-102",
        name: "Golden Hour Preset",
        title: "Golden Hour Preset", // Mapping for Merchant
        type: "Visual",
        rarity: "Legendary",
        price: 5000,
        currency: "FLOW",
        image: "../Assets/images/logo.png", // Placeholder
        description: "The perfect lighting, captured in a .cube file. Limited Edition.",
        owner: "Sage_Nova",
        stock: 3
    }
];

// Auto-Load Logic
const currentStock = JSON.parse(localStorage.getItem('cdf_shop_stock') || '[]');
if (currentStock.length === 0) {
    console.log("[Codex] Injecting Item Manifest...");
    localStorage.setItem('cdf_shop_stock', JSON.stringify(window.ItemManifest));
}
