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
                enter_zone: "Enter the Zone (Ticket)",
                join_circle_artist: "Join the Circle (Artist)",
                syncing_flow: "Synchronizing Flow...",
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
                enter_zone: "Zone betreten (Ticket)",
                join_circle_artist: "Dem Kreis beitreten (Artist)",
                syncing_flow: "Flow wird synchronisiert...",
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
            it: {
                bazaar: "Il Bazar",
                kitchen: "Cucina African Queen",
                dashboard: "Pannello Principale",
                sanctuary: "Santuario di Qter",
                missions: "Missioni Imperiali",
                wisdom: "Saggezza Antica",
                login: "Identificati",
                register: "Diventa un Navigatore",
                dismiss: "Ignora Protocollo (Ospite)",
                jamtruck: "Progresso Jamtruck",
                vision_title: "Perfezione Curata",
                taste_title: "African Queen",
                enter_gateway: "Entra nel Portale",
                welcome_guide: "Benvenuto, Viaggiatore.",
                flow_call: "Il Flow ti chiama",

                // NEW KEYS
                join_circle: "Unisciti al Circolo",
                unlock_full: "Sblocca l'esperienza completa.",
                bazaar_title: "Il Bazar",
                circle_title: "Il Circolo",
                academy_title: "L'Accademia",
                vision_brand: "Impero della Visione",
                taste_brand: "Impero del Gusto",

                // AUTH & QUESTS
                auth_login_title: "CAPITANO DI RITORNO",
                auth_register_title: "NUOVO NAVIGATORE",
                login_username_placeholder: "Nome Cacciatore",
                login_password_placeholder: "Password",
                login_btn: "ENTRA NEL SISTEMA",
                reg_email_placeholder: "Anima Digitale (Email)",
                reg_username_placeholder: "Scegli il tuo Soprannome",
                reg_password_placeholder: "Crea Password",
                reg_btn: "INIZIALIZZA BETA",
                
                // Fog
                fog_message: "IL FLUSSO STA CAMBIANDO...",
                update_msg: "Aggiornamento di Sistema installato. Ti guiderò io.",

                // Tutorial Quests
                quest_initi_title: "Iniziazione",
                quest_initi_text: "Benvenuto, Navigatore! Sono Flowee. La tua prima missione: Visita il Bazar.",
                quest_initi_btn: "Imposta rotta: Bazar",
                tutorial_welcome: "Benvenuto al Centro di Comando. Questa Bussola è il tuo strumento di navigazione.",
                
                quest_econ_title: "L'Economia",
                quest_econ_text: "Questo è il Mercato. Qui scambiamo Flow-Credits. Clicca su un TukTuk per testare l'interfaccia.",
                quest_econ_success: "Eccellente! Hai compreso il commercio. +50 EXP! Prossima: La Musica.",
                quest_econ_btn: "Imposta rotta: Santuario",

                quest_vibe_title: "L'Atmosfera",
                quest_vibe_text: "DJ Qter controlla il ritmo qui. Avvia una traccia per sincronizzare la tua anima.",
                quest_vibe_success: "Senti il Flow? +100 EXP! Ultima fermata: La Cucina.",
                quest_vibe_btn: "Imposta rotta: Cucina",

                // Updates
                new_feature_trinity: "NUOVO: Lo status Trinity! Mantieni Visione, Suono e Cucina in equilibrio.",
                new_feature_jamtruck: "AGGIORNAMENTO: L'indicatore Jamtruck è attivo. Aiutaci a raggiungere 700€!"
            },
            pt: {
                bazaar: "O Bazar",
                kitchen: "Cozinha African Queen",
                dashboard: "Painel Principal",
                sanctuary: "Santuário do Qter",
                missions: "Missões Imperiais",
                wisdom: "Sabedoria Antiga",
                login: "Identifique-se",
                register: "Torne-se Navegador",
                dismiss: "Ignorar Protocolo (Visitante)",
                jamtruck: "Progresso Jamtruck",
                vision_title: "Perfeição Curada",
                taste_title: "African Queen",
                enter_gateway: "Entrar no Portal",
                welcome_guide: "Bem-vindo, Viajante.",
                flow_call: "O Flow te chama",

                // NEW KEYS
                join_circle: "Junte-se ao Círculo",
                enter_zone: "Entrar na Zona (Bilhete)",
                join_circle_artist: "Junte-se ao Círculo (Artista)",
                syncing_flow: "Sincronizando o Flow...",
                unlock_full: "Desbloqueie a experiência completa.",
                bazaar_title: "O Bazar",
                circle_title: "O Círculo",
                academy_title: "A Academia",
                vision_brand: "Império da Visão",
                taste_brand: "Império do Sabor",

                // AUTH & QUESTS
                auth_login_title: "CAPITÃO DE VOLTA",
                auth_register_title: "NOVO NAVIGATOR",
                login_username_placeholder: "Nome de Caçador",
                login_password_placeholder: "Senha",
                login_btn: "ENTRAR NO SISTEMA",
                reg_email_placeholder: "Alma Digital (Email)",
                reg_username_placeholder: "Escolha seu Apelido",
                reg_password_placeholder: "Criar Senha",
                reg_btn: "INICIALIZAR BETA",
                
                // Fog
                fog_message: "O FLUXO ESTÁ MUDANDO...",
                update_msg: "Atualização de Sistema instalada. Eu vou te guiar.",

                // Tutorial Quests
                quest_initi_title: "Iniciação",
                quest_initi_text: "Bem-vindo, Navegador! Eu sou Flowee. Sua primeira missão: Visite o Bazar.",
                quest_initi_btn: "Definir Rota: Bazar",
                tutorial_welcome: "Bem-vindo ao Centro de Comando. Esta Bússola é sua ferramenta de navegação.",
                
                quest_econ_title: "A Economia",
                quest_econ_text: "Este é o Mercado. Aqui negociamos com Flow-Credits. Clique em um TukTuk para testar.",
                quest_econ_success: "Excelente! Você entende o comércio. +50 EXP! Próximo: A Música.",
                quest_econ_btn: "Definir Rota: Santuário",

                quest_vibe_title: "A Vibe",
                quest_vibe_text: "DJ Qter controla o ritmo aqui. Toque uma música para sincronizar.",
                quest_vibe_success: "Você sente o Flow? +100 EXP! Última parada: A Cozinha.",
                quest_vibe_btn: "Definir Rota: Cozinha",

                // Updates
                new_feature_trinity: "NOVO: Status Trinity! Mantenha Visão, Som e Cozinha em equilíbrio.",
                new_feature_jamtruck: "ATUALIZAÇÃO: Indicador Jamtruck está ativo. Ajude-nos a bater 700€!"
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
            z-index: 20000;
            font-family: 'Space Mono', monospace;
            font-size: 14px;
        }
        .lang-dropdown-btn {
            background: #111;
            border: 1px solid rgba(212,175,55,0.5);
            color: #d4af37;
            padding: 4px 12px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: bold;
        }
        .lang-dropdown-btn:hover {
            background: rgba(255,255,255,0.1);
        }
        .lang-dropdown-menu {
            display: none;
            position: absolute;
            right: 0;
            margin-top: 8px;
            background: rgba(0,0,0,0.9);
            border: 1px solid rgba(212,175,55,0.5);
            border-radius: 4px;
            width: 100%;
            text-align: center;
            flex-direction: column;
        }
        .lang-switcher:hover .lang-dropdown-menu {
            display: flex;
        }
        .lang-dropdown-menu button {
            width: 100%;
            color: #aaa;
            padding: 8px 0;
            background: none;
            border: none;
            cursor: pointer;
            border-bottom: 1px solid rgba(212,175,55,0.2);
        }
        .lang-dropdown-menu button:last-child {
            border-bottom: none;
        }
        .lang-dropdown-menu button:hover, .lang-dropdown-menu button.active {
            color: #d4af37;
            background: rgba(255,255,255,0.05);
        }
    `;
    document.head.appendChild(style);
}

    injectSwitcher() {
        // Disabled: Language is determined by user profile card globally.
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
        
    const display = document.getElementById('current-lang-display');
    if (display) display.textContent = lang.toUpperCase();

    document.querySelectorAll('.lang-dropdown-menu button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
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
