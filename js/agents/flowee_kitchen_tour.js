/**
 * Flowee Kitchen Tour — AkwabaLX onboarding (English)
 */
class FloweeKitchenTour {
    constructor() {
        window.FloweeKitchenTour = this;
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => this.start(), 2200));
    }

    async speak(text, mood, options) {
        if (window.Flowee) window.Flowee.talk(true, text, mood || 'guide', options || []);
        if (window.FloweeVoice) {
            await window.FloweeVoice.speakAsync(text);
            await window.FloweeVoice.waitAfterSpeech(600);
        } else {
            await new Promise((r) => setTimeout(r, Math.max(3000, text.length * 40)));
        }
    }

    highlight(sel) {
        document.querySelectorAll('.flowee-tour-highlight').forEach((e) => e.classList.remove('flowee-tour-highlight'));
        const el = document.querySelector(sel);
        if (el) { el.classList.add('flowee-tour-highlight'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }

    async start(force) {
        const path = location.pathname;
        const isKitchen = path.includes('akwaba_kitchen');
        const isOps = path.includes('kitchen_workspace');
        if (!isKitchen && !isOps) return;

        const key = isOps ? 'cdf_kitchen_ops_tour_v1' : 'cdf_kitchen_tour_v1';
        if (!force && localStorage.getItem(key)) return;

        if (isKitchen) await this.guestTour();
        else await this.ownerTour();
        localStorage.setItem(key, '1');
    }

    async guestTour() {
        await this.speak('Welcome to AkwabaLX at Secret Garden. This is the first live kitchen in Circle D Flow.');
        this.highlight('#hero-reel');
        await this.speak('Watch the reel for today\'s vibe. Photos and menu board show what is cooking now.');
        this.highlight('#menu-grid');
        await this.speak('Browse dishes, tap ADD PICKUP, then ORDER PICKUP. Pay cash or card at the bar when status is READY.');
        this.highlight('#cart-bar');
        await this.speak('Pickup orders stay in your cart until you transmit. No online payment yet — closed loop at the garden bar.');
        this.highlight('#kitchen-qr');
        await this.speak('Download or share the kitchen QR. Navigators scan it to open this menu from any event.');
        await this.speak('Share via WhatsApp sends a link with menu, Atlas pin, and your pickup flow ready.');
        await this.speak('Complete Kitchen Heart on the Atlas to earn the Akoma rune — patience and heart.', 'guide', [
            { label: 'OPEN ATLAS', action: () => { location.href = 'quest_map.html'; } },
            { label: 'STAY & ORDER', action: () => window.Flowee?.shush() },
        ]);
    }

    async ownerTour() {
        await this.speak('Kitchen Command Center online. Swipe: Delivery Board, Menu Editor, Crew Comms.');
        this.highlight('#kitchen-kds-board');
        await this.speak('Delivery Board — advance tickets New → Confirmed → Cooking → Ready.');
        this.highlight('#kitchen-menu-editor');
        await this.speak('Menu Editor — toggle LIVE or OFF. Syncs to akwaba_kitchen when Supabase is connected.');
        this.highlight('#kitchen-comm-panel');
        await this.speak('Crew Comms — post updates. Flowee relays status to your team.');
        this.highlight('.soul-ticket-inner');
        await this.speak('Soul Ticket QR — guests scan at the bar when order is READY.');
        await this.speak('Tutorial complete. Run sql/kitchen_pipeline_setup.sql once for full DB sync.', 'celebrate');
    }
}

new FloweeKitchenTour();
