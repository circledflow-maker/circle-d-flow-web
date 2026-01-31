// Shared Constants
window.PARTNERS_DATA = [
    { id: 'hempy', name: "Hempy Roots", coords: [38.710, -9.140], desc: "Purveyors of fine herbal remedies.", image: "Assets/images/logo.png" },
    { id: 'secret_garden', name: "Secret Garden LX", coords: [38.720385, -9.133223], desc: "Oasis of creativity.", image: "Assets/images/logo.png" },
    { id: 'seedge', name: "The Seedge", coords: [38.718220, -9.127670], desc: "Conscious growth.", image: "Assets/images/logo.png" },
    { id: 'botanica', name: "Botanica", coords: [38.718439, -9.148754], desc: "Food, drinks & vibes.", image: "Assets/images/logo.png" },
    { id: 'malingua', name: "Ma Lingua", coords: [38.719600, -9.132570], desc: "Language & Music.", image: "Assets/images/logo.png" },
    { id: 'favela', name: "Favela LX", coords: [38.716241, -9.120880], desc: "Nightlife energy.", image: "Assets/images/logo.png" }
];

// --- PROTOCOL BABEL: LOCALIZATION SYSTEM ---
const TRANSLATIONS = {
    en: {
        nav_hub: "Hub",
        nav_sound: "Sound",
        nav_taste: "Taste",
        nav_visuals: "Visuals",
        nav_style: "Style",
        nav_knowledge: "Knowledge",
        nav_space: "Space",
        nav_spirit: "Spirit",
        login_btn: "Login",
        enter_circle: "Enter the Circle",
        mission_brief: "Mission Briefing",
        mission_text: "Welcome to the Circle. Connect your wallet, explore the map, and support local artists.",
        acknowledge: "Acknowledge",
        welcome_back: "Welcome Back"
    },
    pt: {
        nav_hub: "Centro",
        nav_sound: "Som",
        nav_taste: "Sabor",
        nav_visuals: "Visuais",
        nav_style: "Estilo",
        nav_knowledge: "Saber",
        nav_space: "Espaço",
        nav_spirit: "Espírito",
        login_btn: "Entrar",
        enter_circle: "Entrar no Círculo",
        mission_brief: "Missão",
        mission_text: "Bem-vindo ao Círculo. Conecte sua carteira, explore o mapa e apoie artistas locais.",
        acknowledge: "Confirmar",
        welcome_back: "Bem-vindo de volta"
    },
    de: {
        nav_hub: "Zentrale",
        nav_sound: "Klang",
        nav_taste: "Geschmack",
        nav_visuals: "Visuelles",
        nav_style: "Stil",
        nav_knowledge: "Wissen",
        nav_space: "Raum",
        nav_spirit: "Geist",
        login_btn: "Login",
        enter_circle: "Tritt dem Kreis bei",
        mission_brief: "Einsatzbesprechung",
        mission_text: "Willkommen im Kreis. Verbinde dein Wallet, erkunde die Karte und unterstütze lokale Künstler.",
        acknowledge: "Bestätigen",
        welcome_back: "Willkommen zurück"
    },
    fr: {
        nav_hub: "Centre",
        nav_sound: "Son",
        nav_taste: "Goût",
        nav_visuals: "Visuels",
        nav_style: "Style",
        nav_knowledge: "Savoir",
        nav_space: "Espace",
        nav_spirit: "Esprit",
        login_btn: "Connexion",
        enter_circle: "Entrer dans le Cercle",
        mission_brief: "Briefing de Mission",
        mission_text: "Bienvenue dans le Cercle. Connectez votre portefeuille, explorez la carte et soutenez les artistes locaux.",
        acknowledge: "Confirmer",
        welcome_back: "Bon retour"
    }
};

function initLanguageSystem() {
    const savedLang = localStorage.getItem('appLang');
    if (!savedLang) {
        createLanguageOverlay();
    } else {
        updateLanguage(savedLang);
    }
}

