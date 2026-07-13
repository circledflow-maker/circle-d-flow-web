/**
 * Flowee Kitchen Tour — guest, staff, forge, command paths
 */
class FloweeKitchenTour {
    constructor() {
        window.FloweeKitchenTour = this;
        document.addEventListener('DOMContentLoaded', () => {
            const params = new URLSearchParams(location.search);
            const path = location.pathname;
            // Only auto-start when explicit tutorial mode matches page
            if (path.includes('kitchen_forge') && params.get('tutorial')) {
                setTimeout(() => this.startForgeTour(true), 1200);
            } else if (path.includes('kitchen_command') && params.get('tutorial') === '1') {
                setTimeout(() => this.startCommandTour(true), 1200);
            } else if (path.includes('taste_world_hub') && params.get('tutorial') === '1') {
                setTimeout(() => this.hubTour(true), 1200);
            } else if (path.includes('taste_radar') && params.get('tutorial')) {
                setTimeout(() => this.radarTour(true), 1200);
            } else if (path.includes('akwaba_kitchen') && params.get('tutorial') === '1') {
                setTimeout(() => this.guestTour(true), 1200);
            } else if (path.includes('kitchen_workspace') && params.get('tutorial') === 'ops') {
                setTimeout(() => this.ownerTour(true), 900);
            }
        });
    }

    langText(de, en, pt) {
        const l = window.TasteI18n?.lang || 'de';
        if (l === 'en') return en;
        if (l === 'pt') return pt;
        return de;
    }

    async speak(text, mood, options) {
        if (window.Flowee) window.Flowee.talk(true, text, mood || 'guide', options || []);
        if (window.FloweeVoice) {
            await window.FloweeVoice.speakAsync(text);
            await window.FloweeVoice.waitAfterSpeech(500);
        } else {
            await new Promise((r) => setTimeout(r, Math.max(2200, text.length * 32)));
        }
    }

    highlight(sel, slideIndex = null) {
        document.querySelectorAll('.flowee-tour-highlight').forEach((e) => e.classList.remove('flowee-tour-highlight'));
        const el = document.querySelector(sel);
        if (el) {
            el.classList.add('flowee-tour-highlight');
            if (slideIndex !== null && document.querySelector('.tasteOpsSwiper')?.swiper) {
                document.querySelector('.tasteOpsSwiper').swiper.slideTo(slideIndex);
            } else {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    async start(force) { return this.ownerTour(force); }

    async startForgeTour(force) {
        const key = 'cdf_kitchen_forge_tour_v1';
        if (!force && localStorage.getItem(key)) return;
        await this.speak(this.langText(
            'Willkommen, Schöpfer. Gib deiner Kitchen einen Namen und Slug — danach landest du im Taste Radar.',
            'Welcome, Creator. Name your kitchen and slug — then you go live on Taste Radar.',
            'Bem-vindo, Criador. Nome e slug da cozinha — depois entra no Taste Radar.'
        ));
        this.highlight('#forge-panel');
        await this.speak(this.langText(
            'Aktiviere Taste Radar — Gäste swipen deine Küche manga-style und bestellen Pickup.',
            'Enable Taste Radar — guests swipe your kitchen manga-style and order pickup.',
            'Ative o Taste Radar — convidados deslizam e pedem pickup.'
        ));
        localStorage.setItem(key, '1');
    }

    async startCommandTour(force) {
        const key = 'cdf_kitchen_command_tour_v1';
        if (!force && localStorage.getItem(key)) return;
        await this.speak(this.langText(
            'Kitchen Command — wähle deine zugewiesene oder erstellte Kitchen. Jede führt zu KDS, Menü und QR.',
            'Kitchen Command — pick your assigned or forged kitchen. Each opens KDS, menu and QR.',
            'Kitchen Command — escolha a cozinha atribuída ou criada. Cada uma abre KDS, menu e QR.'
        ));
        this.highlight('#kitchen-list');
        localStorage.setItem(key, '1');
    }

    async hubTour(force) {
        const key = 'cdf_kitchen_tour_hub_v1';
        if (!force && localStorage.getItem(key)) return;
        await this.speak(this.langText(
            'Taste Hub — Radar für Gäste, Kitchen Command für Ops, Forge für neue Realms.',
            'Taste Hub — Radar for guests, Kitchen Command for ops, Forge for new realms.',
            'Taste Hub — Radar para convidados, Command para ops, Forge para novos reinos.'
        ));
        this.highlight('.hub-tile');
        localStorage.setItem(key, '1');
    }

    async radarTour(force) {
        const key = 'cdf_kitchen_tour_radar_v1';
        if (!force && localStorage.getItem(key)) return;
        await this.speak(this.langText(
            'Swipe hoch und runter — manga Kitchen-Scan. Tippe Order für Pickup an die echte KDS.',
            'Swipe up and down — manga kitchen scan. Tap Order to send pickup to the real KDS.',
            'Deslize — scan manga. Toque Order para enviar pickup ao KDS.'
        ));
        localStorage.setItem(key, '1');
    }

    async guestTour(force) {
        const key = 'cdf_kitchen_tour_guest_v1';
        if (!force && localStorage.getItem(key)) return;
        await this.speak(this.langText(
            'Willkommen in der Live-Kitchen. Reel, Menükarte, dann ADD PICKUP — bezahle an der Bar wenn READY.',
            'Welcome to the live kitchen. Reel, menu card, then ADD PICKUP — pay at bar when READY.',
            'Bem-vindo à cozinha live. Reel, menu, ADD PICKUP — pague na barra quando READY.'
        ));
        this.highlight('#menu-grid');
        await this.speak(this.langText(
            'Soul Ticket nach Bestellung — QR + PIN für die Bar. +XP bei jedem Schritt.',
            'Soul Ticket after order — QR + PIN for the bar. +XP every step.',
            'Soul Ticket após pedido — QR + PIN na barra. +XP em cada passo.'
        ));
        this.highlight('#kitchen-qr');
        localStorage.setItem(key, '1');
    }

    async ownerTour(force) {
        const key = 'cdf_kitchen_ops_tour_v2';
        if (!force && localStorage.getItem(key)) return;
        await this.speak(this.langText(
            'Kitchen Ops — swipe: KDS, Menü, Brand, QR, Crew, Soul Ticket.',
            'Kitchen Ops — swipe: KDS, Menu, Brand, QR, Crew, Soul Ticket.',
            'Kitchen Ops — deslize: KDS, Menu, Brand, QR, Crew, Soul Ticket.'
        ));
        this.highlight('#kitchen-kds-board', 0);
        await this.speak(this.langText(
            'Menü live bearbeiten — SAVE syncs sofort zur Gästeseite.',
            'Edit menu live — SAVE syncs instantly to guest page.',
            'Edite o menu live — SAVE sincroniza na página de convidados.'
        ));
        this.highlight('#kitchen-branding-editor', 2);
        if (window.FloweeReward) window.FloweeReward.xpToast('Kitchen Ops +50 XP', 50);
        localStorage.setItem(key, '1');
        setTimeout(() => this.highlight('.none'), 2500);
    }
}

new FloweeKitchenTour();
