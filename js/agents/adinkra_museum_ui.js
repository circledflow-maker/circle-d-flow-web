/**
 * Museum UI — Nature Cycle hall, glossary, guild banner
 */
(function () {
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  window.AdinkraMuseum = {
    mount() {
      this.renderGuildBanner();
      this.renderNatureCycleHall();
      this.renderGlossary();
      this.renderChallenges();
      window.addEventListener('ADINKRA_UNLOCKED', () => {
        this.renderGuildBanner();
        this.renderNatureCycleHall();
        this.renderGlossary();
      });
    },

    renderGuildBanner() {
      const el = document.getElementById('adinkra-guild-banner');
      if (!el || !window.AdinkraEngine) return;
      const stats = window.AdinkraEngine.getMuseumStats();
      const g = stats.guild;
      el.innerHTML = g
        ? `<div class="guild-banner-inner">
            <span class="material-symbols-outlined text-gold">shield</span>
            <div>
              <div class="font-cinzel text-sm uppercase tracking-widest text-gold">${esc(g.name)}</div>
              <div class="text-xs opacity-60 italic">${esc(g.motto)}</div>
            </div>
            <div class="text-xs font-mono ml-auto">${stats.cycleOwned}/${stats.cycleTotal} cycle · ${stats.total} total</div>
          </div>`
        : `<div class="guild-banner-inner opacity-60">
            <span class="material-symbols-outlined">lock</span>
            <div class="text-sm italic">Collect ${3} community or craft symbols to join a Guild.</div>
            <div class="text-xs font-mono ml-auto">${stats.cycleOwned}/${stats.cycleTotal} cycle</div>
          </div>`;
    },

    renderNatureCycleHall() {
      const grid = document.getElementById('adinkra-cycle-grid');
      if (!grid || !window.ADINKRA_NATURE_CYCLE) return;
      const museum = window.AdinkraEngine?.getMuseum() || {};
      grid.innerHTML = '';

      window.ADINKRA_NATURE_CYCLE.forEach((sym) => {
        const owned = museum[sym.id];
        const card = document.createElement('div');
        card.className = `exhibit-card adinkra-exhibit ${owned ? '' : 'adinkra-locked'}`;
        const glyphHost = owned
          ? `<div class="adinkra-pedestal-glyph" data-rune="${sym.id}" data-tier="${owned.tier || 'bronze'}"></div>`
          : `<div class="adinkra-pedestal-locked"><span class="material-symbols-outlined">lock</span><span class="text-xs">Resonance Lv ${window.getLevelForCycleDay?.(sym.day) || sym.day + 1}</span></div>`;
        card.innerHTML = `
          <div class="aspect-square bg-gray-50 mb-4 flex items-center justify-center relative adinkra-pedestal">
            ${glyphHost}
            <span class="cycle-badge ${sym.track}">${sym.track === 'moon' ? '☽' : '◎'} ${sym.day}</span>
          </div>
          <h3 class="text-lg font-cinzel font-bold mb-1">${esc(sym.label)}</h3>
          <p class="text-xs text-gold font-mono mb-2">Glossar #${sym.glossar} · ${sym.track === 'moon' ? 'Moon Cycle' : 'Flow Companion'}</p>
          <p class="text-sm font-serif italic opacity-70 adinkra-meaning">${owned ? esc(sym.essence) : 'Level up or complete challenges to unveil meaning.'}</p>`;
        grid.appendChild(card);
        if (owned) {
          const host = card.querySelector('.adinkra-pedestal-glyph');
          if (window.AdinkraGlyph) window.AdinkraGlyph.paintElement(host, sym.id, owned.tier, 72);
          else window.paintAdinkraElement?.(host, sym.id, owned.tier);
        }
      });
    },

    renderGlossary() {
      const list = document.getElementById('adinkra-glossary-list');
      if (!list) return;
      const museum = window.AdinkraEngine?.getMuseum() || {};
      const rows = window.ADINKRA_GLOSSAR_100 || [];
      list.innerHTML = rows.map((row) => {
        const open = !!museum[row.id];
        return `<div class="glossary-row ${open ? 'unlocked' : 'locked'}">
          <span class="glossary-no">#${row.n}</span>
          <span class="glossary-name">${esc(row.name)}</span>
          <span class="glossary-meaning">${open ? esc(row.meaning) : '— unlock via Museum, Atlas, or Challenge —'}</span>
        </div>`;
      }).join('');
    },

    renderChallenges() {
      const el = document.getElementById('adinkra-challenges');
      if (!el || !window.ADINKRA_CHALLENGES) return;
      const done = window.AdinkraEngine?.getCompletedChallenges() || [];
      el.innerHTML = window.ADINKRA_CHALLENGES.map((ch) => {
        const complete = done.includes(ch.id);
        const sym = window.getAdinkraMeta?.(ch.reward.symbol);
        return `<div class="challenge-card ${complete ? 'done' : ''}">
          <div class="flex justify-between items-start gap-2">
            <h4 class="font-cinzel text-sm">${esc(ch.title)}</h4>
            ${complete ? '<span class="text-gold text-xs">✓ Earned</span>' : `<button type="button" class="challenge-claim" data-challenge="${ch.id}">Claim</button>`}
          </div>
          <p class="text-xs opacity-70 mt-1">${esc(ch.desc)}</p>
          <p class="text-xs text-gold mt-2">Reward: ${esc(sym?.name || ch.reward.symbol)} · +${ch.reward.karma} Trust · +${ch.reward.flow} Flow</p>
        </div>`;
      }).join('');

      el.querySelectorAll('.challenge-claim').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.challenge;
          if (window.AdinkraEngine?.completeChallenge(id)) {
            this.renderChallenges();
            this.renderNatureCycleHall();
            this.renderGlossary();
            this.renderGuildBanner();
          } else if (window.Pusher) window.Pusher.showToast('Already claimed or unavailable.', 'default');
        });
      });
    },
  };
})();
