/**
 * Agent: LibraryAgent (The Librarian)
 * Purpose: Manages the D Bibliothec Knowledge Base, Search, and Codex "Brain".
 */

class LibraryAgent {
    constructor() {
        this.name = "Librarian";
        this.ledgerKey = "cdf_ledger";
        
        // THE KNOWLEDGE BASE (Categorized Books)
        this.knowledgeBase = [
            { 
                id: 'sys_core', 
                title: 'The Core System', 
                category: 'Architecture', 
                keywords: ['system', 'core', 'architecture', 'brain', 'main'],
                content: `
                    <h2>The Circle D Flow Core</h2>
                    <p>The system is built upon the <strong>Three Pillars of Flow</strong>: Vision, Sound, and Code.</p>
                    <p>At its center lies the <strong>Master Node</strong>, an infinite loop of data that connects every Vessel (User) to the source.</p>
                    <hr>
                    <p><em>"Code is not just syntax; it is the rhythm of the digital soul."</em></p>
                `
            },
            { 
                id: 'sys_agents', 
                title: 'The Agent Mesh', 
                category: 'Manual', 
                keywords: ['agent', 'helper', 'pusher', 'flowee', 'bot', 'ai'],
                content: `
                    <h2>The Agent Mesh</h2>
                    <p>We do not rely on static pages. We rely on <strong>Living Agents</strong>.</p>
                    <ul>
                        <li><strong>Flowee:</strong> The Guide and Navigator.</li>
                        <li><strong>Pusher:</strong> The Voice (Notifications).</li>
                        <li><strong>Helper:</strong> The Mechanic (Glitch Repair).</li>
                        <li><strong>Librarian:</strong> The Keeper of Memory.</li>
                    </ul>
                `
            },
            { 
                id: 'lore_origin', 
                title: 'Origin of the Circle', 
                category: 'Lore', 
                keywords: ['origin', 'history', 'story', 'begin', 'start'],
                content: `
                    <h2>The First Spark</h2>
                    <p>In the year 2024, the frequency was discovered. It wasn't a sound, but a <em>feeling</em>.</p>
                    <p>The Founders realized that by aligning their purpose, they could bend reality itself. Thus, the Circle was drawn.</p>
                `
            },
            { 
                id: 'guide_flow', 
                title: 'Mastering Flow', 
                category: 'Guide', 
                keywords: ['flow', 'guide', 'howto', 'help', 'tutorial'],
                content: `
                    <h2>Entering the Flow State</h2>
                    <p>1. <strong>Clear the Mind:</strong> Let go of the static.</p>
                    <p>2. <strong>Focus the Intent:</strong> Choose your daily Quest.</p>
                    <p>3. <strong>Engage:</strong> Do not hesitate. Action creates momentum.</p>
                `
            },
            { 
                id: 'sys_ladder', 
                title: 'The Tower of Sovereigns', 
                category: 'Ladder', 
                keywords: ['ladder', 'rank', 'tower', 'level', 'xp'],
                content: `
                    <h2>The Tower</h2>
                    <p>A meritocratic hierarchy where Haki (Willpower) determines your standing.</p>
                    <p>Only the Top 3 may ascend to the <strong>Golden Floor</strong> and influence the system's future.</p>
                `
            },
            { 
                id: 'sys_codex', 
                title: 'The Codex', 
                category: 'Archive', 
                keywords: ['codex', 'book', 'chronicle', 'log', 'record'],
                content: `
                    <h2>The Codex</h2>
                    <p>The <strong>Scriptorium</strong> of the Circle. It records every pulse, every signal, and every flow state achieved.</p>
                    <p>To view the full visual history, <a href='codex.html' style='color:#d4af37; text-decoration:underline;'>Enter the Scriptorium</a>.</p>
                `
            },
            {
                id: 'lore_community',
                title: 'The Way of the Circle',
                category: 'Manifesto',
                keywords: ['community', 'style', 'vibes', 'culture', 'ethos', 'family'],
                content: `
                    <h2>Our Frequency</h2>
                    <p>We are not just a network; we are a <strong>Resonance</strong>. A collection of artists, warriors, and visionaries bound by the Flow.</p>
                    <hr>
                    <h3>The Code</h3>
                    <ul>
                        <li><strong>Authenticity:</strong> Wear no mask but the one you craft.</li>
                        <li><strong>Sovereignty:</strong> Own your data, own your art, own your soul.</li>
                        <li><strong>Haki:</strong> Willpower is the currency of the brave.</li>
                    </ul>
                    <p><em>"In the Circle, no one stands alone. We flow together."</em></p>
                `
            }
        ];

        this.init();
    }

