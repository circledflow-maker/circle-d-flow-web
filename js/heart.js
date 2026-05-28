// Heart World Frontend Logic
const heartApp = {
    user: {
        username: "Guest",
        role: "Observer",
        points: 0,
        isAuthenticated: false
    },
    
    timerInterval: null,
    timeRemaining: 0,

    init() {
        console.log("Heart World Initialized.");
        // Check if user is already authenticated in session
        const sessionUser = sessionStorage.getItem('heart_user');
        if (sessionUser) {
            this.user = JSON.parse(sessionUser);
            if (this.user.isAuthenticated) {
                document.getElementById('ygdrasil-gate').style.display = 'none';
                document.getElementById('onboarding-screen').style.display = 'none';
                document.getElementById('main-dashboard').style.display = 'flex';
                this.updateUI();
                this.loadMockData();
            }
        }
    },

    unlockGate() {
        const pass = document.getElementById('master-password').value.toLowerCase().trim();
        const err = document.getElementById('gate-error');
        if (pass === 'ygdrasil' || pass === 'yggdrasil' || pass === 'yggdrassil' || pass === 'ygdrassil') {
            document.getElementById('ygdrasil-gate').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('ygdrasil-gate').style.display = 'none';
                document.getElementById('onboarding-screen').style.display = 'flex';
            }, 1000);
        } else {
            err.style.display = 'block';
        }
    },

    completeRegistration() {
        const username = document.getElementById('reg-username').value;
        const role = document.getElementById('reg-role').value;
        
        if (!username || !role) {
            this.showToast("Missing Information", "Please enter a username and select a guild.");
            return;
        }

        this.user = {
            username: username,
            role: role,
            points: 0,
            isAuthenticated: true
        };
        
        sessionStorage.setItem('heart_user', JSON.stringify(this.user));
        
        document.getElementById('onboarding-screen').style.display = 'none';
        document.getElementById('main-dashboard').style.display = 'flex';
        this.updateUI();
        this.showToast("Welcome to the Guild", `Welcome ${username}. Your path as a ${role} begins.`);
        
        this.loadMockData();
    },

    updateUI() {
        document.getElementById('user-display-name').innerText = this.user.username;
        document.getElementById('user-display-role').innerText = this.user.role;
        document.getElementById('user-points').innerText = this.user.points;
    },

    addPoints(amount, reason) {
        this.user.points += amount;
        this.updateUI();
        sessionStorage.setItem('heart_user', JSON.stringify(this.user));
        this.showToast("EXP Gained", `+${amount} EXP: ${reason}`);
    },

    showSection(sectionId) {
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(s => s.classList.add('hidden'));
        document.getElementById('section-' + sectionId).classList.remove('hidden');
    },

    toggleModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    },

    showToast(title, message) {
        const toast = document.getElementById('toast-notification');
        document.getElementById('toast-title').innerText = title;
        document.getElementById('toast-message').innerText = message;
        
        toast.classList.remove('opacity-0', 'translate-y-20');
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-20');
        }, 4000);
    },

    // --- ACTIVITY & MISSIONS ---
    loadMockData() {
        // Mock Activities
        const activities = [
            { user: "C-Riz", action: "Forged a new beat", time: "2h ago", tags: "Audio" },
            { user: "Lyra", action: "Uploaded poem 'Neon Tears'", time: "4h ago", tags: "Text" },
            { user: "Jiro", action: "Marked new Healing Point in Alfama", time: "1d ago", tags: "Map" }
        ];
        
        const actFeed = document.getElementById('activity-feed');
        if (actFeed) {
            actFeed.innerHTML = activities.map(a => `
                <div class="glass-panel p-4 flex items-start gap-4 border-l-2 border-[#d4af37]">
                    <div class="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold">
                        ${a.user.charAt(0)}
                    </div>
                    <div>
                        <p class="text-sm text-white"><span class="text-[#d4af37]">${a.user}</span> ${a.action}</p>
                        <div class="flex justify-between items-center mt-2 w-full">
                            <span class="text-[10px] text-gray-500">${a.time}</span>
                            <span class="text-[9px] border border-gray-700 px-2 py-0.5 rounded text-gray-400 uppercase">${a.tags}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Mock Missions
        const missions = [
            { title: "Find the Yellow Tram", desc: "Locate Tram 28 near Baixa and record 10 seconds of ambient sound.", exp: 20 },
            { title: "Sunrise Gratitude", desc: "Scan a Healing Point before 8 AM and complete a 15min Wu Wei timer.", exp: 50 }
        ];

        const missFeed = document.getElementById('mission-feed');
        if (missFeed) {
            missFeed.innerHTML = missions.map(m => `
                <div class="glass-panel p-4 border border-gray-800 hover:border-[#d4af37]/50 transition-colors cursor-pointer">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="text-[#d4af37] font-bold">${m.title}</h4>
                        <span class="bg-[#d4af37]/10 text-[#d4af37] px-2 py-1 text-[10px] rounded">+${m.exp} EXP</span>
                    </div>
                    <p class="text-xs text-gray-400 mb-4">${m.desc}</p>
                    <button class="text-[10px] border border-[#d4af37] text-[#d4af37] px-3 py-1 hover:bg-[#d4af37] hover:text-black transition-colors" onclick="heartApp.acceptMission(${m.exp})">ACCEPT MISSION</button>
                </div>
            `).join('');
        }
    },

    createMission() {
        const title = document.getElementById('mission-title').value;
        const desc = document.getElementById('mission-desc').value;
        if(!title || !desc) return;
        
        this.toggleModal('create-mission-modal');
        this.showToast("Mission Forged", "Your real-life mission has been added to the board.");
        this.addPoints(10, "Creating a Mission");
        
        // Clear form
        document.getElementById('mission-title').value = '';
        document.getElementById('mission-desc').value = '';
    },

    acceptMission(exp) {
        this.showToast("Mission Accepted", "Good luck. Earn " + exp + " EXP upon completion.");
    },

    uploadToBazar() {
        const title = document.getElementById('bazar-title').value;
        if(!title) return;
        this.addPoints(5, "Bazar Upload");
        document.getElementById('bazar-title').value = '';
        document.getElementById('bazar-desc').value = '';
    },

    // --- QR CODE & HEALING POINTS ---
    generateQRPin() {
        const name = document.getElementById('pin-name').value;
        const timer = document.getElementById('pin-timer').value;
        
        if (!name) {
            this.showToast("Error", "Please provide a location name.");
            return;
        }

        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = ''; // clear previous
        
        // Generate payload for the QR code
        const payload = JSON.stringify({
            type: "healing_point",
            name: name,
            timer: parseInt(timer)
        });

        new QRCode(qrContainer, {
            text: payload,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        document.getElementById('qr-output-container').style.display = 'flex';
        this.addPoints(15, "Forged a new Healing Point");
    },

    simulateQRScan() {
        // Simulate scanning a 1-minute test timer instead of 15 min for testing
        this.startWuWeiTimer(1); 
    },

    startWuWeiTimer(minutes) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timeRemaining = minutes * 60;
        const timerEl = document.getElementById('wuwei-timer');
        const statusEl = document.getElementById('timer-status');
        const btnEl = document.getElementById('btn-scan-qr');
        
        timerEl.classList.add('active');
        statusEl.style.display = 'block';
        btnEl.style.display = 'none';
        
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                timerEl.classList.remove('active');
                statusEl.innerText = "Session Complete. Energy restored.";
                btnEl.style.display = 'inline-block';
                btnEl.innerText = "SCAN ANOTHER POINT";
                
                // Reward points based on duration
                const expReward = minutes >= 30 ? 75 : (minutes >= 15 ? 30 : 10);
                this.addPoints(expReward, `Completed ${minutes}min Wu Wei Session`);
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const m = Math.floor(this.timeRemaining / 60).toString().padStart(2, '0');
        const s = (this.timeRemaining % 60).toString().padStart(2, '0');
        document.getElementById('wuwei-timer').innerText = `${m}:${s}`;
    }
};

window.onload = () => heartApp.init();