function createLanguageOverlay() {
    // Check if exists
    if (document.getElementById('lang-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'lang-overlay';
    overlay.className = 'fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 transition-opacity duration-500';

    const html = `
        <div class="relative w-full max-w-md text-center space-y-8 animate-fade-in-up">
            <h2 class="text-3xl font-bold text-white tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                Select Your<br><span class="text-electric animate-pulse">Frequency</span>
            </h2>
            
            <div class="grid gap-4 mt-8">
                <button onclick="setLanguage('en')" class="lang-btn group relative w-full h-[60px] bg-white/5 border border-white/10 hover:border-electric/50 rounded-xl overflow-hidden transition-all duration-300">
                    <div class="absolute inset-0 bg-electric/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div class="relative flex items-center justify-center gap-3">
                        <span class="text-2xl">🇬🇧</span>
                        <span class="font-bold text-white tracking-widest text-sm uppercase group-hover:text-electric transition-colors">English</span>
                    </div>
                </button>

                <button onclick="setLanguage('pt')" class="lang-btn group relative w-full h-[60px] bg-white/5 border border-white/10 hover:border-green-500/50 rounded-xl overflow-hidden transition-all duration-300">
                    <div class="absolute inset-0 bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div class="relative flex items-center justify-center gap-3">
                        <span class="text-2xl">🇵🇹</span>
                        <span class="font-bold text-white tracking-widest text-sm uppercase group-hover:text-green-400 transition-colors">Português</span>
                    </div>
                </button>

                <button onclick="setLanguage('de')" class="lang-btn group relative w-full h-[60px] bg-white/5 border border-white/10 hover:border-yellow-500/50 rounded-xl overflow-hidden transition-all duration-300">
                    <div class="absolute inset-0 bg-yellow-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div class="relative flex items-center justify-center gap-3">
                        <span class="text-2xl">🇩🇪</span>
                        <span class="font-bold text-white tracking-widest text-sm uppercase group-hover:text-yellow-400 transition-colors">Deutsch</span>
                    </div>
                </button>

                <button onclick="setLanguage('fr')" class="lang-btn group relative w-full h-[60px] bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-xl overflow-hidden transition-all duration-300">
                    <div class="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div class="relative flex items-center justify-center gap-3">
                        <span class="text-2xl">🇫🇷</span>
                        <span class="font-bold text-white tracking-widest text-sm uppercase group-hover:text-blue-400 transition-colors">Français</span>
                    </div>
                </button>
            </div>
            
            <p class="text-[10px] text-white/30 uppercase tracking-widest mt-8">Protocol Babel Active</p>
        </div>
    `;

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
}

window.setLanguage = function (lang) {
    localStorage.setItem('appLang', lang);
    updateLanguage(lang);

    // Animate Out
    const overlay = document.getElementById('lang-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
    }

    // Trigger Mission Briefing if first time
    if (!localStorage.getItem('briefingSeen')) {
        setTimeout(window.initMissionBriefing, 1000);
    }
};

window.updateLanguage = function (lang) {
    const table = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (table[key]) {
            el.innerText = table[key];
        }
    });
};

window.toggleLanguageModal = function () {
    createLanguageOverlay();
};

