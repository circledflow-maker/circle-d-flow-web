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
                taste_brand: "Taste Empire",

                // AUTH & QUESTS
                auth_login_title: "RETURNING CAPTAIN",
                auth_register_title: "NEW NAVIGATOR",
                login_username_placeholder: "Hunter Handle",
                login_password_placeholder: "Passphrase",
                login_btn: "ENTER SYSTEM",
                reg_email_placeholder: "Digital Soul (Email)",
                reg_username_placeholder: "Choose your Moniker",
                reg_password_placeholder: "Create Passphrase",
                reg_btn: "INITIALIZE BETA",
                
                // Fog
                fog_message: "THE FLOW IS SHIFTING...",
                update_msg: "System Update Installed. I will guide you.",

                // Tutorial Quests
                quest_initi_title: "Initiation",
                quest_initi_text: "Welcome, Navigator! I am Flowee. Your first task: Visit the Bazaar.",
                quest_initi_btn: "Set Course: Bazaar",
                tutorial_welcome: "Welcome to the Command Center. This Compass is your navigation tool.",
                
                quest_econ_title: "The Economy",
                quest_econ_text: "This is the Marketplace. Here we trade with Flow-Credits. Click on a TukTuk to test the interface.",
                quest_econ_success: "Excellent! You understand commerce. +50 EXP! Next: The Music.",
                quest_econ_btn: "Set Course: Sanctuary",

                quest_vibe_title: "The Vibe",
                quest_vibe_text: "DJ Qter controls the rhythm here. Start a track to synchronize your soul.",
                quest_vibe_success: "Do you feel the Flow? +100 EXP! Last stop: The Kitchen.",
                quest_vibe_btn: "Set Course: Kitchen",
                
                // Updates
                new_feature_trinity: "NEW: The Trinity Status! Keep Vision, Sound, and Kitchen in balance.",
                new_feature_jamtruck: "UPDATE: The Jamtruck Slider is live. Help us reach 700€!"
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
                taste_brand: "Geschmacks Reich",

                // AUTH & QUESTS
                auth_login_title: "RÜCKKEHRENDER KAPITÄN",
                auth_register_title: "NEUER NAVIGATOR",
                login_username_placeholder: "Jäger Name",
                login_password_placeholder: "Passphrase",
                login_btn: "SYSTEM BETRETEN",
                reg_email_placeholder: "Digitale Seele (Email)",
                reg_username_placeholder: "Wähle deinen Namen",
                reg_password_placeholder: "Passphrase erstellen",
                reg_btn: "BETA INITIALISIEREN",
                
                // Fog
                fog_message: "DER FLOW VERÄNDERT SICH...",
                update_msg: "System Update installiert. Ich führe dich.",

                // Tutorial Quests
                quest_initi_title: "Initiierung",
                quest_initi_text: "Willkommen, Navigator! Ich bin Flowee. Bevor wir das Universum erobern, musst du lernen, das Schiff zu steuern. Erste Aufgabe: Besuche den Basar.",
                quest_initi_btn: "Kurs setzen: Basar",
                
                quest_econ_title: "Die Ökonomie",
                quest_econ_text: "Dies ist der Marktplatz. Hier handeln wir mit Flow-Credits. Klicke auf ein TukTuk, um das Interface zu testen.",
                quest_econ_success: "Exzellent! Du hast den Handel verstanden. +50 EXP! Weiter zur Musik?",
                quest_econ_btn: "Kurs setzen: Heiligtum",

                quest_vibe_title: "Der Vibe",
                quest_vibe_text: "DJ Qter kontrolliert hier den Rhythmus. Starte einen Track, um deine Seele zu synchronisieren.",
                quest_vibe_success: "Spürst du den Flow? +100 EXP! Letzter Halt: Die Küche.",
                quest_vibe_btn: "Kurs setzen: Küche",

                // Updates
                new_feature_trinity: "NEU: Der Trinity-Status! Halte Vision, Sound und Küche in Balance.",
                new_feature_jamtruck: "UPDATE: Der Jamtruck-Slider ist live. Hilf uns, die 700€ zu knacken!"
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
                taste_brand: "Império do Sabor",

                // AUTH & QUESTS
                auth_login_title: "CAPITÃO RETORNANDO",
                auth_register_title: "NOVO NAVEGADOR",
                login_username_placeholder: "Nome de Caçador",
                login_password_placeholder: "Senha",
                login_btn: "ENTRAR NO SISTEMA",
                reg_email_placeholder: "Alma Digital (Email)",
                reg_username_placeholder: "Escolha seu Apelido",
                reg_password_placeholder: "Criar Senha",
                reg_btn: "INICIALIZAR BETA",
                
                // Fog
                fog_message: "O FLUXO ESTÁ MUDANDO...",
                update_msg: "Atualização do Sistema instalada. Eu vou guiá-lo.",

                // Tutorial Quests
                quest_initi_title: "Iniciação",
                quest_initi_text: "Bem-vindo, Navegador! Eu sou Flowee. Sua primeira tarefa: Visite o Bazar.",
                quest_initi_btn: "Definir Curso: Bazar",
                tutorial_welcome: "Bem-vindo ao Centro de Comando. Esta Bússola é sua ferramenta de navegação.",
                
                quest_econ_title: "A Economia",
                quest_econ_text: "Este é o Mercado. Aqui negociamos com Flow-Credits. Clique em um TukTuk para testar a interface.",
                quest_econ_success: "Excelente! Você entende de comércio. +50 EXP! Próximo: A Música.",
                quest_econ_btn: "Definir Curso: Santuário",

                quest_vibe_title: "A Vibe",
                quest_vibe_text: "DJ Qter controla o ritmo aqui. Inicie uma faixa para sincronizar sua alma.",
                quest_vibe_success: "Você sente o Flow? +100 EXP! Última parada: A Cozinha.",
                quest_vibe_btn: "Definir Curso: Cozinha",

                // Updates
                new_feature_trinity: "NOVO: O Status Trinity! Mantenha Visão, Som e Cozinha em equilíbrio.",
                new_feature_jamtruck: "ATUALIZAÇÃO: O Slider do Jamtruck está ativo. Ajude-nos a alcançar 700€!"
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
                taste_brand: "Empire du Goût",

                 // AUTH & QUESTS
                auth_login_title: "CAPITAINE DE RETOUR",
                auth_register_title: "NOUVEAU NAVIGATEUR",
                login_username_placeholder: "Nom de Chasseur",
                login_password_placeholder: "Mot de passe",
                login_btn: "ENTRER DANS LE SYSTÈME",
                reg_email_placeholder: "Âme Numérique (Email)",
                reg_username_placeholder: "Choisissez votre Surnom",
                reg_password_placeholder: "Créer un mot de passe",
                reg_btn: "INITIALISER BETA",
                
                // Fog
                fog_message: "LE FLUX CHANGE...",
                update_msg: "Mise à jour système installée. Je vais vous guider.",

                // Tutorial Quests
                quest_initi_title: "Initiation",
                quest_initi_text: "Bienvenue, Navigateur ! Je suis Flowee. Avant de conquérir l'univers, vous devez apprendre à piloter le navire. Votre première tâche : Visitez le Bazar.",
                quest_initi_btn: "Cap sur : Le Bazar",
                
                quest_econ_title: "L'Économie",
                quest_econ_text: "Ceci est le Marché. Ici, nous échangeons avec des Flow-Credits. Cliquez sur un TukTuk pour tester l'interface.",
                quest_econ_success: "Excellent ! Vous comprenez le commerce. +50 EXP ! Suivant : La Musique.",
                quest_econ_btn: "Cap sur : Le Sanctuaire",

                quest_vibe_title: "La Vibe",
                quest_vibe_text: "DJ Qter contrôle le rythme ici. Lancez un morceau pour synchroniser votre âme.",
                quest_vibe_success: "Sentez-vous le Flow ? +100 EXP ! Dernier arrêt : La Cuisine.",
                quest_vibe_btn: "Cap sur : La Cuisine",

                // Updates
                new_feature_trinity: "NOUVEAU : Le Statut Trinity ! Gardez Vision, Son et Cuisine en équilibre.",
                new_feature_jamtruck: "MISE À JOUR : La jauge du Jamtruck est active. Aidez-nous à atteindre 700€ !"
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
