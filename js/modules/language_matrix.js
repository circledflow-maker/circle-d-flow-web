/**
 * ROSETTA CORE: LANGUAGE MATRIX
 * Version: 1.0 (PT/EN/DE)
 * Purpose: Central Translation Engine for Circle D Flow.
 */

const languageMatrix = {
    // 1. THE DICTIONARY (PT / EN / DE)
    translations: {
        'en': {
            // Navigation
            'nav-battle': 'Battlefield',
            'nav-vault': 'The Vault',
            'nav-market': 'Bazaar',
            'nav-library': 'Library',
            'nav-profile': 'Identity',
            
            // Ticker & Welcome
            'ticker-welcome': 'SYSTEM ONLINE // WELCOME NAVIGATOR',
            'flowee-hello': 'Captain, the winds are changing!',
            
            // Battlefield
            'btn-challenge': 'CHALLENGE',
            'btn-fight': 'FIGHT',
            'lbl-stake': 'THE STAKE',
            'lbl-trace': 'TRACE SIGNATURE',
            'lbl-enter-flow': 'ENTER THE FLOW',
            'lbl-weekly': 'WEEKLY CHALLENGE',
            'lbl-kings': 'KINGS OF FLOW',
            'lbl-pillars': 'THE 5 PILLARS',
            'lbl-legacy': 'LIVE LEGACY',
            
            // Pillars
            'pillar-training': 'TRAINING GROUNDS',
            'pillar-bracket': 'GRAND BRACKET',
            'pillar-crew': 'CREW BATTLE',
            
            // Actions
            'act-search-placeholder': 'Find Opponent by Name...',
            'act-abort': 'ABORT',
            'act-join': 'JOIN BRACKET',
            'act-locked': 'LOCKED',
            'act-coming-soon': 'COMING SOON',
            
            // Flowee Context
            'flowee-scan': 'Scanning local frequencies...',
            'flowee-found': 'Target found!',
            'flowee-none': 'No resonance detected in the fog.',
        },
        'pt': {
            // Navigation
            'nav-battle': 'Campo de Batalha',
            'nav-vault': 'O Cofre',
            'nav-market': 'Bazar',
            'nav-library': 'Biblioteca',
            'nav-profile': 'Identidade',
            
            // Ticker & Welcome
            'ticker-welcome': 'SISTEMA ONLINE // BEM-VINDO NAVEGADOR',
            'flowee-hello': 'Capitão, os ventos estão a mudar!',
            
            // Battlefield
            'btn-challenge': 'DESAFIAR',
            'btn-fight': 'COMBATE',
            'lbl-stake': 'A APOSTA',
            'lbl-trace': 'RASTREAR ASSINATURA',
            'lbl-enter-flow': 'ENTRAR NO FLUXO',
            'lbl-weekly': 'DESAFIO SEMANAL',
            'lbl-kings': 'REIS DO FLUXO',
            'lbl-pillars': 'OS 5 PILARES',
            'lbl-legacy': 'LEGADO AO VIVO',
            
            // Pillars
            'pillar-training': 'CAMPO DE TREINO',
            'pillar-bracket': 'GRANDE TORNEIO',
            'pillar-crew': 'BATALHA DE TRIPULAÇÃO',
            
            // Actions
            'act-search-placeholder': 'Encontrar Oponente...',
            'act-abort': 'ABORTAR',
            'act-join': 'ENTRAR NO TORNEIO',
            'act-locked': 'TRANCADO',
            'act-coming-soon': 'EM BREVE',
            
            // Flowee Context
            'flowee-scan': 'A procurar frequências locais...',
            'flowee-found': 'Alvo encontrado!',
            'flowee-none': 'Nenhuma ressonância detectada no nevoeiro.',
        },
        'de': {
            // Navigation
            'nav-battle': 'Schlachtfeld',
            'nav-vault': 'Die Schatzkammer',
            'nav-market': 'Basar',
            'nav-library': 'Bibliothek',
            'nav-profile': 'Identität',
            
            // Ticker & Welcome
            'ticker-welcome': 'SYSTEM ONLINE // WILLKOMMEN NAVIGATOR',
            'flowee-hello': 'Kapitän, die Winde drehen sich!',
            
            // Battlefield
            'btn-challenge': 'HERAUSFORDERN',
            'btn-fight': 'KAMPF',
            'lbl-stake': 'DER EINSATZ',
            'lbl-trace': 'SIGNATUR VERFOLGEN',
            'lbl-enter-flow': 'BETRITT DEN FLUSS',
            'lbl-weekly': 'WOCHEN-CHALLENGE',
            'lbl-kings': 'KÖNIGE DES FLOWS',
            'lbl-pillars': 'DIE 5 SÄULEN',
            'lbl-legacy': 'LIVE VERMÄCHTNIS',
            
            // Pillars
            'pillar-training': 'TRAININGSGELÄNDE',
            'pillar-bracket': 'GROSSES TURNIER',
            'pillar-crew': 'CREW SCHLACHT',
            
            // Actions
            'act-search-placeholder': 'Gegner finden...',
            'act-abort': 'ABBRUCH',
            'act-join': 'TURNIER BEITRETEN',
            'act-locked': 'GESPERRT',
            'act-coming-soon': 'DEMNÄCHST',
            
            // Flowee Context
            'flowee-scan': 'Scanne lokale Frequenzen...',
            'flowee-found': 'Ziel gefunden!',
            'flowee-none': 'Keine Resonanz im Nebel entdeckt.',
        }
    },

    // 2. THE ENGINE
    setLanguage: function(lang) {
        // Validate
        if (!['pt', 'en', 'de'].includes(lang)) lang = 'pt';
        
        console.log(`[Rosetta] Switching Frequency to: ${lang.toUpperCase()}`);
        localStorage.setItem('preferred_lang', lang);

        // A. Visual Button Update
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`lang-${lang}`);
        if(activeBtn) activeBtn.classList.add('active');

        // B. DOM Translation (Data-Attribute Swap)
        const elements = document.querySelectorAll('[data-i18n]');
        
        // Smooth Transition Effect
        document.body.style.transition = 'filter 0.15s ease';
        document.body.style.filter = 'blur(2px)';

        setTimeout(() => {
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (this.translations[lang][key]) {
                    if (el.tagName === 'INPUT') el.placeholder = this.translations[lang][key];
                    else el.innerText = this.translations[lang][key];
                }
            });
            
            // Restore Vision
            document.body.style.filter = 'none';
        }, 150);

        // C. Global Context Updates
        // 1. Ticker
        if(window.pushTickerMessage) {
            window.pushTickerMessage(this.translations[lang]['ticker-welcome'], 'info');
        }
        
    },

    // 3. AUTO-DETECT (LISSABON PROTOCOL)
    init: function() {
        // Default to PT if no preference saved (Lisbon Context)
        const saved = localStorage.getItem('preferred_lang') || 'pt';
        this.setLanguage(saved);
        
        // Expose to Window
        window.setLanguage = this.setLanguage.bind(this);
        window.i18n = this.translations; // For direct access
    }
};

// Initialize on Load
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => languageMatrix.init());
} else {
    languageMatrix.init();
}