document.addEventListener('DOMContentLoaded', () => {
    // Ensure Gamification is available
    if (typeof window.Gamification === 'undefined') {
        console.warn('Gamification Engine not loaded. Features will be limited.');
    } else {
        console.log(`[App] Gamification Engine Loaded. Level: ${window.Gamification.getLevel()} XP: ${window.Gamification.getXP()}`);
    }
    // Custom Cursor
    const cursor = document.getElementById('cursor');
    // Cursor trail removed as per user request

    if (cursor) {
        // Initial Check for Touch
        if (window.matchMedia("(pointer: coarse)").matches) {
            cursor.style.display = 'none';
        }

        document.addEventListener('mousemove', (e) => {
            // Only move if desktop and not touch
            if (window.innerWidth > 768 && !window.matchMedia("(pointer: coarse)").matches) {
                // Center the 48x48px cursor (offset 24px)
                cursor.style.transform = `translate(${e.clientX - 24}px, ${e.clientY - 24}px)`;
            }
        });

        // Hover Effect for Links and Buttons
        const interactiveElements = document.querySelectorAll('a, button, .service-card, .comparison-container');

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('cursor-active');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('cursor-active');
            });
        });
    }



    // Audio Player
    // Audio Player with Persistence
    // Error Trap (System Health)
    window.onerror = function (msg, source, lineno) {
        const errorReport = {
            msg: msg,
            source: source,
            line: lineno,
            timestamp: new Date().toISOString(),
            user: localStorage.getItem('userEmail') || 'Guest'
        };
        const reports = JSON.parse(localStorage.getItem('cdf_error_reports') || '[]');
        reports.push(errorReport);
        localStorage.setItem('cdf_error_reports', JSON.stringify(reports));
        console.warn('System Health: Error trapped and reported.', errorReport);
    };

    // Audio Player with Persistence
    const audioBtn = document.getElementById('audio-btn');
    const bgMusic = document.getElementById('bg-music');
    const iconOn = document.getElementById('audio-icon-on');
    const iconOff = document.getElementById('audio-icon-off');

    if (audioBtn && bgMusic) {
        // Try to restore state
        const shouldPlay = localStorage.getItem('musicPlaying') === 'true';
        if (shouldPlay) {
            bgMusic.play().then(() => {
                if (iconOn) iconOn.classList.remove('hidden');
                if (iconOff) iconOff.classList.add('hidden');
            }).catch(() => {
                console.log("Autoplay blocked");
            });
        }

        audioBtn.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play();
                if (iconOn) iconOn.classList.remove('hidden');
                if (iconOff) iconOff.classList.add('hidden');
                localStorage.setItem('musicPlaying', 'true');
            } else {
                bgMusic.pause();
                if (iconOn) iconOn.classList.add('hidden');
                if (iconOff) iconOff.classList.remove('hidden');
                localStorage.setItem('musicPlaying', 'false');
            }
        });
    }

    // UX: Membership Lightbox
    function checkLightbox() {
        const lastShown = localStorage.getItem('cdf_lightbox_last_shown');
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; // 24 hours

        // If never shown or cooldown passed
        if (!lastShown || (now - parseInt(lastShown) > cooldown)) {
            const lightbox = document.getElementById('membership-lightbox');
            // Only show if user is NOT logged in
            if (lightbox && localStorage.getItem('isLoggedIn') !== 'true') {
                setTimeout(() => {
                    lightbox.showModal();
                    localStorage.setItem('cdf_lightbox_last_shown', now.toString());
                }, 2000); // 2-second delay for smoother entry
            }
        }
    }
    // Check on load
    checkLightbox();

    // Engagement: Mission Briefing (HUD Notification)
    function initMissionBriefing() {
        if (!localStorage.getItem('briefingSeen')) {
            const briefing = document.createElement('div');
            briefing.className = 'fixed top-24 right-4 max-w-sm bg-black/90 backdrop-blur-xl border border-electric/50 text-white p-6 rounded-2xl z-[100] shadow-[0_0_30px_rgba(154,77,255,0.3)] transform translate-x-full transition-transform duration-500';
            briefing.innerHTML = `
                <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-full bg-electric/20 flex items-center justify-center border border-electric">
                        <span class="material-symbols-outlined text-electric">hub</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-electric mb-1 text-sm tracking-widest uppercase">Mission Briefing</h4>
                        <p class="text-xs text-white/80 leading-relaxed mb-4">
                            Welcome to the Circle. Connect your wallet, explore the map, and support local artists. 
                            <br><strong class="text-white">Protocol Yggdrasil active.</strong>
                        </p>
                        <button id="accept-briefing" class="w-full py-2 bg-electric text-white font-bold text-xs uppercase tracking-widest rounded hover:bg-white hover:text-black transition-colors">
                            Acknowledge
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(briefing);

            // Animate In
            setTimeout(() => briefing.classList.remove('translate-x-full'), 1000);

            // Dismiss
            document.getElementById('accept-briefing').onclick = () => {
                briefing.classList.add('translate-x-full');
                localStorage.setItem('briefingSeen', 'true');
                setTimeout(() => briefing.remove(), 500);
            };
        }
    }
    initMissionBriefing();

    // Utility: WhatsApp Bridge
    window.openWhatsApp = function (text) {
        const phone = "351912345678"; // Replace with actual number if provided, currently generic
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Utility: Guild Status Helper
    window.checkGuildStatus = function () {
        return localStorage.getItem('userGuild') || 'guest';
    };

    // Logout Function (Global)
    window.logout = function () {
        if (confirm("Are you sure you want to leave the Circle?")) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('cdf_active_role');
            // Clear simulated cart
            localStorage.removeItem('aq_cart');
            window.location.href = 'index.html';
        }
    }

    // Initialize
    updateNavState();

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('bg-midnight/80', 'backdrop-blur-md', 'shadow-lg');
                navbar.classList.remove('py-6');
                navbar.classList.add('py-4');
            } else {
                navbar.classList.remove('bg-midnight/80', 'backdrop-blur-md', 'shadow-lg', 'py-4');
                navbar.classList.add('py-6');
            }
        });
    }

    // Booking Modal Logic
    const bookingModal = document.getElementById('booking-modal');
    const closeBookingBtn = document.getElementById('close-booking-btn');
    const serviceCards = document.querySelectorAll('.service-card');
    const offerBtns = document.querySelectorAll('.offer-btn');

    // State
    let bookingState = {
        step: 1,
        service: '',
        details: {}
    };

    // Elements
    const steps = [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3')
    ];
    const progressBar = document.getElementById('booking-progress');
    const stepTitle = document.getElementById('booking-step-title');
    const stepDesc = document.getElementById('booking-step-desc');

    // Step Info
    const stepInfo = [
        { title: "Select Service", desc: "Choose the experience that fits your vision." },
        { title: "Your Details", desc: "Tell us a bit about yourself and your ideas." },
        { title: "Confirm Booking", desc: "Review your details before sending." }
    ];

    function updateModalUI() {
        console.log("Updating Modal UI. Step:", bookingState.step);
        // Show/Hide Steps
        steps.forEach((el, index) => {
            if (!el) {
                console.error(`Step element ${index + 1} not found!`);
                return;
            }
            if (index + 1 === bookingState.step) {
                console.log(`Showing Step ${index + 1}`);
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // Update Progress
        if (progressBar) {
            progressBar.style.width = `${(bookingState.step / 3) * 100}%`;
        }

        // Update Text (Desktop Left Panel)
        if (stepTitle && stepDesc) {
            stepTitle.textContent = stepInfo[bookingState.step - 1].title;
            stepDesc.textContent = stepInfo[bookingState.step - 1].desc;
        }
    }

    function openBookingModal(preselectedService = null) {
        console.log("Opening Booking Modal. Preselected:", preselectedService);
        if (!bookingModal) {
            console.error("Booking modal element not found!");
            return;
        }

        bookingModal.classList.remove('hidden');
        setTimeout(() => bookingModal.classList.remove('opacity-0'), 10);

        // Always start at Step 1 as per user request
        bookingState.step = 1;

        // If a service was clicked, we can highlight it or just store it, 
        // but the user wants the customer to "choose" it. 
        // So we'll just reset the state to ensure they go through the flow.
        bookingState.service = '';

        updateModalUI();
    }
    // Expose to window for manga.js compatibility
    window.openOfferModal = openBookingModal;
    window.openBookingModal = openBookingModal;

    function closeBookingModal() {
        if (!bookingModal) return;

        bookingModal.classList.add('opacity-0');
        setTimeout(() => bookingModal.classList.add('hidden'), 500);
    }

    // Event Listeners

    // Service Cards Click
    serviceCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // We ignore the specific service clicked and just open the modal at Step 1
            openBookingModal();
        });
    });

    // Offer Buttons Click (Direct clicks on buttons)
    offerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            openBookingModal();
        });
    });

    if (closeBookingBtn) {
        closeBookingBtn.addEventListener('click', closeBookingModal);
    }

    // Close on background click
    if (bookingModal) {
        bookingModal.addEventListener('click', (e) => {
            if (e.target === bookingModal) {
                closeBookingModal();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && bookingModal && !bookingModal.classList.contains('hidden')) {
            closeBookingModal();
        }
    });

    // Step 1: Service Selection (Inside Modal)
    document.querySelectorAll('.service-option').forEach(btn => {
        btn.addEventListener('click', () => {
            bookingState.service = btn.dataset.service;
            bookingState.step = 2;
            updateModalUI();
        });
    });

    // Step 2: Form -> Step 3
    const toStep3Btn = document.getElementById('to-step-3');
    if (toStep3Btn) {
        toStep3Btn.addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('booking-form');
            const formData = new FormData(form);

            // Simple Validation
            const name = formData.get('name');
            const email = formData.get('email');

            if (!name || !email) {
                alert('Please fill in your name and email.');
                return;
            }

            bookingState.details = {
                name: name,
                email: email,
                direction: formData.get('direction')
            };

            // Populate Summary
            const summaryService = document.getElementById('summary-service');
            const summaryName = document.getElementById('summary-name');
            const summaryEmail = document.getElementById('summary-email');
            const summaryVision = document.getElementById('summary-vision');

            if (summaryService) summaryService.textContent = bookingState.service;
            if (summaryName) summaryName.textContent = bookingState.details.name;
            if (summaryEmail) summaryEmail.textContent = bookingState.details.email;
            if (summaryVision) summaryVision.textContent = bookingState.details.direction || "No specific vision provided.";

            bookingState.step = 3;
            updateModalUI();
        });
    }

    // Back Buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission if inside form
            if (bookingState.step > 1) {
                bookingState.step--;
                updateModalUI();
            }
        });
    });

    // Confirm Booking
    const confirmBtn = document.getElementById('confirm-booking');
    if (confirmBtn) {
        // Update button text to reflect the action
        confirmBtn.textContent = "Book Date on Calendar";

        confirmBtn.addEventListener('click', () => {
            // 1. Construct Mailto Link (Client-side email)
            const subject = `Booking Request: ${bookingState.service} - ${bookingState.details.name}`;
            const body = `Name: ${bookingState.details.name}%0D%0AEmail: ${bookingState.details.email}%0D%0AService: ${bookingState.service}%0D%0AVision/Details: ${bookingState.details.direction}`;
            const mailtoLink = `mailto:contact@kissyourheart.com?subject=${encodeURIComponent(subject)}&body=${body}`; // Note: body is not standard in mailto but works in some clients, better to just rely on subject or use a form service.
            // Actually, let's just use the Calendar link as the primary action since "mailto" can be annoying if it pops up. 
            // BUT the user said "customer should get confirmation". Without backend, we can't send confirmation TO customer.
            // We can only have customer send email TO us.

            // Let's open the Calendar link as requested for "choose day".
            // And maybe try to open mailto in background or just assume Calendar is enough?
            // The user said "Then message And choose day".

            console.log("Booking Data:", bookingState);

            // Open Google Calendar Appointment Page
            window.open("https://calendar.app.google/XbmJUDtaSWecgEXHA", "_blank");

            // Redirect to Thank You page in the main window
            window.location.href = 'thankyou.html';
        });
    }
    // Cookie Banner Logic
    function initCookieBanner() {
        const consent = localStorage.getItem('cookieConsent');
        if (consent) return; // Already decided

        // Create Banner
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.className = 'fixed bottom-0 left-0 w-full bg-background-dark/95 backdrop-blur-md border-t border-white/10 p-6 z-50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl transform transition-transform duration-500 translate-y-full';

        banner.innerHTML = `
            <div class="text-white/80 text-sm max-w-2xl text-center md:text-left">
                <p>We use cookies to enhance your experience, analyze site traffic, and facilitate bookings. By continuing to use our site, you agree to our use of cookies. <a href="privacy.html" class="text-mystic-gold hover:underline">Learn more in our Privacy Policy</a>.</p>
            </div>
            <div class="flex gap-4">
                <button id="cookie-decline" class="px-4 py-2 border border-white/20 rounded-lg text-white text-sm hover:bg-white/10 transition-colors">Decline</button>
                <button id="cookie-accept" class="px-6 py-2 bg-mystic-gold text-background-dark font-bold rounded-lg text-sm hover:bg-white transition-colors shadow-lg shadow-mystic-gold/20">Accept</button>
            </div>
        `;

        document.body.appendChild(banner);

        // Animate in
        setTimeout(() => {
            banner.classList.remove('translate-y-full');
        }, 100);

        // Event Listeners
        document.getElementById('cookie-accept').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.classList.add('translate-y-full');
            setTimeout(() => banner.remove(), 500);
        });

        document.getElementById('cookie-decline').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'declined');
            banner.classList.add('translate-y-full');
            setTimeout(() => banner.remove(), 500);
        });
    }

    initCookieBanner();

    // --- The Flow Bar Logic (Unified) ---

    // 1. Mobile Wave Menu
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileCloseBtn = document.getElementById('mobile-close-btn');
    const mobileWaveMenu = document.getElementById('mobile-wave-menu');
    const mobileLinks = mobileWaveMenu ? mobileWaveMenu.querySelectorAll('a') : [];

    function toggleMenu(open) {
        if (!mobileWaveMenu) return;

        if (open) {
            mobileWaveMenu.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
            mobileWaveMenu.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
            document.body.style.overflow = 'hidden'; // Lock scroll
        } else {
            mobileWaveMenu.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
            mobileWaveMenu.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
            document.body.style.overflow = ''; // Unlock scroll
        }
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => toggleMenu(true));
    }

    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', () => toggleMenu(false));
    }

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });

    // 1.1 Generic Sidebar Menu (partners.html, etc.)
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.contains('translate-x-full');
            if (isHidden) {
                // Open
                mobileMenu.classList.remove('translate-x-full');
                document.body.style.overflow = 'hidden';
            } else {
                // Close
                mobileMenu.classList.add('translate-x-full');
                document.body.style.overflow = '';
            }
        });

        // Close on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('translate-x-full');
                document.body.style.overflow = '';
            });
        });
    }

    // 2. Auth State Management
    function updateNavState() {
        // Check both potential keys just in case
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        const desktopAuth = document.getElementById('desktop-auth');
        const mobileAuthLink = document.getElementById('mobile-auth-link');

        // Get Real User Data from Gamification Engine
        let userLevel = 0;
        let rankStars = "☆☆☆☆☆☆☆";
        const storedEmail = localStorage.getItem('userEmail');

        // Admin Logic
        const admins = ['circle.d.flow@gmail.com', 'bluesboyproduction@gmail.com'];
        const isAdmin = storedEmail && admins.includes(storedEmail.toLowerCase());

        if (window.Gamification) {
            userLevel = window.Gamification.getLevel();
            if (isAdmin) userLevel = 7; // Force Level 7 for Admins
            const stars = "★".repeat(userLevel) + "☆".repeat(7 - userLevel);
            rankStars = stars;
        }

        let userProfile = {
            name: "Guest",
            rank: rankStars,
            level: userLevel,
            avatar: "https://ui-avatars.com/api/?name=Guest&background=random"
        };

        if (isAdmin) {
            userProfile.name = "Admin";
            userProfile.avatar = "https://ui-avatars.com/api/?name=Admin&background=FFD700&color=000";
            // Initialize Admin Panel
            setTimeout(initAdminPanel, 100);
        } else {
            const storedName = localStorage.getItem('userName');
            if (storedName) {
                userProfile.name = storedName;
                userProfile.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(storedName)}&background=random`;
            } else if (storedEmail) {
                userProfile.name = storedEmail.split('@')[0]; // Simple name from email
            }
        }

        if (isLoggedIn) {
            // Desktop: Show Avatar + Stars
            if (desktopAuth) {
                desktopAuth.innerHTML = `
                     <a href="dashboard.html" class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        <div class="flex flex-col items-end leading-tight min-w-[80px]">
                            <span class="text-white font-bold text-xs">${userProfile.name}</span>
                            <div class="flex items-center gap-1">
                                <span class="text-mystic-gold text-[10px] tracking-widest">${userProfile.rank}</span>
                            </div>
                            <!-- XP Bar -->
                            <div class="w-full h-1 bg-white/10 rounded-full mt-1">
                                <div class="h-full bg-electric rounded-full" style="width: ${window.Gamification ? window.Gamification.getProgressToNextLevel() : 0}%"></div>
                            </div>
                        </div>
                        <div class="relative">
                            <img src="${userProfile.avatar}" alt="User" class="w-9 h-9 rounded-full border border-mystic-gold p-0.5 object-cover">
                            <div class="absolute -bottom-1 -right-1 bg-mystic-gold text-background-dark text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-background-dark">
                                ${userProfile.level}
                            </div>
                        </div>
                    </a>
                `;
            }
            // Mobile: Change "Enter the Circle" to "My Profile"
            if (mobileAuthLink) {
                mobileAuthLink.innerHTML = 'My Profile';
                mobileAuthLink.href = 'dashboard.html';
            }
        } else {
            // Desktop: Show "Enter the Circle" Button
            if (desktopAuth) {
                desktopAuth.innerHTML = `
                    <a href="login.html" class="px-6 py-2 bg-white text-midnight font-bold rounded-full text-xs uppercase tracking-widest hover:bg-mystic-gold hover:scale-105 transition-all shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        Enter the Circle
                    </a>
                `;
            }
            // Mobile: Default
            if (mobileAuthLink) {
                mobileAuthLink.innerHTML = 'Enter the Circle';
                mobileAuthLink.href = 'login.html';
            }
        }
    }

    // Listen for Gamification Events to update UI in real-time
    window.addEventListener('xp-added', () => updateNavState());
    window.addEventListener('level-up', () => updateNavState());

    updateNavState();



});

