class TourCoordinator {
    constructor() {
        this.name = "Tour Coordinator";
        this.init();
    }

    init() {
        console.log(`[${this.name}] Online. Syncing Event Calendar...`);
        this.checkFlyerWall();
        // Check every 10 seconds for updates
        setInterval(() => this.checkFlyerWall(), 10000);
    }

    checkFlyerWall() {
        const wall = document.getElementById('flyer-wall');
        if (!wall) return;

        const eventData = JSON.parse(localStorage.getItem('current_event'));
        if (eventData) {
            this.projectFlyer(eventData);
        } else {
            console.log(`[${this.name}] No active event found. Projecting default.`);
        }
    }

    projectFlyer(event) {
        const screen = document.getElementById('projector-screen');
        if (!screen) return;

        // Dynamic HTML injection
        screen.innerHTML = `
            <h2 class="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-white to-purple-500 animate-pulse tracking-tighter mix-blend-overlay">
                ${event.artist || 'SECRET GUEST'}
            </h2>
            <p class="text-blue-300 font-mono text-xl mt-4 tracking-widest uppercase glow-text">${event.title || 'Live Performance'}</p>
            <div class="mt-8 transform -rotate-2 border-4 border-white p-2 inline-block bg-black shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                <span class="block bg-white text-black font-black text-2xl px-6 py-2 uppercase">${event.location || 'KYH Studio'}</span>
                <span class="block text-white text-xs font-mono mt-1 text-center">${this.formatDate(event.date)}</span>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return 'COMING SOON';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase();
    }
    
    // Called by Admin Dashboard
    publishEvent(artist, title, location, date) {
        const event = { artist, title, location, date, timestamp: Date.now() };
        localStorage.setItem('current_event', JSON.stringify(event));
        console.log(`[${this.name}] Event Published: ${title}`);
        
        // Notify System
        this.broadcastUpdate("New Event Flyer Projected!");
    }
    
    broadcastUpdate(msg) {
        const event = new CustomEvent('agent-alert', { detail: { agent: this.name, message: msg } });
        window.dispatchEvent(event);
    }
}

const tourCoordinator = new TourCoordinator();
window.TourCoordinator = tourCoordinator;
