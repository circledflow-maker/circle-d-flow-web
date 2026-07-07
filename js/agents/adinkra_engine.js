/**
 * Adinkra Engine — museum collection, level rewards, challenges, guilds
 */
(function () {
  const MUSEUM_KEY = 'cdf_adinkra_museum';
  const CHALLENGES_KEY = 'cdf_adinkra_challenges_done';

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function tierForLevel(level) {
    if (level >= 20) return 'gold';
    if (level >= 10) return 'silver';
    return 'bronze';
  }

  function modFlowCredits(amount) {
    const cur = parseInt(localStorage.getItem('cdf_wallet_flow') || '0', 10);
    const next = Math.max(0, cur + amount);
    localStorage.setItem('cdf_wallet_flow', String(next));
    if (window.PointsSync) {
      window.PointsSync.cache.flow_credits = (window.PointsSync.cache.flow_credits || 0) + amount;
      window.PointsSync.cache.fp = window.PointsSync.cache.flow_credits;
      window.PointsSync.renderHUD();
    }
    return next;
  }

  function rewardForSymbol(symbolId, source) {
    const cycle = (window.ADINKRA_NATURE_CYCLE || []).find((s) => s.id === symbolId);
    const karma = cycle?.track === 'moon' ? 8 : 5;
    const flow = cycle?.track === 'flow' ? 8 : 5;
    if (source === 'challenge') {
      return { karma: karma + 2, flow: flow + 3 };
    }
    return { karma, flow };
  }

  window.AdinkraEngine = {
    getMuseum() {
      return readJSON(MUSEUM_KEY, {});
    },

    getCompletedChallenges() {
      return readJSON(CHALLENGES_KEY, []);
    },

    isUnlocked(symbolId) {
      const m = this.getMuseum();
      return !!m[symbolId];
    },

    getOwnedSymbolIds() {
      const museum = this.getMuseum();
      const runes = readJSON('cdf_adinkra_runes', {});
      const fromVenues = Object.values(runes).map((r) => r.rune).filter(Boolean);
      return [...new Set([...Object.keys(museum), ...fromVenues])];
    },

    getGuild() {
      const owned = {};
      this.getOwnedSymbolIds().forEach((id) => { owned[id] = true; });
      return window.computeAdinkraGuild?.(owned) || null;
    },

    unlockSymbol(symbolId, opts = {}) {
      if (!symbolId) return null;
      const meta = window.getAdinkraMeta?.(symbolId);
      const canonical = meta?.aliasOf || symbolId;
      const museum = this.getMuseum();
      const hadEntry = museum[canonical];
      if (museum[canonical] && !opts.upgrade) return museum[canonical];
      if (museum[canonical] && opts.upgrade) {
        const rank = { bronze: 1, silver: 2, gold: 3 };
        if (rank[opts.tier] <= rank[museum[canonical].tier]) return museum[canonical];
      }

      const tier = opts.tier || 'bronze';
      const entry = {
        id: canonical,
        tier,
        source: opts.source || 'unknown',
        museum: opts.museum !== false,
        unlockedAt: new Date().toISOString(),
        cycleDay: opts.cycleDay || null,
        level: opts.level || null,
      };
      museum[canonical] = entry;
      writeJSON(MUSEUM_KEY, museum);

      const rewards = !hadEntry ? (opts.rewards || rewardForSymbol(canonical, opts.source)) : null;
      if (rewards?.karma && window.Resonance) window.Resonance.modKarma(rewards.karma);
      if (rewards?.flow) modFlowCredits(rewards.flow);

      window.dispatchEvent(new CustomEvent('ADINKRA_UNLOCKED', { detail: { symbolId: canonical, entry, meta } }));
      window.dispatchEvent(new CustomEvent('RUNE_COLLECTED', { detail: { runeId: canonical, tier, source: opts.source } }));

      return entry;
    },

    onLevelUp(newLevel, prevLevel) {
      const from = Math.max(1, prevLevel || 1);
      const to = Math.max(from, newLevel || 1);
      const unlocked = [];

      for (let lv = from + 1; lv <= to; lv++) {
        if (lv < 2) continue;
        const sym = window.getNatureCycleByLevel?.(lv);
        if (!sym) continue;
        const tier = tierForLevel(lv);
        const entry = this.unlockSymbol(sym.id, {
          source: `level_${lv}`,
          tier,
          museum: true,
          cycleDay: sym.day,
          level: lv,
          rewards: { karma: sym.track === 'moon' ? 10 : 6, flow: sym.track === 'flow' ? 10 : 6 },
        });
        if (entry) {
          unlocked.push({ level: lv, symbol: sym, entry });
          const msg = `Museum: ${sym.label} (#${sym.glossar}) — ${sym.essence}`;
          if (window.Pusher) window.Pusher.showToast(`◈ Lv${lv} · ${sym.label} earned`, 'success');
          if (window.FloweeReward) window.FloweeReward.grantRune(sym.id, tier);
          else if (window.Flowee) window.Flowee.talk(true, msg, 'celebrate');
        }
      }

      const guild = this.getGuild();
      if (guild && unlocked.length) {
        const gMsg = `Your path aligns with ${guild.name}.`;
        if (window.Flowee) window.Flowee.talk(false, gMsg, 'guide');
      }

      return unlocked;
    },

    completeChallenge(challengeId) {
      const ch = window.getAdinkraChallenge?.(challengeId);
      if (!ch) return false;
      const done = this.getCompletedChallenges();
      if (done.includes(challengeId)) return false;

      done.push(challengeId);
      writeJSON(CHALLENGES_KEY, done);

      this.unlockSymbol(ch.reward.symbol, {
        source: 'challenge',
        sourceId: challengeId,
        tier: 'silver',
        museum: true,
        rewards: { karma: ch.reward.karma || 5, flow: ch.reward.flow || 5 },
      });

      if (window.Pusher) window.Pusher.showToast(`Challenge complete — ${ch.title}`, 'success');
      if (window.FloweeReward) window.FloweeReward.grantRune(ch.reward.symbol, 'silver');
      return true;
    },

    getMuseumStats() {
      const museum = this.getMuseum();
      const cycle = window.ADINKRA_NATURE_CYCLE || [];
      const ownedCycle = cycle.filter((s) => museum[s.id]);
      return {
        total: Object.keys(museum).length,
        cycleOwned: ownedCycle.length,
        cycleTotal: cycle.length,
        guild: this.getGuild(),
      };
    },

    renderCodexChip(symbolId, data) {
      const meta = window.getAdinkraMeta?.(symbolId) || {};
      const glyph = window.renderAdinkraGlyph?.(symbolId, data.tier) || '◈';
      const glossar = meta.glossar ? `#${meta.glossar}` : '';
      return `<div class="adinkra-chip ${data.tier || 'bronze'}" title="${meta.meaning || ''}">
        ${glyph}
        <div style="font-size:0.65em;margin-top:4px">${meta.name || symbolId}</div>
        <span style="opacity:0.7;font-size:0.55em">${glossar} · ${(data.tier || 'bronze').toUpperCase()}</span>
      </div>`;
    },
  };
})();
