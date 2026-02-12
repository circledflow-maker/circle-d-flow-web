/**
 * Agent: Quest Controller (The Game Master)
 * Purpose: Manages Quests, Golden Hour events, and Mission Rewards.
 * Connects with Pusher (Toast) and Helper (Data).
 */

class QuestController {
    constructor() {
        this.name = "QuestController";
        this.quests = JSON.parse(localStorage.getItem('cdf_active_quests') || '[]');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Quest Grid Online.`);
        this.listenForGoldenHour();
        window.QuestController = this;
    }

    // --- GOLDEN HOUR LOGIC ---
    triggerGoldenHour() {
        // 1. Set the Vibe
        const vibe = {
            active: true,
            location: 'Lisbon Waterfront',
            expires: Date.now() + (60 * 60 * 1000) // 1 Hour
        };
        localStorage.setItem('cdf_golden_hour', JSON.stringify(vibe));

        // 2. Broadcast
        if(window.Pusher) {
            window.Pusher.showToast('THE CAPTAIN CALLS FOR THE GOLDEN HOUR!', 'mission');
            // Simulate a global event if we had websockets
        }

        console.log("[Golden Hour] Triggered!");
        return "Golden Hour Active: Lisbon Waterfront";
    }

    listenForGoldenHour() {
        // Simple polling for now (or listen to storage event in a real app)
        setInterval(() => {
            const data = localStorage.getItem('cdf_golden_hour');
            if(data) {
                const vibe = JSON.parse(data);
                if(vibe.active && Date.now() < vibe.expires) {
                    // Logic to show UI effects on current page
                    document.body.classList.add('golden-hour-mode');
                } else {
                    document.body.classList.remove('golden-hour-mode');
                }
            }
        }, 5000);
    }

    // --- QUEST MANAGEMENT ---
    createQuest(title, type, reward, description = "") {
        const quest = {
            id: 'Q-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            title: title,
            description: description,
            type: type, // 'PHOTO', 'VIDEO', 'CODE'
            reward: reward, // XP or Voucher
            active: true,
            timestamp: Date.now()
        };
        this.quests.push(quest);
        this.saveQuests();
        console.log(`[Quest] Created: ${title}`);
        return quest;
    }

    completeQuest(questIdOrTag) {
        // Logic to verify and grant reward
        console.log(`[Quest] Completing: ${questIdOrTag}`);
        if(window.Pusher) window.Pusher.showToast('Quest Complete! +XP', 'success');
        
        // Award XP
        let xp = parseInt(localStorage.getItem('cdf_xp') || '0');
        xp += 50;
        localStorage.setItem('cdf_xp', xp.toString());
    }

    saveQuests() {
        localStorage.setItem('cdf_active_quests', JSON.stringify(this.quests));
    }
}

new QuestController();
