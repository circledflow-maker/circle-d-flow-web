/**
 * Agent: Event Horizon
 * Role: Manages "Gatherings" (Events), Pin Display, and Creation flow.
 */
class EventHorizonAgent {
    constructor() {
        this.name = "EventAgent";
        this.storageKey = 'cdf_events';
        this.mapPinsContainer = null;
        this.feedContainer = null;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Scanning Sector...`);
        window.EventAgent = this;

        this.mapPinsContainer = document.getElementById('event-pins-container');
        this.feedContainer = document.getElementById('event-feed');

        this.injectModal();
        this.refreshEvents();
        this.renderArchives();
    }

    getEvents() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    saveEvent(eventData) {
        const events = this.getEvents();
        events.push(eventData);
        localStorage.setItem(this.storageKey, JSON.stringify(events));
        
        if(window.Pusher) window.Pusher.showToast('Signal Flare Fired! Event Created.', 'success');
        this.refreshEvents();
        this.closeCreator();
        
        // Notify Ticker
        if(window.pushTickerMessage) window.pushTickerMessage(`NEW GATHERING: ${eventData.title.toUpperCase()} AT ${eventData.location.toUpperCase()}`, 'SYSTEM');
    }

    refreshEvents() {
        const events = this.getEvents();
        document.getElementById('active-events-count').innerText = `${events.length} Active Signals`;
        
        this.renderMapPins(events);
        this.renderFeed(events);
    }

    renderMapPins(events) {
        if(!this.mapPinsContainer) return;
        this.mapPinsContainer.innerHTML = '';

        events.forEach((evt, index) => {
            // Mock Coords if not provided (Random spread for now)
            // In a real app, user would pick a point. Here we mock it based on index hash.
            const top = 20 + (evt.id.charCodeAt(evt.id.length-1) % 60); 
            const left = 20 + (evt.id.charCodeAt(evt.id.length-2) % 60);

            const pin = document.createElement('div');
            pin.className = "absolute flex flex-col items-center group cursor-pointer transition-transform hover:scale-110 hover:z-50";
            pin.style.top = `${top}%`;
            pin.style.left = `${left}%`;
            pin.onclick = () => alert(`Event: ${evt.title}\nHost: ${evt.host}`);

            pin.innerHTML = `
                <div class="relative">
                    <div class="w-8 h-8 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.8)] animate-bounce">
                        <span class="material-symbols-outlined text-[10px] text-white">location_on</span>
                    </div>
                    <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-1 h-8 bg-gradient-to-b from-purple-500 to-transparent"></div>
                </div>
                <div class="opacity-0 group-hover:opacity-100 bg-black/80 border border-purple-500/30 text-xs px-2 py-1 rounded mt-2 transition-opacity whitespace-nowrap">
                    ${evt.title}
                </div>
            `;
            this.mapPinsContainer.appendChild(pin);
        });
    }

    renderFeed(events) {
        if(!this.feedContainer) return;
        
        if(events.length === 0) {
            this.feedContainer.innerHTML = `
                <div class="col-span-1 md:col-span-3 text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <span class="material-symbols-outlined text-4xl text-white/20 mb-4">radar</span>
                    <p class="text-white/40 font-mono">Scanning Frequency... No active gatherings found.</p>
                </div>
            `;
            return;
        }

        this.feedContainer.innerHTML = events.reverse().map(evt => `
            <div class="bg-[#0F0A13] border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors group">
                <div class="h-2 bg-gradient-to-r from-purple-800 to-purple-600"></div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-display font-bold text-white group-hover:text-purple-300 transition-colors">${evt.title}</h3>
                            <div class="text-xs text-purple-400 font-mono uppercase tracking-wider">${evt.type} • ${evt.location}</div>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <span class="material-symbols-outlined text-white/50">event</span>
                        </div>
                    </div>
                    
                    <p class="text-sm text-white/60 mb-6 line-clamp-3 leading-relaxed">
                        ${evt.desc || 'No secure data provided for this gathering.'}
                    </p>

                    <div class="flex items-center justify-between border-t border-white/5 pt-4">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                ${evt.host.substring(0,2).toUpperCase()}
                            </div>
                            <span class="text-xs text-white/40">${evt.host}</span>
                        </div>
                        <button class="text-xs font-bold text-purple-400 hover:text-white transition-colors" onclick="alert('RSVP Feature Coming Soon')">
                            RSVP >
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- CREATION MODAL ---

    injectModal() {
        const modal = document.createElement('div');
        modal.id = 'event-creator-modal';
        modal.className = 'fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300';
        modal.innerHTML = `
            <div class="w-full max-w-lg bg-[#141018] border border-purple-500/30 rounded-2xl p-8 relative transform scale-95 transition-transform duration-300" id="event-modal-content">
                <button onclick="EventAgent.closeCreator()" class="absolute top-4 right-4 text-white/30 hover:text-red-500 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
                
                <h2 class="text-2xl font-display font-bold text-white mb-1">Host Gathering</h2>
                <p class="text-purple-400/60 text-xs font-mono uppercase tracking-widest mb-6">Broadcast your signal to the fleet.</p>
                
                <form onsubmit="EventAgent.handleSubmit(event)" class="space-y-4">
                    <!-- Title -->
                    <div>
                        <label class="block text-xs text-white/50 mb-1">Operation Name</label>
                        <input type="text" name="title" required class="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:border-purple-500 outline-none transition-colors" placeholder="e.g. Neon Rooftop Party">
                    </div>

                    <!-- Location -->
                    <div>
                        <label class="block text-xs text-white/50 mb-1">Coordinates / Location</label>
                        <input type="text" name="location" required class="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:border-purple-500 outline-none transition-colors" placeholder="e.g. LX Factory, Dock 3">
                    </div>
                    
                    <!-- Type -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs text-white/50 mb-1">Type</label>
                            <select name="type" class="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:border-purple-500 outline-none">
                                <option value="Gathering">Gathering</option>
                                <option value="Mission">Mission</option>
                                <option value="Rave">Rave</option>
                                <option value="Market">Market</option>
                            </select>
                        </div>
                        <div>
                             <label class="block text-xs text-white/50 mb-1">Date</label>
                             <input type="date" name="date" required class="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:border-purple-500 outline-none">
                        </div>
                    </div>

                    <!-- Desc -->
                    <div>
                        <label class="block text-xs text-white/50 mb-1">Briefing</label>
                        <textarea name="desc" rows="3" class="w-full bg-black/50 border border-white/10 rounded px-4 py-2 text-white focus:border-purple-500 outline-none transition-colors" placeholder="Description of the event..."></textarea>
                    </div>

                    <button type="submit" class="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all mt-4">
                        Ignite Signal Flare
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }

    openCreator() {
        const modal = document.getElementById('event-creator-modal');
        const content = document.getElementById('event-modal-content');
        modal.classList.remove('opacity-0', 'pointer-events-none');
        content.classList.remove('scale-95');
    }

    closeCreator() {
        const modal = document.getElementById('event-creator-modal');
        const content = document.getElementById('event-modal-content');
        modal.classList.add('opacity-0', 'pointer-events-none');
        content.classList.add('scale-95');
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {
            id: 'EVT-' + Date.now().toString(36),
            title: formData.get('title'),
            location: formData.get('location'),
            type: formData.get('type'),
            desc: formData.get('desc'),
            date: formData.get('date'),
            host: localStorage.getItem('cdf_username') || 'Anonymous Captain',
            timestamp: Date.now()
        };

        this.saveEvent(payload);
        e.target.reset();
    }
    renderArchives() {
        const container = document.getElementById('archives-content');
        if(!container) return;

        // MOCK DATA (Replace with Helper.getHistory() later)
        const guests = [
            { name: "Traveler_01", action: "Visited the Core", time: "2 hrs ago" },
            { name: "Neon_Samurai", action: "Completed 'First Spark'", time: "5 hrs ago" },
            { name: "Cyber_Monk", action: "Meditated in Grove", time: "1 day ago" }
        ];

        let html = '<ul class="space-y-3">';
        guests.forEach(g => {
            html += `
                <li class="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span class="text-white/80 font-mono">${g.name}</span>
                    </div>
                    <span class="text-white/40 text-xs">${g.action}</span>
                </li>
            `;
        });
        html += '</ul>';
        container.innerHTML = html;
        
        // RENDER MEDALS
        const medalContainer = document.getElementById('medal-display');
        if(medalContainer) {
            medalContainer.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500 flex items-center justify-center" title="Beta Tester">
                    <span class="material-symbols-outlined text-xs text-yellow-500">verified</span>
                </div>
                <div class="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center" title="First Quest">
                    <span class="material-symbols-outlined text-xs text-blue-500">flag</span>
                </div>
            `;
        }
    }
}

new EventHorizonAgent();
