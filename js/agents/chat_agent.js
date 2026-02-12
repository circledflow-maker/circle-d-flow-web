/**
 * Agent: Chat Operator
 * Role: Manages real-time communication simulation.
 */
class ChatAgent {
    constructor() {
        this.name = "ChatAgent";
        this.feed = null;
        this.users = [
            { name: "The_Omen", role: "Omen", status: "online" },
            { name: "Flow_Master_Kai", role: "Flow Master", status: "online" },
            { name: "Creator_Ronin", role: "Flow Creator", status: "idle" },
            { name: "Pixel_Muse", role: "Flow Creator", status: "online" }
        ];
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log(`[${this.name}] Comms Link Established.`);
        window.ChatAgent = this;
        
        this.feed = document.getElementById('chat-feed');
        this.renderUserList();
        
        // Initial Welcome
        this.feed.innerHTML = ''; // Clear loading
        this.addSystemMessage("Connected to The Source. Flow resonates.");
        this.addMessage({ user: "The_Omen", text: "Welcome to the Circle. Align your purpose.", time: "Now", role: "Omen" });

        // Simulate activity
        setInterval(() => this.simulateIncoming(), 15000);
    }

    renderUserList() {
        const list = document.getElementById('user-list');
        if(!list) return;

        list.innerHTML = this.users.map(u => `
            <li class="flex items-center gap-3 px-2 py-1 rounded hover:bg-white/5 cursor-pointer transition-colors group">
                <div class="relative">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                        ${u.name.substring(0,2).toUpperCase()}
                    </div>
                    <div class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0F0A13] ${u.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}"></div>
                </div>
                <div>
                    <div class="text-sm text-white/80 group-hover:text-white font-medium">${u.name}</div>
                    <div class="text-[10px] text-white/30 uppercase tracking-wider">${u.role}</div>
                </div>
            </li>
        `).join('');
    }

    switchChannel(channel) {
        // Visual Update for Sidebar (Simplified)
        console.log(`[${this.name}] Switching to Channel: ${channel}`);
        this.currentChannel = channel;
        
        // Clear Feed
        this.feed.innerHTML = '';
        
        if(channel === 'trinity') {
            this.addSystemMessage("ENCRYPTED CONNECTION ESTABLISHED. TRINITY CORE LISTENING.");
            this.addMessage({ user: "Trinity_Bot", text: "Greetings, Navigator. How can we assist your evolution?", time: "Now", role: "admin" });
        } else {
             this.addSystemMessage(`Reconnected to ${channel.toUpperCase()} Frequency.`);
        }
    }

    sendMessage(e) {
        e.preventDefault();
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        
        if(!text) return;

        // Add User Message
        this.addMessage({
            user: "You", // TODO: Get from localStorage
            text: text,
            time: "Just now",
            role: "user",
            isMe: true
        });

        input.value = '';
        
        // Play Sound
        if(window.Helper) window.Helper.triggerHaptic('light');
        
        // TRINITY BOT LOGIC
        if(this.currentChannel === 'trinity') {
             setTimeout(() => {
                this.addMessage({ user: "Trinity_Bot", text: "We have received your query. Analyzing compatibility with the Circle's goals...", time: "Now", role: "admin" });
             }, 1500);
             return;
        }

        // Auto-reply Simulation (Easter Egg)
        if(text.toLowerCase().includes('hello')) {
            setTimeout(() => {
                this.addMessage({ user: "Pixel_Priestess", text: "Greetings! 👋", time: "Now", role: "user" });
            }, 1000);
        }
    }

    addMessage(msg) {
        const div = document.createElement('div');
        div.className = `flex gap-4 ${msg.isMe ? 'flex-row-reverse' : ''} animate-fade-in-up`;
        
        const avatar = msg.isMe 
            ? `<div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20"><span class="material-symbols-outlined text-white/50">person</span></div>` 
            : `<div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50 text-purple-300 font-bold text-xs">${msg.user.substring(0,2).toUpperCase()}</div>`;

        const bubbleColor = msg.isMe 
            ? 'bg-purple-600/20 border-purple-500/30 text-white' 
            : 'bg-white/5 border-white/10 text-white/80';

        div.innerHTML = `
            ${avatar}
            <div class="max-w-[80%] md:max-w-[60%]">
                <div class="flex items-center gap-2 mb-1 ${msg.isMe ? 'justify-end' : ''}">
                    <span class="text-xs font-bold ${msg.role === 'admin' ? 'text-yellow-500' : 'text-white/50'}">${msg.user}</span>
                    <span class="text-[10px] text-white/30">${msg.time}</span>
                </div>
                <div class="p-3 md:p-4 rounded-2xl border ${bubbleColor} backdrop-blur-sm text-sm leading-relaxed shadow-lg">
                    ${msg.text}
                </div>
            </div>
        `;

        this.feed.appendChild(div);
        this.scrollToBottom();
    }

    addSystemMessage(text) {
        const div = document.createElement('div');
        div.className = "flex justify-center my-4";
        div.innerHTML = `
            <span class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                ${text}
            </span>
        `;
        this.feed.appendChild(div);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.feed.scrollTop = this.feed.scrollHeight;
    }

    simulateIncoming() {
        const messages = [
            "Anyone up for a Co-Op mission?",
            "Just found a rare artifact in Alfama sector!",
            "Global event starting in 5 minutes.",
            "My Haki level just leveled up!"
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        const randomUser = this.users[Math.floor(Math.random() * this.users.length)];
        
        this.addMessage({
            user: randomUser.name,
            text: randomMsg,
            time: "Now",
            role: randomUser.role
        });
    }
}

new ChatAgent();