    init() {
        console.log(`[${this.name}] Knowledge Base Loaded: ${this.knowledgeBase.length} Volumes.`);
        this.injectReaderStyles();
        // glossary styles moved to HTML
    }

    getGlossaryTerms() {
        const terms = [];
        this.knowledgeBase.forEach(book => {
            terms.push({ type: 'book', label: book.title, id: book.id });
            book.keywords.forEach(k => {
                if(!terms.some(t => t.label === k)) {
                    terms.push({ type: 'keyword', label: k, id: book.id });
                }
            });
        });
        return terms.sort((a,b) => a.label.localeCompare(b.label));
    }

    openGlossary() {
        const overlay = document.getElementById('glossary-book');
        const list = document.getElementById('glossary-list');
        
        if(overlay && list) {
            const terms = this.getGlossaryTerms();
            list.innerHTML = terms.map(t => `
                <div class="glossary-item" onclick="window.LibraryAgent.handleGlossaryClick('${t.id}')">
                    <span class="type-icon">${t.type === 'book' ? '📖' : '🔑'}</span>
                    <span class="term-label">${t.label}</span>
                </div>
            `).join('');
            
            overlay.classList.add('active');
        }
    }

    handleGlossaryClick(bookId) {
        console.log(`[${this.name}] Glossary Item Clicked: ${bookId}`);
        this.closeGlossary();
        setTimeout(() => {
            this.openBook(bookId);
        }, 500);
    }

    closeGlossary() {
        console.log(`[${this.name}] Closing Glossary...`);
        const overlay = document.getElementById('glossary-book');
        if(overlay) {
            overlay.classList.remove('active');
            console.log("Glossary overlay class removed.");
        } else {
            console.warn("Glossary overlay not found!");
        }
    }

    search(query) {
        if(!query) return [];
        const q = query.toLowerCase();
        this.logToCodex('Search', `User sought knowledge: "${query}"`);
        return this.knowledgeBase.filter(book => 
            book.title.toLowerCase().includes(q) || 
            book.keywords.some(k => k.includes(q))
        );
    }

    openBook(bookId) {
        const book = this.knowledgeBase.find(b => b.id === bookId);
        if(!book) return;
        console.log(`[${this.name}] Opening Tome: ${book.title}`);
        
        const overlay = document.getElementById('pergament-reader');
        const content = document.getElementById('reader-content');
        
        if(overlay && content) {
            content.innerHTML = `
                <div class="pergament-header">
                    <span class="category-tag">${book.category || 'Tome'}</span>
                    <h1>${book.title}</h1>
                </div>
                <div class="pergament-body">
                    ${book.content}
                </div>
                <div class="pergament-footer">
                    <span>Index: ${book.id.toUpperCase()}</span>
                </div>
            `;
            overlay.classList.add('active');
            this.logToCodex('Study', `Read the tome: ${book.title}`);
        }
    }

    closeReader() {
        const overlay = document.getElementById('pergament-reader');
        if(overlay) overlay.classList.remove('active');
    }

    logToCodex(type, title) {
        const entry = {
            title: title,
            type: type,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now()
        };
        const currentLedger = JSON.parse(localStorage.getItem(this.ledgerKey) || '[]');
        const exists = currentLedger.some(e => e.title === title && e.timestamp > Date.now() - 60000);
        if(exists) return;

        currentLedger.unshift(entry);
        if(currentLedger.length > 50) currentLedger.pop();
        localStorage.setItem(this.ledgerKey, JSON.stringify(currentLedger));
        
        if(window.Pusher) window.Pusher.showToast(`Codex Updated: ${type}`, 'info');
    }

    injectReaderStyles() {
         // Styles are now mostly in HTML, but keeping this hook if needed for future
    }
}

// Global
window.LibraryAgent = new LibraryAgent();
