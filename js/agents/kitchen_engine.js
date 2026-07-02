/**
 * Kitchen Engine — load kitchens/menus/orders from Supabase with local fallback
 */
class KitchenEngine {
    constructor() {
        this.kitchen = null;
        this.menu = [];
        this.cart = JSON.parse(localStorage.getItem('cdf_kitchen_cart') || '[]');
        window.KitchenEngine = this;
    }

    async load(slug) {
        const fallback = window.AKWABA_KITCHEN;
        if (!window.supabaseClient) {
            this.kitchen = fallback;
            this.menu = fallback.menu || [];
            return this;
        }
        try {
            const { data: k, error } = await window.supabaseClient
                .from('kitchens').select('*').eq('slug', slug || 'akwabalx').eq('is_live', true).maybeSingle();
            if (!error && k) {
                this.kitchen = k;
                const { data: items } = await window.supabaseClient
                    .from('kitchen_menu_items').select('*').eq('kitchen_id', k.id).eq('is_available', true).order('sort_order');
                this.menu = (items || []).map((i) => ({
                    id: i.id,
                    name: i.name,
                    description: i.description,
                    category: i.category,
                    price_eur: parseFloat(i.price_eur),
                    image: i.image_url,
                }));
                return this;
            }
        } catch (e) {
            console.warn('[KitchenEngine]', e.message);
        }
        this.kitchen = fallback;
        this.menu = fallback.menu || [];
        return this;
    }

    addToCart(itemId) {
        const item = this.menu.find((m) => m.id === itemId);
        if (!item) return;
        this.cart.push({ ...item, qty: 1, at: Date.now() });
        localStorage.setItem('cdf_kitchen_cart', JSON.stringify(this.cart));
        window.dispatchEvent(new CustomEvent('KITCHEN_CART_UPDATED'));
        if (window.FloweeReward) window.FloweeReward.xpToast(`Added ${item.name} to pickup cart`, 5);
    }

    cartTotal() {
        return this.cart.reduce((s, i) => s + (i.price_eur || 0) * (i.qty || 1), 0);
    }

    clearCart() {
        this.cart = [];
        localStorage.removeItem('cdf_kitchen_cart');
        window.dispatchEvent(new CustomEvent('KITCHEN_CART_UPDATED'));
    }

    async placeOrder(pickupNote) {
        if (!this.cart.length) return null;
        const payload = {
            kitchen_id: this.kitchen.id,
            items: this.cart,
            total_eur: this.cartTotal(),
            pickup_note: pickupNote || '',
            status: 'pending',
            payment_status: 'unpaid',
        };
        if (window.supabaseClient) {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                payload.customer_id = user.id;
                const { data, error } = await window.supabaseClient.from('kitchen_orders').insert([payload]).select().single();
                if (!error && data) {
                    this.clearCart();
                    if (window.QuestEngine) {
                        await window.QuestEngine.grantReward('LQ-008', 100, 'Kitchen Heart');
                        await window.QuestEngine.fulfillTasteQuest('LQ-T02');
                    }
                    if (window.FloweeReward) await window.FloweeReward.celebrate(`Order sent to ${this.kitchen.name}! Pick up at the bar when status is READY.`, 'celebrate');
                    return data;
                }
            }
        }
        localStorage.setItem('cdf_pending_pickup', JSON.stringify({ ...payload, at: Date.now() }));
        this.clearCart();
        if (window.QuestEngine) await window.QuestEngine.fulfillTasteQuest('LQ-T02');
        if (window.FloweeReward) await window.FloweeReward.celebrate('Pickup request saved. Pay at the Akwaba bar when you arrive.', 'guide');
        return payload;
    }

    isOwner() {
        return this.kitchen?.owner_user_id && window.QuestEngine?.user?.id === this.kitchen.owner_user_id;
    }
}

document.addEventListener('DOMContentLoaded', () => { new KitchenEngine(); });
