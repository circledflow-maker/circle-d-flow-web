/**
 * Kitchen Ops — KDS, menu CRUD, QR studio, crew comms, soul tickets, gamification
 */
(function () {
  const DEFAULT_KITCHEN_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function kitchenUrl(slug) {
    const base = window.location.origin.includes('localhost')
      ? `${window.location.origin}/pages/akwaba_kitchen.html`
      : 'https://circle-d-flow-web.vercel.app/pages/akwaba_kitchen';
    return slug && slug !== 'akwabalx' ? `${base}?kitchen=${slug}` : base;
  }

  function pinFromOrder(order) {
    const raw = String(order.id || Date.now()).replace(/-/g, '').slice(0, 6).toUpperCase();
    return `AKW-${raw}`;
  }

  window.KitchenOps = {
    kitchen: null,
    orders: [],
    allOrders: [],
    menu: [],
    messages: [],
    channel: null,
    selectedOrder: null,
    stats: { sold: 0, revenue: 0, avgRating: 4.9, ready: 0 },

    async init(slug) {
      const params = new URLSearchParams(window.location.search);
      const kitchenSlug = slug || params.get('kitchen') || localStorage.getItem('cdf_active_kitchen') || 'akwabalx';
      if (window.KitchenEngine) await window.KitchenEngine.load(kitchenSlug);
      this.kitchen = window.KitchenEngine?.kitchen || window.AKWABA_KITCHEN;
      if (window.KitchenStore) {
        this.kitchen = window.KitchenStore.normalizeKitchen(this.kitchen, kitchenSlug);
      }
      localStorage.setItem('cdf_active_kitchen', this.kitchen?.slug || kitchenSlug);
      await Promise.all([this.loadOrders(), this.loadMenu(), this.loadMessages(), this.loadStats()]);
      this.renderAll();
      this.bindPanels();
      this.subscribeRealtime();
      const tut = params.get('tutorial');
      const mode = params.get('mode');
      if (mode === 'forge' || params.get('slide') === 'forge') {
        window.location.replace('kitchen_forge.html' + (tut ? '?tutorial=1' : ''));
        return;
      }
      if (window.FloweeKitchenTour && tut === 'ops') {
        setTimeout(() => window.FloweeKitchenTour.ownerTour(true), 900);
      }
    },

    renderAll() {
      this.renderHeader();
      this.renderKDS();
      this.renderStats();
      this.renderMenuEditor();
      this.renderBrandingEditor();
      this.renderQRStudio();
      this.renderKitchenSetup();
      this.renderComm();
      this.renderStaffPanel();
      this.renderSoulTicket();
      this.renderVoucherPanel();
    },

    async loadOrders() {
      const localKey = 'cdf_kitchen_orders_local';
      const localAll = JSON.parse(localStorage.getItem(localKey) || '[]');
      const kid = this.kitchen?.id;
      const norm = (o) => ({ ...o, status: o.status === 'cooking' ? 'in_progress' : o.status });
      const activeStatuses = ['pending', 'confirmed', 'in_progress', 'ready', 'cooking'];
      const localActive = localAll.filter((o) =>
        o.kitchen_id === kid && activeStatuses.includes(o.status)
      ).map(norm);
      if (!window.supabaseClient || !kid) {
        this.orders = localActive;
        this.allOrders = [...localAll.filter((o) => o.kitchen_id === kid)];
        return;
      }
      try {
        const { data } = await window.supabaseClient
          .from('kitchen_orders')
          .select('*')
          .eq('kitchen_id', kid)
          .order('created_at', { ascending: false })
          .limit(120);
        const dbOrders = (data || []).map(norm);
        const dbIds = new Set(dbOrders.map((o) => o.id));
        const mergedLocal = localActive.filter((o) => !dbIds.has(o.id));
        this.allOrders = [...dbOrders, ...localAll.filter((o) => o.kitchen_id === kid && !dbIds.has(o.id)).map(norm)];
        this.orders = [...dbOrders.filter((o) => ['pending', 'confirmed', 'in_progress', 'ready'].includes(o.status)), ...mergedLocal];
      } catch (e) {
        console.warn('[KitchenOps] orders', e.message);
        this.orders = localActive;
        this.allOrders = localAll.filter((o) => o.kitchen_id === kid);
      }
    },

    async loadStats() {
      const picked = this.allOrders.filter((o) => o.status === 'picked_up');
      this.stats.sold = picked.length;
      this.stats.revenue = picked.reduce((s, o) => s + parseFloat(o.total_eur || 0), 0);
      this.stats.ready = this.orders.filter((o) => o.status === 'ready').length;
      const ratings = JSON.parse(localStorage.getItem(`cdf_kitchen_ratings_${this.kitchen?.slug}`) || '[]');
      if (ratings.length) {
        this.stats.avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
      }
    },

    async loadMenu() {
      const slug = this.kitchen?.slug || 'akwabalx';
      let remote = [];
      if (window.supabaseClient && this.kitchen?.id) {
        try {
          const { data, error } = await window.supabaseClient
            .from('kitchen_menu_items')
            .select('*')
            .eq('kitchen_id', this.kitchen.id)
            .order('sort_order');
          if (error) console.warn('[KitchenOps] menu load', error.message);
          else remote = data || [];
        } catch (e) {
          console.warn('[KitchenOps] menu load', e.message);
        }
      }
      if (!remote.length && window.KitchenStore) {
        const local = window.KitchenStore.getMenuLocal(slug).filter((i) => !i._deleted);
        if (local.length) remote = local;
      }
      if (!remote.length) remote = window.KitchenEngine?.menu || window.AKWABA_KITCHEN?.menu || [];
      this.menu = window.KitchenStore
        ? window.KitchenStore.mergeMenu(remote, slug)
        : remote;
      if (window.KitchenStore) {
        this.kitchen = window.KitchenStore.normalizeKitchen(this.kitchen, slug);
      }
    },

    async loadMessages() {
      const localKey = `cdf_kitchen_msgs_${this.kitchen?.slug || 'akwabalx'}`;
      if (!window.supabaseClient || !this.kitchen?.id) {
        this.messages = JSON.parse(localStorage.getItem(localKey) || '[]');
        return;
      }
      try {
        const { data, error } = await window.supabaseClient
          .from('kitchen_messages')
          .select('*')
          .eq('kitchen_id', this.kitchen.id)
          .eq('channel', 'ops')
          .order('created_at', { ascending: true })
          .limit(80);
        if (error) {
          console.warn('[KitchenOps] messages load', error.message);
          this.messages = JSON.parse(localStorage.getItem(localKey) || '[]');
        } else {
          this.messages = data || [];
        }
      } catch (e) {
        this.messages = JSON.parse(localStorage.getItem(localKey) || '[]');
      }
    },

    subscribeRealtime() {
      const slug = this.kitchen?.slug || 'akwabalx';
      const menuKey = `cdf_kitchen_menu_${slug}`;
      if (!this._opsSyncBound) {
        this._opsSyncBound = true;
        window.addEventListener('KITCHEN_MENU_UPDATED', (e) => {
          if (!e.detail?.slug || e.detail.slug === slug) {
            this.loadMenu().then(() => this.renderMenuEditor());
          }
        });
        window.addEventListener('storage', (e) => {
          if (e.key === menuKey) this.loadMenu().then(() => this.renderMenuEditor());
        });
        try {
          this._opsBc = new BroadcastChannel('cdf_kitchen_sync');
          this._opsBc.onmessage = (e) => {
            const d = e.data || {};
            if (d.slug === slug && d.type === 'menu') this.loadMenu().then(() => this.renderMenuEditor());
          };
        } catch (_) { /* BroadcastChannel unavailable */ }
      }
      if (!window.supabaseClient || !this.kitchen?.id) return;
      if (this.channel) window.supabaseClient.removeChannel(this.channel);
      this.channel = window.supabaseClient
        .channel(`kitchen-ops-${this.kitchen.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_orders', filter: `kitchen_id=eq.${this.kitchen.id}` }, () => {
          this.loadOrders().then(() => { this.renderKDS(); this.renderStats(); this.renderSoulTicket(); });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_menu_items', filter: `kitchen_id=eq.${this.kitchen.id}` }, () => {
          this.loadMenu().then(() => this.renderMenuEditor());
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kitchen_messages', filter: `kitchen_id=eq.${this.kitchen.id}` }, () => {
          this.loadMessages().then(() => this.renderComm());
        })
        .subscribe();
    },

    renderHeader() {
      const name = document.getElementById('kitchen-ops-name');
      const sub = document.getElementById('kitchen-ops-sub');
      if (name) name.textContent = this.kitchen?.name || 'Kitchen';
      if (sub) sub.textContent = this.kitchen?.location_name || this.kitchen?.slug || 'Command Center';
    },

    statusColumns() {
      return [
        { key: 'pending', label: 'New', color: '#fde047' },
        { key: 'confirmed', label: 'Confirmed', color: '#60a5fa' },
        { key: 'in_progress', label: 'Cooking', color: '#fb923c' },
        { key: 'ready', label: 'Ready', color: '#4ade80' },
      ];
    },

    renderKDS() {
      const board = document.getElementById('kitchen-kds-board');
      if (!board) return;
      const cols = this.statusColumns();
      board.innerHTML = cols.map((col) => {
        const items = this.orders.filter((o) => o.status === col.key);
        return `<div class="kds-col">
          <div class="kds-col-head" style="border-color:${col.color}"><span>${col.label}</span><span class="kds-count">${items.length}</span></div>
          <div class="kds-cards">${items.map((o) => this.orderCard(o)).join('') || '<p class="text-[10px] text-white/30 p-2">—</p>'}</div>
        </div>`;
      }).join('');
      board.querySelectorAll('[data-advance]').forEach((btn) => {
        btn.addEventListener('click', () => this.advanceOrder(btn.dataset.advance, btn.dataset.next));
      });
      board.querySelectorAll('[data-ticket]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const order = this.orders.find((o) => o.id === btn.dataset.ticket);
          if (order) { this.selectedOrder = order; this.renderSoulTicket(); }
        });
      });
    },

    orderCard(order) {
      const items = Array.isArray(order.items) ? order.items : [];
      const names = items.map((i) => i.name || i.title || 'Item').join(', ') || 'Pickup';
      const next = { pending: 'confirmed', confirmed: 'in_progress', in_progress: 'ready', ready: 'picked_up' }[order.status];
      const nextLabel = { confirmed: 'Confirm', in_progress: 'Cooking', ready: 'Ready', picked_up: 'Picked Up' }[next] || 'Done';
      return `<div class="kds-card">
        <div class="text-[10px] text-white/40 font-mono">#${String(order.id || '').slice(0, 8)}</div>
        <div class="font-bold text-sm text-white mt-1">${escapeHtml(names)}</div>
        <div class="text-[10px] text-white/50 mt-1">€${parseFloat(order.total_eur || 0).toFixed(2)}</div>
        ${order.pickup_note ? `<div class="text-[10px] text-[var(--terracotta)] mt-1">${escapeHtml(order.pickup_note)}</div>` : ''}
        <div class="flex gap-1 mt-2 flex-wrap">
          ${next ? `<button type="button" class="kds-advance flex-1" data-advance="${order.id}" data-next="${next}">${nextLabel} →</button>` : ''}
          ${order.status === 'ready' ? `<button type="button" class="kds-ticket text-[9px] px-2 py-1 border border-[var(--gold)]/50 rounded" data-ticket="${order.id}">Ticket</button>` : ''}
        </div>
      </div>`;
    },

    async advanceOrder(orderId, nextStatus) {
      if (!orderId || !nextStatus) return;
      const isLocal = String(orderId).startsWith('local-') || !window.supabaseClient;
      if (window.supabaseClient && !isLocal) {
        const { error } = await window.supabaseClient.from('kitchen_orders').update({ status: nextStatus }).eq('id', orderId);
        if (error) { if (window.Pusher) window.Pusher.showToast(error.message, 'error'); return; }
      } else {
        const local = JSON.parse(localStorage.getItem('cdf_kitchen_orders_local') || '[]');
        const idx = local.findIndex((o) => o.id === orderId);
        if (idx >= 0) { local[idx].status = nextStatus; localStorage.setItem('cdf_kitchen_orders_local', JSON.stringify(local)); }
      }
      window.dispatchEvent(new CustomEvent('KITCHEN_ORDER_UPDATED', {
        detail: { orderId, status: nextStatus, kitchenId: this.kitchen?.id, slug: this.kitchen?.slug },
      }));
      try {
        const bc = new BroadcastChannel('cdf_kitchen_sync');
        bc.postMessage({ type: 'order', orderId, status: nextStatus, slug: this.kitchen?.slug });
        bc.close();
      } catch (_) {}
      if (nextStatus === 'ready') await this.grantKitchenReward('order_ready');
      if (nextStatus === 'picked_up') {
        await this.grantKitchenReward('first_pickup');
        if (window.FlavorQuestEngine) window.FlavorQuestEngine.onEvent('soul_scan', { orderId });
      }
      await this.loadOrders();
      await this.loadStats();
      this.renderKDS();
      this.renderStats();
      this.renderSoulTicket();
      if (window.Pusher) window.Pusher.showToast(`Order → ${nextStatus}`, 'success');
    },

    renderStats() {
      const sold = document.getElementById('stat-dishes-sold');
      const vibe = document.getElementById('stat-vibe');
      const revenue = document.getElementById('stat-revenue');
      const ready = document.getElementById('stat-ready');
      const portions = document.getElementById('portions');
      if (sold) sold.textContent = String(this.stats.sold);
      if (vibe) vibe.textContent = String(this.stats.avgRating);
      if (revenue) revenue.textContent = `€${this.stats.revenue.toFixed(0)}`;
      if (ready) ready.textContent = String(this.stats.ready);
      const liveItem = this.menu.find((m) => m.is_available !== false);
      if (portions && liveItem) {
        const est = Math.max(0, 42 - this.stats.sold % 50);
        portions.textContent = String(est);
        const label = document.getElementById('portions-label');
        if (label) label.textContent = liveItem.name || 'Portions Left';
      }
    },

    mediaSrc(url) {
      if (!url) return '/Assets/kitchens/akwabalx/logo-fallback.png';
      if (window.kitchenMediaUrl && !String(url).startsWith('data:')) return window.kitchenMediaUrl(url);
      return url;
    },

    renderBrandingEditor() {
      const el = document.getElementById('kitchen-branding-editor');
      if (!el) return;
      const slug = this.kitchen?.slug || 'akwabalx';
      const k = window.KitchenStore ? window.KitchenStore.normalizeKitchen(this.kitchen, slug) : this.kitchen;
      const cover = k?.cover || '/Assets/kitchens/akwabalx/hero-1.jpg';
      const board = k?.menu_board || '/Assets/kitchens/akwabalx/menu-board.webp';
      el.innerHTML = `
        <p class="text-[10px] text-white/50 mb-3">Title image (hero) and food menu card — syncs to guest page instantly.</p>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="ops-card p-0 overflow-hidden">
            <p class="slide-label px-3 pt-3 mb-0">Title Image</p>
            <div class="relative aspect-[4/3] bg-black/40 m-3 rounded-lg overflow-hidden border border-white/10">
              <img id="brand-cover-preview" src="${escapeHtml(this.mediaSrc(cover))}" class="w-full h-full object-cover" alt="Kitchen cover"
                onerror="this.onerror=null;this.src='${escapeHtml(cover)}'">
              <label class="absolute inset-0 flex items-center justify-center bg-black/50 text-[9px] text-white cursor-pointer opacity-0 hover:opacity-100 transition">
                UPLOAD COVER
                <input type="file" class="hidden" id="brand-cover-upload" accept="image/*">
              </label>
            </div>
            <button type="button" id="btn-save-cover" class="w-full text-[9px] py-2 border-t border-white/10 text-[var(--gold)] uppercase tracking-widest">Save Title Image</button>
          </div>
          <div class="ops-card p-0 overflow-hidden">
            <p class="slide-label px-3 pt-3 mb-0">Food Menu Card</p>
            <div class="relative aspect-[3/4] bg-black/40 m-3 rounded-lg overflow-hidden border border-white/10">
              <img id="brand-menu-preview" src="${escapeHtml(this.mediaSrc(board))}" class="w-full h-full object-contain" alt="Menu board"
                onerror="this.onerror=null;this.src='${escapeHtml(board)}'">
              <label class="absolute inset-0 flex items-center justify-center bg-black/50 text-[9px] text-white cursor-pointer opacity-0 hover:opacity-100 transition">
                UPLOAD MENU
                <input type="file" class="hidden" id="brand-menu-upload" accept="image/*">
              </label>
            </div>
            <button type="button" id="btn-save-menu-board" class="w-full text-[9px] py-2 border-t border-white/10 text-[var(--gold)] uppercase tracking-widest">Save Menu Card</button>
          </div>
        </div>`;

      this._brandCoverData = cover.startsWith('data:') ? cover : null;
      this._brandMenuData = board.startsWith('data:') ? board : null;

      document.getElementById('brand-cover-upload')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const data = await this.compressImage(file, 1400);
        this._brandCoverData = data;
        const img = document.getElementById('brand-cover-preview');
        if (img) img.src = data;
      });
      document.getElementById('brand-menu-upload')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const data = await this.compressImage(file, 1600);
        this._brandMenuData = data;
        const img = document.getElementById('brand-menu-preview');
        if (img) img.src = data;
      });
      document.getElementById('btn-save-cover')?.addEventListener('click', () => this.saveBranding('cover', this._brandCoverData));
      document.getElementById('btn-save-menu-board')?.addEventListener('click', () => this.saveBranding('menu_board', this._brandMenuData));
    },

    async saveBranding(field, dataUrl) {
      if (!dataUrl) {
        if (window.Pusher) window.Pusher.showToast('Upload an image first', 'error');
        return;
      }
      const slug = this.kitchen?.slug || 'akwabalx';
      const brand = { [field]: dataUrl };
      const result = await window.KitchenStore.saveBrandingCloud(slug, this.kitchen?.id, brand);
      this.kitchen = window.KitchenStore.normalizeKitchen(this.kitchen, slug);
      if (window.Pusher) {
        window.Pusher.showToast(
          result.warning ? `${field} saved locally` : `${field === 'cover' ? 'Title image' : 'Menu card'} live on guest page`,
          result.warning ? 'info' : 'success'
        );
      }
      if (window.Flowee) window.Flowee.talk(true, 'Branding updated — guests see it now.', 'celebrate');
    },

    renderMenuEditor() {
      const el = document.getElementById('kitchen-menu-editor');
      if (!el) return;
      const items = this.menu.length ? this.menu : (window.AKWABA_KITCHEN?.menu || []);
      const rows = items.map((item) => {
        const id = item.id || item.slug || item.name;
        const avail = item.is_available !== false;
        const img = item.image_url || item.image || '/Assets/kitchens/akwabalx/logo-fallback.png';
        const imgWeb = this.mediaSrc(img);
        return `<div class="menu-edit-row flex-col" data-item-id="${escapeHtml(id)}">
          <div class="flex items-start gap-2 w-full">
            <div class="relative w-16 h-16 bg-black/40 border border-white/10 rounded overflow-hidden flex-shrink-0">
                <img src="${escapeHtml(imgWeb)}" class="w-full h-full object-cover menu-item-img-preview" id="img-prev-${escapeHtml(id)}"
                  onerror="this.onerror=null;this.src='${escapeHtml(img)}'">
                <label class="absolute inset-0 flex items-center justify-center bg-black/50 text-[9px] text-white cursor-pointer opacity-0 hover:opacity-100 transition">
                    UPLOAD
                    <input type="file" class="hidden menu-img-upload" data-upload-id="${escapeHtml(id)}" accept="image/*">
                </label>
            </div>
            <div class="flex-1 min-w-0">
              <input class="menu-name w-full bg-transparent font-bold text-sm border-b border-white/10 mb-1" value="${escapeHtml(item.name)}" data-field="name">
              <input class="menu-desc w-full bg-transparent text-[10px] text-white/50 border-b border-white/5 mb-1" value="${escapeHtml(item.description || '')}" data-field="description" placeholder="Description">
              <div class="flex gap-2 items-center mt-1">
                <input class="menu-price w-16 bg-black/40 text-[10px] px-2 py-1 rounded border border-white/10" type="number" step="0.01" value="${parseFloat(item.price_eur || 0).toFixed(2)}" data-field="price_eur">
                <select class="menu-cat text-[10px] bg-black/40 border border-white/10 rounded px-1" data-field="category">
                  ${['main', 'combo', 'vegan', 'drink', 'dessert'].map((c) => `<option value="${c}" ${item.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <button type="button" class="menu-save text-[9px] px-2 py-1 border border-[var(--gold)]/50 text-[var(--gold)] rounded" data-save-id="${escapeHtml(id)}">SAVE</button>
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <button type="button" class="menu-toggle ${avail ? 'on' : ''}" data-menu-id="${escapeHtml(id)}">${avail ? 'LIVE' : 'OFF'}</button>
              <button type="button" class="menu-del text-[9px] text-red-400/70" data-del-id="${escapeHtml(id)}">✕</button>
            </div>
          </div>
        </div>`;
      }).join('');
      el.innerHTML = (rows || '<p class="text-white/40 text-xs p-4">No menu items yet.</p>') + `
        <div class="p-3 border-t border-white/10 bg-black/20">
          <p class="text-[9px] uppercase tracking-widest text-[var(--sage)] mb-2">Add dish</p>
          <div class="flex flex-col gap-2" id="menu-add-form">
            <input id="new-item-name" class="bg-black/50 border border-white/10 rounded px-2 py-2 text-xs" placeholder="Dish name">
            <input id="new-item-desc" class="bg-black/50 border border-white/10 rounded px-2 py-2 text-xs" placeholder="Description">
            <div class="flex gap-2">
              <input id="new-item-price" type="number" step="0.01" class="flex-1 bg-black/50 border border-white/10 rounded px-2 py-2 text-xs" placeholder="€ price">
              <button type="button" id="btn-add-menu-item" class="px-3 py-2 bg-[var(--sage)] text-black text-xs font-bold rounded">+ ADD</button>
            </div>
          </div>
        </div>`;
      el.querySelectorAll('.menu-toggle').forEach((btn) => {
        btn.addEventListener('click', () => this.toggleMenuItem(btn.dataset.menuId, btn));
      });
      el.querySelectorAll('.menu-save').forEach((btn) => {
        btn.addEventListener('click', () => this.saveMenuItem(btn.dataset.saveId, btn.closest('.menu-edit-row')));
      });
      el.querySelectorAll('.menu-del').forEach((btn) => {
        btn.addEventListener('click', () => this.deleteMenuItem(btn.dataset.delId));
      });
      el.querySelectorAll('.menu-img-upload').forEach((input) => {
        input.addEventListener('change', (e) => this.handleImageUpload(e.target.dataset.uploadId, e.target.files[0]));
      });
      document.getElementById('btn-add-menu-item')?.addEventListener('click', () => this.addMenuItem());
    },

    async handleImageUpload(id, file) {
      if (!file) return;
      if (window.Pusher) window.Pusher.showToast('Compressing image...', 'info');
      try {
        const compressed = await this.compressImage(file);
        const itemIdx = this.menu.findIndex(i => (i.id || i.slug || i.name) === id);
        if (itemIdx >= 0) {
           this.menu[itemIdx].image_url = compressed;
           const preview = document.getElementById(`img-prev-${id}`);
           if (preview) preview.src = compressed;
           const slug = this.kitchen?.slug || 'akwabalx';
           const result = await window.KitchenStore.saveMenuItem(slug, this.kitchen?.id, id, { image_url: compressed });
           const msg = result.warning ? 'Image saved on this device' : 'Image uploaded and synced';
           if (window.Pusher) window.Pusher.showToast(msg, result.warning ? 'info' : 'success');
           if (window.Flowee) window.Flowee.talk(true, 'Dish image updated! Looking tasty.', 'celebrate');
        }
      } catch (e) {
        if (window.Pusher) window.Pusher.showToast('Failed to process image', 'error');
      }
    },

    compressImage(file, maxSize) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = maxSize || 800;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX) { height *= MAX / width; width = MAX; }
            } else {
              if (height > MAX) { width *= MAX / height; height = MAX; }
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    rowField(row, field) {
      const el = row?.querySelector(`[data-field="${field}"]`);
      return el?.value?.trim() || '';
    },

    async saveMenuItem(id, row) {
      const current = this.menu.find((m) => String(m.id) === String(id));
      const payload = {
        name: this.rowField(row, 'name'),
        description: this.rowField(row, 'description'),
        price_eur: parseFloat(this.rowField(row, 'price_eur')) || 0,
        category: this.rowField(row, 'category') || 'main',
        is_available: current?.is_available !== false,
      };
      if (!payload.name) return;
      const slug = this.kitchen?.slug || 'akwabalx';
      const result = await window.KitchenStore.saveMenuItem(slug, this.kitchen?.id, id, payload);
      await this.loadMenu();
      this.renderMenuEditor();
      const msg = result.warning
        ? `${payload.name} saved on this device`
        : `${payload.name} saved — live on guest menu`;
      if (window.Pusher) window.Pusher.showToast(msg, result.warning ? 'info' : 'success');
    },

    async addMenuItem() {
      const name = document.getElementById('new-item-name')?.value?.trim();
      const description = document.getElementById('new-item-desc')?.value?.trim() || '';
      const price_eur = parseFloat(document.getElementById('new-item-price')?.value) || 0;
      if (!name) return;
      const slug = this.kitchen?.slug || 'akwabalx';
      const payload = {
        kitchen_id: this.kitchen?.id || DEFAULT_KITCHEN_ID,
        name, description, price_eur, category: 'main', is_available: true,
        sort_order: (this.menu.length || 0) + 1,
        image_url: '/Assets/kitchens/akwabalx/logo-fallback.png',
      };
      const result = await window.KitchenStore.insertMenuItem(slug, payload);
      document.getElementById('new-item-name').value = '';
      document.getElementById('new-item-desc').value = '';
      document.getElementById('new-item-price').value = '';
      await this.loadMenu();
      this.renderMenuEditor();
      if (window.Flowee) window.Flowee.talk(true, `"${name}" is LIVE on your kitchen page. Guests see it instantly.`, 'celebrate');
      if (result.warning && window.Pusher) window.Pusher.showToast('Saved locally — cloud sync when online', 'info');
    },

    async deleteMenuItem(id) {
      if (!confirm('Remove this dish from the menu?')) return;
      const slug = this.kitchen?.slug || 'akwabalx';
      await window.KitchenStore.deleteMenuItem(slug, this.kitchen?.id, id);
      await this.loadMenu();
      this.renderMenuEditor();
    },

    async toggleMenuItem(id, btn) {
      const turningOn = !btn.classList.contains('on');
      btn.classList.toggle('on', turningOn);
      btn.textContent = turningOn ? 'LIVE' : 'OFF';
      const slug = this.kitchen?.slug || 'akwabalx';
      await window.KitchenStore.saveMenuItem(slug, this.kitchen?.id, id, { is_available: turningOn });
      const item = this.menu.find((m) => String(m.id) === String(id));
      if (item) item.is_available = turningOn;
      if (window.Pusher) window.Pusher.showToast(turningOn ? 'Item LIVE on guest menu' : 'Item hidden', 'success');
    },

    renderQRStudio() {
      const wrap = document.getElementById('kitchen-qr-studio');
      if (!wrap) return;
      const url = kitchenUrl(this.kitchen?.slug);
      wrap.innerHTML = `
        <p class="text-[10px] text-white/50 mb-3">Guests scan → open menu & order. Better than delivery apps — zero commission, full vibe.</p>
        <div class="flex flex-col items-center gap-3">
          <canvas id="kitchen-ops-qr" class="bg-white p-2 rounded-lg"></canvas>
          <p class="text-[9px] text-white/40 font-mono break-all text-center px-2">${escapeHtml(url)}</p>
          <div class="flex gap-2 w-full">
            <button type="button" id="btn-download-qr" class="flex-1 text-xs py-2 border border-[var(--gold)] text-[var(--gold)] rounded-lg">Download QR</button>
            <button type="button" id="btn-share-qr-wa" class="flex-1 text-xs py-2 border border-[var(--sage)] text-[var(--sage)] rounded-lg">WhatsApp</button>
          </div>
          <button type="button" id="btn-print-qr" class="w-full text-xs py-2 bg-white/5 border border-white/10 rounded-lg">Print for bar / event</button>
        </div>`;
      if (window.QRCode) {
        QRCode.toCanvas(document.getElementById('kitchen-ops-qr'), url, { width: 180, margin: 1 });
      }
      document.getElementById('btn-download-qr')?.addEventListener('click', () => {
        const c = document.getElementById('kitchen-ops-qr');
        const a = document.createElement('a');
        a.download = `${this.kitchen?.slug || 'kitchen'}-menu-qr.png`;
        a.href = c.toDataURL('image/png');
        a.click();
        if (window.QuestEngine) window.QuestEngine.fulfillTasteQuest('LQ-T03');
      });
      document.getElementById('btn-share-qr-wa')?.addEventListener('click', () => {
        const text = encodeURIComponent(`Order at ${this.kitchen?.name} — scan & pick up! ${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      });
      document.getElementById('btn-print-qr')?.addEventListener('click', () => window.print());
    },

    renderKitchenSetup() {
      const el = document.getElementById('kitchen-setup-panel');
      if (!el) return;
      el.innerHTML = `
        <p class="text-xs text-white/60 mb-3">Forge your own kitchen realm — menu, QR, crew invites in one flow.</p>
        <form id="kitchen-create-form" class="space-y-2">
          <input id="new-kitchen-name" class="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs" placeholder="Kitchen name (e.g. Soul Bites LX)" required>
          <input id="new-kitchen-slug" class="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs" placeholder="slug (e.g. soulbites)" pattern="[a-z0-9-]+">
          <input id="new-kitchen-tagline" class="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs" placeholder="Tagline">
          <input id="new-kitchen-location" class="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs" placeholder="Location (Lisbon venue)">
          <button type="submit" class="w-full py-3 bg-[var(--gold)] text-black text-xs font-bold uppercase tracking-widest rounded-lg">Create Kitchen</button>
        </form>
        <p class="text-[9px] text-white/30 mt-2">Requires login. You become owner — crew joins via invite code AKWABA-CREW.</p>`;
      document.getElementById('kitchen-create-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createKitchen();
      });
    },

    async createKitchen() {
      if (!window.supabaseClient) {
        if (window.Pusher) window.Pusher.showToast('Login required for kitchen creation', 'error');
        return;
      }
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (!user) {
        window.location.href = `login.html?redirect=${encodeURIComponent('kitchen_workspace.html?tutorial=1')}`;
        return;
      }
      const name = document.getElementById('new-kitchen-name')?.value?.trim();
      let slug = document.getElementById('new-kitchen-slug')?.value?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || name?.toLowerCase().replace(/\s+/g, '').slice(0, 20);
      const tagline = document.getElementById('new-kitchen-tagline')?.value?.trim() || 'Taste the flow';
      const location_name = document.getElementById('new-kitchen-location')?.value?.trim() || 'Lisbon';
      if (!name || !slug) return;
      const payload = {
        slug, name, tagline, location_name, address: 'Lisbon, Portugal',
        lat: 38.72, lng: -9.145, owner_user_id: user.id, is_live: true,
        logo_url: '/Assets/kitchens/akwabalx/logo.png',
        cover_url: '/Assets/kitchens/akwabalx/hero-1.jpg',
        qr_code_data: kitchenUrl(slug),
        discount_note: 'Navigator discount with Akoma rune — scan QR at bar.',
      };
      const { data, error } = await window.supabaseClient.from('kitchens').insert([payload]).select().single();
      if (error) {
        if (window.Pusher) window.Pusher.showToast(error.message, 'error');
        return;
      }
      localStorage.setItem('cdf_active_kitchen', slug);
      const localK = { slug, name, tagline, show_on_radar: true };
      const list = JSON.parse(localStorage.getItem('cdf_my_kitchens') || '[]');
      if (!list.find((x) => x.slug === slug)) {
        list.push(localK);
        localStorage.setItem('cdf_my_kitchens', JSON.stringify(list));
      }
      const radar = JSON.parse(localStorage.getItem('cdf_radar_kitchens') || '[]');
      if (!radar.find((x) => x.slug === slug)) {
        radar.push({ slug, name, tagline, page: `akwaba_kitchen.html?kitchen=${slug}` });
        localStorage.setItem('cdf_radar_kitchens', JSON.stringify(radar));
      }
      if (window.Flowee) window.Flowee.talk(true, `Kitchen "${name}" forged! Add dishes, download QR, invite crew.`, 'celebrate');
      window.location.href = `kitchen_workspace.html?kitchen=${slug}&tutorial=ops`;
    },

    renderStaffPanel() {
      const el = document.getElementById('kitchen-staff-panel');
      if (!el) return;
      el.innerHTML = `
        <div class="text-[10px] text-white/50 mb-2">Crew invite code</div>
        <div class="font-mono text-lg text-[var(--gold)] mb-3">AKWABA-CREW</div>
        <p class="text-[10px] text-white/40 mb-3">Share with pass, bar & service. Staff sees KDS + comms when logged in.</p>
        <a href="akwaba_kitchen.html?kitchen=${escapeHtml(this.kitchen?.slug || 'akwabalx')}" class="block text-center text-xs py-2 border border-white/20 rounded-lg text-white/70">Preview guest menu →</a>`;
    },

    renderSoulTicket() {
      const order = this.selectedOrder || this.orders.find((o) => o.status === 'ready') || this.orders[0];
      if (!order) {
        const status = document.getElementById('ticket-status');
        if (status) status.textContent = 'No active orders';
        return;
      }
      this.selectedOrder = order;
      const items = Array.isArray(order.items) ? order.items : [];
      const title = items.map((i) => i.name).join(', ') || 'Pickup Order';
      const pin = pinFromOrder(order);
      const qrData = JSON.stringify({ kitchen: this.kitchen?.slug, order: order.id, pin });
      const titleEl = document.getElementById('ticket-dish-title');
      const pinEl = document.getElementById('ticket-pin');
      const status = document.getElementById('ticket-status');
      if (titleEl) titleEl.textContent = title;
      if (pinEl) pinEl.textContent = pin;
      if (status) status.textContent = order.status === 'ready' ? 'Ready for pickup' : order.status;
      const img = document.getElementById('ticket-qr-img');
      if (img) img.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}`;
    },

    renderVoucherPanel() {
      const el = document.getElementById('kitchen-voucher-panel');
      if (!el) return;
      el.innerHTML = `
        <input id="voucher-code-input" class="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs font-mono uppercase mb-2" placeholder="NAVIGATOR10" value="NAVIGATOR10">
        <button type="button" id="btn-apply-voucher" class="w-full py-2 text-xs border border-[var(--sage)] text-[var(--sage)] rounded-lg mb-3">Apply Navigator Voucher</button>
        <p class="text-[9px] text-white/40">10% off + 15 XP · Trust points for verified pickup scans.</p>`;
      document.getElementById('btn-apply-voucher')?.addEventListener('click', () => this.applyVoucher());
    },

    async applyVoucher() {
      const code = document.getElementById('voucher-code-input')?.value?.trim().toUpperCase();
      if (!code) return;
      localStorage.setItem('cdf_kitchen_voucher', code);
      await this.grantKitchenReward('soul_ticket_scan');
      if (window.FloweeReward) window.FloweeReward.xpToast(`Voucher ${code} applied`, 15);
      else if (window.Pusher) window.Pusher.showToast(`Voucher ${code} — 10% at bar`, 'success');
    },

    async grantKitchenReward(ruleKey) {
      if (!window.supabaseClient) return;
      try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) await window.supabaseClient.rpc('kitchen_grant_reward', { p_user_id: user.id, p_rule_key: ruleKey, p_kitchen_slug: this.kitchen?.slug || 'akwabalx' });
      } catch (_) { /* optional */ }
    },

    async scanSoulTicket() {
      const order = this.selectedOrder;
      if (!order) {
        if (window.Pusher) window.Pusher.showToast('Select a READY order first', 'error');
        return;
      }
      await this.advanceOrder(order.id, 'picked_up');
      await this.grantKitchenReward('soul_ticket_scan');
      const trust = parseInt(localStorage.getItem('cdf_kitchen_trust') || '0', 10) + 5;
      localStorage.setItem('cdf_kitchen_trust', String(trust));
      const trustEl = document.getElementById('stat-trust');
      if (trustEl) trustEl.textContent = String(trust);
      document.getElementById('ticket-status').textContent = 'Delivered';
      document.getElementById('ticket-status').style.color = 'var(--sage)';
      if (window.QuestEngine) window.QuestEngine.fulfillTasteQuest('LQ-T04');
      if (window.FloweeReward) window.FloweeReward.xpToast('Soul Ticket scan — guest +20 XP, kitchen +5 Trust', 20);
    },

    async submitRating(val) {
      const key = `cdf_kitchen_ratings_${this.kitchen?.slug}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(val);
      localStorage.setItem(key, JSON.stringify(list));
      this.stats.avgRating = (list.reduce((a, b) => a + b, 0) / list.length).toFixed(1);
      this.renderStats();
      if (val >= 4) await this.grantKitchenReward('five_star_vibe');
      if (window.FloweeReward) window.FloweeReward.xpToast(`${val}-flame vibe sent`, 15);
      document.getElementById('soul-ticket')?.classList.remove('is-flipped');
    },

    renderComm() {
      const log = document.getElementById('kitchen-comm-log');
      if (!log) return;
      log.innerHTML = this.messages.map((m) =>
        `<div class="comm-msg"><span class="comm-who">${escapeHtml(m.sender_name)}</span><span class="comm-body">${escapeHtml(m.body)}</span></div>`
      ).join('') || '<p class="text-white/30 text-xs">No messages — post rush orders, 86 items, @Flowee briefings.</p>';
      log.scrollTop = log.scrollHeight;
    },

    bindPanels() {
      this.bindCommForm();
      document.getElementById('btn-scan-ticket')?.addEventListener('click', () => this.scanSoulTicket());
      document.querySelectorAll('.flame').forEach((f, i) => {
        f.addEventListener('click', () => {
          document.querySelectorAll('.flame').forEach((el, j) => el.classList.toggle('active', j < i + 1));
        });
      });
      document.getElementById('btn-send-rating')?.addEventListener('click', () => {
        const active = document.querySelectorAll('.flame.active').length || 3;
        this.submitRating(active);
      });
      window.flipTicket = () => document.getElementById('soul-ticket')?.classList.toggle('is-flipped');
    },

    bindCommForm() {
      const form = document.getElementById('kitchen-comm-form');
      const input = document.getElementById('kitchen-comm-input');
      if (!form || !input) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = input.value.trim();
        if (!body) return;
        await this.sendMessage(body);
        input.value = '';
      });
    },

    async sendMessage(body) {
      const name = localStorage.getItem('cdf_user_username') || 'Chef';
      const payload = { kitchen_id: this.kitchen?.id || DEFAULT_KITCHEN_ID, sender_name: name, body, channel: 'ops' };
      if (window.supabaseClient) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) payload.sender_id = user.id;
        const { error } = await window.supabaseClient.from('kitchen_messages').insert([payload]);
        if (error) { if (window.Pusher) window.Pusher.showToast(error.message, 'error'); return; }
      } else {
        const localKey = `cdf_kitchen_msgs_${this.kitchen?.slug || 'akwabalx'}`;
        const list = JSON.parse(localStorage.getItem(localKey) || '[]');
        list.push({ ...payload, id: Date.now(), created_at: new Date().toISOString() });
        localStorage.setItem(localKey, JSON.stringify(list));
        this.messages = list;
        this.renderComm();
      }
      await this.loadMessages();
      this.renderComm();
      if (window.Flowee) window.Flowee.talk(true, `Relayed to crew: "${body}"`, 'guide');
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('kitchen-kds-board')) window.KitchenOps.init();
  });
})();
