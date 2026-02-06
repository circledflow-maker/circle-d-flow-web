/**
 * THE CHRONICLER AGENT (The Writer)
 * Records user actions and creates legend entries in the Scriptorium.
 */
class ChroniclerAgent {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('cdf_chronicles') || '[]');
        this.init();
    }

    init() {
        console.log("📜 [Chronicler] The Ink is wet.");
        window.addEventListener('cdf_event', (e) => this.logEvent(e.detail));
    }

    logEvent(event) {
        // e.g. { type: 'battle_won', details: 'Quiz Master' }
        const legend = this.proseify(event);
        if (legend) {
            this.history.push({
                timestamp: Date.now(),
                ...legend
            });
            localStorage.setItem('cdf_chronicles', JSON.stringify(this.history));
            
            // Notify User
            if(window.Notifications) window.Notifications.send('chronicler', 'A new Legend has been written in the Scriptorium.', 'low');
        }
    }

    proseify(event) {
        // Transform boring data into Legend Prose
        switch(event.type) {
            case 'battle_won':
                return {
                    title: "The Victory of Knowledge",
                    text: `In the darkness of the Colosseum, the Creator stood firm. Against the riddle "${event.details}", their mind was sharp as a blade. The Flow responded.`
                };
            case 'item_sold':
                return {
                    title: "The Merchant's Gold",
                    text: `A pact was made in the Golden Vault. The artifact "${event.details}" found a new keeper, and coin flowed like water.`
                };
            case 'level_up':
                return {
                    title: "The Ascension",
                    text: `A surge of power. The Creator crossed the threshold to Level ${event.details}, and the Realm shivered in anticipation.`
                };
            default:
                return null;
        }
    }
}

// Init
window.Chronicler = new ChroniclerAgent();
