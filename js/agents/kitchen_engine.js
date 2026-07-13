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

    mapMenuItems(items) {
        return (items || [])
            .filter((i) => i.is_available !== false && !i._deleted)
            .map((i) => ({
                id: i.id,
                name: i.name,
                description: i.description,
                category: i.category,
                price_eur: parseFloat(i.price_eur),
                image: i.image_url || i.image,
                sort_order: i.sort_order,
            }));
    }

    async load(slug) {
        const kitchenSlug = slug || 'akwabalx';
        const fallback = window.AKWABA_KITCHEN;
        const normalize = (k) => (window.KitchenStore ? window.KitchenStore.normalizeKitchen(k, kitchenSlug) : k);

        if (!window.supabaseClient) {
            this.kitchen = normalize(fallback);
            const merged = window.KitchenStore
                ? window.KitchenStore.mergeMenu(fallback.menu || [], kitchenSlug)
                : (fallback.menu || []);
            this.menu = this.mapMenuItems(merged);
            return this;
        }
        try {
            const { data: k, error } = await window.supabaseClient
                .from('kitchens').select('*').eq('slug', kitchenSlug).eq('is_live', true).maybeSingle();
            if (!error && k) {
                this.kitchen = normalize(k);
                const { data: items } = await window.supabaseClient
                    .from('kitchen_menu_items').select('*').eq('kitchen_id', k.id).order('sort_order');
                const merged = window.KitchenStore
                    ? window.KitchenStore.mergeMenu(items || [], kitchenSlug)
                    : (items || []);
                this.menu = this.mapMenuItems(merged);
                return this;
            }
        } catch (e) {
            console.warn('[KitchenEngine]', e.message);
        }
        this.kitchen = normalize(fallback);
        const merged = window.KitchenStore
            ? window.KitchenStore.mergeMenu(fallback.menu || [], kitchenSlug)
            : (fallback.menu || []);
        this.menu = this.mapMenuItems(merged);
        return this;
    }

    subscribeMenuRealtime(onUpdate) {
        const slug = this.kitchen?.slug || 'akwabalx';
        const refresh = async () => {
            await this.load(slug);
            if (onUpdate) onUpdate(this.menu);
        };
        window.addEventListener('KITCHEN_MENU_UPDATED', (e) => {
            if (!e.detail?.slug || e.detail.slug === slug) refresh();
        });
        window.addEventListener('KITCHEN_BRAND_UPDATED', (e) => {
            if (!e.detail?.slug || e.detail.slug === slug) refresh().then(() => onUpdate && onUpdate(this.menu));
        });
        if (!window.supabaseClient || !this.kitchen?.id) return;
        if (this._menuChannel) window.supabaseClient.removeChannel(this._menuChannel);
        this._menuChannel = window.supabaseClient
            .channel(`kitchen-menu-${this.kitchen.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_menu_items', filter: `kitchen_id=eq.${this.kitchen.id}` }, refresh)
            .subscribe();
    }

    addToCart(itemId) {
        const item = this.menu.find((m) => m.id === itemId);
        if (!item) return;
        this.cart.push({ ...item, qty: 1, at: Date.now() });
        localStorage.setItem('cdf_kitchen_cart', JSON.stringify(this.cart));
        window.dispatchEvent(new CustomEvent('KITCHEN_CART_UPDATED'));
        if (window.FloweeReward) window.FloweeReward.xpToast(`Added ${item.name} to pickup cart`, 5);
    }

    async reloadMenu() {
        if (this.kitchen?.slug) await this.load(this.kitchen.slug);
        return this.menu;
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
        let order = null;
        if (window.supabaseClient) {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                payload.customer_id = user.id;
                const { data, error } = await window.supabaseClient.from('kitchen_orders').insert([payload]).select().single();
                if (!error && data) order = data;
            }
        }
        if (!order) {
            order = { ...payload, id: crypto.randomUUID?.() || `local-${Date.now()}`, created_at: new Date().toISOString() };
            const local = JSON.parse(localStorage.getItem('cdf_kitchen_orders_local') || '[]');
            local.push(order);
            localStorage.setItem('cdf_kitchen_orders_local', JSON.stringify(local));
        }
        this.clearCart();
        window.dispatchEvent(new CustomEvent('KITCHEN_ORDER_PLACED', {
            detail: { kitchenSlug: this.kitchen?.slug, items: payload.items, orderId: order?.id },
        }));
        if (window.FlavorQuestEngine) window.FlavorQuestEngine.onEvent('order', { kitchenSlug: this.kitchen?.slug, items: payload.items });
        if (window.QuestEngine) {
            await window.QuestEngine.fulfillTasteQuest('LQ-T02');
            if (window.QuestEngine.grantReward) await window.QuestEngine.grantReward('LQ-008', 100, 'Kitchen Heart');
        }
        if (window.FloweeReward) await window.FloweeReward.celebrate(`Order sent to ${this.kitchen.name}! Pick up at the bar when READY.`, 'celebrate');
        return order;
    }

    isOwner() {
        return this.kitchen?.owner_user_id && window.QuestEngine?.user?.id === this.kitchen.owner_user_id;
    }
}

document.addEventListener('DOMContentLoaded', () => { new KitchenEngine(); });
