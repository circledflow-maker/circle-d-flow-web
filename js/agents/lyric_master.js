/**
 * Agent: Lyric Master (The Poet-King)
 * Purpose: Manages the Lyric Field Colosseum (Entries, Audio, Gallery, Hall of Fame)
 */

class LyricMasterAgent {
    constructor() {
        this.name = "LyricMaster";
        this.registryKey = "cdf_lyric_registry";
        this.hallOfFameKey = "cdf_hall_of_fame";
        this.userKey = "cdf_user_profile"; // From Onboarding
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] The Colosseum of Words is Open.`);
        this.renderGallery();
        this.renderFeed();
        
        // Expose to window
        window.LyricMaster = this;

        // Auto-Check if User is King (For Stamp Button visibility)
        this.checkKingStatus();
    }

    // --- CORE LOGIC: REGISTRY ---

    getRegistry() {
        return JSON.parse(localStorage.getItem(this.registryKey) || '[]');
    }

    saveRegistry(data) {
        if(window.Helper) {
            window.Helper.saveData(this.registryKey, JSON.stringify(data));
        } else {
            localStorage.setItem(this.registryKey, JSON.stringify(data));
        }
    }

    /**
     * Creates a new Lyric Entry
     * @param {string} text 
     * @param {File} audioFile (Optional)
     */
    forgeLyric(text, audioFile) {
        if (!text) return alert("Silent words cannot be forged.");

        const user = JSON.parse(localStorage.getItem(this.userKey) || '{"name":"Unknown_Poet", "nenType":"Specialist"}');
        
        let audioUrl = null;
        if (audioFile) {
            audioUrl = URL.createObjectURL(audioFile); // Temporary Blob URL for Session
        }

        const newEntry = {
            id: 'LYRIC_' + Date.now(),
            author: user.name,
            nenType: user.nenType || 'Specialist',
            text: text,
            audio: audioUrl, 
            timestamp: new Date().toISOString(),
            resonance: 0,
            stampedBy: null // "King Name" if stamped
        };

        const registry = this.getRegistry();
        registry.unshift(newEntry); // Add to top
        this.saveRegistry(registry);

        // Feedback
        if(window.Pusher) window.Pusher.showToast('Resonance Forged successfully!', 'success');
        if(window.Flowee && window.Flowee.talk) window.Flowee.talk(true, "A new voice enters the Colosseum!");

        this.renderFeed(); // Refresh
        return true;
    }

    // --- INTERACTION ---

    playSnippet(entryId) {
        const registry = this.getRegistry();
        const entry = registry.find(e => e.id === entryId);
        if(!entry) return;

        // Visual Feedback
        const card = document.getElementById(`card-${entryId}`);
        if(card) {
            card.classList.add('animate-pulse', 'border-amber-400');
            setTimeout(() => card.classList.remove('animate-pulse', 'border-amber-400'), 3000); // Reset visual
        }

        if(entry.audio) {
            const audio = new Audio(entry.audio);
            audio.play().catch(e => console.warn("Audio play blocked", e));
        } else {
            // Default "Idea Sound" if no audio
            if(window.SoundEngineer) window.SoundEngineer.playFx('hover');
        }
    }

    addResonance(entryId) {
        const registry = this.getRegistry();
        const entry = registry.find(e => e.id === entryId);
        if(entry) {
            entry.resonance++;
            this.saveRegistry(registry);
            
            // Update UI
            const counter = document.getElementById(`res-${entryId}`);
            if(counter) counter.innerText = entry.resonance;

            // Reward Author Logic (Mock - would be realtime)
            if(window.Pusher) window.Pusher.showToast(`Resonance +1 for ${entry.author}`, 'karma');
        }
    }

    // --- KING'S DOMAIN ---

    checkKingStatus() {
        // Logic to unlock "Stamp" buttons for Admins/Kings
        // For Beta: Everyone is a potential King
        document.body.classList.add('king-view');
    }

    applyStamp(entryId) {
        const registry = this.getRegistry();
        const entry = registry.find(e => e.id === entryId);
        
        if(entry && !entry.stampedBy) {
            entry.stampedBy = "Captain_CQR"; // Identifying the Stamper
            entry.resonance += 1000;
            this.saveRegistry(registry);

            if(window.Pusher) window.Pusher.showToast(`LEGENDARY STATUS CONFERRED: ${entry.author}`, 'success');
            this.renderGallery(); // Add to Hall of Fame Carousel
            this.renderFeed();
        }
    }

    exportHallOfFame() {
        const registry = this.getRegistry();
        const legends = registry.filter(e => e.stampedBy);
        
        const blob = new Blob([JSON.stringify(legends, null, 2)], {type : 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `HallOfFame_CQR_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        if(window.Pusher) window.Pusher.showToast('Hall of Fame Archives Exported.', 'default');
    }

    // --- RENDERING ---

    renderGallery() {
        const container = document.getElementById('kings-gallery-track');
        if(!container) return;

        const registry = this.getRegistry();
        const legends = registry.filter(e => e.stampedBy);

        if(legends.length === 0) {
             container.innerHTML = `
                <div class="flex items-center justify-center w-full h-full text-white/20 uppercase tracking-widest text-sm">
                    The Throne awaits the first Legend...
                </div>
             `;
             return;
        }

        container.innerHTML = legends.map(entry => `
            <div class="flex-shrink-0 w-80 h-64 bg-black/60 border border-amber-500/50 rounded-xl relative p-6 flex flex-col justify-between group hover:bg-black/80 transition-all snap-center cursor-pointer" onclick="LyricMaster.playSnippet('${entry.id}')">
                <div class="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent"></div>
                <div class="z-10">
                     <span class="text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30 px-2 py-1 rounded mb-4 inline-block">Legendary</span>
                     <p class="text-white text-lg font-serif italic line-clamp-3">"${entry.text}"</p>
                </div>
                <div class="z-10 flex items-center justify-between border-t border-white/10 pt-4">
                    <div class="flex items-center gap-2">
                         <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xs">${entry.author[0]}</div>
                         <span class="text-white/60 text-xs uppercase">${entry.author}</span>
                    </div>
                    <span class="material-symbols-outlined text-amber-500">verified</span>
                </div>
            </div>
        `).join('');
    }

    renderFeed() {
        const container = document.getElementById('lyric-feed');
        if(!container) return;

        const registry = this.getRegistry();

        if(registry.length === 0) {
            container.innerHTML = `<div class="text-center text-white/30 py-20">The Colosseum is silent. Be the first to speak.</div>`;
            return;
        }

        container.innerHTML = registry.map(entry => `
            <div id="card-${entry.id}" class="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all group overflow-hidden">
                ${entry.stampedBy ? '<div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/50 to-transparent rounded-bl-3xl flex items-start justify-end p-2"><span class="material-symbols-outlined text-amber-400">verified</span></div>' : ''}
                
                <div class="flex items-start gap-4 mb-4">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">${entry.author[0]}</div>
                    <div>
                        <h4 class="text-white font-bold">${entry.author}</h4>
                        <span class="text-xs text-white/40 uppercase tracking-widest">${new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>

                <div class="mb-6 relative">
                    <p class="text-xl text-white/90 font-serif leading-relaxed italic">"${entry.text}"</p>
                </div>

                <div class="flex items-center justify-between">
                    <button onclick="LyricMaster.playSnippet('${entry.id}')" class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest transition-colors">
                        <span class="material-symbols-outlined text-sm">play_arrow</span>
                        Listen
                    </button>

                    <div class="flex items-center gap-4">
                        <button onclick="LyricMaster.addResonance('${entry.id}')" class="flex items-center gap-1 text-white/50 hover:text-red-500 transition-colors group/heart">
                            <span class="material-symbols-outlined text-lg group-hover/heart:fill-current">favorite</span>
                            <span id="res-${entry.id}" class="text-xs font-bold">${entry.resonance}</span>
                        </button>
                        
                        <button onclick="LyricMaster.applyStamp('${entry.id}')" class="text-white/20 hover:text-amber-500 transition-colors ${entry.stampedBy ? 'hidden' : ''}" title="King's Stamp">
                            <span class="material-symbols-outlined text-lg">hotel_class</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}