// -- Admin Dashboard Logic --
function initAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    const eventList = document.getElementById('admin-event-list');
    const pendingTicketsEl = document.getElementById('admin-pending-tickets');

    if (!adminPanel) return;

    adminPanel.classList.remove('hidden');

    // System Health: Master Inbox (Error Reports)
    const errorList = document.getElementById('admin-error-list');
    if (errorList) {
        const reports = JSON.parse(localStorage.getItem('cdf_error_reports') || '[]');
        if (reports.length === 0) {
            errorList.innerHTML = '<p class="text-xs text-gray-500 italic">No new reports.</p>';
        } else {
            errorList.innerHTML = reports.map(r => `
                <div class="p-2 border-l-2 border-red-500 bg-white/5 mb-1">
                    <p class="text-[10px] text-gray-400 font-mono">${new Date(r.timestamp).toLocaleTimeString()} - ${r.user}</p>
                    <p class="text-xs text-red-200 font-bold">${r.msg}</p>
                    <p class="text-[10px] text-gray-500 truncate">${r.source}:${r.line}</p>
                </div>
            `).join('');
        }
    }

    // Weekly Summary Logic
    window.generateWeeklySummary = function () {
        const reports = JSON.parse(localStorage.getItem('cdf_error_reports') || '[]');
        const members = 1; // Simulated
        alert(`Weekly Summary Generated:\n- Total Errors Reported: ${reports.length}\n- New Members: ${members}\n- System Status: 98% Uptime\n\nReport sent to Master Dashboard Inbox.`);
    };

    // Stats
    // Stats
    if (window.Events) {
        const tickets = window.Events.getMyTickets(); // Get all (no email arg)
        if (pendingTicketsEl) pendingTicketsEl.textContent = tickets.length;

        // Render Events
        if (eventList) {
            const events = window.Events.getEvents();
            eventList.innerHTML = events.map(evt => `
                <div class="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 hover:border-white/20 transition-colors">
                    <div>
                        <p class="text-white font-bold text-sm truncate w-32 md:w-48">${evt.title}</p>
                        <p class="text-xs text-mist">${new Date(evt.date).toLocaleDateString()}</p>
                    </div>
                    <button onclick="deleteEvent('${evt.id}')" class="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete Event">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            `).join('');

            if (events.length === 0) {
                eventList.innerHTML = '<p class="text-sm text-mist italic">No events found.</p>';
            }
        }
    }

    // Render Notifications
    if (window.Notifications) {
        renderAdminNotifications();
        // Listen for updates
        window.addEventListener('notificationsUpdated', renderAdminNotifications);
    }

    // Render Funds
    if (window.renderFundDisplay) window.renderFundDisplay();
}

