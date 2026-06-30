/**
 * Bazaar Trade — shared delete, update & purchase logic (stall mgmt + guild stalls)
 */
window.BazaarTrade = {
    LOCAL_KEYS: ['cqr_offline_items', 'cdf_listings'],

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

        // RLS may block hard delete — soft-delete so it vanishes from all public stalls
        const { error: softError } = await window.supabaseClient
            .from('market_items')
            .update({ is_active: false, category: '__deleted__', guild_category: '__deleted__' })
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
            is_active: payload.is_active !== false,
            stock_count: payload.stock_count != null ? parseInt(payload.stock_count, 10) : 1
        };

        if (this.isLocalOnlyId(id)) {
            this._patchLocalItem(id, update);
            return { mode: 'local' };
        }

        const { error } = await window.supabaseClient
            .from('market_items')
            .update(update)
            .eq('id', id);

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

    async buyWithEuro(item) {
        const normalized = this.normalizeItem(item);
        const amount = normalized.price_fiat;
        if (!amount) return alert('No fiat price available for this artifact.');

        if (!window.Stripe) return alert('Stripe not loaded on this page.');

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
            if (!clientSecret) throw new Error('No payment session');

            const stripe = window._bazaarStripe || Stripe(pk);
            window._bazaarStripe = stripe;
            const { error } = await stripe.confirmPayment({
                elements: stripe.elements({ clientSecret }),
                confirmParams: { return_url: window.location.href },
                redirect: 'if_required'
            });
            if (error) alert(error.message);
            else if (window.Pusher) window.Pusher.showToast('Payment complete!', 'success');
        } catch (err) {
            alert('Checkout failed: ' + err.message);
        }
    },

    encodeItem(item) {
        return encodeURIComponent(JSON.stringify(this.normalizeItem(item)));
    },

    buildStallActions(item) {
        const key = this.cacheItem(item);
        const credits = this.getCachedItem(key).price_credits;
        const encoded = this.encodeItem(this.getCachedItem(key));
        return `
            <div class="flex gap-2 flex-wrap justify-end">
                <button type="button" class="buy-btn text-[10px]" onclick="BazaarTrade.buyWithFlow(BazaarTrade.getCachedItem('${key}'))">${credits} FC</button>
                <button type="button" class="buy-btn text-[10px] opacity-80" onclick="openOrderModal('${encoded}')">Contact</button>
            </div>`;
    }
};
