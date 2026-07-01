/**
 * Flowee Quest Tour — interactive Atlas → Codex → Rank guidance (English)
 */
class FloweeQuestTour {
    constructor() {
        this.step = 0;
        this.timer = null;
        window.FloweeQuestTour = this;
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => this.onPageReady(), 2500));
    }

    speak(text, mood) {
        if (!window.Flowee) return;
        window.Flowee.talk(true, text, mood || 'guide');
        if (window.FloweeVoice) window.FloweeVoice.speak(text);
    }

    delay(ms) {
        return new Promise((r) => { this.timer = setTimeout(r, ms); });
    }

    highlight(sel) {
        document.querySelectorAll('.flowee-tour-highlight').forEach((e) => e.classList.remove('flowee-tour-highlight'));
        const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
        if (el) {
            el.classList.add('flowee-tour-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    async onPageReady() {
        const path = window.location.pathname;
        if (path.includes('quest_map')) await this.startAtlasTour();
        if (path.includes('quest_board')) await this.startCodexTour();
        if (path.includes('hall_of_legends')) await this.startRankTour();
    }

    async startAtlasTour() {
        if (localStorage.getItem('cdf_atlas_tour_v2')) return;
        if (window.FloweeNotify) await window.FloweeNotify.promptViaFlowee();

        this.speak('Welcome to the Lisbon Atlas, Navigator. This map links real streets to quests, runes, and XP.');
        await this.delay(4500);

        this.speak('Use filters: Sound for live music, Vision for miradouros, Kitchen for taste zones, Sanctuary for creative hubs.');
        this.highlight('#atlas-filter-bar');
        await this.delay(5000);

        this.speak('Tap NEARBY to see the closest missions. Walk there, then press VERIFY GPS on the quest pin.');
        this.highlight('#atlas-nearby-btn');
        await this.delay(4000);

        this.speak('Example: Hidden Oasis at Jardim do Torel — accept in QUESTS, then return here to verify when you arrive.');
        await this.delay(4500);

        localStorage.setItem('cdf_atlas_tour_v2', 'started');
    }

    onNearbyPressed() {
        if (localStorage.getItem('cdf_tour_nearby_xp')) return;
        this.speak('These are your nearest missions. Tap a pin, accept the quest, and verify on site for XP and Adinkra runes.');
        if (window.QuestEngine) {
            window.QuestEngine.grantReward('TOUR-NEARBY-01', 25, 'Atlas Scout');
            localStorage.setItem('cdf_tour_nearby_xp', '1');
        }
        setTimeout(() => {
            this.speak('Ready for the Quest Log? Tap QUESTS at the bottom — I will meet you in the Codex.');
            this.highlight('#nav-board');
            localStorage.setItem('cdf_atlas_tour_v2', 'done');
        }, 3500);
    }

    async startCodexTour() {
        if (localStorage.getItem('cdf_codex_tour_v2')) return;
        if (!localStorage.getItem('cdf_atlas_tour_v2')) {
            this.speak('Open MAP first for the Atlas tour, or browse Lisbon Atlas Quests below.');
        } else {
            this.speak('This is the Codex — your mission log. Protocols teach the system; Lisbon quests grant GPS XP.');
        }
        await this.delay(4000);
        this.highlight('#codex-mobile-tabs, #codex-protocols-section');
        this.speak('Use QUESTS, FORGE, or AREA tabs on mobile. Protocols 1 to 3 mirror MAP, QUESTS, and RANK.');
        await this.delay(4500);
        this.highlight('#lisbon-quest-list');
        this.speak('Pick a quest, tap Accept, open MAP, walk to the pin, then Verify GPS. I will notify you if alerts are on.');
        await this.delay(5000);
        this.highlight('#quest-protocol-1');
        this.speak('Start Protocol 1 if you have not finished the Atlas awakening. Then climb the Brotherhood Rank.');
        this.highlight('#nav-bro');
        await this.delay(3500);
        localStorage.setItem('cdf_codex_tour_v2', '1');
    }

    async startRankTour() {
        if (localStorage.getItem('cdf_rank_tour_v2')) return;
        this.speak('The Brotherhood Rank shows live Navigators, your Adinkra Codex, and level unlocks. No demo ghosts — real profiles only.');
        this.highlight('#adinkra-codex-section');
        await this.delay(4000);
        this.speak('Collect Bronze runes on the Atlas, anchor Silver on site, earn Gold through community battles.');
        localStorage.setItem('cdf_rank_tour_v2', '1');
    }
}

new FloweeQuestTour();