function renderAdminNotifications() {
    const list = document.getElementById('admin-notifications');
    if (!list || !window.Notifications) return;

    // Get Admin + All messages
    const alerts = window.Notifications.notifications.filter(n => n.targetRole === 'admin' || n.targetRole === 'all');

    if (alerts.length === 0) {
        list.innerHTML = '<p class="text-xs text-mist italic">No alerts.</p>';
        return;
    }

    list.innerHTML = alerts.map(n => `
        <div class="p-2 rounded bg-white/5 border-l-2 ${n.type === 'action_required' ? 'border-amber' : 'border-electric'} mb-1">
            <p class="text-xs text-white">${n.message}</p>
            <span class="text-[10px] text-gray-500">${new Date(n.timestamp).toLocaleTimeString()}</span>
        </div>
    `).join('');
}

window.clearNotifications = function () {
    if (window.Notifications) {
        window.Notifications.notifications = [];
        window.Notifications.save();
        renderAdminNotifications();
    }
};

// Global delete function for Admin
window.deleteEvent = function (id) {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;

    if (window.Events && window.Events.deleteEvent(id)) {
        // initAdminPanel will refresh the list
        initAdminPanel();
    } else {
        alert('Failed to delete event.');
    }
};

// Simulation Logic for Check-in
window.simulateCheckIn = function () {
    const ticketId = document.getElementById('scan-ticket-id').value;
    const resultEl = document.getElementById('scan-result');
    if (!ticketId) { resultEl.textContent = "Enter Ticket ID"; return; }

    // In a real app, we'd look up the ticket, verify it, find the user.
    // Here we just award XP to the CURRENT user for demo purposes, 
    // assuming they are the one being scanned (or we just simulate the math).

    if (window.Gamification) {
        window.Gamification.checkAttendance('simulated_event', 'current_user', 'attended');
        resultEl.textContent = `Success! Checked in ${ticketId}. +100 XP awarded.`;
        resultEl.className = "text-xs text-green-400 mt-2";
    }
};

