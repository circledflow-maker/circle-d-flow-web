/**
 * Sound-Command Dashboard Logic
 * Controls: Stage-Master, Flyer-Engine, Jam Ignition, Scouting Report
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check Auth (Simple Simulation)
    // In real app, check session token.
    console.log("[System] Dashboard Initialized");
    loadScoutingReport();
});

// --- 1. STAGE-MASTER (Bracket Control) ---
function declareWinner(winnerName) {
    const confirmWin = confirm(`Declare ${winnerName} as the winner of this bout?`);
    if(confirmWin) {
        // Update Local State simulate
        alert(`🏆 VICTORY: ${winnerName} advances to the next round!`);
        // Sync with Arena
        const event = new CustomEvent('arena-update', { detail: { winner: winnerName } });
        window.dispatchEvent(event);
    }
}

function updateBracket() {
    alert("🔄 Syncing Live Bracket with Arena Display...");
    setTimeout(() => alert("✅ Bracket Synced Successfully."), 1000);
}

// --- 2. FLYER-ENGINE ---
function publishFlyer() {
    const artist = document.getElementById('flyer-artist').value;
    const title = document.getElementById('flyer-title').value;
    
    if(!artist || !title) {
        alert("⚠️ System Error: Artist and Title Required.");
        return;
    }

    alert(`🚀 PROJECTING TO WALL: ${artist} - ${title}`);
    // Effect: Pulse animations
}

// --- 3. JAM IGNITION ---
let isJamming = false;
function toggleJamSession() {
    isJamming = !isJamming;
    const btn = document.getElementById('jam-btn');
    const icon = btn.querySelector('span');
    const text = btn.querySelectorAll('span')[1];

    if(isJamming) {
        btn.classList.add('animate-pulse', 'border-danger');
        icon.innerText = "mic";
        icon.classList.remove('text-white/30');
        icon.classList.add('text-danger', 'animate-bounce');
        text.innerText = "ON AIR";
        text.classList.remove('text-white/30');
        text.classList.add('text-white');
        alert("🎙️ BASS-WELLE ALERT: Jam Session is LIVE!");
    } else {
        btn.classList.remove('animate-pulse', 'border-danger');
        icon.innerText = "mic_off";
        icon.classList.add('text-white/30');
        icon.classList.remove('text-danger', 'animate-bounce');
        text.innerText = "Go Live";
        text.classList.add('text-white/30');
        text.classList.remove('text-white');
    }
}

// --- 4. KINGDOM VIBE ---
function setVibe(vibeName) {
    console.log(`[Audio Override] Setting Kingdom Frequency to: ${vibeName}`);
    // Visual feedback
    const toasts = document.createElement('div');
    toasts.className = "fixed bottom-8 right-8 bg-electric text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce";
    toasts.innerText = `🔊 VIBE SHIFT: ${vibeName}`;
    document.body.appendChild(toasts);
    setTimeout(() => toasts.remove(), 3000);
}

// --- 5. SCOUTING REPORT (Challenger Review) ---
function loadScoutingReport() {
    const tbody = document.getElementById('scouting-list');
    if(!tbody) return;

    const queue = JSON.parse(localStorage.getItem('challenger_queue') || '[]');
    tbody.innerHTML = '';

    if(queue.length === 0) {
        tbody.innerHTML = `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="py-3 px-4 text-white/50">--:--</td>
                <td class="py-3 px-4 font-bold text-white">No Pending Challengers</td>
                <td class="py-3 px-4 text-white/50">-</td>
                <td class="py-3 px-4 text-right"></td>
            </tr>`;
        return;
    }

    queue.forEach(challenger => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/5 hover:bg-white/5 transition-colors";
        
        const date = new Date(challenger.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        tr.innerHTML = `
            <td class="py-3 px-4 text-white/50 text-xs">${date}</td>
            <td class="py-3 px-4 font-bold text-white">${challenger.name}</td>
            <td class="py-3 px-4 text-electric text-xs uppercase">${challenger.style}</td>
            <td class="py-3 px-4 text-right gap-2 flex justify-end">
                <button onclick="reviewChallenger('${challenger.id}', 'approve')" class="p-1 hover:bg-success/20 text-success rounded transition-colors" title="Approve">
                    <span class="material-symbols-outlined text-lg">check_circle</span>
                </button>
                <button onclick="reviewChallenger('${challenger.id}', 'reject')" class="p-1 hover:bg-danger/20 text-danger rounded transition-colors" title="Reject">
                    <span class="material-symbols-outlined text-lg">cancel</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function reviewChallenger(id, action) {
    let queue = JSON.parse(localStorage.getItem('challenger_queue') || '[]');
    const challenger = queue.find(c => c.id === id);
    
    // Remove from queue
    queue = queue.filter(c => c.id !== id);
    localStorage.setItem('challenger_queue', JSON.stringify(queue));

    if(action === 'approve') {
        // Move to Bracket (Simulated)
        alert(`✅ APPROVED: ${challenger.name} enters the Tournament Bracket!`);
        // In real app, push to 'tournament_participants'
    } else {
        alert(`🚫 REJECTED: ${challenger.name} was denied entry.`);
    }

    // Refresh UI
    loadScoutingReport();
}

function logout() {
    window.location.href = '../index.html';
}
