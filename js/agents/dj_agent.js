/**
 * Agent: DJ Guter (The Signal)
 * Purpose: Manages persistent audio state and synchronization across the ecosystem.
 * Dependencies: localStorage (cdf_dj_state)
 */

class DjAgent {
    constructor() {
        this.name = "DJ Guter";
        this.STORAGE_KEY = "cdf_dj_state";
        this.tracks = [
            { id: 1, title: "Outbreak Frequency", artist: "DJ Guter", duration: "3:45" },
            { id: 2, title: "Neon Jungle", artist: "The Flow", duration: "4:20" },
            { id: 3, title: "Cyber-Soul", artist: "KitKat", duration: "2:50" }
        ];

        this.state = this.loadState();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }

        // Listen for storage changes (Tab Sync)
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY) {
                this.syncState(JSON.parse(e.newValue));
            }
        });
    }

    init() {
        console.log(`[${this.name}] Signal Initialized. Current Track: ${this.state.currentTrack?.title}`);
        this.renderFooterWidget();
        this.updateUI();
    }

    loadState() {
        const defaultState = {
            isPlaying: false,
            currentTrack: this.tracks[0],
            volume: 0.8
        };
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || defaultState;
    }

    saveState() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    }

    play(trackId = null) {
        if(trackId) {
            this.state.currentTrack = this.tracks.find(t => t.id === trackId) || this.tracks[0];
        }
        this.state.isPlaying = true;
        this.saveState();
        this.updateUI();
        this.broadcast(`Now Playing: ${this.state.currentTrack.title}`);
    }

    pause() {
        this.state.isPlaying = false;
        this.saveState();
        this.updateUI();
    }

    toggle() {
        if (this.state.isPlaying) this.pause();
        else this.play();
    }

    next() {
        let idx = this.tracks.findIndex(t => t.id === this.state.currentTrack.id);
        idx = (idx + 1) % this.tracks.length;
        this.play(this.tracks[idx].id);
    }

    // --- UI SYNC ---

    syncState(newState) {
        this.state = newState;
        this.updateUI();
    }

    updateUI() {
        // Update Footer Widget
        const widget = document.getElementById('dj-footer-widget');
        if (widget) {
            const icon = widget.querySelector('.icon');
            const text = widget.querySelector('.track-name');
            const bars = widget.querySelectorAll('.bar');

            if (this.state.isPlaying) {
                icon.innerText = 'pause_circle';
                text.innerText = `${this.state.currentTrack.title} - ${this.state.currentTrack.artist}`;
                text.classList.remove('opacity-50');
                text.classList.add('text-electric');
                
                // Animate bars
                bars.forEach(b => b.classList.add('animate-music-bar'));
            } else {
                icon.innerText = 'play_circle';
                text.innerText = "Signal Paused";
                text.classList.add('opacity-50');
                text.classList.remove('text-electric');
                
                // Stop bars
                bars.forEach(b => b.classList.remove('animate-music-bar'));
            }
        }

        // Update Outbreak Page (If active)
        if(window.location.pathname.includes('outbreak_tunes.html')) {
             if(window.renderOutbreakPlayer) window.renderOutbreakPlayer(this.state);
        }
    }

    renderFooterWidget() {
        if (document.getElementById('dj-footer-widget')) return;

        // Inject into existing footer or create floating
        const footer = document.querySelector('footer'); // Assuming standard footer exists
        if (!footer) return;

        const widget = document.createElement('div');
        widget.id = 'dj-footer-widget';
        widget.className = "fixed bottom-0 left-0 w-full h-12 bg-black/90 border-t border-electric/30 backdrop-blur flex items-center justify-between px-8 z-50 transform translate-y-0 transition-transform cursor-pointer hover:bg-black";
        widget.onclick = (e) => {
             // If click is not on a button, toggle player
             if(e.target.tagName !== 'BUTTON' && !window.location.pathname.includes('outbreak_tunes.html')) {
                 window.location.href = '../pages/outbreak_tunes.html';
             }
        };

        widget.innerHTML = `
            <div class="flex items-center gap-4">
                <button onclick="event.stopPropagation(); window.DjAgent.toggle()" class="text-electric hover:text-white transition-colors">
                    <span class="material-symbols-outlined icon text-2xl">play_circle</span>
                </button>
                <div class="flex gap-1 h-4 items-end">
                    <div class="w-1 h-2 bg-electric rounded-full bar"></div>
                    <div class="w-1 h-3 bg-electric rounded-full bar"></div>
                    <div class="w-1 h-4 bg-electric rounded-full bar"></div>
                    <div class="w-1 h-2 bg-electric rounded-full bar"></div>
                </div>
                <span class="text-xs font-mono uppercase tracking-widest text-white/50 track-name">Initializing Signal...</span>
            </div>
            
            <div class="flex items-center gap-2">
                 <span class="text-[9px] text-white/30 uppercase tracking-widest">Outbreak FM 104.5</span>
                 <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
        `;
        document.body.appendChild(widget);
    }
    
    broadcast(msg) {
        if(window.BridgePusher) {
            window.BridgePusher.broadcast('AUDIO_EVENT', { msg: msg });
        }
    }
}

window.DjAgent = new DjAgent();