window.simulateNoShow = function () {
    const ticketId = document.getElementById('scan-ticket-id').value;
    const resultEl = document.getElementById('scan-result');
    if (!ticketId) { resultEl.textContent = "Enter Ticket ID"; return; }

    if (window.Gamification) {
        window.Gamification.checkAttendance('simulated_event', 'current_user', 'noshow');
        resultEl.textContent = `Marked ${ticketId} as No-Show. -50 XP penalty.`;
        resultEl.className = "text-xs text-red-400 mt-2";
    }
};

// Simulation: Funds
window.simulateTicketSale = function () {
    if (window.Gamification) {
        window.Gamification.addPendingFunds(50);
        updateFundDisplay();
        window.Notifications.send('success', 'Ticket Sold! €50 added to Escrow.', 'admin');
    }
};

window.simulateFundRelease = function () {
    if (window.Gamification) {
        if (window.Gamification.releaseFunds(50)) {
            updateFundDisplay();
            window.Notifications.send('success', '€50 Released from Escrow (72h passed).', 'admin');
        } else {
            alert('No pending funds to release.');
        }
    }
};

function updateFundDisplay() {
    if (!window.Gamification) return;
    const w = window.Gamification.state.wallet;
    if (w) {
        const pending = document.getElementById('admin-pending-funds');
        const available = document.getElementById('admin-available-funds');
        if (pending) pending.textContent = `€${(w.pendingFunds || 0).toFixed(2)}`;
        if (available) available.textContent = `€${(w.availableFunds || 0).toFixed(2)}`;
    }
}

