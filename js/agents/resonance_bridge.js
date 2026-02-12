/**
 * Agent: Resonance Bridge (The Chat)
 * Role: Manages Real-time Communication, Admin Whispers, and Artifact Sharing.
 */

class ResonanceBridge {
    constructor() {
        this.name = "ResonanceBridge";
        this.messages = [];
        this.socketMock = null; // Simulating Socket.io
        this.rateLimit = { count: 0, lastTime: Date.now() };
        this.isMuted = false;
        
        // Admin IDs (Mock)
        this.ADMINS = {
            'ROOT': { id: 'master_root', role: 'Captain', color: 'text-mystic-gold', badge: '🦅', border: 'border-mystic-gold' },
            'QTER': { id: 'dj_qter', role: 'Sound Master', color: 'text-gray-300', badge: '🎧', border: 'border-gray-400' },
            'KITKAT': { id: 'kitkat_agent', role: 'Resource Agent', color: 'text-bronze-400', badge: '🍬', border: 'border-orange-700' }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Signal Bridge Established.`);
        window.Resonance = this;
        this.connectSocket();
    }

    connectSocket() {
        // Mock Connection
        setTimeout(() => {
            console.log(`[${this.name}] Connected to Matrix Relay.`);
            if(window.Pusher) window.Pusher.showToast("Resonance Bridge Online", "success");
        }, 1000);
    }

    /**
     * Renders the Chat Interface into a container
     */
    renderInterface(container) {
        container.innerHTML = `
            <div class="flex flex-col h-full bg-[#0F0A13] relative overflow-hidden">
                <!-- Chat Header -->
                <div class="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center z-10">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-electric animate-pulse">wifi_tethering</span>
                        <div>
                            <h3 class="text-sm font-bold text-white uppercase tracking-widest">Global Frequency</h3>
                            <div class="text-[10px] text-white/50 flex items-center gap-1">
                                <span class="w-2 h-2 rounded-full bg-green-500"></span> 1,024 Initiates Online
                            </div>
                        </div>
                    </div>
                    <!-- Tools -->
                    <div class="flex gap-2">
                         <button onclick="Resonance.exportHistory()" class="text-white/30 hover:text-white material-symbols-outlined text-sm" title="Export Resonance">mail</button>
                    </div>
                </div>

                <!-- Messages Area (Infinite Scroll) -->
                <div id="resonance-feed" class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth relative">
                    <div class="text-center py-8 opacity-50">
                        <span class="material-symbols-outlined text-4xl text-white/10">history_edu</span>
                        <p class="text-[10px] text-white/30 mt-2 uppercase tracking-widest">Siphon Archives Loaded</p>
                    </div>
                    <!-- Messages will be injected here -->
                </div>

                <!-- Input Area -->
                <div class="p-4 bg-black/60 border-t border-white/10 z-10">
                     <!-- Drag Drop Zone overlay (Hidden by default) -->
                     <div id="drop-zone" class="hidden absolute inset-0 bg-electric/20 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-electric m-2 rounded-xl">
                        <div class="text-white font-bold flex flex-col items-center">
                            <span class="material-symbols-outlined text-4xl mb-2">move_to_inbox</span>
                            Drop Artifact to Share
                        </div>
                     </div>

                    <div class="bg-white/5 border border-white/10 rounded-xl flex items-center p-2 focus-within:border-electric/50 transition-colors relative">
                        <button class="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors" title="Add Artifact" onclick="Resonance.toggleArtifactPicker()">
                            <span class="material-symbols-outlined text-sm">token</span>
                        </button>
                        
                        <input type="text" id="resonance-input" autocomplete="off"
                            class="flex-1 bg-transparent border-none outline-none text-white text-sm px-3 placeholder-white/20 font-medium"
                            placeholder="Broadcast message..."
                            onkeypress="if(event.key === 'Enter') Resonance.sendMessage()">
                        
                        <button onclick="Resonance.sendMessage()" class="w-8 h-8 rounded-lg bg-electric text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                            <span class="material-symbols-outlined text-sm">send</span>
                        </button>
                    </div>
                    <div class="text-[9px] text-white/20 mt-2 text-center font-mono">
                        Shift+Enter for new line • /help for commands
                    </div>
                </div>
            </div>
        `;

        // Initialize Drag & Drop
        this.initDragDrop(container);
        
        // Load initial dummy messages
        this.loadMockHistory();
    }

    sendMessage() {
        const input = document.getElementById('resonance-input');
        const text = input.value.trim();
        
        if(!text) return;
        if(this.isMuted) {
            window.Pusher.showToast("Spirit Muted: Wait 60s", "error");
            return;
        }

        // 1. Rate Limiting
        const now = Date.now();
        if(now - this.rateLimit.lastTime < 1000) {
            this.rateLimit.count++;
        } else {
            this.rateLimit.count = 1;
            this.rateLimit.lastTime = now;
        }

        if(this.rateLimit.count > 5) {
            this.muteUser();
            return;
        }

        // 2. Admin Command Intercept
        if(text.startsWith('/')) {
            if(this.handleAdminCommand(text)) {
                input.value = ''; // Clear if command handled
                return;
            }
        }

        // 3. Render User Message (Optimistic UI)
        const user = {
            name: localStorage.getItem('cdf_user_username') || 'Me',
            id: 'local_user',
            avatar: localStorage.getItem('cdf_user_avatar') || '../Assets/images/logo.png',
            role: 'Initiate'
        };

        this.addMessage({
            id: Date.now(),
            text: window.Helper.sanitizeInput(text),
            user: user,
            timestamp: Date.now(),
            isMe: true
        });

        input.value = '';
        
        // 4. Simulate Socket Emit
        // socket.emit('sendMessage', { text, user });
    }

    addMessage(msg) {
        const feed = document.getElementById('resonance-feed');
        if(!feed) return;

        const isMe = msg.isMe;
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-slide-up-fade`;

        // Role Styling
        let nameColor = 'text-white/60';
        let borderColor = 'border-white/10';
        let glow = '';
        let badge = '';

        // Check for Admin
        if (msg.user.id === 'master_root') {
            nameColor = this.ADMINS.ROOT.color;
            borderColor = this.ADMINS.ROOT.border;
            badge = this.ADMINS.ROOT.badge;
            glow = 'shadow-[0_0_15px_rgba(255,215,0,0.2)]';
        }

        // Artifact Card Handling
        let contentHTML = `<div class="text-sm text-white/90 leading-relaxed">${msg.text}</div>`;
        
        if(msg.type === 'ARTIFACT') {
            contentHTML = this.renderArtifactCard(msg.artifact);
        }

        msgDiv.innerHTML = `
            <div class="relative shrink-0">
                <img src="${msg.user.avatar}" class="w-8 h-8 rounded-full bg-black border ${borderColor} object-cover">
                <div class="absolute -bottom-1 -right-1 text-[10px] drop-shadow-md" title="Nen Active">🔥</div>
            </div>
            
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider ${nameColor}">${badge} ${msg.user.name}</span>
                    <span class="text-[9px] text-white/20 font-mono">${window.Helper.formatTime(msg.timestamp)}</span>
                    <!-- Translation Seal -->
                    <button class="text-[9px] text-white/10 hover:text-white transition-colors" title="Translate Aura" onclick="Resonance.translateMessage(this)">
                        <span class="material-symbols-outlined text-[10px]">translate</span>
                    </button>
                </div>
                
                <div class="p-3 ${isMe ? 'bg-blue-600/20 border-blue-500/30' : 'bg-white/5 border-white/10'} border rounded-2xl ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'} ${glow} backdrop-blur-sm">
                    ${contentHTML}
                </div>
                
                 <!-- Verify Signal (Only for specific contexts, added randomly for demo) -->
                ${!isMe && Math.random() > 0.8 ? `
                    <button class="mt-1 flex items-center gap-1 text-[9px] text-green-400 hover:text-green-300 transition-colors bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20" onclick="Resonance.verifySignal(this)">
                        <span class="material-symbols-outlined text-[10px]">check_circle</span> Verify Signal
                    </button>
                ` : ''}
            </div>
        `;

        feed.appendChild(msgDiv);
        feed.scrollTop = feed.scrollHeight;
    }

    renderArtifactCard(artifact) {
        return `
            <div class="group relative w-48 bg-black/40 border border-t-2 border-white/10 hover:border-amber-500 rounded-lg overflow-hidden transition-all cursor-pointer mt-1" onclick="alert('Viewing Artifact: ${artifact.name}')">
                <div class="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex p-2 gap-2">
                    <img src="${artifact.img}" class="w-10 h-10 rounded border border-white/20 object-cover bg-white/5">
                    <div class="flex flex-col justify-center min-w-0">
                        <div class="text-[10px] font-bold text-white truncate text-amber-100">${artifact.name}</div>
                        <div class="text-[9px] text-amber-500 font-mono flex items-center gap-1">
                            <span class="material-symbols-outlined text-[9px]">diamond</span> ${artifact.value} VS
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="bg-white/5 p-1 px-2 flex justify-between items-center text-[8px] text-white/30 border-t border-white/5">
                    <span class="uppercase tracking-wider">Relic Card</span>
                    <span class="material-symbols-outlined text-[10px]">visibility</span>
                </div>
            </div>
        `;
    }

    // --- ADMIN WHISPERS ---
    
    handleAdminCommand(text) {
        const parts = text.split(' ');
        const cmd = parts[0];
        const arg = parts.slice(1).join(' ');

        // Mock Admin Check (In real app, backend validates session)
        const isAdmin = true; // Simulating you are Captain

        if(cmd === '/nexus-pulse' && isAdmin) {
            if(confirm("Captain, are you sure you wish to pulse the Kingdom?")) {
                window.dispatchEvent(new CustomEvent('GLOBAL_UI_EVENT', { detail: { type: 'PULSE', msg: arg } }));
            }
            return true;
        }

        if(cmd === '/drop-beat' && isAdmin) {
            window.dispatchEvent(new CustomEvent('GLOBAL_SOUND_EVENT', { detail: { type: 'OVERRIDE', track: arg } }));
            return true;
        }

        if(cmd === '/kitkat-gift' && isAdmin) {
             window.dispatchEvent(new CustomEvent('ROOM_LOOT_EVENT', { detail: { amount: parseInt(arg) || 100 } }));
             return true;
        }

        return false;
    }

    muteUser() {
        this.isMuted = true;
        window.Pusher.showToast("Nen Overload! You are muted for 60s.", "error");
        if(window.Flowee) window.Flowee.talk(true, "Calm your spirit, Initiate. Too much resonance.");
        
        setTimeout(() => {
            this.isMuted = false;
            window.Pusher.showToast("Mute Lifted. Resume Resonance.", "success");
        }, 60000);
    }

    // --- UTILITIES ---

    initDragDrop(container) {
        const dropZone = container.querySelector('#drop-zone');
        
        container.ondragover = (e) => {
            e.preventDefault();
            dropZone.classList.remove('hidden');
        };

        container.ondragleave = (e) => {
            if (e.relatedTarget && !container.contains(e.relatedTarget)) {
                 dropZone.classList.add('hidden');
            }
        };

        container.ondrop = (e) => {
            e.preventDefault();
            dropZone.classList.add('hidden');
            
            // Mock Artifact Drop
            this.addMessage({
                id: Date.now(),
                type: 'ARTIFACT',
                user: { name: 'Me', id: 'local', avatar: localStorage.getItem('cdf_user_avatar')},
                timestamp: Date.now(),
                isMe: true,
                artifact: {
                    name: "Dropped Soul Gem",
                    value: 500,
                    img: "../Assets/images/logo.png"
                }
            });
        };
    }

    loadMockHistory() {
        const history = [
            { id: 1, text: "Anyone down for a Co-Op on the 'Neon Nights' event?", user: { name: 'Neon_Ghost', id: 'u1', avatar: '' }, timestamp: Date.now() - 3600000 },
            { id: 2, text: "I have the Sound Artifacts if you need them.", user: { name: 'Audio_Witch', id: 'u2', avatar: '' }, timestamp: Date.now() - 1800000 },
             // Admin Message Mock
            { id: 3, text: "Welcome to the Siege, Initiates. The Hub is now LIVE.", user: { name: 'The Captain', id: 'master_root', avatar: '../Assets/images/logo.png' }, timestamp: Date.now() - 60000 }
        ];

        history.forEach(msg => {
            msg.isMe = false;
            if(!msg.user.avatar) msg.user.avatar = `https://ui-avatars.com/api/?name=${msg.user.name}&background=random`;
            this.addMessage(msg);
        });
    }

    toggleArtifactPicker() {
        alert("Opening Collector's Bag...");
        // In real app, opens Inventory Modal to select item
    }

    verifySignal(btn) {
        btn.innerHTML = `<span class="material-symbols-outlined text-[10px]">verified</span> Signal Verified`;
        btn.classList.remove('bg-green-500/10', 'text-green-400');
        btn.classList.add('bg-green-500/20', 'text-green-200', 'cursor-default');
        btn.onclick = null;
        window.Pusher.showToast("Signal Verified on Blockchain", "success");
    }
}

new ResonanceBridge();
