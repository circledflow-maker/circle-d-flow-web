
/**
 * PROTOCOL DAILY GRIND & TICKER SYSTEM
 */

class DailyQuestManager {
    constructor() {
        this.quests = [
            { id: 1, type: 'quiz', text: 'What is the core philosophy of Circle?', options: ['Connection', 'Money', 'Fame'], correct: 0, xp: 50 },
            { id: 2, type: 'action', text: 'Check the vibe at Outbreak Tunes.', actionLink: 'outbreak_tunes.html', actionText: 'Go to Sound', xp: 50 },
            { id: 3, type: 'action', text: 'Check the menu at African Queen.', actionLink: 'african-queen-kitchen.html', actionText: 'Go to Taste', xp: 50 },
            { id: 4, type: 'ticker', text: 'Broadcast a status update to the network.', xp: 75 },
            { id: 5, type: 'quiz', text: 'What level unlocks the Scouter?', options: ['Level 1', 'Level 3', 'Level 5'], correct: 1, xp: 50 }
        ];
        this.currentQuest = null;
        this.init();
    }

    init() {
        const lastDate = localStorage.getItem('lastQuestDate');
        const today = new Date().toDateString();

        if (lastDate !== today) {
            // New Day, New Quest
            this.generateNewQuest();
        } else {
            // Load existing
            this.currentQuest = JSON.parse(localStorage.getItem('currentQuest'));
        }

        this.render();
        this.startTimer();
    }

    generateNewQuest() {
        const today = new Date().toDateString();
        const randIndex = Math.floor(Math.random() * this.quests.length);
        this.currentQuest = { ...this.quests[randIndex], completed: false };

        localStorage.setItem('lastQuestDate', today);
        localStorage.setItem('currentQuest', JSON.stringify(this.currentQuest));
    }

    render() {
        const titleEl = document.getElementById('quest-title');
        const descEl = document.getElementById('quest-desc');
        const actionArea = document.getElementById('quest-action-area');
        const xpEl = document.getElementById('quest-xp-reward');

        if (!titleEl) return;

        if (this.currentQuest.completed) {
            titleEl.textContent = "Mission Accomplished";
            descEl.textContent = "Come back tomorrow for new orders.";
            actionArea.innerHTML = `<button class="px-6 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded text-xs font-bold uppercase tracking-widest cursor-default">Completed</button>`;
            return;
        }

        titleEl.textContent = this.currentQuest.type === 'quiz' ? 'Knowledge Check' : (this.currentQuest.type === 'ticker' ? 'Network Update' : 'Scout Mission');
        descEl.textContent = this.currentQuest.text;
        xpEl.textContent = this.currentQuest.xp;

        // Render Actions
        if (this.currentQuest.type === 'quiz') {
            actionArea.innerHTML = this.currentQuest.options.map((opt, idx) => `
                <button onclick="window.DailyQuest.submitQuiz(${idx})" class="mr-2 mb-2 px-4 py-2 bg-white/5 hover:bg-purple-500 hover:text-white border border-white/10 rounded text-xs transition-colors">
                    ${opt}
                </button>
            `).join('');
        } else if (this.currentQuest.type === 'action') {
            actionArea.innerHTML = `
                <a href="${this.currentQuest.actionLink}" onclick="window.DailyQuest.complete()" class="px-6 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded text-xs uppercase tracking-widest transition-colors">
                    ${this.currentQuest.actionText}
                </a>
            `;
        } else if (this.currentQuest.type === 'ticker') {
            actionArea.innerHTML = `<p class="text-xs text-purple-300 italic">Use the Broadcast Panel below to complete this quest.</p>`;
        }
    }

    submitQuiz(index) {
        if (index === this.currentQuest.correct) {
            alert("Correct! + " + this.currentQuest.xp + " XP");
            this.complete();
        } else {
            alert("Incorrect. The Flow is disrupted. Try again.");
        }
    }

    complete() {
        if (this.currentQuest.completed) return;

        this.currentQuest.completed = true;
        localStorage.setItem('currentQuest', JSON.stringify(this.currentQuest));

        // Award XP
        if (window.Gamification) {
            window.Gamification.addXP(this.currentQuest.xp, "Daily Quest");
        }

        this.render();
    }

    startTimer() {
        const timerEl = document.getElementById('quest-timer');
        if (!timerEl) return;

        setInterval(() => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const diff = tomorrow - now;
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            timerEl.textContent = `Resets in ${h}h ${m}m`;
        }, 60000);
    }
}

// Ticker System
let currentVibe = 'fire'; // default

function setTickerVibe(vibe) {
    currentVibe = vibe;
    document.querySelectorAll('.vibe-btn').forEach(btn => btn.classList.remove('bg-white/20', 'text-white'));
    event.currentTarget.classList.add('bg-white/20', 'text-white');
}

function broadcastTicker() {
    const input = document.getElementById('ticker-input');
    const msg = input.value;
    if (!msg) return alert("Please enter a message.");

    const icons = { 'fire': '🔥', 'ice': '🌊', 'skull': '☠️' };
    const fullMsg = `[${icons[currentVibe]}] ${msg}`;

    // Update Local Ticker (Simulation)
    const ticker = document.querySelector('.animate-marquee');
    if (ticker) {
        ticker.textContent = `${fullMsg} • ` + ticker.textContent;
    }

    // Check if there is an active ticker quest
    if (window.DailyQuest && window.DailyQuest.currentQuest && window.DailyQuest.currentQuest.type === 'ticker' && !window.DailyQuest.currentQuest.completed) {
        window.DailyQuest.complete();
    }

    // WhatsApp
    const artist = localStorage.getItem('artistName') || 'Anonymous';
    window.openWhatsApp(`Ticker Update from ${artist}: ${fullMsg}`);

    input.value = '';
    alert("Broadcast Sent to Network!");
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    window.DailyQuest = new DailyQuestManager();
    window.setTickerVibe = setTickerVibe;
    window.broadcastTicker = broadcastTicker;
});
