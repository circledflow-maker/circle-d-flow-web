/**
 * The Sous-Chef Agent
 * -------------------
 * Role: Order Manager & Menu Curator
 * Goal: Manage the kitchen's inventory, process orders, and enforce Royal Decrees.
 */

window.SousChef = {
    name: "The Sous-Chef",
    menuDB: [
        {
            id: "jollof",
            name: "Jollof Rice (The Classic)",
            price: 12,
            type: "Main",
            image: "https://placehold.co/400x300/1A1622/FFBF00?text=Jollof+Rice",
            desc: "Smoky, spicy, and soulful. Served with plantains.",
            xp: 50
        },
        {
            id: "tilapia",
            name: "Grilled Tilapia",
            price: 15,
            type: "Main",
            image: "https://placehold.co/400x300/1A1622/FFBF00?text=Tilapia",
            desc: "Fresh river fish marinated in secret spices.",
            xp: 65
        },
        {
            id: "cachupa",
            name: "Cachupa Royal",
            price: 14,
            type: "Main",
            image: "https://placehold.co/400x300/1A1622/FFBF00?text=Cachupa",
            desc: "Slow-cooked stew of corn, beans, and meat.",
            xp: 60
        },
        {
            id: "moamba",
            name: "Moamba de Galinha",
            price: 13,
            type: "Main",
            image: "https://placehold.co/400x300/1A1622/FFBF00?text=Moamba",
            desc: "Chicken stew in rich palm nut sauce.",
            xp: 55
        },
        {
            id: "plantain",
            name: "Fried Plantain",
            price: 5,
            type: "Side",
            image: "https://placehold.co/400x300/1A1622/FFBF00?text=Plantains",
            desc: "Sweet, golden, and crispy.",
            xp: 20
        },
        {
            id: "bissap",
            name: "Bissap Juice",
            price: 3,
            type: "Drink",
            image: "https://placehold.co/400x300/1A1622/FFBF00?text=Bissap",
            desc: "Refreshing hibiscus flower drink.",
            xp: 15
        }
    ],

    init() {
        console.log(`[${this.name}] Entering the kitchen...`);
        this.renderMenu();
        this.checkRoyalDecree();
        this.initStats(); // Initialize Stat Tracking
    },

    initStats() {
        if(!localStorage.getItem('kyh_kitchen_stats')) {
            localStorage.setItem('kyh_kitchen_stats', JSON.stringify({
                orders: 42,
                truck_progress: 15,
                daily_goal: 100
            }));
        }
    },

    // ... (checkRoyalDecree and renderMenu remain same)

    addToCart(id) {
        // ... (existing logs)
        console.log(`[${this.name}] Added ${id} to cart.`);
        
        // Update Stats
        const stats = JSON.parse(localStorage.getItem('kyh_kitchen_stats'));
        stats.orders++;
        stats.truck_progress += 1; // Simulation
        localStorage.setItem('kyh_kitchen_stats', JSON.stringify(stats));
        
        // Visual Feedback
        const card = document.getElementById(`dish-${id}`);
        // ... (rest of visual feedback)
        const btn = card.querySelector('button');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span> Adding...';
        btn.classList.add('bg-amber', 'text-black');
        
        setTimeout(() => {
            btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Added';
            
            // Trigger Supply Helper (Simulated)
            if(window.SupplyHelper) window.SupplyHelper.updateProgress(1); // Small bump
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('bg-amber', 'text-black');
            }, 1000);
        }, 800);
        
        // Update Floating Cart Counter (Simulated)
        const counter = document.getElementById('cart-count');
        if(counter) {
            counter.classList.remove('hidden');
            counter.innerText = parseInt(counter.innerText || 0) + 1;
        }
    },

    giftMeal(id) {
        alert("Karma-Gold: You've gifted a meal! (Simulation: +10 Karma added)");
        if(window.SupplyHelper) window.SupplyHelper.updateProgress(5); // Big bump
    },

    voteDish(id) {
        alert("Vote Cast! Your opinion shapes the menu.");
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    window.SousChef.init();
});
