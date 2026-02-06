/**
 * THE MERCHANT AGENT (Keeper of the Golden Vault)
 * Orchestrates the Bazaar Crew:
 * - The Auctioneer (Bids)
 * - The Market Barker (Hype)
 * - The Sentry (Security)
 * - Flowee (Guide)
 */
class MerchantAgent {
    constructor() {
        this.listings = [];
        this.blacklist = ['Scam_Artist_99', 'Ghost_Buyer_X'];
        this.auctionEnds = this.getNextAuctionEnd();
        this.currentBid = 5000; // Mock current high bid
        
        // Mock Creator Profiles
        this.creators = {
            'Sage_Nova': { class: 'Visionary', quote: "Seeing beyond the veil.", origin: "LX Factory", avatar: '🎨', achievement: 'Won Design Duel #42' },
            'Killa_Beat': { class: 'Sound-Smith', quote: "Rhythms from the underground.", origin: "Bairro Alto", avatar: '🎧', achievement: 'Dropped New EP' },
            'African_Queen': { class: 'Alchemist', quote: "Taste the soul of the earth.", origin: "Mouraria", avatar: '🍲', achievement: 'Fed 500 Souls' }
        };

        this.init();
    }

    init() {
        console.log("🦅 [Merchant] The Crew is assembled.");
        // Take control of Flowee
        window.suppressFloweeDefault = true;

        this.loadListings();
        this.checkTime(); 
        this.renderStreet();
        this.initAuction();
        this.renderAuctionTimer();
        this.renderBlacklist();

        // Narrative: The Grand Entrance
        setTimeout(() => this.triggerFloweeEntrance(), 500); // Faster trigger

        // Periodic Checks
        setInterval(() => this.checkTime(), 60000); 
        setInterval(() => this.renderAuctionTimer(), 1000);
        
        // Market Barker: Random FOMO updates
        setInterval(() => this.triggerMarketBarker(), 45000); 
    }

    checkTime() {
        const hour = new Date().getHours(); 
        const body = document.body;
        // Mock Time for testing if needed, otherwise real time
        const isNight = hour >= 18 || hour < 8; 

        if (isNight) {
            if (!body.classList.contains('night-market')) {
                body.classList.add('night-market');
                body.classList.remove('day-market');
                console.log("[Merchant] Night Market Active 🌙");
            }
        } else {
            if (!body.classList.contains('day-market')) {
                body.classList.add('day-market');
                body.classList.remove('night-market');
                console.log("[Merchant] Day Market Active ☀️");
            }
        }
    }

    startProximityLoop() {
        const wrapper = document.getElementById('street-wrapper');
        if (!wrapper) return;

        const checkProximity = () => {
            const center = wrapper.scrollLeft + (wrapper.clientWidth / 2);
            const stalls = document.querySelectorAll('.stall-wrapper');
            
            stalls.forEach(stall => {
                const rect = stall.offsetLeft + (stall.offsetWidth / 2);
                const dist = Math.abs(center - rect);
                const maxDist = 200; // Activation range

                if (dist < maxDist) {
                    // In Focus
                    const scale = 1 + (0.1 * (1 - dist/maxDist)); // Smooth scale up to 1.1
                    stall.style.transform = `scale(${scale})`;
                    stall.style.zIndex = "40";
                    stall.style.filter = "brightness(1.2)";
                    stall.querySelector('.stall-structure')?.classList.add('ring-2', 'ring-amber-500');
                    
                    // Optional: Flowee comment on focus (throttled)
                    // if(Math.random() > 0.99) window.Flowee.talk(false, "Ooh, look at this one!");
                } else {
                    // Out of Focus
                    stall.style.transform = `scale(0.9)`;
                    stall.style.zIndex = "10";
                    stall.style.filter = "brightness(0.7)";
                    stall.querySelector('.stall-structure')?.classList.remove('ring-2', 'ring-amber-500');
                }
            });

            requestAnimationFrame(checkProximity);
        };
        
        requestAnimationFrame(checkProximity);
    }

