/**
 * Sound Manager Logic
 * Handles storage and retrieval of events for Outbreak Tunes / Livefromtheunderground.
 */

const SOUND_STORAGE_KEY = 'cdf_sound_events';

const SoundManager = {
    // Default Initial Events
    defaultEvents: [
        {
            id: 'e1',
            title: 'Cypher LX Tournament',
            date: '2024-02-19',
            location: 'Secret Garden',
            description: 'The Tournament begins. Feb 19th. Who will take the crown?',
            image: 'https://placehold.co/600x400/9333ea/ffffff?text=Cypher+LX'
        },
        {
            id: 'e2',
            title: 'Beat Lab Session',
            date: '2024-03-22',
            location: 'Studio 4B',
            description: 'Production workshop with Will Qter. Learn sampling techniques.',
            image: 'https://placehold.co/600x400/9333ea/ffffff?text=Beat+Lab'
        }
    ],

    // Get All Events
    getEvents: function () {
        const stored = localStorage.getItem(SOUND_STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(this.defaultEvents));
            return this.defaultEvents;
        }
        return JSON.parse(stored);
    },

    // Add New Event
    addEvent: function (event) {
        const events = this.getEvents();
        const newEvent = {
            id: 'e_' + Date.now(),
            ...event
        };
        events.unshift(newEvent); // Add to top
        localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(events));
        return newEvent;
    },

    // Render Events to Container
    renderEvents: function (containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const events = this.getEvents();
        container.innerHTML = events.map(evt => `
            <div class="flex flex-col md:flex-row gap-6 bg-white/5 border border-purple-500/30 rounded-xl overflow-hidden hover:border-purple-500 transition-all p-4">
                <div class="w-full md:w-48 h-32 md:h-auto rounded-lg overflow-hidden flex-shrink-0">
                    <img src="${evt.image}" alt="${evt.title}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 flex flex-col justify-center">
                    <div class="flex items-center gap-3 text-purple-400 text-xs font-bold uppercase tracking-widest mb-2">
                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">calendar_month</span> ${evt.date}</span>
                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">location_on</span> ${evt.location}</span>
                    </div>
                    <h3 class="text-2xl font-bold text-white mb-2">${evt.title}</h3>
                    <p class="text-white/70 text-sm mb-4">${evt.description}</p>
                    <div class="flex gap-2">
                        <button class="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 transition-colors uppercase tracking-widest">
                            RSVP
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

// Auto-render if on Sound page
if (document.getElementById('sound-events-list')) {
    SoundManager.renderEvents('sound-events-list');
}
