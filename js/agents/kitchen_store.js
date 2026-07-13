/**
 * Kitchen Store — local-first menu/branding persistence + cloud sync fallback
 */
(function () {
  const DEFAULT_OPS = 'AKWABA-CREW';

  function storeKey(slug, part) {
    return `cdf_kitchen_${part}_${slug || 'akwabalx'}`;
  }

  function parseJson(raw, fallback) {
    try {
      return JSON.parse(raw || '');
    } catch (_) {
      return fallback;
    }
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
  }

  window.kitchenMediaUrl = function kitchenMediaUrl(url, preferWebp) {
    if (!url || String(url).startsWith('data:')) return url;
    if (preferWebp === false) return url;
    const s = String(url);
    if (/logo-fallback|\/logo\.png/i.test(s)) return s;
    return s.replace(/\.(jpe?g|png)(\?.*)?$/i, '.webp$2');
  };

  window.KitchenStore = {
    getOpsCode() {
      return localStorage.getItem('cdf_kitchen_ops_code') || DEFAULT_OPS;
    },

    getMenuLocal(slug) {
      return parseJson(localStorage.getItem(storeKey(slug, 'menu')), []);
    },

    saveMenuLocal(slug, items) {
      localStorage.setItem(storeKey(slug, 'menu'), JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('KITCHEN_MENU_UPDATED', { detail: { slug } }));
    },

    mergeMenu(remote, slug) {
      const local = this.getMenuLocal(slug);
      if (!local.length) return remote || [];
      const map = new Map((remote || []).map((i) => [String(i.id), { ...i }]));
      local.forEach((item) => {
        const id = String(item.id);
        if (item._deleted) {
          map.delete(id);
          return;
        }
        map.set(id, { ...(map.get(id) || {}), ...item });
      });
      return Array.from(map.values())
        .filter((i) => !i._deleted)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },

    getBranding(slug) {
      return parseJson(localStorage.getItem(storeKey(slug, 'brand')), {});
    },

    saveBranding(slug, patch) {
      const next = { ...this.getBranding(slug), ...patch, updated_at: Date.now() };
      localStorage.setItem(storeKey(slug, 'brand'), JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('KITCHEN_BRAND_UPDATED', { detail: { slug } }));
      return next;
    },

    normalizeKitchen(raw, slug) {
      const fallback = window.AKWABA_KITCHEN || {};
      const brand = this.getBranding(slug || raw?.slug || 'akwabalx');
      const base = raw || fallback;
      const pick = (...vals) => vals.find((v) => v != null && v !== '');

      return {
        ...base,
        slug: base.slug || slug || 'akwabalx',
        id: base.id || fallback.id,
        name: base.name || fallback.name,
        tagline: base.tagline || fallback.tagline,
        location_name: base.location_name || fallback.location_name,
        discount_note: base.discount_note || fallback.discount_note,
        logo: pick(brand.logo, base.logo, base.logo_url, fallback.logo),
        cover: pick(brand.cover, base.cover, base.cover_url, fallback.cover),
        reel: pick(brand.reel, base.reel, base.reel_url, fallback.reel),
        menu_board: pick(brand.menu_board, base.menu_board, base.menu_board_url, fallback.menu_board),
        gallery: brand.gallery || base.gallery || fallback.gallery || [],
      };
    },

    async syncToCloud(action, payload, slug) {
      try {
        const res = await fetch('/api/kitchen-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            slug: slug || 'akwabalx',
            payload,
            ops_code: this.getOpsCode(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, ...data };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },

    async trySupabaseMenuWrite(method, table, body, match) {
      if (!window.supabaseClient) return { ok: false, error: 'offline' };
      let result;
      if (method === 'update') {
        result = await window.supabaseClient.from(table).update(body).match(match);
      } else if (method === 'insert') {
        result = await window.supabaseClient.from(table).insert([body]);
      } else if (method === 'delete') {
        result = await window.supabaseClient.from(table).delete().match(match);
      }
      if (result?.error) return { ok: false, error: result.error.message };
      return { ok: true, source: 'supabase' };
    },

    async saveMenuItem(slug, kitchenId, id, fields) {
      const items = this.getMenuLocal(slug);
      const idx = items.findIndex((i) => String(i.id) === String(id));
      const row = { ...fields, id, kitchen_id: kitchenId, updated_at: Date.now() };
      if (idx >= 0) items[idx] = { ...items[idx], ...row };
      else items.push(row);
      this.saveMenuLocal(slug, items);

      if (window.supabaseClient && kitchenId && id && !String(id).startsWith('local-')) {
        const direct = await this.trySupabaseMenuWrite('update', 'kitchen_menu_items', fields, { id });
        if (direct.ok) return direct;
      }

      if (!String(id).startsWith('local-') && isUuid(id)) {
        const cloud = await this.syncToCloud('update_menu_item', { id, kitchen_id: kitchenId, ...fields }, slug);
        if (cloud.ok) return { ok: true, source: 'api' };
        if (cloud.error && !cloud.error.includes('not configured')) {
          return { ok: true, source: 'local', warning: cloud.error };
        }
      }

      return { ok: true, source: 'local', warning: 'Saved on this device — cloud sync pending' };
    },

    async insertMenuItem(slug, payload) {
      const id = payload.id || `local-${Date.now()}`;
      const row = { ...payload, id };
      const items = this.getMenuLocal(slug);
      items.push(row);
      this.saveMenuLocal(slug, items);

      if (window.supabaseClient && payload.kitchen_id) {
        const insertPayload = { ...payload };
        delete insertPayload.id;
        const direct = await this.trySupabaseMenuWrite('insert', 'kitchen_menu_items', insertPayload, {});
        if (direct.ok) return { ok: true, source: 'supabase', id };
      }

      const cloud = await this.syncToCloud('insert_menu_item', { ...payload, kitchen_id: payload.kitchen_id }, slug);
      if (cloud.ok) return { ok: true, source: 'api', id: cloud.id || id };

      return { ok: true, source: 'local', id, warning: cloud.error };
    },

    async deleteMenuItem(slug, kitchenId, id) {
      const items = this.getMenuLocal(slug).filter((i) => String(i.id) !== String(id));
      items.push({ id, kitchen_id: kitchenId, _deleted: true });
      this.saveMenuLocal(slug, items);

      if (window.supabaseClient && id && !String(id).startsWith('local-')) {
        const direct = await this.trySupabaseMenuWrite('delete', 'kitchen_menu_items', {}, { id });
        if (direct.ok) return direct;
      }

      const cloud = await this.syncToCloud('delete_menu_item', { id, kitchen_id: kitchenId }, slug);
      if (cloud.ok) return { ok: true, source: 'api' };

      return { ok: true, source: 'local', warning: cloud.error };
    },

    async saveBrandingCloud(slug, kitchenId, brand) {
      this.saveBranding(slug, brand);

      const patch = {
        logo_url: brand.logo,
        cover_url: brand.cover,
        reel_url: brand.reel,
        menu_board_url: brand.menu_board,
      };
      Object.keys(patch).forEach((k) => patch[k] == null && delete patch[k]);

      if (window.supabaseClient && kitchenId) {
        const { error } = await window.supabaseClient.from('kitchens').update(patch).eq('id', kitchenId);
        if (!error) return { ok: true, source: 'supabase' };
      }

      const cloud = await this.syncToCloud('update_branding', { kitchen_id: kitchenId, ...patch }, slug);
      if (cloud.ok) return { ok: true, source: 'api' };

      return { ok: true, source: 'local', warning: cloud.error };
    },
  };
})();
