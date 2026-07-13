/**
 * Flavor Quest Engine — quest progress, feedback, XP grants
 */
(function () {
  const QUESTS = [
    { id: 'LQ-FQ01', type: 'order', titleKey: 'fq01_title', descKey: 'fq01_desc', xp: 100, flow: 15 },
    { id: 'LQ-FQ02', type: 'feedback', titleKey: 'fq02_title', descKey: 'fq02_desc', xp: 150, flow: 20, requiresPhoto: true },
    { id: 'LQ-FQ03', type: 'share', titleKey: 'fq03_title', descKey: 'fq03_desc', xp: 80, flow: 10 },
    { id: 'LQ-FQ04', type: 'scan', titleKey: 'fq04_title', descKey: 'fq04_desc', xp: 120, flow: 15 },
    { id: 'LQ-FQ05', type: 'streak', titleKey: 'fq05_title', descKey: 'fq05_desc', xp: 500, flow: 50, ordersRequired: 3, days: 7 },
    { id: 'LQ-FQ06', type: 'visit', titleKey: 'fq06_title', descKey: 'fq06_desc', xp: 60, flow: 10 },
  ];

  const COPY = {
    de: {
      fq01_title: 'Der erste Biss', fq01_desc: 'Bestelle ein Hauptgericht in einer Taste-Kitchen.',
      fq02_title: 'Flavor Log', fq02_desc: 'Hinterlasse Feedback mit Foto im Flavor Log.',
      fq03_title: 'Kitchen QR Pulse', fq03_desc: 'Lade Kitchen-QR herunter oder teile per WhatsApp.',
      fq04_title: 'Soul Ticket Scan', fq04_desc: 'Pickup abgeschlossen — Soul Ticket an der Bar gescannt.',
      fq05_title: 'Der Stammgast', fq05_desc: '3 Bestellungen innerhalb von 7 Tagen.',
      fq06_title: 'Taste Radar', fq06_desc: 'Öffne Taste Radar und betritt eine Kitchen.',
    },
    en: {
      fq01_title: 'The First Bite', fq01_desc: 'Order any main dish from a Taste kitchen.',
      fq02_title: 'Flavor Log', fq02_desc: 'Leave feedback with photo in the Flavor Log.',
      fq03_title: 'Kitchen QR Pulse', fq03_desc: 'Download kitchen QR or share via WhatsApp.',
      fq04_title: 'Soul Ticket Scan', fq04_desc: 'Complete pickup — Soul Ticket scanned at bar.',
      fq05_title: 'The Regular', fq05_desc: 'Order 3 times within 7 days.',
      fq06_title: 'Taste Radar', fq06_desc: 'Open Taste Radar and enter a kitchen.',
    },
    pt: {
      fq01_title: 'A Primeira Mordida', fq01_desc: 'Peça um prato principal numa cozinha Taste.',
      fq02_title: 'Flavor Log', fq02_desc: 'Deixe feedback com foto no Flavor Log.',
      fq03_title: 'Kitchen QR Pulse', fq03_desc: 'Descarregue QR ou partilhe no WhatsApp.',
      fq04_title: 'Soul Ticket Scan', fq04_desc: 'Pickup concluído — Soul Ticket na barra.',
      fq05_title: 'O Regular', fq05_desc: '3 pedidos em 7 dias.',
      fq06_title: 'Taste Radar', fq06_desc: 'Abra o Taste Radar e entre numa cozinha.',
    },
  };

  function progressKey() { return 'cdf_flavor_quest_progress'; }
  function ordersKey() { return 'cdf_flavor_order_log'; }

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(progressKey()) || '{}'); }
    catch { return {}; }
  }

  function saveProgress(p) {
    localStorage.setItem(progressKey(), JSON.stringify(p));
    window.dispatchEvent(new CustomEvent('FLAVOR_QUEST_UPDATED'));
  }

  function lang() {
    return window.TasteI18n?.lang || localStorage.getItem('cdf_lang') || 'de';
  }

  function label(q, field) {
    return (COPY[lang()] || COPY.en)[q[field]] || q.id;
  }

  window.FlavorQuestEngine = {
    quests: QUESTS,

    getStatus(questId) {
      const p = getProgress();
      if (!p[questId]) {
        if (questId === 'LQ-FQ01' || questId === 'LQ-FQ06') return 'active';
        return 'locked';
      }
      return p[questId].status || 'locked';
    },

    setStatus(questId, status, meta) {
      const p = getProgress();
      p[questId] = { status, ...meta, at: Date.now() };
      saveProgress(p);
    },

    evaluateLocks() {
      const p = getProgress();
      if (!p['LQ-FQ01']) this.setStatus('LQ-FQ01', 'active');
      if (p['LQ-FQ01']?.status === 'completed' && !p['LQ-FQ02']) this.setStatus('LQ-FQ02', 'active');
      if (p['LQ-FQ02']?.status === 'completed' && !p['LQ-FQ03']) this.setStatus('LQ-FQ03', 'active');
      const orders = this.getOrderLog().length;
      if (orders >= 1 && p['LQ-FQ04']?.status === 'locked') this.setStatus('LQ-FQ04', 'active');
      if (orders >= 1 && p['LQ-FQ05']?.status === 'locked') this.setStatus('LQ-FQ05', 'active');
      if (!p['LQ-FQ06']) this.setStatus('LQ-FQ06', 'active');
      this.checkStreak();
    },

    getOrderLog() {
      try { return JSON.parse(localStorage.getItem(ordersKey()) || '[]'); }
      catch { return []; }
    },

    logOrder(kitchenSlug, items) {
      const log = this.getOrderLog();
      log.push({ kitchenSlug, items, at: Date.now() });
      localStorage.setItem(ordersKey(), JSON.stringify(log));
      const hasMain = (items || []).some((i) => ['main', 'combo'].includes(i.category));
      if (hasMain || (items || []).length) {
        this.setStatus('LQ-FQ01', 'claimable', { kitchenSlug });
      }
      this.checkStreak();
      this.evaluateLocks();
    },

    checkStreak() {
      const week = 7 * 24 * 60 * 60 * 1000;
      const recent = this.getOrderLog().filter((o) => Date.now() - o.at < week);
      if (recent.length >= 3) this.setStatus('LQ-FQ05', 'claimable', { count: recent.length });
    },

    onEvent(type, payload) {
      switch (type) {
        case 'order':
          this.logOrder(payload?.kitchenSlug, payload?.items);
          break;
        case 'share_qr':
          this.setStatus('LQ-FQ03', 'claimable');
          break;
        case 'soul_scan':
          this.setStatus('LQ-FQ04', 'claimable', payload);
          break;
        case 'radar_visit':
          this.setStatus('LQ-FQ06', 'claimable', payload);
          break;
        case 'feedback':
          if (payload?.photo) this.setStatus('LQ-FQ02', 'claimable', payload);
          break;
        default:
          break;
      }
      this.evaluateLocks();
    },

    async claim(questId) {
      const q = QUESTS.find((x) => x.id === questId);
      const st = this.getStatus(questId);
      if (!q || st !== 'claimable') return false;

      if (window.supabaseClient) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
          try {
            await window.supabaseClient.rpc('flavor_fulfill_quest', { p_user_id: user.id, p_quest_id: questId });
          } catch (_) { /* local fallback */ }
        }
      }

      if (window.QuestEngine?.grantReward) await window.QuestEngine.grantReward(questId, q.xp, label(q, 'titleKey'));
      else if (window.FloweeReward) window.FloweeReward.xpToast(`+${q.xp} XP`, q.xp);

      this.setStatus(questId, 'completed');
      if (window.Pusher) window.Pusher.showToast(`+${q.xp} XP · ${label(q, 'titleKey')}`, 'success');
      return true;
    },

    async submitFeedback({ kitchenSlug, rating, body, photoDataUrl }) {
      const payload = {
        kitchen_slug: kitchenSlug || 'akwabalx',
        rating: rating || 5,
        body: body || '',
        photo_url: photoDataUrl || null,
        quest_id: 'LQ-FQ02',
      };

      if (window.supabaseClient) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) payload.user_id = user.id;
        try {
          await window.supabaseClient.from('kitchen_feedback').insert([payload]);
        } catch (e) { console.warn('[FlavorQuest] feedback', e.message); }
      }

      localStorage.setItem(`cdf_flavor_feedback_${Date.now()}`, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('cdf-flavor-log', { detail: payload }));
      this.onEvent('feedback', { photo: !!photoDataUrl, rating, body });
      return true;
    },

    renderQuests(containerId) {
      const grid = document.getElementById(containerId);
      if (!grid) return;
      this.evaluateLocks();
      grid.innerHTML = '';
      const claimLbl = window.TasteI18n?.t('tw.flavor.claim') || 'Claim XP';
      const lockedLbl = window.TasteI18n?.t('tw.flavor.locked') || 'Locked';
      const progLbl = window.TasteI18n?.t('tw.flavor.progress') || 'In progress';
      const doneLbl = window.TasteI18n?.t('tw.flavor.done') || 'Done';

      QUESTS.forEach((q) => {
        const st = this.getStatus(q.id);
        let btn = '';
        if (st === 'claimable') {
          btn = `<button type="button" class="mt-4 w-full py-2 bg-[#00ff00] text-black font-bold uppercase text-xs" data-claim="${q.id}">${claimLbl} +${q.xp}</button>`;
        } else if (st === 'completed') {
          btn = `<div class="mt-4 py-2 text-center text-xs text-[#00ff00] uppercase">${doneLbl}</div>`;
        } else if (st === 'active') {
          btn = `<div class="mt-4 py-2 border border-white/20 text-center text-xs text-white/50 uppercase">${progLbl}</div>`;
        } else {
          btn = `<div class="mt-4 py-2 text-center text-xs text-white/20 uppercase">🔒 ${lockedLbl}</div>`;
        }
        const card = document.createElement('div');
        card.className = `quest-card p-6 rounded-lg ${st === 'completed' ? 'completed' : ''}`;
        card.innerHTML = `
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-lg">${label(q, 'titleKey')}</h3>
            <span class="text-[#00ff00] font-mono text-sm">+${q.xp} XP</span>
          </div>
          <p class="text-sm text-white/70">${label(q, 'descKey')}</p>${btn}`;
        grid.appendChild(card);
      });

      grid.querySelectorAll('[data-claim]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await this.claim(btn.dataset.claim);
          this.renderQuests(containerId);
        });
      });
    },
  };

  window.addEventListener('KITCHEN_ORDER_PLACED', (e) => {
    window.FlavorQuestEngine?.onEvent('order', e.detail);
  });
})();
