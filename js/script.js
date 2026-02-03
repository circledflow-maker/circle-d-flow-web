/* CIRCLE D FLOW - AGENT PROTOCOL v3.0
   Contains: Agent Guard (Policy), Agent Guide (Story), System Core (XP)
   Languages: DE, EN, PT, FR
*/

// --- 1. SPRACH-MODUL (LANGUAGE CORE) ---
const translations = {
    en: { 
        welcome: "Identity verified. Welcome to the Flow Network.", 
        locked: "LOCKED! Required Level:", 
        pandora: "⚠️ POLICY VIOLATION. Content moved to Pandora's Box. Respect the community.",
        success: "✅ Success! Resonance earned.",
        levelUp: "⚡ LEVEL UP! New Rank achieved."
    },
    de: { 
        welcome: "Identität verifiziert. Willkommen im Flow Network.", 
        locked: "GESPERRT! Benötigtes Level:", 
        pandora: "⚠️ REGELVERSTOẞ. Inhalt in Pandora's Box verschoben. Respektiere die Community.",
        success: "✅ Erfolg! Resonanz erhalten.",
        levelUp: "⚡ LEVEL UP! Neuer Rang erreicht."
    },
    pt: { 
        welcome: "Identidade verificada. Bem-vindo ao Flow Network.", 
        locked: "BLOQUEADO! Nível necessário:", 
        pandora: "⚠️ VIOLAÇÃO. Conteúdo movido para a Caixa de Pandora. Respeite a comunidade.",
        success: "✅ Sucesso! Ressonância ganha.",
        levelUp: "⚡ SUBIU DE NÍVEL! Nova classificação."
    },
    fr: { 
        welcome: "Identité vérifiée. Bienvenue dans le Flow Network.", 
        locked: "VERROUILLÉ ! Niveau requis :", 
        pandora: "⚠️ VIOLATION. Contenu déplacé dans la Boîte de Pandore. Respectez la communauté.",
        success: "✅ Succès ! Résonance gagnée.",
        levelUp: "⚡ NIVEAU SUPÉRIEUR ! Nouveau rang."
    }
};

// Erkennt Sprache oder nutzt Englisch als Standard
const userLang = localStorage.getItem('user_lang')?.toLowerCase() || 'en';
const t = translations[userLang] || translations['en'];


// --- 2. AGENT GUARD (Der Wächter & Attitude Check) 👮 ---
const AgentGuard = {
    // Die Rote Linie (Absolute No-Gos weltweit)
    blacklist: [
        "nigger", "neger", "kanake", "faggot", "schwuchtel", "pédé", 
        "heil hitler", "sieg heil", "kill yourself", "suicide", "rape", "vergewaltigung"
    ],

    check: function(text) {
        const lowerText = text.toLowerCase();
        
        // Scannt nach verbotenen Wörtern
        for (let word of this.blacklist) {
            if (lowerText.includes(word)) {
                console.warn(`[Agent Guard] Blocked toxic content: ${word}`);
                return false; // Test NICHT bestanden
            }
        }
        // Wenn sauber: Erlaubt (auch Hip Hop Slang wie 'shit', 'fuck', 'bitch' ist OK)
        return true; 
    },

    punish: function(text, type) {
        // Logik für Pandora's Box
        const pandoraBox = JSON.parse(localStorage.getItem('cdf_pandora') || '[]');
        pandoraBox.push({ 
            content: text, 
            reason: "Policy Violation", 
            timestamp: new Date() 
        });
        localStorage.setItem('cdf_pandora', JSON.stringify(pandoraBox));
        
        // Agent Guide informieren, dass er schimpfen muss
        AgentGuide.speak(t.pandora);
    }
};


// --- 3. AGENT GUIDE (Der Erzähler & Interface) 🧞‍♂️ ---
const AgentGuide = {
    speak: function(message) {
        const overlay = document.getElementById('story-overlay');
        const textBox = document.getElementById('story-text');
        
        if(overlay && textBox) {
            textBox.innerText = message;
            overlay.classList.remove('hidden'); // Zeigt die Sprechblase
            
            // Auto-Close nach 5 Sekunden (optional)
             setTimeout(() => { /* overlay.classList.add('hidden'); */ }, 6000);
        } else {
            // Notfall-Fallback, falls HTML fehlt
            alert(`[GUIDE]: ${message}`);
        }
    },

    intro: function() {
        this.speak(t.welcome);
    }
};


// --- 4. SYSTEM CORE (XP & Leveling) ⚙️ ---
const System = {
    caps: { 1: 100, 2: 300, 3: 800, 4: 2000 },
    player: JSON.parse(localStorage.getItem('cdf_player')) || { xp: 0, level: 0 },

    addXP: function(amount) {
        this.player.xp += amount;
        this.checkLevelUp();
        this.save();
        this.updateUI();
    },

    checkLevelUp: function() {
        const nextCap = this.caps[this.player.level + 1];
        if (nextCap && this.player.xp >= nextCap) {
            this.player.level++;
            AgentGuide.speak(`${t.levelUp} (Rank ${this.player.level}).`);
        }
    },

    save: function() {
        localStorage.setItem('cdf_player', JSON.stringify(this.player));
    },

    updateUI: function() {
        const xpText = document.getElementById('xp-text');
        if (xpText) xpText.innerText = `${this.player.xp} RES`;
    }
};


// --- 5. EVENTS & INTERAKTIONEN (Die Brücke zum HTML) ---

document.addEventListener('DOMContentLoaded', () => {
    System.updateUI();
    
    // Begrüßung beim ersten Mal
    if (window.location.pathname.includes('dashboard') && System.player.xp === 0) {
        setTimeout(() => AgentGuide.intro(), 1500);
    }
});

// Funktion für den "More"-Button und Navigation
window.checkAccess = function(page, requiredLevel) {
    if (System.player.level < requiredLevel) {
        const missing = System.caps[requiredLevel] - System.player.xp;
        AgentGuide.speak(`🔒 ${t.locked} ${requiredLevel}. (${missing} XP missing)`);
    } else {
        // Smart Path Detection: Check if we are already in the 'pages/' folder
        const isPagesDir = window.location.pathname.includes('/pages/');
        const prefix = isPagesDir ? '' : 'pages/';
        window.location.href = `${prefix}${page}.html`;
    }
};

// Funktion für das Textfeld (Test Labor)
window.submitContent = function(type, text) {
    // 1. Agent Guard prüft
    if (!AgentGuard.check(text)) {
        AgentGuard.punish(text); // Ab in die Box
        return;
    }

    // 2. Wenn Okay: Belohnung
    System.addXP(50);
    AgentGuide.speak(`${t.success} (+50 RES)`);
};