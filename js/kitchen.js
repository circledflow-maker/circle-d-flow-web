/**
 * Kitchen Manager Logic
 * Handles storage and retrieval of menu items for African Queen Kitchen.
 */

const KITCHEN_STORAGE_KEY = 'cdf_kitchen_menu';

const KitchenManager = {
    // Default Initial Menu
    defaultMenu: [
        {
            id: 'k1',
            name: 'Jollof Rice & Plantain',
            description: 'The classic West African favorite. Spicy rice with fried plantains.',
            price: '12.00',
            image: 'https://placehold.co/400x300/e6b800/1a1a1a?text=Jollof',
            category: 'Main'
        },
        {
            id: 'k2',
            name: 'Egusi Soup & Pounded Yam',
            description: 'Rich melon seed stew served with smooth pounded yam.',
            price: '15.00',
            image: 'https://placehold.co/400x300/e6b800/1a1a1a?text=Egusi',
            category: 'Main'
        },
        {
            id: 'k3',
            name: 'Puff Puff',
            description: 'Sweet fried dough balls. Perfect for snacking.',
            price: '4.00',
            image: 'https://placehold.co/400x300/e6b800/1a1a1a?text=Puff+Puff',
            category: 'Snack'
        }
    ],

    // Get All Dishes
    getMenu: function () {
        const stored = localStorage.getItem(KITCHEN_STORAGE_KEY);
        if (!stored) {
            // Initialize with default if empty
            localStorage.setItem(KITCHEN_STORAGE_KEY, JSON.stringify(this.defaultMenu));
            return this.defaultMenu;
        }
        return JSON.parse(stored);
    },

    // Add New Dish
    addDish: function (dish) {
        const menu = this.getMenu();
        const newDish = {
            id: 'k_' + Date.now(),
            ...dish
        };
        menu.unshift(newDish); // Add to top
        localStorage.setItem(KITCHEN_STORAGE_KEY, JSON.stringify(menu));
        return newDish;
    },

    // Render Menu to Container
    renderMenu: function (containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const menu = this.getMenu();
        container.innerHTML = menu.map(dish => `
            <div class="bg-black/40 border border-[#FFD700]/20 rounded-xl overflow-hidden hover:border-[#FFD700]/50 transition-all group">
                <div class="h-48 overflow-hidden relative">
                    <img src="${dish.image}" alt="${dish.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute top-2 right-2 bg-black/80 text-[#FFD700] px-2 py-1 text-xs font-bold rounded uppercase">
                        ${dish.category || 'Special'}
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2 gap-2">
                        <h3 class="text-xl font-bold text-white leading-tight">${dish.name}</h3>
                        <span class="text-[#FFD700] font-bold whitespace-nowrap">${dish.price}€</span>
                    </div>
                    <p class="text-white/70 text-sm mb-4 line-clamp-2">${dish.description}</p>
                    <button class="w-full py-2 bg-[#FFD700]/10 hover:bg-[#FFD700] text-[#FFD700] hover:text-black font-bold uppercase text-xs tracking-widest rounded transition-colors"
                            onclick="alert('Order feature coming soon!')">
                        Order Now
                    </button>
                </div>
            </div>
        `).join('');
    }
};

// Auto-render if on Kitchen page
if (document.getElementById('kitchen-menu-grid')) {
    KitchenManager.renderMenu('kitchen-menu-grid');
}