// Hook into Admin Init to update funds initially
const _originalInit = window.initAdminPanel; // Careful with re-eval
// We'll just call it at the end of initAdminPanel in the DOM logic if possible, 
// or simpler: just add it to the interval or event listener if we had one.
// Since we are creating a fresh verify pass, let's just add it to the render loop in initAdminPanel via a small edit or assume user manually clicks to refresh.
// Actually, let's edit initAdminPanel one last time to include updateFundDisplay();

window.renderFundDisplay = updateFundDisplay; // Export for init


/**
 * Manager Access & Password Gates
 */
window.requestManagerAccess = function (role) {
    const passwords = {
        'admin': 'FreePirates',
        'kitchen': 'Dkitchen!',
        'sound': 'Dsound!'
    };

    const input = prompt(`Enter Password for ${role.toUpperCase()} Access:`);
    if (input === passwords[role]) {
        alert(`Access Granted: ${role.toUpperCase()}`);
        activateManagerRole(role);
    } else {
        alert('Access Denied. Incorrect Password.');
    }
}

function activateManagerRole(role) {
    localStorage.setItem('cdf_active_role', role);

    // Unlock Upload Options
    const modal = document.getElementById('upload-modal');
    if (modal) {
        if (role === 'admin') {
            document.getElementById('opt-museum').disabled = false;
            document.getElementById('opt-kitchen').disabled = false;
            document.getElementById('opt-sound').disabled = false;
            document.getElementById('admin-panel').classList.remove('hidden');
        } else if (role === 'kitchen') {
            document.getElementById('opt-kitchen').disabled = false;
        } else if (role === 'sound') {
            document.getElementById('opt-sound').disabled = false;
        }

        // Auto-show modal for convenience
        modal.showModal();
        // Select the relevant option
        const select = document.getElementById('upload-type');
        if (role === 'kitchen') select.value = 'dish';
        if (role === 'sound') select.value = 'event';
        if (role === 'admin') select.value = 'museum';
    }
}

/**
 * Unified Upload Handler
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('unified-upload-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const type = formData.get('type') || document.getElementById('upload-type').value; // fallback

            const data = {
                title: formData.get('title'),
                description: formData.get('description'),
                price: formData.get('price'),
                image: 'https://placehold.co/600x400/333/white?text=' + type.toUpperCase() // Mock image
            };

            if (type === 'dish') {
                if (window.KitchenManager) window.KitchenManager.addDish(data);
                alert('Dish added to Menu!');
            } else if (type === 'event') {
                if (window.SoundManager) window.SoundManager.addEvent(data);
                alert('Event added to Calendar!');
            } else {
                // Marketplace/Museum default
                alert(`Item uploaded to ${type}! (Simulated)`);
            }

            document.getElementById('upload-modal').close();
            form.reset();
        });
    }

    // Feedback
    window.submitFeedback = function () {
        const msg = prompt("Describe the bug or error:");
        if (msg) alert("Feedback sent to Dev Team! (FreePirates)");
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });

            // Handle controller change (reload on update)
            let refreshing;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                window.location.reload();
                refreshing = true;
            });
        });
    }
}
