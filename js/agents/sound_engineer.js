/**
 * THE SOUND ENGINEER AGENT
 * Role: Standard (Automator)
 * Purpose: Manages Tournament Brackets and Artist Uploads for "The Frequency".
 */

class SoundEngineer {
    constructor() {
        this.name = "The Sound Engineer";
        this.role = "Automator";
        this.bracketState = JSON.parse(localStorage.getItem('cypher_bracket')) || this.initBracket();
        this.init();
    }

    init() {
        console.log(`[${this.name}] Calibrating Frequency...`);
        this.checkBracketUpdates();
        this.checkGlobalAudio(); // Sync Volume
        this.checkGlobalTrack(); // Sync Track
        this.broadcastSchedule(); // Broadcast Jam Time
        
        // Listen for admin commands from Sound-Command and Global Volume
        window.addEventListener('storage', (e) => {
            if (e.key === 'cypher_update') {
                this.refreshBracketUI();
            }
            if (e.key === 'cdf_global_volume') {
                this.syncVolume(e.newValue);
            }
            if (e.key === 'cdf_global_track') {
                this.syncTrack(e.newValue);
            }
        });
    }

    checkGlobalAudio() {
        const vol = localStorage.getItem('cdf_global_volume');
        if(vol) this.syncVolume(vol);
    }
    
    checkGlobalTrack() {
        const track = localStorage.getItem('cdf_global_track');
        if(track) console.log(`[${this.name}] Current Vibe: ${track}`);
        // In a real app, this would start playing the track if autoplay is on
    }

    syncTrack(trackName) {
        console.log(`[${this.name}] Global Vibe Shift Detected: ${trackName}`);
        
        // 1. Notify User via Pusher if available, else console
        if(window.Pusher) {
            window.Pusher.showToast(`🎵 Frequency Shift: ${trackName}`, 'xp');
        }
        
        // 2. Mock Audio Switch
        // const audio = document.getElementById('bg-music');
        // if(audio) { audio.src = ...; audio.play(); }
    }

    syncVolume(val) {
        // Convert 0-100 to 0.0-1.0
        const volume = parseFloat(val) / 100;
        console.log(`[${this.name}] Global Volume Sync: ${val}%`);
        
        // Apply to all audio elements
        document.querySelectorAll('audio, video').forEach(media => {
            media.volume = volume;
        });
    }

    broadcastSchedule() {
        // Simulate a Jam scheduled for "Tomorrow 20:00" or similar
        const venues = ["LX Factory", "Secret Garden", "Village Underground", "The Sandbox"];
        const venue = venues[Math.floor(Math.random() * venues.length)];
        
        const now = new Date();
        const jamTime = new Date(now.getTime() + (Math.random() * 48 * 60 * 60 * 1000)); // Within 48h
        
        const schedule = {
            venue: venue,
            timestamp: jamTime.toISOString(),
            title: "Midnight Flow Session"
        };
        
        localStorage.setItem('kyh_next_jam', JSON.stringify(schedule));
        console.log(`[${this.name}] Jam Scheduled: ${venue} @ ${jamTime.toLocaleTimeString()}`);
    }

    initBracket() {
        // Initial Mock Data
        return {
            round1: [
                { p1: 'Hempy', p2: 'Ray', winner: null },
                { p1: 'Ghost', p2: 'Will', winner: null },
                { p1: 'Flow', p2: 'Echo', winner: null },
                { p1: 'Vibe', p2: 'Beat', winner: null }
            ],
            semiFinals: [],
            final: null,
            champion: null
        };
    }

    checkBracketUpdates() {
        const matchElements = document.querySelector('#budokai-arena');
        if (matchElements) {
             console.log(`[${this.name}] Budokai Arena Active. Syncing Aura levels...`);
             this.updateBars();
        }
    }

    refreshBracketUI() {
        console.log(`[${this.name}] Syncing with Sound-Command... Bracket Updated.`);
        this.bracketState = JSON.parse(localStorage.getItem('cypher_bracket'));
        this.notifyUpdate("Bracket Updated: Round 2 is Live!");
        // Re-render bracket text if needed
    }

    // --- BUDOKAI PROTOCOL ---

    voteFor(fighter) {
        console.log(`[${this.name}] Vote Registered: ${fighter}`);
        
        // 0. Referee Check
        if (window.HypeRef) {
             const result = window.HypeRef.validateVote('Local_User', fighter);
             if (!result.valid) {
                 alert(`⛔ REF SAYS NO: ${result.reason}`);
                 return;
             }
        }

        // 1. Mock Aura Increase
        this.increaseAura(fighter, 100);

        // 2. Update Scouter
        this.addToScouter(`<span class="text-blue-400">User_${Math.floor(Math.random()*999)}</span> voted for ${fighter}`);

        // 3. Trigger Flowee Comment
        if (window.Flowee && Math.random() > 0.7) {
            window.Flowee.talk(true, `${fighter}'s Aura is rising!`);
        }
    }

