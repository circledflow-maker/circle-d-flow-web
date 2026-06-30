/**
 * Bazaar Trade — shared delete, update & purchase logic (stall mgmt + guild stalls)
 */
window.BazaarTrade = {
    LOCAL_KEYS: ['cqr_offline_items', 'cdf_listings'],
    TOMBSTONE_KEY: 'bazaar_deleted_ids',

    markDeleted(id) {
        if (!id) return;
        try {
            const ids = JSON.parse(localStorage.getItem(this.TOMBSTONE_KEY) || '[]');
            if (!ids.includes(id)) {
                ids.push(id);
                localStorage.setItem(this.TOMBSTONE_KEY, JSON.stringify(ids));
            }
        } catch (e) { /* ignore */ }
    },

    isTombstoned(id) {
        try {
            return JSON.parse(localStorage.getItem(this.TOMBSTONE_KEY) || '[]').includes(id);
        } catch (e) {
            return false;
        }
    },

    normalizeItem(item) {
        const credits = parseInt(item.price_credits ?? item.price_flow ?? item.price_fc ?? 0, 10) || 0;
        return {
            id: item.id,
            title: item.title || item.name || 'Artifact',
            description: item.description || '',
            image_url: item.image_url || '',
            creator_id: item.creator_id || item.vendor_id || item.seller_id,
            guild_category: item.guild_category || item.category || 'Products',
            category: item.category || item.guild_category || 'Products',
            price_credits: credits,
            price_fiat: parseFloat(item.price_fiat ?? item.price_eur ?? (credits / 100).toFixed(2)),
            is_active: item.is_active !== false,
            stock_count: item.stock_count != null ? item.stock_count : 1
        };
    },

    purgeFromLocalCaches(id, title) {
        this.LOCAL_KEYS.forEach((key) => {
            try {
                const list = JSON.parse(localStorage.getItem(key) || '[]');
                const filtered = list.filter((item) => item.id !== id && item.title !== title);
                localStorage.setItem(key, JSON.stringify(filtered));
            } catch (e) { /* ignore */ }
        });
    },

    isLocalOnlyId(id) {
        return !id || String(id).startsWith('local_') || String(id).startsWith('lst_');
    },

    async deleteArtifact(id, title) {
        if (!id) throw new Error('No artifact id');

        this.purgeFromLocalCaches(id, title);
        this.markDeleted(id);

        if (this.isLocalOnlyId(id) || !window.supabaseClient) {
            return { mode: 'local' };
        }

        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('You must be signed in to delete artifacts.');

        const { error: deleteError } = await window.supabaseClient
            .from('market_items')
            .delete()
            .eq('id', id)
            .eq('creator_id', user.id);

        if (!deleteError) return { mode: 'deleted' };

        // RLS may block hard delete — hide from all public stalls
        const { error: softError } = await window.supabaseClient
            .from('market_items')
            .update({ is_active: false })
            .eq('id', id)
            .eq('creator_id', user.id);

        if (softError) throw softError;
        return { mode: 'soft_deleted', detail: deleteError.message };
    },

    async updateArtifact(id, payload) {
        const credits = parseInt(payload.price_credits, 10) || 0;
        const update = {
            title: payload.title,
            description: payload.description || '',
            price_credits: credits,
            price_fiat: parseFloat((credits / 100).toFixed(2)),
            guild_category: payload.guild_category || payload.category,
            category: payload.category || payload.guild_category,
            is_active: payload.is_active !== false
        };

        if (this.isLocalOnlyId(id)) {
            this._patchLocalItem(id, { ...update, stock_count: payload.stock_count });
            return { mode: 'local' };
        }

        const { error } = await window.supabaseClient
            .from('market_items')
            .update(update)
            .eq('id', id)
            .eq('creator_id', (await window.supabaseClient.auth.getUser()).data.user?.id);

        if (error) throw error;
        return { mode: 'updated' };
    },

    _patchLocalItem(id, update) {
        this.LOCAL_KEYS.forEach((key) => {
            try {
                const list = JSON.parse(localStorage.getItem(key) || '[]');
                const idx = list.findIndex((i) => i.id === id);
                if (idx >= 0) {
                    list[idx] = { ...list[idx], ...update, price_flow: update.price_credits };
                    localStorage.setItem(key, JSON.stringify(list));
                }
            } catch (e) { /* ignore */ }
        });
    },

    _itemCache: {},

    cacheItem(item) {
        const normalized = this.normalizeItem(item);
        const key = normalized.id || ('tmp_' + Date.now() + Math.random().toString(36).slice(2));
        this._itemCache[key] = normalized;
        return key;
    },

    getCachedItem(key) {
        return this._itemCache[key];
    },

    async buyWithFlow(item) {
        const normalized = this.normalizeItem(item);
        const cost = normalized.price_credits;
        if (!cost) return alert('This artifact has no Flow price set.');

        if (!window.Gamification) {
            return alert('Wallet offline. Please refresh and try again.');
        }

        if (!confirm(`Purchase "${normalized.title}" for ${cost} FC?`)) return;

        const tradeItem = {
            title: normalized.title,
            priceFlow: cost,
            ownerId: normalized.creator_id
        };

        if (window.MarketplaceCore?.processFlowPayment(tradeItem)) {
            if (window.Pusher) window.Pusher.showToast('Artifact secured!', 'success');
        }
    },

    async openEuroCheckout(item) {
        const normalized = this.normalizeItem(item);
        const amount = normalized.price_fiat;
        if (!amount || amount <= 0) return alert('No Euro price set for this artifact.');

        if (!window.Stripe) {
            const s = document.createElement('script');
            s.src = 'https://js.stripe.com/v3/';
            document.head.appendChild(s);
            await new Promise((res) => { s.onload = res; });
        }

        this._ensureEuroModal();
        const modal = document.getElementById('bazaar-euro-modal');
        document.getElementById('bazaar-euro-item').textContent = normalized.title;
        document.getElementById('bazaar-euro-price').textContent = `€${amount.toFixed(2)}`;
        const mount = document.getElementById('bazaar-payment-element');
        mount.innerHTML = '<span class="text-[#00ffcc] text-xs animate-pulse">Connecting...</span>';
        modal.classList.remove('hidden');

        const pk = window.STRIPE_PUBLISHABLE_KEY || 'pk_test_51SdebPDeSUihf09RzlBFNrIjuQnfGMixv5aeyxp7Qb8VA8seoEVuHYWb4MBM6Kvfel5N3JMyLly8zzdURworgXJg00ocwKiVGR';
        const backendUrl = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? 'http://localhost:3000/create-payment-intent'
            : '/api/create-payment-intent';

        try {
            const res = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            if (!res.ok) throw new Error('Payment service unavailable');
            const { clientSecret } = await res.json();
            const stripe = window._bazaarStripe || Stripe(pk);
            window._bazaarStripe = stripe;
            this._stripeElements = stripe.elements({
                clientSecret,
                appearance: { theme: 'night', variables: { colorPrimary: '#d2691e' } }
            });
            mount.innerHTML = '';
            const paymentElement = this._stripeElements.create('payment');
            paymentElement.mount('#bazaar-payment-element');
            this._pendingEuroItem = normalized;
        } catch (err) {
            mount.innerHTML = `<span class="text-red-400 text-xs">${err.message}</span>`;
        }
    },

    async confirmEuroCheckout() {
        if (!this._stripeElements || !window._bazaarStripe) return;
        const btn = document.getElementById('bazaar-euro-submit');
        btn.disabled = true;
        btn.textContent = 'Processing...';
        const { error } = await window._bazaarStripe.confirmPayment({
            elements: this._stripeElements,
            confirmParams: { return_url: window.location.href },
            redirect: 'if_required'
        });
        btn.disabled = false;
        btn.textContent = 'Pay with Card';
        if (error) alert(error.message);
        else {
            document.getElementById('bazaar-euro-modal').classList.add('hidden');
            if (window.Pusher) window.Pusher.showToast('Payment complete!', 'success');
        }
    },

    _ensureEuroModal() {
        if (document.getElementById('bazaar-euro-modal')) return;
        const el = document.createElement('div');
        el.id = 'bazaar-euro-modal';
        el.className = 'hidden fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4';
        el.innerHTML = `
            <div class="bg-[#1a0a18] border border-[#d2691e] rounded-xl p-6 w-full max-w-md text-white relative">
                <button type="button" onclick="document.getElementById('bazaar-euro-modal').classList.add('hidden')" class="absolute top-3 right-3 text-white/50 material-symbols-outlined">close</button>
                <h3 class="font-cinzel text-[#ffaa44] text-lg mb-1">Secure Checkout</h3>
                <p id="bazaar-euro-item" class="text-sm mb-1"></p>
                <p id="bazaar-euro-price" class="text-[#ffaa44] font-mono font-bold mb-4"></p>
                <div id="bazaar-payment-element" class="mb-4 min-h-[120px] bg-white/5 rounded p-3"></div>
                <button type="button" id="bazaar-euro-submit" onclick="BazaarTrade.confirmEuroCheckout()" class="w-full py-3 bg-[#d2691e] text-white font-bold rounded uppercase text-sm">Pay with Card</button>
            </div>`;
        document.body.appendChild(el);
    },

    async buyWithEuro(item) {
        return this.openEuroCheckout(item);
    },

    encodeItem(item) {
        return encodeURIComponent(JSON.stringify(this.normalizeItem(item)));
    },

    buildStallActions(item) {
        const key = this.cacheItem(item);
        const norm = this.getCachedItem(key);
        const credits = norm.price_credits;
        const eur = norm.price_fiat;
        const encoded = this.encodeItem(norm);
        const eurBtn = eur > 0
            ? `<button type="button" class="buy-btn text-[10px] opacity-90" onclick="BazaarTrade.openEuroCheckout(BazaarTrade.getCachedItem('${key}'))">€${eur.toFixed(0)}</button>`
            : '';
        return `
            <div class="flex gap-2 flex-wrap justify-end">
                <button type="button" class="buy-btn text-[10px]" onclick="BazaarTrade.buyWithFlow(BazaarTrade.getCachedItem('${key}'))">${credits} FC</button>
                ${eurBtn}
                <button type="button" class="buy-btn text-[10px] opacity-80" onclick="openOrderModal('${encoded}')">Contact</button>
            </div>`;
    }
};
