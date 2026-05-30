// Flowee 2026 - Advanced AI Agent
// Features: State Awareness, DOM Manipulation, Agentic Action, RAG Integration

class FloweeAgent {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.initUI();
        this.scanContext();
    }

    initUI() {
        // Create Floating Flowee Orb
        const orb = document.createElement('div');
        orb.id = 'flowee-orb';
        orb.className = 'fixed bottom-6 right-6 w-16 h-16 rounded-full cursor-pointer z-[1000] shadow-[0_0_20px_rgba(212,175,55,0.6)] flex items-center justify-center transition-transform hover:scale-110';
        orb.style.background = 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)';
        orb.style.border = '2px solid #d4af37';
        orb.innerHTML = '<img src="/Assets/images/logo.png" alt="Flowee" class="w-10 h-10 object-contain animate-pulse">';
        orb.onclick = () => this.toggleChat();
        document.body.appendChild(orb);

        // Create Chat UI
        const chat = document.createElement('div');
        chat.id = 'flowee-chat-ui';
        chat.className = 'fixed bottom-24 right-6 w-80 h-[500px] max-h-[80vh] bg-black/95 backdrop-blur-xl border border-[#d4af37]/50 rounded-xl z-[1000] flex flex-col hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300';
        chat.innerHTML = `
            <div class="p-4 border-b border-[#d4af37]/30 flex justify-between items-center bg-gradient-to-r from-black to-[#1a1a1a]">
                <div class="flex items-center gap-2">
                    <img src="/Assets/images/logo.png" class="w-6 h-6 object-contain">
                    <span class="cinzel text-[#d4af37] font-bold text-lg">Flowee</span>
                    <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
                </div>
                <button id="flowee-close" class="text-gray-400 hover:text-white">&times;</button>
            </div>
            <div id="flowee-messages" class="flex-grow p-4 overflow-y-auto flex flex-col gap-3 font-mono text-xs">
                <!-- Messages -->
            </div>
            <div class="p-3 border-t border-[#d4af37]/30 bg-black/50">
                <form id="flowee-form" class="flex gap-2">
                    <input type="text" id="flowee-input" class="flex-grow bg-white/5 border border-[#d4af37]/30 rounded px-3 py-2 text-white focus:outline-none focus:border-[#d4af37] text-xs" placeholder="Ask Flowee...">
                    <button type="submit" class="bg-[#d4af37] text-black px-3 py-2 rounded font-bold hover:bg-white transition-colors"><span class="material-symbols-outlined text-[16px]">send</span></button>
                </form>
            </div>
        `;
        document.body.appendChild(chat);

        document.getElementById('flowee-close').onclick = () => this.toggleChat();
        document.getElementById('flowee-form').onsubmit = (e) => {
            e.preventDefault();
            this.handleUserInput();
        };

        this.addMessage("bot", "Willkommen im System 2026. Ich bin Flowee. Wie kann ich dir im Circle helfen?");
    }

    scanContext() {
        // Build state awareness
        const url = window.location.href;
        const pageTitle = document.title;
        const visibleElements = [];
        
        // Find important DOM elements
        document.querySelectorAll('h1, h2, h3, button, .dashboard-section').forEach(el => {
            if (el.innerText && el.innerText.trim() !== '') {
                visibleElements.push({
                    tag: el.tagName,
                    text: el.innerText.substring(0, 50).replace(/\n/g, ' '),
                    id: el.id || null
                });
            }
        });

        // User session from Supabase (if loaded)
        let userSession = "Not logged in";
        if (window.heartApp && window.heartApp.user) {
            userSession = window.heartApp.user;
        } else if (localStorage.getItem('cqr_lang')) {
            userSession = { language: localStorage.getItem('cqr_lang') };
        }

        this.contextState = {
            url: url,
            title: pageTitle,
            elements: visibleElements.slice(0, 15), // Send top 15 elements to avoid token limit
            session: userSession
        };
    }

    toggleChat() {
        const chat = document.getElementById('flowee-chat-ui');
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            chat.classList.remove('hidden');
            document.getElementById('flowee-input').focus();
            this.scanContext(); // Rescan when opened
        } else {
            chat.classList.add('hidden');
        }
    }

    addMessage(role, text) {
        const msgs = document.getElementById('flowee-messages');
        const div = document.createElement('div');
        div.className = `p-3 rounded-lg max-w-[85%] ${role === 'user' ? 'bg-[#d4af37]/20 text-white self-end border border-[#d4af37]/30' : 'bg-white/5 text-gray-300 self-start border border-white/10'}`;
        div.innerHTML = text;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }

    async handleUserInput() {
        const input = document.getElementById('flowee-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        this.addMessage('user', text);
        this.messages.push({ role: 'user', content: text });

        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        const msgs = document.getElementById('flowee-messages');
        const div = document.createElement('div');
        div.id = typingId;
        div.className = 'p-3 rounded-lg max-w-[85%] bg-white/5 text-gray-400 self-start border border-white/10 flex gap-1';
        div.innerHTML = '<div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div><div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div><div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>';
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;

        try {
            // Re-scan context right before sending
            this.scanContext();

            // Depending on env, call Vercel Serverless Function or use Local Mock for testing
            let botReply = "";
            const isLocalStatic = window.location.hostname === "localhost" || window.location.protocol === "file:";
            
            if (isLocalStatic && !window.ENV?.GEMINI_API_KEY) {
                // LOCAL MOCK RAG (No API Key available)
                botReply = this.localMockRAG(text);
                await new Promise(r => setTimeout(r, 1000)); // simulate delay
            } else {
                // REAL API CALL (Vercel Edge Function)
                const res = await fetch('/api/flowee', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: this.messages,
                        domState: this.contextState,
                        currentUrl: window.location.href,
                        userSession: this.contextState.session
                    })
                });
                
                if (!res.ok) {
                    throw new Error("Backend API Error");
                }
                const data = await res.json();
                botReply = data.reply;
            }

            document.getElementById(typingId).remove();
            
            // Parse Agentic Actions before displaying
            const cleanedText = this.parseActions(botReply);
            
            this.addMessage('bot', cleanedText);
            this.messages.push({ role: 'bot', content: botReply });

        } catch (error) {
            console.error("Flowee API Error, falling back to local:", error);
            const fallbackReply = this.localMockRAG(text);
            const cleanedText = this.parseActions(fallbackReply);
            document.getElementById(typingId).remove();
            this.addMessage('bot', `<span class="text-xs text-gray-500 italic mb-2 block">Offline Mode Active</span>` + cleanedText);
            this.messages.push({ role: 'bot', content: fallbackReply });
        }
    }

    localMockRAG(text) {
        const lower = text.toLowerCase();
        if (lower.includes("event") || lower.includes("jamsession")) {
            return "Klar, ich kann dir bei Events helfen. Soll ich dich zum Event-Bereich bringen und dir das Formular zeigen? [[SCROLLTO:#section-events-board]] [[HIGHLIGHT:#btn-create-event]]";
        }
        if (lower.includes("wer bin ich") || lower.includes("profil")) {
            return "Lass mich dein Profil öffnen. [[ACTION:OPEN_PROFILE]]";
        }
        if (lower.includes("luvo") || lower.includes("map")) {
            return "Hier sind die neuesten Luvo Maps. [[WIDGET:LUVO_MINI_MAP]]";
        }
        return "Ich verstehe. Als Flowee im lokalen Modus analysiere ich gerade die Seite: " + this.contextState.title + ". Wie kann ich dir hier weiterhelfen?";
    }

    parseActions(text) {
        let displayHtml = text;

        // 1. HIGHLIGHT: [[HIGHLIGHT:#id]]
        const highlightRegex = /\[\[HIGHLIGHT:(#[^\]]+)\]\]/g;
        let match;
        while ((match = highlightRegex.exec(text)) !== null) {
            const selector = match[1];
            const el = document.querySelector(selector);
            if (el) {
                el.style.transition = 'all 0.5s ease';
                const oldShadow = el.style.boxShadow;
                el.style.boxShadow = '0 0 30px #d4af37, inset 0 0 20px #d4af37';
                setTimeout(() => el.style.boxShadow = oldShadow, 3000);
            }
            displayHtml = displayHtml.replace(match[0], '');
        }

        // 2. SCROLLTO: [[SCROLLTO:#id]]
        const scrollRegex = /\[\[SCROLLTO:(#[^\]]+)\]\]/g;
        while ((match = scrollRegex.exec(text)) !== null) {
            const selector = match[1];
            const el = document.querySelector(selector);
            if (el) {
                // Find a trigger button to show the section if it's hidden (Heart World specific logic)
                if (selector.includes('events-board') && window.heartApp) {
                    window.heartApp.showSection('events-board');
                }
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
            displayHtml = displayHtml.replace(match[0], '');
        }

        // 3. ACTION: [[ACTION:name]]
        const actionRegex = /\[\[ACTION:([^\]]+)\]\]/g;
        while ((match = actionRegex.exec(text)) !== null) {
            const action = match[1];
            if (action === 'OPEN_PROFILE' && window.heartApp) {
                window.heartApp.toggleModal('profile-modal');
            } else if (action === 'CREATE_EVENT' && window.heartApp) {
                window.heartApp.showSection('events-board');
                window.heartApp.toggleModal('create-event-modal');
            }
            displayHtml = displayHtml.replace(match[0], '');
        }

        // 4. WIDGET: [[WIDGET:name]]
        const widgetRegex = /\[\[WIDGET:([^\]]+)\]\]/g;
        while ((match = widgetRegex.exec(text)) !== null) {
            const widgetType = match[1];
            if (widgetType === 'LUVO_MINI_MAP') {
                const widgetHtml = `
                    <div class="mt-2 p-2 bg-black border border-[#d4af37]/30 rounded">
                        <div class="text-[10px] text-[#d4af37] mb-1 cinzel">Luvo Radar</div>
                        <div class="w-full h-24 bg-[url('/Assets/images/logo.png')] bg-cover bg-center opacity-70 border border-white/10 relative">
                            <div class="absolute top-1/2 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            <div class="absolute top-1/3 right-1/3 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                        </div>
                        <button onclick="window.location.href='luvo.html'" class="w-full mt-2 bg-white/10 text-[10px] py-1 hover:bg-[#d4af37] hover:text-black transition-colors">Enter Luvo</button>
                    </div>
                `;
                displayHtml = displayHtml.replace(match[0], widgetHtml);
            } else {
                displayHtml = displayHtml.replace(match[0], '');
            }
        }

        // Format code blocks or markdown if needed
        displayHtml = displayHtml.replace(/\n/g, '<br>');

        return displayHtml;
    }
}

// Global Injector
document.addEventListener('DOMContentLoaded', () => {
    // Inject CSS for Material Symbols if missing
    if (!document.querySelector('link[href*="material-symbols"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
        document.head.appendChild(link);
    }

    // Initialize Flowee
    window.flowee = new FloweeAgent();
});
