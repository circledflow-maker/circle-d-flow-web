/**
 * Agent: Language Matrix (The Tower of Babel)
 * Purpose: Handling Internationalization (i18n) for EN, PT, DE, FR.
 */

class LanguageMatrix {
    constructor() {
        this.name = "LanguageMatrix";
        this.translations = {
            en: {
                bazaar: "The Bazaar",
                kitchen: "African Queen Kitchen",
                dashboard: "Master Dashboard",
                sanctuary: "Qter's Sanctuary",
                missions: "Imperial Quests",
                wisdom: "Ancient Wisdom",
                login: "Identify Yourself",
                register: "Become a Navigator",
                dismiss: "Dismiss Protocol (Guest)",
                jamtruck: "Jamtruck Progress",
                vision_title: "Curated Perfection",
                taste_title: "African Queen",
                enter_gateway: "Enter Gateway",
                welcome_guide: "Welcome, Voyager.",
                flow_call: "The Flow Calls You",
                
                // NEW KEYS
                join_circle: "Join the Circle",
                unlock_full: "Unlock the full experience.",
                bazaar_title: "The Bazaar",
                circle_title: "The Circle",
                academy_title: "The Academy",
                vision_brand: "Vision Empire",
                taste_brand: "Taste Empire"
            },
            de: {
                bazaar: "Der Basar",
                kitchen: "African Queen Küche",
                dashboard: "Master Dashboard",
                sanctuary: "Qters Heiligtum",
                missions: "Imperiale Quests",
                wisdom: "Altes Wissen",
                login: "Identifiziere dich",
                register: "Werde Navigator",
                dismiss: "Protokoll verwerfen (Gast)",
                jamtruck: "Jamtruck Fortschritt",
                vision_title: "Kuratierte Perfektion",
                taste_title: "African Queen",
                enter_gateway: "Tretet ein",
                welcome_guide: "Willkommen, Reisender.",
                flow_call: "Der Flow ruft dich",

                // NEW KEYS
                join_circle: "Tritt dem Kreis bei",
                unlock_full: "Entfessle das volle Erlebnis.",
                bazaar_title: "Der Basar",
                circle_title: "Der Kreis",
                academy_title: "Die Akademie",
                vision_brand: "Vision Imperium",
                taste_brand: "Geschmacks Reich"
            },
            pt: {
                bazaar: "O Bazar",
                kitchen: "Cozinha African Queen",
                dashboard: "Painel Mestre",
                sanctuary: "Santuário do Qter",
                missions: "Missões Imperiais",
                wisdom: "Sabedoria Antiga",
                login: "Identifique-se",
                register: "Torne-se Navegador",
                dismiss: "Ignorar Protocolo (Convidado)",
                jamtruck: "Progresso do Jamtruck",
                vision_title: "Perfeição Curada",
                taste_title: "African Queen",
                enter_gateway: "Entrar no Portal",
                welcome_guide: "Bem-vindo, Viajante.",
                flow_call: "O Flow Chama por Ti",

                // NEW KEYS
                join_circle: "Junte-se ao Círculo",
                unlock_full: "Desbloqueie a experiência completa.",
                bazaar_title: "O Bazar",
                circle_title: "O Círculo",
                academy_title: "A Academia",
                vision_brand: "Império da Visão",
                taste_brand: "Império do Sabor"
            },
            fr: {
                bazaar: "Le Bazar",
                kitchen: "Cuisine African Queen",
                dashboard: "Tableau de Bord Maître",
                sanctuary: "Le Sanctuaire de Qter",
                missions: "Quêtes Impériales",
                wisdom: "Sagesse Ancienne",
                login: "Identifiez-vous",
                register: "Devenir Navigateur",
                dismiss: "Ignorer le protocole (Invité)",
                jamtruck: "Progression du Jamtruck",
                vision_title: "Perfection Organisée",
                taste_title: "African Queen",
                enter_gateway: "Entrer dans le Portail",
                welcome_guide: "Bienvenue, Voyageur.",
                flow_call: "Le Flow Vous Appelle",

                // NEW KEYS
                join_circle: "Rejoindre le Cercle",
                unlock_full: "Débloquez l'expérience complète.",
                bazaar_title: "Le Bazar",
                circle_title: "Le Cercle",
                academy_title: "L'Académie",
                vision_brand: "Empire de Vision",
                taste_brand: "Empire du Goût"
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Translating the Realm...`);
        this.injectStyles();
        this.loadLanguage();
        this.injectSwitcher();
        
        window.LanguageMatrix = this;
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .lang-switcher {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 20000; /* Ensure it's above everything */
                display: flex;
                gap: 8px;
                background: rgba(0,0,0,0.6);
                padding: 8px 12px;
                border-radius: 99px;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 215, 0, 0.2); /* Gold tint */
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            }
            .lang-switcher:hover {
                background: rgba(0,0,0,0.8);
                border-color: rgba(255, 215, 0, 0.5);
            }
            .lang-btn {
                cursor: pointer;
                font-size: 1.2rem;
                opacity: 0.6;
                filter: grayscale(0.5);
                transition: all 0.2s;
            }
            .lang-btn:hover, .lang-btn.active {
                opacity: 1;
                filter: grayscale(0);
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(style);
    }

    injectSwitcher() {
        // Avoid duplicates
        if (document.querySelector('.lang-switcher')) return;

        const switcher = document.createElement('div');
        switcher.className = 'lang-switcher';
        switcher.innerHTML = `
            <span class="lang-btn" onclick="LanguageMatrix.setLanguage('en')" title="English">🇬🇧</span>
            <span class="lang-btn" onclick="LanguageMatrix.setLanguage('de')" title="Deutsch">🇩🇪</span>
            <span class="lang-btn" onclick="LanguageMatrix.setLanguage('pt')" title="Português">🇵🇹</span>
            <span class="lang-btn" onclick="LanguageMatrix.setLanguage('fr')" title="Français">🇫🇷</span>
        `;
        document.body.appendChild(switcher);
    }

    setLanguage(lang) {
        localStorage.setItem('cqr_lang', lang);
        
        // Update UI Text
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[lang][key]) {
                // Determine if input placeholder or innerText
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = this.translations[lang][key];
                } else {
                    element.innerHTML = this.translations[lang][key]; // innerHTML allows formatting
                }
            }
        });

        // Update Active Button State
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            // Check if this button corresponds to current lang (simple text check or proper attribute)
            if (btn.getAttribute('onclick').includes(`('${lang}')`)) {
                btn.classList.add('active');
            }
        });
        
        console.log(`[${this.name}] Language set to: ${lang.toUpperCase()}`);
        
        // Notify Flowee if active
        if(window.Flowee) window.Flowee.talk(true, this.translations[lang].welcome_guide, "guide");
    }

    loadLanguage() {
        const savedLang = localStorage.getItem('cqr_lang') || 'en';
        this.setLanguage(savedLang);
    }
}

new LanguageMatrix();
