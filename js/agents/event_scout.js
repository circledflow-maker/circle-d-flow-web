/**
 * THE EVENT SCOUT AGENT
 * Role: Helper (Connector)
 * Purpose: Syncs Sound Events (Jams, Tournaments) with the Living Map.
 */

class EventScout {
    constructor() {
        this.name = "The Event Scout";
        this.role = "Connector";
        this.init();
    }

    init() {
        console.log(`[${this.name}] Scanning for Audio Signals...`);
        this.syncEvents();
    }

    syncEvents() {
        // Mock Event Data source
        const soundEvents = [
            { id: 'ev_01', type: 'concert', name: 'Cypher LX: The Underground', location: 'Bairro Alto', coords: [38.710, -9.145], time: '22:00' },
            { id: 'ev_02', type: 'jam', name: 'Open Mic Night', location: 'Alfama', coords: [38.711, -9.129], time: '20:00' }
        ];

        // Push to Global Map State (simulated localStorage sync)
        const currentMapEvents = JSON.parse(localStorage.getItem('map_events')) || [];
        
        // Merge without duplicates
        const newEvents = [...currentMapEvents];
        soundEvents.forEach(ev => {
            if (!newEvents.find(e => e.id === ev.id)) {
                newEvents.push(ev);
                console.log(`[${this.name}] New Signal Detected: ${ev.name}`);
            }
        });

        localStorage.setItem('map_events', JSON.stringify(newEvents));
    }
}

// Initialize
const eventScout = new EventScout();
window.EventScout = eventScout;
