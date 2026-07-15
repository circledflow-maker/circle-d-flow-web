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

    applyMergedMenu(items, kitchenSlug) {
        const merged = window.KitchenStore
            ? window.KitchenStore.mergeMenu(items || [], kitchenSlug)
            : (items || []);
        this.menu = this.mapMenuItems(merged);
        return this.menu;
    }

    async load(slug) {
        const kitchenSlug = slug || 'akwabalx';
        const fallback = window.AKWABA_KITCHEN;
        const normalize = (k) => (window.KitchenStore ? window.KitchenStore.normalizeKitchen(k, kitchenSlug) : k);

        if (!window.supabaseClient) {
            this.kitchen = normalize(fallback);
            this.applyMergedMenu(fallback.menu || [], kitchenSlug);
            return this;
        }
        try {
            const { data: k, error } = await window.supabaseClient
                .from('kitchens').select('*').eq('slug', kitchenSlug).maybeSingle();
            if (!error && k) {
                this.kitchen = normalize(k);
                const { data: items } = await window.supabaseClient
                    .from('kitchen_menu_items').select('*').eq('kitchen_id', k.id).order('sort_order');
                this.applyMergedMenu(items || [], kitchenSlug);
                if (kitchenSlug === 'akwabalx') this.kitchen.reel = '';
                return this;
            }
        } catch (e) {
            console.warn('[KitchenEngine]', e.message);
        }
        this.kitchen = normalize(fallback);
        this.applyMergedMenu(fallback.menu || [], kitchenSlug);
        if (kitchenSlug === 'akwabalx') this.kitchen.reel = '';
        return this;
    }

    subscribeMenuRealtime(onUpdate) {
        const slug = this.kitchen?.slug || 'akwabalx';
        const menuKey = `cdf_kitchen_menu_${slug}`;
        const brandKey = `cdf_kitchen_brand_${slug}`;
        const refresh = async () => {
            await this.load(slug);
            if (onUpdate) onUpdate(this.menu);
        };
        if (!this._menuSyncBound) {
            this._menuSyncBound = true;
            window.addEventListener('KITCHEN_MENU_UPDATED', (e) => {
                if (!e.detail?.slug || e.detail.slug === slug) refresh();
            });
            window.addEventListener('KITCHEN_BRAND_UPDATED', (e) => {
                if (!e.detail?.slug || e.detail.slug === slug) refresh().then(() => onUpdate && onUpdate(this.menu));
            });
            window.addEventListener('storage', (e) => {
                if (e.key === menuKey || e.key === brandKey) refresh();
            });
            try {
                this._kitchenBc = new BroadcastChannel('cdf_kitchen_sync');
                this._kitchenBc.onmessage = (e) => {
                    const d = e.data || {};
                    if (d.slug === slug && (d.type === 'menu' || d.type === 'brand')) refresh();
                };
            } catch (_) { /* BroadcastChannel unavailable */ }
        }
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

    normalizeOrderStatus(status) {
        const s = String(status || 'pending').toLowerCase();
        if (s === 'cooking') return 'in_progress';
        return s;
    }

    async fetchOrder(orderId) {
        if (!orderId) return null;
        if (window.supabaseClient && !String(orderId).startsWith('local-')) {
            try {
                const { data } = await window.supabaseClient
                    .from('kitchen_orders').select('*').eq('id', orderId).maybeSingle();
                if (data) return { ...data, status: this.normalizeOrderStatus(data.status) };
            } catch (e) { console.warn('[KitchenEngine] fetchOrder', e.message); }
        }
        const local = JSON.parse(localStorage.getItem('cdf_kitchen_orders_local') || '[]');
        const found = local.find((o) => o.id === orderId);
        return found ? { ...found, status: this.normalizeOrderStatus(found.status) } : null;
    }

    subscribeOrderRealtime(orderId, onUpdate) {
        if (!orderId || typeof onUpdate !== 'function') return;
        this._activeOrderId = orderId;
        this._orderUpdateCb = onUpdate;
        if (!this._orderSyncBound) {
            this._orderSyncBound = true;
            window.addEventListener('KITCHEN_ORDER_UPDATED', (e) => {
                const d = e.detail || {};
                if (!d.orderId || d.orderId === this._activeOrderId) this._refreshTrackedOrder();
            });
            window.addEventListener('storage', (e) => {
                if (e.key === 'cdf_kitchen_orders_local') this._refreshTrackedOrder();
            });
            try {
                this._orderBc = new BroadcastChannel('cdf_kitchen_sync');
                this._orderBc.onmessage = (e) => {
                    if (e.data?.type === 'order' || e.data?.type === 'order_ready') this._refreshTrackedOrder();
                };
            } catch (_) { /* BroadcastChannel unavailable */ }
            window.addEventListener('KITCHEN_ORDER_READY', (e) => {
                const d = e.detail || {};
                if (!d.orderId || d.orderId === this._activeOrderId) this._onGuestOrderReady(d.order || null);
            });
        }
        this._bindOrderChannel(orderId);
        this._refreshTrackedOrder();
    }

    async _refreshTrackedOrder() {
        if (!this._activeOrderId || !this._orderUpdateCb) return;
        const order = await this.fetchOrder(this._activeOrderId);
        if (order) {
            if (order.status === 'ready' && this._lastReadyNotifyId !== order.id) {
                this._lastReadyNotifyId = order.id;
                this._onGuestOrderReady(order);
            }
            this._orderUpdateCb(order);
        }
    }

    _onGuestOrderReady(order) {
        if (!order) return;
        const items = Array.isArray(order.items) ? order.items : [];
        const title = items.map((i) => i.name).join(', ') || 'Your pickup';
        const msg = `${title} is READY at the bar — show your Soul Ticket!`;
        if (window.Flowee) window.Flowee.talk(true, msg, 'success');
        if (window.Pusher) window.Pusher.showToast('Order ready for pickup!', 'success');
        if (navigator.vibrate) {
            try { navigator.vibrate([180, 80, 180, 80, 240]); } catch (_) {}
        }
        window.dispatchEvent(new CustomEvent('KITCHEN_GUEST_PICKUP_READY', { detail: { order } }));
    }

    _bindOrderChannel(orderId) {
        if (!window.supabaseClient || String(orderId).startsWith('local-')) return;
        if (this._orderChannel) window.supabaseClient.removeChannel(this._orderChannel);
        this._orderChannel = window.supabaseClient
            .channel(`kitchen-order-${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'kitchen_orders',
                filter: `id=eq.${orderId}`,
            }, () => this._refreshTrackedOrder())
            .subscribe();
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
            if (user) payload.customer_id = user.id;
            const { data, error } = await window.supabaseClient.from('kitchen_orders').insert([payload]).select().single();
            if (!error && data) order = data;
            else if (error) console.warn('[KitchenEngine] order insert', error.message);
        }
        if (!order) {
            order = { ...payload, id: crypto.randomUUID?.() || `local-${Date.now()}`, created_at: new Date().toISOString() };
            const local = JSON.parse(localStorage.getItem('cdf_kitchen_orders_local') || '[]');
            local.push(order);
            localStorage.setItem('cdf_kitchen_orders_local', JSON.stringify(local));
        }
        localStorage.setItem('cdf_active_kitchen_order', JSON.stringify({
            id: order.id,
            kitchen_id: order.kitchen_id,
            slug: this.kitchen?.slug || 'akwabalx',
        }));
        try {
            const bc = new BroadcastChannel('cdf_kitchen_sync');
            bc.postMessage({ type: 'order', orderId: order.id, status: order.status, slug: this.kitchen?.slug });
            bc.close();
        } catch (_) {}
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

window.ensureKitchenEngine = function ensureKitchenEngine() {
    if (window.KitchenEngine && typeof window.KitchenEngine.load === 'function') {
        return window.KitchenEngine;
    }
    return new KitchenEngine();
};

if (!(window.KitchenEngine && typeof window.KitchenEngine.load === 'function')) {
    new KitchenEngine();
}
