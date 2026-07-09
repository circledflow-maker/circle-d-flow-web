/**
 * Coop Mobile — swipe panels instead of scroll (touch-first)
 */
(function () {
  const MQ = window.matchMedia('(max-width: 1023px)');
  const mobileMounts = [];

  const MOUNT_PLAN = [
    { id: 'coop-hud-block', slot: 'coop-mobile-slot-hud', anchor: 'coop-hud-anchor' },
    { id: 'coop-team-block', slot: 'coop-mobile-slot-team', anchor: 'coop-team-anchor' },
    { id: 'flowee-tutorial-card', slot: 'coop-mobile-slot-tutorial', anchor: 'coop-tutorial-anchor' },
    { id: 'flowee-guide-card', slot: 'coop-mobile-slot-guide', anchor: 'coop-guide-anchor' },
  ];

  function isMobile() {
    return MQ.matches;
  }

  function mountMobileSlots() {
    if (!isMobile()) return;
    MOUNT_PLAN.forEach(({ id, slot, anchor }) => {
      const node = document.getElementById(id);
      const target = document.getElementById(slot);
      if (!node || !target || node.dataset.coopMounted === '1') return;
      mobileMounts.push({
        node,
        anchor: document.getElementById(anchor),
        next: node.nextSibling,
      });
      target.appendChild(node);
      node.dataset.coopMounted = '1';
      node.classList.remove('hidden');
    });
  }

  function restoreDesktopSlots() {
    mobileMounts.forEach(({ node, anchor, next }) => {
      if (!anchor) return;
      if (next) anchor.insertBefore(node, next);
      else anchor.appendChild(node);
      delete node.dataset.coopMounted;
    });
    mobileMounts.length = 0;
  }

  window.CoopMobile = {
    panelIndex: 0,
    phaseIndex: 0,
    crewIndex: 0,

    init() {
      this.bindMainSwipe();
      this.bindPhaseSwipe();
      this.bindCrewSwipe();
      this.bindPhaseNavButtons();
      MQ.addEventListener('change', () => this.onBreakpoint());
      this.onBreakpoint();
    },

    bindPhaseNavButtons() {
      document.getElementById('coop-phase-prev-m')?.addEventListener('click', () => {
        const cur = (window.CoopBarkeeper?.project?.phase || 1) - 1;
        this.goPhase(cur - 1);
      });
      document.getElementById('coop-phase-next-m')?.addEventListener('click', () => {
        const cur = (window.CoopBarkeeper?.project?.phase || 1) - 1;
        this.goPhase(cur + 1);
      });
    },

    onBreakpoint() {
      if (isMobile()) mountMobileSlots();
      else restoreDesktopSlots();
      this.refresh();
      this.goPanel(this.panelIndex);
    },

    refresh() {
      this.renderDots('coop-panel-dots', 4, this.panelIndex, (i) => this.goPanel(i));
      this.renderDots('coop-phase-dots', 5, (window.CoopBarkeeper?.project?.phase || 1) - 1, (i) => {
        if (window.CoopBarkeeper) {
          window.CoopBarkeeper.project.phase = i + 1;
          window.CoopBarkeeper.save({});
          window.CoopBarkeeper.renderPhases();
          window.CoopBarkeeper.renderPhaseForm();
          window.CoopBarkeeper.guide?.();
        }
      });
    },

    renderDots(containerId, count, active, onTap) {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = Array.from({ length: count }, (_, i) =>
        `<button type="button" class="coop-dot ${i === active ? 'active' : ''}" data-i="${i}" aria-label="Panel ${i + 1}"></button>`
      ).join('');
      el.querySelectorAll('.coop-dot').forEach((dot) => {
        dot.addEventListener('click', () => onTap(parseInt(dot.dataset.i, 10)));
      });
    },

    goPanel(i) {
      const track = document.getElementById('coop-panel-track');
      if (!track) return;
      this.panelIndex = Math.max(0, Math.min(3, i));
      track.style.transform = `translateX(-${this.panelIndex * 100}%)`;
      this.renderDots('coop-panel-dots', 4, this.panelIndex, (idx) => this.goPanel(idx));
    },

    goPhase(i) {
      if (!window.CoopBarkeeper) return;
      const ph = Math.max(1, Math.min(5, i + 1));
      window.CoopBarkeeper.project.phase = ph;
      window.CoopBarkeeper.save({});
      const track = document.getElementById('coop-phase-track');
      if (track) track.style.transform = `translateX(-${(ph - 1) * 100}%)`;
      window.CoopBarkeeper.renderPhases();
      window.CoopBarkeeper.renderPhaseForm();
      window.CoopBarkeeper.guide?.();
      this.refresh();
    },

    goCrew(i) {
      const track = document.getElementById('coop-crew-track');
      if (!track) return;
      const max = (window.COOP_CORE_CREW || []).length - 1;
      this.crewIndex = Math.max(0, Math.min(max, i));
      track.style.transform = `translateX(-${this.crewIndex * 100}%)`;
      const label = document.getElementById('coop-crew-swipe-label');
      if (label) label.textContent = `${this.crewIndex + 1} / ${max + 1} · swipe crew`;
    },

    attachSwipe(el, onSwipe) {
      if (!el) return;
      let startX = 0;
      let startY = 0;
      let tracking = false;

      el.addEventListener('touchstart', (e) => {
        if (!isMobile()) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        tracking = true;
      }, { passive: true });

      el.addEventListener('touchend', (e) => {
        if (!tracking || !isMobile()) return;
        tracking = false;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * 0.85) return;
        onSwipe(dx < 0 ? 1 : -1);
      }, { passive: true });
    },

    bindMainSwipe() {
      const viewport = document.getElementById('coop-panel-viewport');
      this.attachSwipe(viewport, (dir) => this.goPanel(this.panelIndex + dir));
    },

    bindPhaseSwipe() {
      const viewport = document.getElementById('coop-phase-viewport')
        || document.getElementById('coop-phase-planner-m');
      this.attachSwipe(viewport, (dir) => {
        const cur = (window.CoopBarkeeper?.project?.phase || 1) - 1;
        this.goPhase(cur + dir);
      });
    },

    bindCrewSwipe() {
      const viewport = document.getElementById('coop-crew-viewport');
      this.attachSwipe(viewport, (dir) => this.goCrew(this.crewIndex + dir));
    },

    afterCrewRender() {
      if (!isMobile()) return;
      const track = document.getElementById('coop-crew-track');
      if (track) track.style.transform = `translateX(-${this.crewIndex * 100}%)`;
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('coop-panel-viewport')) window.CoopMobile.init();
  });
})();
