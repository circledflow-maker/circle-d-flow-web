class QuestManager {
    constructor() {
        this.quests = {
            daily: null,
            weekly: null
        };
        this.init();
    }

    init() {
        // Load from storage or default
        const stored = localStorage.getItem('activeQuests');
        if (stored) {
            this.quests = JSON.parse(stored);
        } else {
            // Defaults
            this.quests.daily = {
                id: 'daily_share',
                title: 'Spread the Flow',
                desc: 'Share your profile on social media.',
                xp: 50,
                type: 'daily',
                expires: this.getTomorrow()
            };
            this.quests.weekly = {
                id: 'weekly_explore',
                title: 'The Local Explorer',
                desc: 'Check-in at 3 Partner locations.',
                xp: 100,
                type: 'weekly',
                progress: 0,
                target: 3,
                expires: this.getNextWeek()
            };
            this.save();
        }
    }

    // Admin Feature: Push New Quest
    pushQuest(type, title, desc, xp, target = 1) {
        const id = `${type}_${Date.now()}`;
        const newQuest = {
            id,
            title,
            desc,
            xp,
            type,
            progress: 0,
            target,
            expires: type === 'daily' ? this.getTomorrow() : this.getNextWeek()
        };

        this.quests[type] = newQuest;
        this.save();

        // Notify System
        if (window.Notifications) {
            window.Notifications.send('Quest Update', `New ${type} quest available: ${title}`);
        }

        console.log(`[QuestManager] Pushed new ${type} quest: ${title}`);
        return newQuest;
    }

    completeQuest(type) {
        const quest = this.quests[type];
        if (!quest) return;

        if (window.Gamification) {
            window.Gamification.addXP(quest.xp);
            window.Notifications.send('Quest Completed!', `You earned ${quest.xp} XP.`);
        }

        // Mark as done or generate new (simplified)
        this.quests[type] = null; // Clear slot
        this.save();
    }

    getTomorrow() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    getNextWeek() {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    save() {
        localStorage.setItem('activeQuests', JSON.stringify(this.quests));
    }
}

window.QuestManager = new QuestManager();
