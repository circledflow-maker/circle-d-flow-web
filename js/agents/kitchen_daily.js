/**
 * Kitchen Daily Close — Tagesabschluss, Archiv, Auto 23:30
 */
(function () {
  function archiveKey(slug) {
    return `cdf_kitchen_archive_${slug || 'akwabalx'}`;
  }

  function scansKey(slug, day) {
    return `cdf_kitchen_scans_${slug || 'akwabalx'}_${day}`;
  }

  function todayStr(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  function orderDay(order) {
    const raw = order.created_at || order.updated_at;
    if (!raw) return todayStr();
    return String(raw).slice(0, 10);
  }

  function dishCounts(orders) {
    const map = new Map();
    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it) => {
        const name = it.name || it.title || 'Item';
        map.set(name, (map.get(name) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.KitchenDaily = {
    recordScan(slug) {
      const day = todayStr();
      const key = scansKey(slug, day);
      const n = parseInt(localStorage.getItem(key) || '0', 10) + 1;
      localStorage.setItem(key, String(n));
      return n;
    },

    getScans(slug, day) {
      return parseInt(localStorage.getItem(scansKey(slug, day)) || '0', 10);
    },

    getArchive(slug) {
      try {
        return JSON.parse(localStorage.getItem(archiveKey(slug)) || '[]');
      } catch (_) {
        return [];
      }
    },

    saveArchiveLocal(slug, report) {
      const list = this.getArchive(slug).filter((r) => r.report_date !== report.report_date);
      list.unshift(report);
      localStorage.setItem(archiveKey(slug), JSON.stringify(list.slice(0, 90)));
    },

    hasReportForDay(slug, day) {
      return this.getArchive(slug).some((r) => r.report_date === day);
    },

    buildReport(kitchen, allOrders, day, { auto = false } = {}) {
      const slug = kitchen?.slug || 'akwabalx';
      const dayOrders = (allOrders || []).filter((o) => {
        if (kitchen?.id && o.kitchen_id && o.kitchen_id !== kitchen.id) return false;
        return orderDay(o) === day;
      });
      const picked = dayOrders.filter((o) => o.status === 'picked_up');
      const revenue = picked.reduce((s, o) => s + parseFloat(o.total_eur || 0), 0);
      const ratings = JSON.parse(localStorage.getItem(`cdf_kitchen_ratings_${slug}`) || '[]');
      const avgRating = ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : '4.9';
      const topDishes = dishCounts(picked.length ? picked : dayOrders);
      const scans = this.getScans(slug, day);
      const trust = parseInt(localStorage.getItem('cdf_kitchen_trust') || '0', 10);
      const msgs = JSON.parse(localStorage.getItem(`cdf_kitchen_msgs_${slug}`) || '[]');
      const dayMsgs = msgs.filter((m) => String(m.created_at || '').slice(0, 10) === day);

      return {
        id: `report-${slug}-${day}`,
        report_date: day,
        kitchen_id: kitchen?.id,
        kitchen_slug: slug,
        kitchen_name: kitchen?.name || 'Kitchen',
        generated_at: new Date().toISOString(),
        auto_generated: !!auto,
        orders_total: dayOrders.length,
        orders_picked_up: picked.length,
        orders_ready: dayOrders.filter((o) => o.status === 'ready').length,
        orders_pending: dayOrders.filter((o) => o.status === 'pending').length,
        revenue_eur: Math.round(revenue * 100) / 100,
        soul_scans: scans,
        trust_points: trust,
        avg_vibe: avgRating,
        crew_messages: dayMsgs.length,
        top_dishes: topDishes.slice(0, 8),
        status_breakdown: {
          pending: dayOrders.filter((o) => o.status === 'pending').length,
          confirmed: dayOrders.filter((o) => o.status === 'confirmed').length,
          in_progress: dayOrders.filter((o) => o.status === 'in_progress').length,
          ready: dayOrders.filter((o) => o.status === 'ready').length,
          picked_up: picked.length,
        },
      };
    },

    reportHtml(report) {
      const dishes = (report.top_dishes || [])
        .map((d, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(d.name)}</td><td>${d.qty}</td></tr>`)
        .join('') || '<tr><td colspan="3">—</td></tr>';
      return `
        <div id="daily-report-print" class="daily-report-sheet">
          <header class="daily-report-head">
            <h1 class="cinzel text-[var(--gold)] text-lg tracking-widest">${escapeHtml(report.kitchen_name)}</h1>
            <p class="text-[10px] uppercase tracking-widest text-white/50">Tagesabschluss · ${report.report_date}</p>
            <p class="text-[9px] text-white/40 mt-1">${report.auto_generated ? 'Automatisch 23:30' : 'Manuell erstellt'} · ${new Date(report.generated_at).toLocaleString('de-DE')}</p>
          </header>
          <div class="daily-stat-grid">
            <div><strong>${report.orders_total}</strong><span>Bestellungen</span></div>
            <div><strong>${report.orders_picked_up}</strong><span>Abgeholt</span></div>
            <div><strong>€${Number(report.revenue_eur).toFixed(2)}</strong><span>Umsatz</span></div>
            <div><strong>${report.soul_scans}</strong><span>Soul-Scans</span></div>
            <div><strong>${report.avg_vibe}</strong><span>Vibe</span></div>
            <div><strong>${report.trust_points}</strong><span>Trust</span></div>
          </div>
          <p class="text-[9px] uppercase text-[var(--gold)] mt-4 mb-2">Top Gerichte</p>
          <table class="daily-dish-table"><thead><tr><th>#</th><th>Gericht</th><th>Anz.</th></tr></thead><tbody>${dishes}</tbody></table>
          <p class="text-[9px] text-white/40 mt-3">Crew-Nachrichten: ${report.crew_messages} · Bereit: ${report.status_breakdown?.ready || 0} · Offen: ${report.status_breakdown?.pending || 0}</p>
        </div>`;
    },

    async syncCloud(slug, report) {
      if (!window.KitchenStore) return { ok: false };
      return window.KitchenStore.syncToCloud('save_daily_report', {
        kitchen_id: report.kitchen_id,
        report,
      }, slug);
    },

    async generateReport({ auto = false } = {}) {
      const ops = window.KitchenOps;
      if (!ops) return null;
      const slug = ops.kitchen?.slug || 'akwabalx';
      const day = todayStr();
      if (this.hasReportForDay(slug, day) && auto) return this.getArchive(slug).find((r) => r.report_date === day);

      await ops.loadOrders();
      const report = this.buildReport(ops.kitchen, ops.allOrders || [], day, { auto });
      this.saveArchiveLocal(slug, report);
      const cloud = await this.syncCloud(slug, report);
      if (!cloud.ok && window.Pusher && !auto) {
        window.Pusher.showToast('Archiv lokal gespeichert', 'success');
      } else if (window.Pusher && !auto) {
        window.Pusher.showToast('Tagesabschluss erstellt', 'success');
      }
      this.renderPanel();
      return report;
    },

    printReport(report) {
      const wrap = document.getElementById('kitchen-daily-preview');
      if (!wrap) return;
      wrap.innerHTML = this.reportHtml(report);
      wrap.classList.remove('hidden');
      setTimeout(() => window.print(), 200);
    },

    renderPanel() {
      const el = document.getElementById('kitchen-daily-panel');
      const list = document.getElementById('kitchen-daily-archive');
      const preview = document.getElementById('kitchen-daily-preview');
      if (!el || !list) return;
      const slug = window.KitchenOps?.kitchen?.slug || 'akwabalx';
      const archive = this.getArchive(slug);
      const today = todayStr();
      const hasToday = archive.some((r) => r.report_date === today);

      el.querySelector('#btn-generate-daily')?.classList.toggle('opacity-50', hasToday);

      list.innerHTML = archive.length
        ? archive.map((r) => `
          <div class="daily-archive-row">
            <div>
              <div class="font-bold text-sm text-white">${r.report_date}</div>
              <div class="text-[9px] text-white/40">${r.auto_generated ? 'Auto 23:30' : 'Manuell'} · €${Number(r.revenue_eur).toFixed(2)} · ${r.orders_picked_up} Pickups</div>
            </div>
            <div class="flex gap-1">
              <button type="button" class="daily-archive-btn" data-view="${r.report_date}" title="Ansehen"><span class="material-symbols-outlined text-sm">visibility</span></button>
              <button type="button" class="daily-archive-btn" data-pdf="${r.report_date}" title="PDF"><span class="material-symbols-outlined text-sm">picture_as_pdf</span></button>
            </div>
          </div>`).join('')
        : '<p class="text-white/30 text-xs">Noch keine Abschlüsse — manuell erstellen oder Auto um 23:30.</p>';

      list.querySelectorAll('[data-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const r = archive.find((x) => x.report_date === btn.dataset.view);
          if (r && preview) {
            preview.innerHTML = this.reportHtml(r);
            preview.classList.remove('hidden');
          }
        });
      });
      list.querySelectorAll('[data-pdf]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const r = archive.find((x) => x.report_date === btn.dataset.pdf);
          if (r) this.printReport(r);
        });
      });
    },

    bindPanel() {
      document.getElementById('btn-generate-daily')?.addEventListener('click', () => this.generateReport({ auto: false }));
      this.renderPanel();
    },

    checkAutoClose() {
      const ops = window.KitchenOps;
      if (!ops?.kitchen) return;
      const slug = ops.kitchen.slug || 'akwabalx';
      const now = new Date();
      const day = todayStr(now);
      const mins = now.getHours() * 60 + now.getMinutes();
      const cutoff = 23 * 60 + 30;
      if (mins >= cutoff && !this.hasReportForDay(slug, day)) {
        this.generateReport({ auto: true }).then(() => {
          if (window.Flowee) window.Flowee.talk(true, `Tagesabschluss ${day} automatisch im Archiv hinterlegt.`, 'guide');
        });
      }
    },

    init() {
      this.bindPanel();
      this.checkAutoClose();
      setInterval(() => this.checkAutoClose(), 60000);
    },
  };
})();
