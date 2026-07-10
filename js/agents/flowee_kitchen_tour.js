/**
 * Flowee Kitchen Tour — guest, staff, Taste World paths
 */
class FloweeKitchenTour {
    constructor() {
        window.FloweeKitchenTour = this;
        document.addEventListener('DOMContentLoaded', () => {
            const params = new URLSearchParams(location.search);
            if (params.get('tutorial')) setTimeout(() => this.start(true), 1200);
            else setTimeout(() => this.start(), 2200);
        });
    }

    async speak(text, mood, options) {
        if (window.Flowee) window.Flowee.talk(true, text, mood || 'guide', options || []);
        if (window.FloweeVoice) {
            await window.FloweeVoice.speakAsync(text);
            await window.FloweeVoice.waitAfterSpeech(500);
        } else {
            await new Promise((r) => setTimeout(r, Math.max(2500, text.length * 35)));
        }
    }

    highlight(sel, slideIndex = null) {
        document.querySelectorAll('.flowee-tour-highlight').forEach((e) => e.classList.remove('flowee-tour-highlight'));
        const el = document.querySelector(sel);
        if (el) { 
            el.classList.add('flowee-tour-highlight'); 
            if (slideIndex !== null && document.querySelector('.tasteOpsSwiper')) {
                document.querySelector('.tasteOpsSwiper').swiper.slideTo(slideIndex);
            } else {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
            }
        }
    }

    async start(force) {
        const path = location.pathname;
        if (path.includes('taste_world_entry')) return this.entryTour(force);
        if (path.includes('taste_world_hub')) return this.hubTour(force);
        if (path.includes('taste_radar')) return this.radarTour(force);
        if (path.includes('akwaba_kitchen')) return this.guestTour(force);
        if (path.includes('kitchen_workspace')) return this.ownerTour(force);
    }

    tourKey(suffix) {
        const k = `cdf_kitchen_tour_${suffix}`;
        return k;
    }

    async entryTour(force) {
        const key = this.tourKey('entry_v1');
        if (!force && localStorage.getItem(key)) return;
        await this.speak('Taste World splits in two frequencies — Creator forges kitchens, Genießer tastes the flow.');
        this.highlight('.path-btn');
        await this.speak('Creators get KDS, live menu, QR codes and crew comms. Guests swipe Taste Radar and order pickup — zero delivery-app fees.');
        localStorage.setItem(key, '1');
    }

    async hubTour(force) {
        const key = this.tourKey('hub_v1');
        if (!force && localStorage.getItem(key)) return;
        await this.speak('Taste Hub — every path in one orbit. Radar for discovery, Kitchen for ordering, Workspace for your crew.');
        this.highlight('.hub-tile');
        localStorage.setItem(key, '1');
    }

    async radarTour(force) {
        const key = this.tourKey('radar_v1');
        if (!force && localStorage.getItem(key)) return;
        await this.speak('Swipe up and down — manga-style kitchen scan. Tap Order to transmit pickup to the real KDS board.');
        localStorage.setItem(key, '1');
    }

    async guestTour(force) {
        const key = this.tourKey('guest_v1');
        if (!force && localStorage.getItem(key)) return;
        await this.speak('Welcome to the live kitchen. Hero reel, menu board, then ADD PICKUP — pay at the bar when READY.');
        this.highlight('#menu-grid');
        await this.speak('Your Soul Ticket appears after order — QR + PIN for the bar handshake. +XP every step.');
        this.highlight('#kitchen-qr');
        await this.speak('Share kitchen QR at events — guests land directly on this menu. No commission, full community vibe.', 'guide', [
            { label: 'OPEN RADAR', action: () => { location.href = 'taste_radar.html?tutorial=1'; } },
            { label: 'ORDER NOW', action: () => window.Flowee?.shush() },
        ]);
        localStorage.setItem('cdf_kitchen_tour_v1', '1');
        localStorage.setItem('cdf_initiation_kitchen_visited', '1');
    }

    async ownerTour(force) {
        const key = 'cdf_kitchen_ops_tour_v2';
        if (!force && localStorage.getItem(key)) return;
        await this.speak('Kitchen Command — swipe 5 decks: KDS, Menu, QR, Crew, Soul Ticket.');
        this.highlight('#kitchen-kds-board', 0);
        await this.speak('Slide 1 — advance orders New → Confirmed → Cooking → Ready. Real-time from guest orders.');
        this.highlight('#kitchen-menu-editor', 1);
        await this.speak('Slide 2 — edit dishes live. Now with image upload! Snap a pic, we compress and sync it to the menu.', 'guide');
        this.highlight('#kitchen-qr-studio', 2);
        await this.speak('Slide 3 — download your menu QR. Print at bar. Create a new kitchen if you are forging a realm.');
        this.highlight('#kitchen-comm-panel', 3);
        await this.speak('Slide 4 — crew comms. Rush orders, 86 items, @Flowee briefings sync to team.');
        this.highlight('#soul-ticket', 4);
        await this.speak('Slide 5 — Soul Ticket scan grants Trust + Flow Credits. Better than Lieferando — you own the guest relationship.', 'celebrate');
        
        if (window.FloweeReward) {
            window.FloweeReward.xpToast('Kitchen Command Tutorial Complete!', 50);
        }
        localStorage.setItem(key, '1');
        
        // Remove highlight at the end
        setTimeout(() => this.highlight('.none'), 3000);
    }
}

new FloweeKitchenTour();
