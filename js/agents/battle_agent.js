/**
 * BattleAgent
 * Handles logic for the Battle Field section:
 * - Tournament Status Updates
 * - Moment Heroes Data
 * - Upload Portal Interactions
 */

class BattleAgent {
    constructor() {
        this.name = 'BattleAgent';
        this.data = {
            tournaments: [
                {
                    id: 't1',
                    name: 'Lisbon Cypher King',
                    status: 'LIVE',
                    phase: 'Top 16 Breakdown',
                    registrations: { current: 24, max: 32 },
                    color: 'red-500'
                },
                {
                    id: 't2',
                    name: 'Rap God Lyrical',
                    status: 'OPEN',
                    phase: 'Submissions Closing Soon',
                    registrations: { current: 12, max: 50 },
                    color: 'electric'
                }
            ],
            heroes: [
                { category: 'B-BOY', name: 'Kid Flow', img: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?q=80&w=1000&auto=format&fit=crop' },
                { category: 'LYRICS', name: 'MC Truth', img: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1000&auto=format&fit=crop' },
                { category: 'VISUAL', name: 'Vandal X', img: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=1000&auto=format&fit=crop' },
                { category: 'MIND', name: 'Sage One', quote: "The circle is not a shape, it's a movement." }
            ]
        };
        
        console.log(`[${this.name}] Initialized. Ready for combat.`);
        this.init();
    }

    init() {
        // Future: Fetch real data here
        // this.renderTournaments();
        // this.renderHeroes();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Upload Button Logic
        const uploadBtns = document.querySelectorAll('[data-action="upload-entry"]');
        uploadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleUploadClick();
            });
        });
    }

    handleUploadClick() {
        // Check Auth (Mock)
        const isLoggedIn = localStorage.getItem('cdf_user_role') !== 'visitor';
        
        if (!isLoggedIn) {
            alert('⛔ RESTRICTED AREA ⛔\n\nYou must be a Registered Agent to upload content.\nPlease Login or Join the Circle.');
            // Trigger Auth Lightbox via BridgePusher if available
            if (window.BridgePusher) {
                window.BridgePusher.showAuthLightbox();
            }
        } else {
            alert('🚀 UPLOAD_PORTAL_INIT 🚀\n\nGateway opening...\n(File Upload feature coming in next update)');
        }
    }

    // Mock method to simulate live updates
    refreshStatus() {
        console.log(`[${this.name}] Refreshing Battle Status...`);
        // Logic to update DOM elements
    }
}

// Attach to Window
window.BattleAgent = new BattleAgent();
