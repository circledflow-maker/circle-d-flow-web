/**
 * Kitchen Ops — KDS board, menu toggles, crew comms (Supabase + local fallback)
 */
(function () {
  const KITCHEN_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.KitchenOps = {
    kitchen: null,
    orders: [],
    menu: [],
    messages: [],
    channel: null,

    async init(slug) {
      const params = new URLSearchParams(window.location.search);
      const kitchenSlug = slug || params.get('kitchen') || 'akwabalx';
      if (window.KitchenEngine) await window.KitchenEngine.load(kitchenSlug);
      this.kitchen = window.KitchenEngine?.kitchen || window.AKWABA_KITCHEN;
      await Promise.all([this.loadOrders(), this.loadMenu(), this.loadMessages()]);
      this.renderKDS();
      this.renderMenuEditor();
      this.renderComm();
      this.bindCommForm();
      this.subscribeRealtime();
      if (window.FloweeKitchenTour && !localStorage.getItem('cdf_kitchen_ops_tour_v1')) {
        setTimeout(() => window.FloweeKitchenTour.start(true), 800);
      }
    },

    async loadOrders() {
      if (!window.supabaseClient || !this.kitchen?.id) {
        this.orders = JSON.parse(localStorage.getItem('cdf_kitchen_orders_local') || '[]');
        return;
      }
      try {
        const { data } = await window.supabaseClient
          .from('kitchen_orders')
          .select('*')
          .eq('kitchen_id', this.kitchen.id)
          .in('status', ['pending', 'confirmed', 'in_progress', 'ready'])
          .order('created_at', { ascending: true });
        this.orders = data || [];
      } catch (e) {
        console.warn('[KitchenOps] orders', e.message);
        this.orders = [];
      }
    },

    async loadMenu() {
      if (!window.supabaseClient || !this.kitchen?.id) {
        this.menu = window.KitchenEngine?.menu || window.AKWABA_KITCHEN?.menu || [];
        return;
      }
      try {
        const { data } = await window.supabaseClient
          .from('kitchen_menu_items')
          .select('*')
          .eq('kitchen_id', this.kitchen.id)
          .order('sort_order');
        this.menu = data || [];
      } catch (e) {
        this.menu = window.KitchenEngine?.menu || [];
      }
    },

    async loadMessages() {
      const localKey = `cdf_kitchen_msgs_${this.kitchen?.slug || 'akwabalx'}`;
      if (!window.supabaseClient || !this.kitchen?.id) {
        this.messages = JSON.parse(localStorage.getItem(localKey) || '[]');
        return;
      }
      try {
        const { data } = await window.supabaseClient
          .from('kitchen_messages')
          .select('*')
          .eq('kitchen_id', this.kitchen.id)
          .eq('channel', 'ops')
          .order('created_at', { ascending: true })
          .limit(80);
        this.messages = data || [];
      } catch (e) {
        this.messages = JSON.parse(localStorage.getItem(localKey) || '[]');
      }
    },

    subscribeRealtime() {
      if (!window.supabaseClient || !this.kitchen?.id) return;
      if (this.channel) window.supabaseClient.removeChannel(this.channel);
      this.channel = window.supabaseClient
        .channel(`kitchen-ops-${this.kitchen.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_orders', filter: `kitchen_id=eq.${this.kitchen.id}` }, () => {
          this.loadOrders().then(() => this.renderKDS());
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kitchen_messages', filter: `kitchen_id=eq.${this.kitchen.id}` }, () => {
          this.loadMessages().then(() => this.renderComm());
        })
        .subscribe();
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
        ${next ? `<button type="button" class="kds-advance mt-2" data-advance="${order.id}" data-next="${next}">${nextLabel} →</button>` : ''}
      </div>`;
    },

    async advanceOrder(orderId, nextStatus) {
      if (!orderId || !nextStatus) return;
      if (window.supabaseClient) {
        const { error } = await window.supabaseClient
          .from('kitchen_orders')
          .update({ status: nextStatus })
          .eq('id', orderId);
        if (error) {
          if (window.Pusher) window.Pusher.showToast(error.message, 'error');
          return;
        }
      } else {
        const local = JSON.parse(localStorage.getItem('cdf_kitchen_orders_local') || '[]');
        const idx = local.findIndex((o) => o.id === orderId);
        if (idx >= 0) {
          local[idx].status = nextStatus;
          localStorage.setItem('cdf_kitchen_orders_local', JSON.stringify(local));
        }
      }
      if (nextStatus === 'ready' && window.supabaseClient) {
        try {
          const { data: { user } } = await window.supabaseClient.auth.getUser();
          if (user) await window.supabaseClient.rpc('kitchen_grant_reward', { p_user_id: user.id, p_rule_key: 'order_ready' });
        } catch (_) { /* optional */ }
      }
      await this.loadOrders();
      this.renderKDS();
      if (window.Pusher) window.Pusher.showToast(`Order → ${nextStatus}`, 'success');
    },

    renderMenuEditor() {
      const el = document.getElementById('kitchen-menu-editor');
      if (!el) return;
      const rows = (this.menu.length ? this.menu : (window.AKWABA_KITCHEN?.menu || [])).map((item) => {
        const id = item.id || item.slug || item.name;
        const avail = item.is_available !== false;
        return `<div class="menu-edit-row">
          <div class="flex-1">
            <div class="font-bold text-sm">${escapeHtml(item.name)}</div>
            <div class="text-[10px] text-white/50">€${parseFloat(item.price_eur || 0).toFixed(2)} · ${escapeHtml(item.category || 'main')}</div>
          </div>
          <button type="button" class="menu-toggle ${avail ? 'on' : ''}" data-menu-id="${escapeHtml(id)}">${avail ? 'LIVE' : 'OFF'}</button>
        </div>`;
      }).join('');
      el.innerHTML = rows || '<p class="text-white/40 text-xs">No menu items — run sql/kitchen_pipeline_setup.sql</p>';
      el.querySelectorAll('.menu-toggle').forEach((btn) => {
        btn.addEventListener('click', () => this.toggleMenuItem(btn.dataset.menuId, btn));
      });
    },

    async toggleMenuItem(id, btn) {
      const turningOn = !btn.classList.contains('on');
      btn.classList.toggle('on', turningOn);
      btn.textContent = turningOn ? 'LIVE' : 'OFF';
      if (window.supabaseClient && this.kitchen?.id) {
        await window.supabaseClient
          .from('kitchen_menu_items')
          .update({ is_available: turningOn })
          .eq('kitchen_id', this.kitchen.id)
          .eq('id', id);
      }
      if (window.Pusher) window.Pusher.showToast(turningOn ? 'Item live on menu' : 'Item hidden', 'success');
    },

    renderComm() {
      const log = document.getElementById('kitchen-comm-log');
      if (!log) return;
      log.innerHTML = this.messages.map((m) =>
        `<div class="comm-msg"><span class="comm-who">${escapeHtml(m.sender_name)}</span><span class="comm-body">${escapeHtml(m.body)}</span></div>`
      ).join('') || '<p class="text-white/30 text-xs">No messages yet — Flowee listens here.</p>';
      log.scrollTop = log.scrollHeight;
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
      const name = localStorage.getItem('cdf_user_username') || localStorage.getItem('cdf_name') || 'Chef';
      const payload = {
        kitchen_id: this.kitchen?.id || KITCHEN_ID,
        sender_name: name,
        body,
        channel: 'ops',
      };
      if (window.supabaseClient) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) payload.sender_id = user.id;
        const { error } = await window.supabaseClient.from('kitchen_messages').insert([payload]);
        if (error) {
          if (window.Pusher) window.Pusher.showToast(error.message, 'error');
          return;
        }
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
      if (window.Flowee) window.Flowee.talk(true, `Message relayed to kitchen ops: "${body}"`, 'guide');
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('kitchen-kds-board')) window.KitchenOps.init();
  });
})();
