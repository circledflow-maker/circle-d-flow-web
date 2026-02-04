/**
 * Flow-ee AI Assistant
 * The guide for the Circle D Flow ecosystem.
 */

class FlowEE {
    constructor() {
        this.isOpen = false;
        
        // Wait for DOM
        setTimeout(() => this.init(), 100);
    }

    init() {
        this.window = document.getElementById('ai-chat-window');
        this.trigger = document.getElementById('ai-buddy-trigger');
        this.messages = document.querySelector('#chat-messages'); // Flex container
        this.input = document.getElementById('ai-input');

        if (!this.window || !this.trigger) return;

        // Expose to global scope for HTML onclicks
        window.toggleChat = () => this.toggle();
        window.askAI = () => this.ask();

        // Enter key support
        if(this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.ask();
            });
        }

        // Deferred Appearance (Storytelling)
        // Wait 3 seconds to let the user settle in
        setTimeout(() => {
            this.trigger.classList.remove('opacity-0', 'translate-y-10');
            this.trigger.classList.add('opacity-100', 'translate-y-0');
        }, 3000);

        this.knowledge = {
            xp: "To grow in the Flow, earn Resonance (XP). Level 1 is Scout, Level 3 is Curator for the Museum. Keep moving!",
            level: "To grow in the Flow, earn Resonance (XP). Level 1 is Scout, Level 3 is Curator for the Museum. Keep moving!",
            yin: "In the heart of the beat, there is silence. In silence, the beat is born. Yin and Yang – find your balance.",
            yang: "In the heart of the beat, there is silence. In silence, the beat is born. Yin and Yang – find your balance.",
            balance: "Balance is the key to the Flow. Do not rush, do not stall. Just be.",
            museum: "The Museum is our hall of fame. You need Level 3 to enter. Show your artifacts to the community!",
            default: "I'm still learning the frequencies of this world. Ask me about Levels, the Museum, or for a quote of balance."
        };
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.window.classList.remove('hidden');
            // Small delay to allow display:flex to apply before opacity transition
            setTimeout(() => {
                this.window.classList.remove('opacity-0', 'translate-y-4', 'scale-95');
                this.window.classList.add('opacity-100', 'translate-y-0', 'scale-100');
                if(this.input) this.input.focus();
            }, 10);
        } else {
            this.window.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
            this.window.classList.add('opacity-0', 'translate-y-4', 'scale-95');
            setTimeout(() => {
                this.window.classList.add('hidden');
            }, 300); // Wait for transition
        }
    }

    async ask() {
        const query = this.input.value.trim().toLowerCase();
        if (!query) return;

        // Add User Message
        this.addMessage(this.input.value, 'user');
        this.input.value = "";

        // Show Typing Indicator
        const typingId = this.addTyping();

        // Simulate thinking delay
        setTimeout(() => {
            this.removeMessage(typingId);
            this.processQuery(query);
        }, 1200);
    }

    processQuery(query) {
        let response = this.knowledge.default;

        // Simple Keyword Matching
        if (query.includes('search') || query.includes('find') || query.includes('who is')) {
            response = `Let me check the global archives for '${query}'... <br><br><span class="text-[10px] text-blue-400 font-mono block animate-pulse">[WEB SEARCH SIMULATION: Accessing World Wide Web...]</span>`;
        } else {
            for (const key in this.knowledge) {
                if (query.includes(key)) {
                    response = this.knowledge[key];
                    break;
                }
            }
        }

        this.addMessage(response, 'bot');
    }

    addMessage(text, sender) {
        const div = document.createElement('div');
        if (sender === 'user') {
            div.className = "text-right text-blue-300 bg-white/5 p-3 rounded-lg ml-8 border border-white/5 text-xs";
        } else {
            div.className = "bg-purple-900/20 p-3 rounded-lg border border-purple-500/20 mr-4 text-gray-300 text-xs";
        }
        div.innerHTML = sender === 'bot' ? `🤖 ${text}` : text;
        this.messages.appendChild(div);
        this.scrollToBottom();
        return div.id;
    }

    addTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = "bg-purple-900/10 p-2 rounded-lg border border-purple-500/10 mr-12 w-fit";
        div.innerHTML = `<div class="flex gap-1"><div class="w-1 h-1 bg-white/50 rounded-full animate-bounce"></div><div class="w-1 h-1 bg-white/50 rounded-full animate-bounce delay-100"></div><div class="w-1 h-1 bg-white/50 rounded-full animate-bounce delay-200"></div></div>`;
        this.messages.appendChild(div);
        this.scrollToBottom();
        return id;
    }

    removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    scrollToBottom() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }
}

// Initialize on Message
document.addEventListener('DOMContentLoaded', () => {
    new FlowEE();
});
