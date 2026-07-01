/**
 * Flowee Quest Tour — interactive Atlas → Codex → Rank guidance (English)
 * Paced to speech — waits while Flowee is talking.
 */
class FloweeQuestTour {
    constructor() {
        this.step = 0;
        this.timer = null;
        window.FloweeQuestTour = this;
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => this.onPageReady(), 2800));
    }

    async speak(text, mood) {
        if (window.Flowee) window.Flowee.talk(true, text, mood || 'guide');
        if (window.FloweeVoice) {
            await window.FloweeVoice.speakAsync(text);
            await window.FloweeVoice.waitAfterSpeech(700);
        } else {
            await this.delay(Math.max(3500, text.length * 45));
        }
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

        await this.speak('Welcome to the Lisbon Atlas, Navigator. This map links real streets to quests, runes, and XP.');
        this.highlight('#atlas-filter-bar');
        await this.speak('Use filters: Sound for live music, Vision for miradouros, Kitchen for taste zones, Sanctuary for creative hubs.');
        this.highlight('#atlas-nearby-btn');
        await this.speak('Tap NEARBY to see the closest missions. Walk there, then press VERIFY GPS on the quest pin.');
        await this.speak('Example: Hidden Oasis at Jardim do Torel — accept in QUESTS, then return here to verify when you arrive.');
        localStorage.setItem('cdf_atlas_tour_v2', 'started');
    }

    async onNearbyPressed() {
        if (localStorage.getItem('cdf_tour_nearby_xp')) return;
        await this.speak('These are your nearest missions. Tap a pin, accept the quest, and verify on site for XP and Adinkra runes.');
        if (window.QuestEngine) {
            window.QuestEngine.grantReward('TOUR-NEARBY-01', 25, 'Atlas Scout');
            localStorage.setItem('cdf_tour_nearby_xp', '1');
        }
        this.highlight('#nav-board');
        await this.speak('Ready for the Quest Log? Tap QUESTS at the bottom — I will meet you in the Codex.');
        localStorage.setItem('cdf_atlas_tour_v2', 'done');
    }

    async startCodexTour() {
        if (localStorage.getItem('cdf_codex_tour_v2')) return;
        if (!localStorage.getItem('cdf_atlas_tour_v2')) {
            await this.speak('Open MAP first for the Atlas tour, or browse Lisbon Atlas Quests below.');
        } else {
            await this.speak('This is the Codex — your mission log. Protocols teach the system; Lisbon quests grant GPS XP.');
        }
        this.highlight('#codex-section-tabs, #codex-protocols-section');
        await this.speak('Switch between PROTOCOLS, LISBON, and COMMUNITY tabs. Protocols 1 to 3 mirror MAP, QUESTS, and RANK.');
        this.highlight('#lisbon-quest-list');
        await this.speak('Pick a quest, tap Accept, open MAP, walk to the pin, then Verify GPS.');
        this.highlight('#quest-protocol-1');
        await this.speak('Start Protocol 1 if you have not finished the Atlas awakening. Then climb the Brotherhood Rank.');
        this.highlight('#nav-bro');
        localStorage.setItem('cdf_codex_tour_v2', '1');
    }

    async startRankTour() {
        if (localStorage.getItem('cdf_rank_tour_v2')) return;
        await this.speak('The Brotherhood Rank shows live Navigators, your Adinkra Codex, and level unlocks. Real profiles only.');
        this.highlight('#adinkra-codex-section');
        await this.speak('Collect Bronze runes on the Atlas, anchor Silver on site, earn Gold through community battles.');
        localStorage.setItem('cdf_rank_tour_v2', '1');
    }
}

new FloweeQuestTour();