    playSound(fxType) {
        console.log(`[${this.name}] Playing Dropping FX: ${fxType}`);
        // Visual Feedback
        this.addToScouter(`<span class="text-pink-400">FX TRIGGERED: ${fxType.toUpperCase()}! 🔊</span>`);
        
        // In a real app, this would play audio:
        // new Audio(`assets/sounds/${fxType}.mp3`).play();
        
        // Trigger generic "shake" on the board?
        const board = document.getElementById('live-lab');
        if(board) {
            board.classList.add('animate-pulse');
            setTimeout(() => board.classList.remove('animate-pulse'), 200);
        }
    }

    lendAura() {
        console.log(`[${this.name}] SPIRIT BOMB CHARGING...`);
        alert("🙌 YOU LENT YOUR AURA! The Arena is shaking!");
        
        // Boost both bars for effect
        this.insertRandomAura();
        this.addToScouter(`<span class="text-mystic-gold font-bold">A MASSIVE SURGE OF AURA DETECTED!</span>`);
    }

    increaseAura(fighter, amount) {
        const id = fighter.toLowerCase();
        const bar = document.getElementById(`bar-${id}`);
        const pwrText = document.getElementById(`pwr-${id}`);

        // Update Bar
        if (bar) {
            let currentWidth = parseInt(bar.style.width) || 50;
            let newWidth = Math.min(100, currentWidth + 5); 
            bar.style.width = `${newWidth}%`;
        }
        
        // Update Power Level Text
        if (pwrText) {
            let currentPwr = parseInt(pwrText.innerText.replace(/,/g, '')) || 5000;
            let newPwr = currentPwr + (amount * Math.floor(Math.random() * 5 + 1)); // Random surge
            pwrText.innerText = newPwr.toLocaleString();
            
            // Visual Pop (Flash White)
            pwrText.classList.add('text-white', 'scale-110');
            setTimeout(() => pwrText.classList.remove('text-white', 'scale-110'), 150);
        }
    }
    
    updateBars() {
        // Init mock bars
        const f1 = document.getElementById('bar-hempy');
        const f2 = document.getElementById('bar-ray');
        if(f1) f1.style.width = '45%';
        if(f2) f2.style.width = '55%';
    }

    addToScouter(html) {
        const feed = document.getElementById('scouter-feed');
        if (!feed) return;

        const li = document.createElement('li');
        li.className = "animate-fade-in-up";
        li.innerHTML = html;
        feed.prepend(li);

        // Keep list short
        if (feed.children.length > 8) feed.lastElementChild.remove();
    }
    
    insertRandomAura() {
       // Simulate live activity
       const f = Math.random() > 0.5 ? 'Hempy' : 'Ray';
       this.voteFor(f);
    }

    validateUpload(fileName) {
        console.log(`[${this.name}] Analyzing Spectral Data of: ${fileName}`);
        return new Promise((resolve) => {
            setTimeout(() => {
                const quality = Math.random() > 0.2; // 80% success
                resolve({ valid: quality, message: quality ? "frequency_match" : "distortion_detected" });
            }, 1000);
        });
    }

    notifyUpdate(msg) {
        const event = new CustomEvent('agent-alert', { detail: { agent: this.name, message: msg } });
        window.dispatchEvent(event);
    }

    registerChallenger() {
        console.log(`[${this.name}] Challenger registration initiated.`);
        this.addToScouter(`<span class="text-green-400">CHALLENGER REGISTRATION OPEN!</span>`);
        this.notifyUpdate("New Challenger Registration is Live!");
        // In a real app, this would open a modal or navigate to a registration form.
    }
}

// Initialize and Expose Globals
const soundEngineer = new SoundEngineer();
window.SoundEngineer = soundEngineer;

// Global Wrapper for HTML Onclick
window.registerChallenger = () => {
    if (window.SoundEngineer) {
        window.SoundEngineer.registerChallenger();
    } else {
        console.error("SoundEngineer Agent not initialized!");
    }
};

window.playSound = (s) => window.SoundEngineer?.playSound(s);
window.lendAura = () => window.SoundEngineer?.lendAura();
window.voteFor = (f) => window.HypeRef?.vote(f); // This line was changed from SoundEngineer.voteFor to HypeRef.vote

// Autostart Simulation if on Arena
if(document.getElementById('budokai-arena')) {
    setInterval(() => {
        if(Math.random() > 0.8) window.SoundEngineer.insertRandomAura();
    }, 3000);
}