    loadListings() {
        // ... (Keep existing loading logic)
        const local = JSON.parse(localStorage.getItem('cdf_listings') || '[]');
        const system = [
            { id: 'sys_1', title: 'Golden Beat Pack', price: 500, desc: 'Lo-Fi beats for deep flow states.', owner: 'Killa_Beat', image: '../Assets/images/logo.png', type: 'direct' },
            { id: 'sys_2', title: 'Graffiti Blueprint', price: 300, desc: 'Digital mural design.', owner: 'Sage_Nova', image: '../Assets/images/logo.png', type: 'direct' },
            { id: 'sys_3', title: 'Spicy Yassa Sauce', price: 150, desc: 'A jar of pure fire.', owner: 'African_Queen', image: '../Assets/images/logo.png', type: 'direct' }
        ];
        this.listings = [...local, ...system];
    }

    renderStreet() {
        const street = document.getElementById('street-container');
        if (!street) return;

        let streetContent = '';
        streetContent += this.createBulletinBoard();
        streetContent += this.listings.map(item => this.createStall(item)).join('');
        streetContent += this.createMysteryMerchant(); 
        street.innerHTML = streetContent;
        
        this.plantHiddenTreasure(street);
    }

    // --- Visual Components and Buttons ---

    createStall(item) {
        const creator = this.creators[item.owner] || { class: 'Unknown', bg: 'bg-gray-800', avatar: '👤', achievement: 'User' };
        const isOutlaw = this.blacklist.includes(item.owner);
        
        let glowColor = 'white';
        if (creator.class === 'Sound-Smith') glowColor = 'purple-500';
        if (creator.class === 'Alchemist') glowColor = 'amber-500';
        if (creator.class === 'Visionary') glowColor = 'cyan-500';

        let stallStyle = `border-${glowColor}/30 bg-${glowColor}/10`;
        if (isOutlaw) stallStyle = 'border-red-600 grayscale';

        return `
            <div class="stall-wrapper group relative flex-shrink-0 w-[400px] h-[500px] mx-4 snap-center transition-all duration-500 perspective-1000"
                 onmouseenter="window.Merchant.wakeStall(this)" onmouseleave="window.Merchant.sleepStall(this)">
                
                <!-- Avatar (The Face) -->
                <div class="absolute -left-12 bottom-0 z-30 w-32 h-64 flex flex-col items-center justify-end transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-4">
                    <div class="text-6xl filter drop-shadow-lg cursor-pointer transform transition-transform group-hover:rotate-12" 
                         onclick="window.Merchant.showCreatorCard('${item.owner}')">
                        ${creator.avatar}
                    </div>
                    <!-- Report Shadow Button (The Sentry) -->
                    <button onclick="window.Merchant.triggerSentry('${item.owner}')" 
                        class="mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-900/90 text-white hover:text-red-300 text-[8px] px-3 py-1 rounded-full border border-red-500/50 hover:bg-black uppercase tracking-widest backdrop-blur-md shadow-lg transform translate-y-2 group-hover:translate-y-0 duration-300">
                        <span class="material-symbols-outlined text-[10px] align-middle mr-1">report</span>Report Shadow
                    </button>
                </div>

                <!-- Stall Structure -->
                <div class="stall-structure relative w-full h-full rounded-3xl border-2 ${stallStyle} backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                    
                    <!-- Wake Up Light -->
                    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 bg-${glowColor} blur-[100px] transition-all duration-700 group-hover:w-full group-hover:h-full opacity-0 group-hover:opacity-20 pointer-events-none"></div>

                    <!-- Image & Trust Widget -->
                    <div class="h-64 bg-black/50 relative overflow-hidden group-hover:sepia-0 transition-all">
                        <img src="${item.image}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity">
                        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/90"></div>
                        
                        <!-- Trust Widget (Karma/Aura) -->
                        <div class="absolute top-4 right-4 cursor-pointer" onclick="window.Merchant.explainTrust('${item.owner}')">
                            <div class="w-8 h-8 rounded-full bg-black/80 border border-amber-400 flex items-center justify-center text-xs hover:scale-125 transition-transform shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                                🛡️
                            </div>
                        </div>
                    </div>

                    <!-- Info & Action -->
                    <div class="p-6 relative z-10">
                        <div class="flex justify-between items-start mb-2">
                             <h3 class="text-3xl font-serif font-bold text-white leading-none">${item.title}</h3>
                             <div class="text-xs font-mono text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded">${item.price} Flow</div>
                        </div>
                        <p class="text-white/60 text-xs font-mono mb-6 neon-text">${creator.class} Class</p>
                        
                        ${isOutlaw ? 
                            `<button class="w-full py-4 bg-red-900/50 text-red-500 font-bold uppercase tracking-widest border border-red-500 cursor-not-allowed flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined">block</span> BLOCKED BY SENTINEL
                             </button>` 
                            : 
                            `<div class="space-y-2">
                                <button onclick="window.Merchant.startHaggling(this, '${item.title}', '${item.owner}')" 
                                    class="w-full py-3 bg-white/5 hover:bg-${glowColor} hover:text-black hover:border-transparent border border-white/20 font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined">send</span> Initiate Trade
                                </button>
                                <button onclick="window.Merchant.showCreatorCard('${item.owner}')" 
                                    class="w-full py-2 bg-transparent text-white/50 hover:text-white text-[10px] uppercase tracking-widest transition-all">
                                    View Legacy
                                </button>
                             </div>`
                        }
                    </div>

                    <!-- Sheriff Overlay (If Outlaw) -->
                    ${isOutlaw ? `
                        <div class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 pointer-events-none">
                            <div class="text-6xl animate-pulse">🦅</div>
                            <h2 class="text-red-500 font-bold text-xl uppercase tracking-widest mt-4">SENTINEL BLOCK</h2>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createMysteryMerchant() {
        // The Auctioneer's Spot
        return `
            <div class="stall-wrapper flex-shrink-0 w-[400px] h-[500px] mx-4 snap-center flex items-center text-center">
                <div class="w-full h-[90%] rounded-3xl border-2 border-dashed border-purple-500/50 bg-black/80 flex flex-col items-center justify-center p-8 text-center shadow-[0_0_50px_rgba(147,51,234,0.3)] relative overflow-hidden group">
                     <!-- Auctioneer Visual -->
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
                    
                    <div class="text-6xl mb-4 animate-spin-slow">⏳</div>
                    <h3 class="text-3xl font-serif font-bold text-purple-400 mb-2">Hunter Auction</h3>
                    <p class="text-white/70 italic text-sm mb-6">"Current High Bid: <span class="text-amber-400 font-mono text-lg">${this.currentBid} Flow</span>"</p>
                    
                    <button onclick="window.Merchant.placeBid()" 
                        class="px-8 py-4 bg-gradient-to-r from-purple-600 to-electric text-white font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-lg animate-pulse" id="btn-auction-bid">
                        <span class="material-symbols-outlined align-middle mr-2">gavel</span> Place Bid (+500)
                    </button>
                    
                    <p class="text-[10px] text-white/30 mt-4 uppercase tracking-widest">Validated by The Auctioneer</p>
                </div>
            </div>`;
    }
    
    createBulletinBoard() {
        // Keep existing logic
        return `<div class="stall-wrapper flex-shrink-0 w-[300px] h-[500px] mx-4 snap-center flex items-center justify-center">
                 <div class="bg-[#1a1a1a] border-y-8 border-amber-800 p-6 shadow-2xl transform -rotate-1 hover:rotate-0 transition-transform w-full">
                     <h3 class="text-center font-serif text-2xl text-amber-500 mb-4 border-b border-white/10 pb-2">Kingdom Pulse</h3>
                     <div class="space-y-4 text-xs font-mono text-white/70" id="bulletin-content">
                         <div class="bg-black/50 p-2 border-l-2 border-green-500">"Looking for Beats!"</div>
                         <div class="bg-black/50 p-2 border-l-2 border-purple-500">"Lost my Mic in the Arena..."</div>
                     </div>
                 </div>
                </div>`;
    }

    // --- AGENT ACTIONS ---

    // 1. The Auctioneer
    // 1. The Auctioneer
    // --- TRANSACTION SYSTEM ---
    
    buyItem(id, title, price, seller) {
        if (!window.Gamification) return;

        // 1. Check Funds
        if (!window.Gamification.spendTokens(price, `Bought ${title}`)) {
            alert("Insufficient Flow Tokens!");
            return;
        }

        // 2. Process Transfer
        this.recordTransaction(title, price, seller, 'Flow');
        
        // 3. Remove from Market (simulated for System items, real for User items)
        this.removeFromMarket(id);

        // 4. Add to Inventory
        this.addToInventory({ id, title, price, seller, date: new Date().toISOString() });

        // 5. Visual Feedback
        if(window.Flowee) window.Flowee.talk(true, `SOLD! ${title} is yours, Captain!`);
        this.triggerMarketBarker(`JUST SOLD: ${title} for ${price} Flow!`);
        
        // 6. Notification
        if(window.Notifications) window.Notifications.send('success', `Purchased ${title} from ${seller}`, 'user');
        
        // 7. Success Modal
        const successModal = document.getElementById('success-modal');
        if(successModal) {
            document.getElementById('success-item-name').innerText = title;
            document.getElementById('success-price').innerText = `${price} Flow`;
            successModal.showModal();
        } else {
             // Fallback
             setTimeout(() => location.reload(), 1500);
        }
    }

    recordTransaction(item, amount, seller, currency) {
        const ledger = JSON.parse(localStorage.getItem('cdf_ledger') || '[]');
        ledger.push({
            id: 'tx_' + Date.now(),
            item, amount, seller, currency,
            buyer: 'User',
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('cdf_ledger', JSON.stringify(ledger));
    }

    removeFromMarket(id) {
        let listings = JSON.parse(localStorage.getItem('cdf_listings') || '[]');
        const originalLen = listings.length;
        listings = listings.filter(i => i.id !== id);
        
        if (listings.length < originalLen) {
             localStorage.setItem('cdf_listings', JSON.stringify(listings));
             console.log(`[Merchant] Item ${id} removed from listings.`);
        }
    }

    addToInventory(item) {
        const inv = JSON.parse(localStorage.getItem('cdf_inventory') || '[]');
        inv.push(item);
        localStorage.setItem('cdf_inventory', JSON.stringify(inv));
    }

    // --- AUCTION LOGIC (Persisted) ---

    initAuction() {
        const saved = JSON.parse(localStorage.getItem('cdf_auction_state') || '{}');
        this.currentBid = saved.bid || 5000;
        this.highBidder = saved.bidder || 'System_Ghost';
        
        // Render initial state
        const timer = document.getElementById('auction-timer');
        if(timer && saved.bid) {
             // Logic to update UI immediately if elements exist
        }
    }

    placeBid() {
        this.currentBid += 500;
        this.highBidder = 'User';
        
        // Persist
        localStorage.setItem('cdf_auction_state', JSON.stringify({
            bid: this.currentBid,
            bidder: this.highBidder,
            timestamp: new Date().toISOString()
        }));
        
        // Visuals
        const stalls = document.querySelectorAll('.stall-wrapper');
        stalls.forEach(stall => { 
            if(stall.innerHTML.includes('Hunter Auction')) {
                const priceTag = stall.querySelector('.text-amber-400');
                if(priceTag) {
                    priceTag.innerText = `${this.currentBid} Flow`;
                    priceTag.closest('p').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], 300);
                }
            }
        });

        if(window.Flowee) {
             window.Flowee.talk(true, `BID ACCEPTED! ${this.currentBid} Flow! You are the Apex Predator now!`);
             window.Flowee.flyTo('.stall-wrapper');
        }
        
        if(window.Gamification) window.Gamification.addXP(20, 'Placed Bid');
        this.triggerMarketBarker(`New High Bid: ${this.currentBid} Flow by The User!`);
    }

    // --- Utilities ---
    wakeStall(stallEl) { stallEl.style.zIndex = "50"; }
    sleepStall(stallEl) { stallEl.style.zIndex = "10"; }
    plantHiddenTreasure(c) { /* ... */ }
    getNextAuctionEnd() { const d = new Date(); d.setDate(d.getDate() + (7-d.getDay())%7); d.setHours(23,59,59,0); return d; }
    renderAuctionTimer() { /* ... */ }
    renderBlacklist() { /* ... */ }
}

window.Merchant = new MerchantAgent();
