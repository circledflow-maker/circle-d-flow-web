/**
 * Coop Barkeeper — Flowee guides project planning at the Resonance Bar
 */
(function () {
  const STORAGE_KEY = 'cdf_coop_project';
  const CHAT_KEY = 'cdf_coop_bar_chat';
  const REMINDER_KEY = 'cdf_coop_reminders';
  let saveTimer = null;

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function readReminders() {
    try {
      return JSON.parse(localStorage.getItem(REMINDER_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function writeReminders(list) {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(list));
  }

  const FLOWEE_GUIDE = {
    1: { text: 'Step 1 — Name your session and pick Organic or Social Media. Choose one of six Adinkra souls.', cta: 'Set title & vibe', target: '#coop-phase-form, #coop-phase-form-m' },
    2: { text: 'Step 2 — Assign roles. KyheartLx coordinates, Naru visions, C-riz holds the mic. Swipe crew cards on mobile.', cta: 'Assign crew roles', target: '#coop-crew-grid, #coop-crew-viewport' },
    3: { text: 'Step 3 — Lock location, guests, and gear pack. Lisbon outdoor? Plan rain backup in Phase 4.', cta: 'Pick location & gear', target: '#coop-equipment, #coop-location' },
    4: { text: 'Step 4 — Event date, Plan B, and follow-up for post-production. I will remind you.', cta: 'Set calendar', target: '#coop-event-date, #coop-planb' },
    5: { text: 'Step 5 — Seal The Bon. Download briefing and enter Sanctuary with the crew.', cta: 'Review & seal', target: '#coop-brief-preview, [data-seal="5"]' },
  };

  function clearSpotlight() {
    document.querySelectorAll('.coop-flowee-spotlight').forEach((el) => el.classList.remove('coop-flowee-spotlight'));
  }

  function spotlight(selector) {
    clearSpotlight();
    if (!selector) return;
    const el = document.querySelector(selector.split(',')[0].trim());
    if (!el) return;
    el.classList.add('coop-flowee-spotlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  window.coopFloweeSpotlight = spotlight;

  function readProject() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || createEmptyProject();
    } catch {
      return createEmptyProject();
    }
  }

  function writeProject(p) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    localStorage.setItem('circle_selected_event', JSON.stringify(toEventPayload(p)));
    localStorage.setItem('cdf_latest_event', JSON.stringify(toEventPayload(p)));
    window.dispatchEvent(new CustomEvent('COOP_PROJECT_UPDATED', { detail: p }));
  }

  function createEmptyProject() {
    const crew = {};
    (window.COOP_CORE_CREW || []).forEach((m) => {
      crew[m.id] = { memberId: m.id, name: m.name, roles: [...(m.defaultRoles || [])] };
    });
    return {
      id: 'coop_' + Date.now(),
      title: 'Untitled Session',
      phase: 1,
      phasesDone: [],
      projectType: null,
      scale: null,
      adinkraSoul: null,
      crew,
      guests: [],
      locationId: null,
      locationCustom: '',
      planBLocationId: null,
      equipment: [],
      eventDate: '',
      followUpDate: '',
      chatSummary: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function toEventPayload(p) {
    const loc = (window.COOP_LOCATIONS || []).find((l) => l.id === p.locationId);
    return {
      title: p.title,
      type: p.projectType === 'social_media' ? 'Social Media Production' : 'Organic Gathering',
      date: p.eventDate,
      followUp: p.followUpDate,
      address: loc?.name || p.locationCustom || 'TBA',
      economy: 'Trust / Flow / Karma',
      needs: Object.values(p.crew || {}).flatMap((c) => c.roles || []).map((rid) => window.getCoopRole?.(rid)?.label || rid),
      locationChecks: [loc?.zone, p.planBLocationId ? 'Plan B set' : ''].filter(Boolean),
      adinkra: p.adinkraSoul,
      guests: p.guests,
      equipment: p.equipment,
    };
  }

  function grantRewards(reward, reason) {
    if (!reward) return;
    if (reward.trust) {
      const k = parseInt(localStorage.getItem('cdf_trust_points') || localStorage.getItem('cdf_user_karma') || '0', 10) + reward.trust;
      localStorage.setItem('cdf_trust_points', String(k));
      localStorage.setItem('cdf_user_karma', String(k));
      if (window.ResonanceSystem?.modKarma) window.ResonanceSystem.modKarma(reward.trust);
    }
    if (reward.flow) {
      const f = parseInt(localStorage.getItem('cdf_wallet_flow') || '0', 10) + reward.flow;
      localStorage.setItem('cdf_wallet_flow', String(f));
    }
    if (reward.exp) {
      const e = parseInt(localStorage.getItem('cdf_xp') || localStorage.getItem('cdf_user_xp') || '0', 10) + reward.exp;
      localStorage.setItem('cdf_xp', String(e));
      localStorage.setItem('cdf_user_xp', String(e));
      if (window.GamificationEngine) {
        window.GamificationEngine.state.exp = e;
        window.GamificationEngine.updateHUD?.();
      }
      if (window.PointsSync?.refresh) window.PointsSync.refresh();
    }
    if (window.AdinkraEngine && reward.adinkra) {
      window.AdinkraEngine.unlockSymbol(reward.adinkra, { source: 'coop_phase', tier: 'bronze', museum: true });
    }
    if (window.Pusher) window.Pusher.showToast(`+${reward.exp || 0} EXP · ${reason}`, 'success');
  }

  function getGapRoles(project) {
    const filled = new Set();
    Object.values(project.crew || {}).forEach((c) => (c.roles || []).forEach((r) => filled.add(r)));
    const required = (window.COOP_ROLES || []).filter((r) => r.required).map((r) => r.id);
    return required.filter((id) => !filled.has(id));
  }

  function buildBriefing(project) {
    const loc = (window.COOP_LOCATIONS || []).find((l) => l.id === project.locationId);
    const planB = (window.COOP_LOCATIONS || []).find((l) => l.id === project.planBLocationId);
    const sym = window.getAdinkraMeta?.(project.adinkraSoul) || {};
    const crewLines = Object.values(project.crew || {}).map((c) => {
      const roles = (c.roles || []).map((rid) => window.getCoopRole?.(rid)?.label || rid).join(', ');
      return `• ${c.name}: ${roles || '—'}`;
    }).join('\n');
    const gear = (project.equipment || []).map((id) => {
      const g = (window.COOP_EQUIPMENT || []).find((x) => x.id === id);
      return g?.name || id;
    }).join(', ');
    return `═══ CIRCLE D FLOW · PROJECT BRIEF ═══
Title: ${project.title}
Type: ${project.projectType || '—'} · Scale: ${project.scale || '—'}
Adinkra Soul: ${sym.name || project.adinkraSoul || '—'} — ${sym.meaning || ''}

📍 Location: ${loc?.name || project.locationCustom || 'TBA'}
☔ Plan B: ${planB?.name || 'Not set'}
📅 Event: ${project.eventDate || 'TBA'}
🔄 Follow-Up: ${project.followUpDate || 'TBA'}

CREW
${crewLines}

GUESTS: ${(project.guests || []).join(', ') || 'Core crew only'}
GEAR: ${gear || 'TBD'}

— Sealed by Flowee at the Resonance Bar`;
  }

  function floweeAnswer(text, project) {
    const q = text.toLowerCase();
    const gaps = getGapRoles(project);
    const loc = (window.COOP_LOCATIONS || []).find((l) => l.id === project.locationId);

    if (q.includes('@flowee') || q.startsWith('flowee')) {
      const clean = text.replace(/@flowee/gi, '').trim();
      if (!clean) {
        return `I'm behind the bar, Navigator. We're on Phase ${project.phase}: ${window.COOP_PHASES?.[project.phase - 1]?.title || 'Planning'}. Ask me about roles, gear, locations, or the Adinkra soul for this session.`;
      }
      return floweeAnswer(clean, project);
    }

    if (q.includes('role') || q.includes('crew') || q.includes('wer') || q.includes('who')) {
      if (gaps.length) {
        return `Gap alert: still need ${gaps.map((id) => window.getCoopRole?.(id)?.label || id).join(', ')}. KyheartLx usually coordinates, Naru leads vision/stream, C-riz holds the mic and narrative. Assign in Phase 2.`;
      }
      return 'Crew looks solid. KyheartLx on coordination & photo, Naru on vision & stream, C-riz on host & philosophy — adjust roles if this is a bigger event.';
    }

    if (q.includes('location') || q.includes('lisbon') || q.includes('ort') || q.includes('wetter') || q.includes('weather')) {
      const spot = loc?.name || 'no location locked yet';
      return `Location: ${spot}. For outdoor Lisbon shoots check wind at the river (Praça/Ribeira). Rain? Use Plan B — Secret Garden or ClimaLabs. Golden hour ~1h before sunset at miradouros.`;
    }

    if (q.includes('equipment') || q.includes('gear') || q.includes('pack')) {
      const type = project.projectType || 'organic';
      const list = window.getEquipmentForProject?.(type, project.scale || 'get_together') || [];
      return `For ${type}: ${list.slice(0, 5).map((g) => g.name).join(', ')}${list.length > 5 ? '…' : ''}. Social media adds gimbal + stream kit. Tick items in Phase 3.`;
    }

    if (q.includes('adinkra') || q.includes('symbol') || q.includes('soul')) {
      const sym = window.getCoopAdinkraSoul?.(project.adinkraSoul) || window.getAdinkraMeta?.(project.adinkraSoul);
      const list = (window.COOP_ADINKRA_SOULS || []).map((s) => s.label).join(', ');
      return sym
        ? `Session soul: ${sym.label || sym.name} — ${sym.essence || sym.meaning}. Six coop keys: ${list}.`
        : `Pick one of six Adinkra souls in Phase 1: ${list}. Organic → Adwo, Social Media → Nkyemu, intimate → Akoma.`;
    }

    if (q.includes('calendar') || q.includes('termin') || q.includes('date') || q.includes('follow')) {
      return `Event: ${project.eventDate || 'not set'}. Follow-up post-production: ${project.followUpDate || 'schedule 2–3 days after for edit + social drop'}. I will add both to your briefing bon.`;
    }

    if (q.includes('guest') || q.includes('gäste') || q.includes('liste')) {
      return `Guests: ${(project.guests || []).length ? project.guests.join(', ') : 'none yet'}. For bigger events add local artists + community Navigators from the Flow Finder.`;
    }

    if (q.includes('summary') || q.includes('bon') || q.includes('brief')) {
      return buildBriefing(project);
    }

    if (q.includes('tutorial') || q.includes('walkthrough') || q.includes('anleitung')) {
      if (window.CoopFloweeTutorial) {
        window.CoopFloweeTutorial.start(true);
        return 'Starting the Resonance Bar tutorial — 7 steps: vibe, crew invites, roles, location, calendar, briefing. Naru & C-riz can follow the same flow when they accept your invite.';
      }
      return 'Tap Start Tutorial on the guide card — I walk you through coop planning in about 2 minutes.';
    }

    if (q.includes('invite') || q.includes('einlad') || q.includes('team')) {
      const crew = project.crew || {};
      const linked = (window.COOP_CORE_CREW || []).map((m) => {
        const c = crew[m.id];
        return c?.userId || c?.username ? `${m.name} ✓` : `${m.name} — send invite`;
      }).join(' · ');
      return `Team sync: ${linked}. Use the invite box above — search Naru or C-riz by username. Everyone sees the same plan once linked in Supabase.`;
    }

    if (q.includes('coop') || q.includes('resonance bar') || q.includes('zusammen')) {
      return 'Coop = shared event planning in 5 phases. You earn EXP, Trust (Karma), and Flow per sealed phase. KyheartLx coordinates, Naru vision/stream, C-riz host/MC. Invites sync roles and briefing to the whole crew.';
    }

    if (q.includes('help') || q.includes('hilfe')) {
      return 'Commands: coop, tutorial, invite team, roles, location, equipment, guests, calendar, Adinkra, or "summary". Tag @Flowee anytime. Complete each phase for EXP + Trust + Flow.';
    }

    return `Noted. For "${text.slice(0, 40)}…" — check Phase ${project.phase} on the bar. Tag @Flowee with roles, location, gear, or summary questions.`;
  }

  window.askFloweeBarkeeper = function (text) {
    return floweeAnswer(text, readProject());
  };

  window.CoopBarkeeper = {
    project: null,
    chat: [],

    init() {
      this.project = readProject();
      if (window.ArtistProfileSync) {
        const sp = window.ArtistProfileSync.getSoulprint();
        if (sp.completed_at && (this.project.title === 'Untitled Session' || !(this.project.equipment || []).length)) {
          this.project = window.ArtistProfileSync.seedCoopProject(sp);
          writeProject(this.project);
        }
      }
      try {
        this.chat = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
      } catch {
        this.chat = [];
      }
      if (!this.chat.length) {
        this.pushChat('flowee', "Welcome to the Resonance Bar. I'm Flowee — your barkeeper. KyheartLx, Naru, and C-riz: what are we mixing today? Swipe panels on mobile · tag @Flowee anytime.");
      }
      this.renderAll();
      this.guide(true);
      this.checkReminders();
      this.scheduleReminders();
      setInterval(() => this.checkReminders(), 60000);
      window.addEventListener('COOP_PROJECT_UPDATED', () => {
        this.renderAll();
        this.guide();
      });
      window.addEventListener('POINTS_SYNCED', () => this.renderResonanceBar());
      window.addEventListener('COOP_TEAM_LOADED', () => {
        if (window.CoopSync) window.CoopSync.renderTeamStatus();
      });
      if (window.CoopMobile) window.CoopMobile.refresh();
      if (window.CoopSync) window.CoopSync.init();
      if (window.CoopFloweeTutorial && !window.CoopFloweeTutorial.isDone()) {
        window.CoopFloweeTutorial.offer();
      }
    },

    getProject() {
      return this.project;
    },

    save(patch) {
      this.project = { ...this.project, ...patch, updatedAt: new Date().toISOString() };
      writeProject(this.project);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        this.scheduleReminders();
        this.guide();
      }, 400);
    },

    saveNow(patch) {
      clearTimeout(saveTimer);
      this.project = { ...this.project, ...patch, updatedAt: new Date().toISOString() };
      writeProject(this.project);
      this.scheduleReminders();
      this.guide();
    },

    guide(speak) {
      const ph = this.project?.phase || 1;
      const g = FLOWEE_GUIDE[ph] || FLOWEE_GUIDE[1];
      const el = document.getElementById('flowee-guide-text');
      const cta = document.getElementById('flowee-guide-cta');
      const step = document.getElementById('flowee-guide-step');
      if (el) el.textContent = g.text;
      if (step) step.textContent = `Phase ${ph} / 5`;
      spotlight(g.target);
      if (cta) {
        cta.textContent = g.cta;
        cta.onclick = () => {
          const form = document.getElementById('coop-phase-form') || document.getElementById('coop-phase-form-m');
          form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (window.CoopMobile) window.CoopMobile.goPanel(1);
          if (window.Flowee) window.Flowee.talk(false, g.text, 'guide');
          this.pushChat('flowee', g.text);
        };
      }
      if (speak && window.Flowee) {
        const last = parseInt(localStorage.getItem('cdf_coop_guide_spoken') || '0', 10);
        if (last !== ph) {
          localStorage.setItem('cdf_coop_guide_spoken', String(ph));
          window.Flowee.talk(true, g.text, 'guide');
        }
      }
    },

    notify(title, body, tag) {
      if (window.FloweeNotify) window.FloweeNotify.send(title, body, tag);
      if (window.Pusher) window.Pusher.showToast(body, 'default');
    },

    scheduleReminders() {
      const p = this.project;
      const list = readReminders().filter((r) => r.projectId !== p.id);
      const now = Date.now();

      if (p.eventDate) {
        const eventMs = new Date(p.eventDate).getTime();
        if (eventMs > now) {
          list.push({ id: 'ev24', projectId: p.id, at: eventMs - 86400000, title: 'Resonance Bar', body: `Tomorrow: ${p.title}`, tag: 'coop-ev', fired: false });
          list.push({ id: 'ev2', projectId: p.id, at: eventMs - 7200000, title: 'Resonance Bar', body: `In 2h: ${p.title} — pack gear`, tag: 'coop-ev', fired: false });
        }
      }
      if (p.followUpDate) {
        const fu = new Date(p.followUpDate).getTime();
        if (fu > now) {
          list.push({ id: 'fu', projectId: p.id, at: fu, title: 'Post-Production', body: `Follow-up: ${p.title} edit & social drop`, tag: 'coop-fu', fired: false });
        }
      }
      if (p.phasesDone.length < 5) {
        list.push({ id: 'resume', projectId: p.id, at: now + 86400000, title: 'Resonance Bar', body: `Continue planning: ${p.title} (Phase ${p.phase}/5)`, tag: 'coop-resume', fired: false });
      }
      writeReminders(list);
    },

    checkReminders() {
      const now = Date.now();
      const list = readReminders();
      let changed = false;
      list.forEach((r) => {
        if (!r.fired && r.at <= now) {
          r.fired = true;
          changed = true;
          this.notify(r.title, r.body, r.tag);
          this.pushChat('flowee', `⏰ Reminder: ${r.body}`);
        }
      });
      if (changed) writeReminders(list);
    },

    completePhase(phaseId) {
      const phase = (window.COOP_PHASES || []).find((p) => p.id === phaseId);
      if (!phase || this.project.phasesDone.includes(phaseId)) return false;

      const valid = this.validatePhase(phaseId);
      if (!valid.ok) {
        if (window.Pusher) window.Pusher.showToast(valid.msg, 'error');
        if (window.Flowee) window.Flowee.talk(true, valid.msg, 'guide');
        return false;
      }

      this.project.phasesDone.push(phaseId);
      if (this.project.phase <= phaseId) this.project.phase = Math.min(5, phaseId + 1);
      grantRewards(phase.reward, phase.title);

      if (phaseId === 5) {
        this.project.chatSummary = buildBriefing(this.project);
        this.pushChat('flowee', 'The Bon is sealed. Briefing saved — open The Sanctuary chatroom or export below.');
        this.addLedgerTasks();
      } else {
        const next = window.COOP_PHASES?.[this.project.phase - 1];
        this.pushChat('flowee', `Phase ${phaseId} complete. +${phase.reward.exp} EXP. Next: ${next?.title || 'Done'} — ${next?.floweePrompt || ''}`);
      }

      writeProject(this.project);
      this.scheduleReminders();
      if (window.Flowee) window.Flowee.talk(true, `${phase.title} secured. Resonance expanded.`, 'celebrate');
      this.renderAll();
      this.guide(true);
      if (window.CoopMobile) window.CoopMobile.refresh();
      return true;
    },

    validatePhase(phaseId) {
      const p = this.project;
      if (phaseId === 1) {
        if (!p.projectType || !p.scale) return { ok: false, msg: 'Choose project type and scale first.' };
        if (!p.title || p.title === 'Untitled Session') return { ok: false, msg: 'Name your session before sealing Phase 1.' };
        return { ok: true };
      }
      if (phaseId === 2) {
        const gaps = getGapRoles(p);
        if (gaps.length) return { ok: false, msg: `Fill required roles: ${gaps.map((id) => window.getCoopRole?.(id)?.label).join(', ')}` };
        return { ok: true };
      }
      if (phaseId === 3) {
        if (!p.locationId && !p.locationCustom) return { ok: false, msg: 'Pick a Lisbon location or enter a custom spot.' };
        if (!(p.equipment || []).length) return { ok: false, msg: 'Select at least one equipment item.' };
        return { ok: true };
      }
      if (phaseId === 4) {
        if (!p.eventDate) return { ok: false, msg: 'Set the event date.' };
        if (!p.planBLocationId) return { ok: false, msg: 'Set Plan B location for Lisbon weather.' };
        if (!p.followUpDate) return { ok: false, msg: 'Schedule post-production follow-up date.' };
        return { ok: true };
      }
      return { ok: true };
    },

    addLedgerTasks() {
      if (!window.GamificationEngine) return;
      const p = this.project;
      const tasks = [
        { title: `Pack gear: ${(p.equipment || []).length} items`, type: 'human', reward: 30 },
        { title: 'Confirm guestlist & comms', type: 'human', reward: 25 },
        { title: 'Post-production edit & master', type: 'system', reward: 50 },
      ];
      tasks.forEach((t) => {
        if (!window.GamificationEngine.state.quests.find((q) => q.title === t.title && q.status !== 'completed')) {
          window.GamificationEngine.addQuest(t.title, t.type, t.reward, 'Crew');
        }
      });
    },

    pushChat(who, text) {
      this.chat.push({ who, text, at: Date.now() });
      if (this.chat.length > 80) this.chat = this.chat.slice(-80);
      localStorage.setItem(CHAT_KEY, JSON.stringify(this.chat));
      this.renderChat();
    },

    sendChat(text) {
      const user = localStorage.getItem('cdf_user_username') || localStorage.getItem('cdf_name') || 'Navigator';
      this.pushChat(user, text);
      const reply = floweeAnswer(text, this.project);
      setTimeout(() => {
        this.pushChat('flowee', reply);
        if (window.Flowee) window.Flowee.talk(false, reply.slice(0, 120), 'guide');
      }, 400);
    },

    toggleRole(memberId, roleId) {
      const crew = { ...this.project.crew };
      const entry = crew[memberId] || { memberId, name: memberId, roles: [] };
      const roles = [...(entry.roles || [])];
      const idx = roles.indexOf(roleId);
      if (idx >= 0) roles.splice(idx, 1);
      else roles.push(roleId);
      crew[memberId] = { ...entry, roles };
      this.save({ crew });
      this.renderCrew();
      this.renderGapAlert();
    },

    toggleEquipment(id) {
      const eq = [...(this.project.equipment || [])];
      const idx = eq.indexOf(id);
      if (idx >= 0) eq.splice(idx, 1);
      else eq.push(id);
      this.save({ equipment: eq });
      this.renderEquipment();
    },

    addGuest(name) {
      const guests = [...(this.project.guests || [])];
      if (name && !guests.includes(name)) guests.push(name);
      this.save({ guests });
      this.renderGuests();
    },

    exportBriefing() {
      const text = buildBriefing(this.project);
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cdf-brief-${this.project.id}.txt`;
      a.click();
    },

    openSanctuary() {
      writeProject(this.project);
      window.location.href = 'chat.html';
    },

    renderAll() {
      this.renderResonanceBar();
      this.renderPhases();
      this.renderPhaseForm();
      this.renderCrew();
      this.renderGapAlert();
      this.renderEquipment();
      this.renderGuests();
      this.renderChat();
      this.renderBriefing();
      this.renderFocus();
      this.guide();
      this.syncMobileMirrors();
      if (window.CoopSync) window.CoopSync.renderTeamStatus();
    },

    renderResonanceBar() {
      const exp = parseInt(localStorage.getItem('cdf_xp') || document.getElementById('res-bar-exp')?.textContent || '0', 10);
      const trust = parseInt(localStorage.getItem('cdf_trust_points') || localStorage.getItem('cdf_user_karma') || '100', 10);
      const flow = parseInt(localStorage.getItem('cdf_wallet_flow') || '0', 10);
      const level = Math.max(1, Math.floor(exp / 200) + 1);
      const pct = ((exp % 200) / 200) * 100;

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('res-bar-exp', exp);
      set('res-bar-tp', trust);
      set('res-bar-flow', flow);
      set('res-bar-level', level);
      const bar = document.getElementById('resonance-progress-bar');
      if (bar) bar.style.width = `${pct}%`;
      const lbl = document.getElementById('resonance-progress-label');
      if (lbl) lbl.textContent = `${exp % 200} / 200 XP to Lv ${level + 1}`;
    },

    renderPhases() {
      const el = document.getElementById('coop-phase-steps');
      const mobile = window.matchMedia('(max-width: 1023px)').matches;
      if (el && !mobile) {
        el.innerHTML = (window.COOP_PHASES || []).map((ph) => {
          const done = this.project.phasesDone.includes(ph.id);
          const active = this.project.phase === ph.id;
          return `<button type="button" class="coop-phase-step ${done ? 'done' : ''} ${active ? 'active' : ''}" data-phase="${ph.id}">
            <span class="material-symbols-outlined text-sm">${done ? 'check_circle' : ph.icon}</span>
            <span>${ph.title}</span>
          </button>`;
        }).join('');
        el.querySelectorAll('.coop-phase-step').forEach((btn) => {
          btn.addEventListener('click', () => {
            this.project.phase = parseInt(btn.dataset.phase, 10);
            writeProject(this.project);
            this.renderPhases();
            this.renderPhaseForm();
            this.guide();
          });
        });
      }
      if (window.CoopMobile) window.CoopMobile.refresh();
    },

    renderPhaseForm() {
      const mobile = window.matchMedia('(max-width: 1023px)').matches;
      const activeId = mobile ? 'coop-phase-form-m' : 'coop-phase-form';
      const inactiveId = mobile ? 'coop-phase-form' : 'coop-phase-form-m';
      const inactiveEl = document.getElementById(inactiveId);
      if (inactiveEl) inactiveEl.innerHTML = '';
      const targets = [document.getElementById(activeId)].filter(Boolean);
      if (!targets.length) return;
      const p = this.project;
      const ph = p.phase;
      let html = '';

      if (ph === 1) {
        html = `
          <label class="coop-label">Session Title</label>
          <input id="coop-title" class="coop-input" value="${escapeHtml(p.title || '')}" placeholder="e.g. C-Riz Release · Tiny Desk">
          <label class="coop-label mt-4">Project Type</label>
          <div class="coop-chip-row">${(window.COOP_PROJECT_TYPES || []).map((t) =>
            `<button type="button" class="coop-chip ${p.projectType === t.id ? 'on' : ''}" data-type="${t.id}">${t.label}</button>`
          ).join('')}</div>
          <p class="text-xs text-white/40 mt-1">${escapeHtml((window.COOP_PROJECT_TYPES || []).find((t) => t.id === p.projectType)?.desc || '')}</p>
          <label class="coop-label mt-4">Scale</label>
          <div class="coop-chip-row">${(window.COOP_SCALES || []).map((s) =>
            `<button type="button" class="coop-chip ${p.scale === s.id ? 'on' : ''}" data-scale="${s.id}">${s.label}</button>`
          ).join('')}</div>
          <label class="coop-label mt-4">Adinkra Soul <span class="text-white/30">(6 resonance keys)</span></label>
          <div class="coop-chip-row coop-adinkra-row">${(window.COOP_ADINKRA_SOULS || []).map((s) =>
            `<button type="button" class="coop-chip coop-adinkra-chip ${p.adinkraSoul === s.id ? 'on' : ''}" data-adinkra="${s.id}" title="${escapeHtml(s.essence)}">${escapeHtml(s.label)}</button>`
          ).join('')}</div>
          <p id="coop-adinkra-hint" class="text-xs text-tao-fire/80 mt-2">${escapeHtml(window.getCoopAdinkraSoul?.(p.adinkraSoul)?.essence || 'Pick a soul — auto-set by vibe & scale')}</p>
          <button type="button" class="coop-seal-btn mt-6" data-seal="1">Seal Phase 1 · +25 EXP</button>`;
      } else if (ph === 2) {
        html = `<p class="text-xs text-white/50 mb-2 coop-swipe-hint lg:hidden">← Swipe crew cards →</p>
          <p id="coop-crew-swipe-label" class="text-[10px] text-tao-fire font-mono mb-2 lg:hidden">1 / 3 · swipe crew</p>
          <div id="coop-crew-viewport" class="coop-swipe-viewport lg:!block lg:!overflow-visible">
            <div id="coop-crew-track" class="coop-crew-track"></div>
          </div>
          <div id="coop-crew-grid" class="space-y-3 hidden lg:block"></div>
          <button type="button" class="coop-seal-btn mt-6" data-seal="2">Seal Phase 2 · +35 EXP</button>`;
      } else if (ph === 3) {
        html = `
          <label class="coop-label">Location</label>
          <select id="coop-location" class="coop-input">${(window.COOP_LOCATIONS || []).map((l) =>
            `<option value="${l.id}" ${p.locationId === l.id ? 'selected' : ''}>${escapeHtml(l.name)}</option>`
          ).join('')}</select>
          <input id="coop-location-custom" class="coop-input mt-2" placeholder="Custom address…" value="${escapeHtml(p.locationCustom || '')}">
          <label class="coop-label mt-4">Guestlist</label>
          <div class="flex gap-2"><input id="coop-guest-input" class="coop-input flex-1" placeholder="Add guest…"><button type="button" id="coop-guest-add" class="coop-chip on">+</button></div>
          <div id="coop-guests" class="flex flex-wrap gap-2 mt-2"></div>
          <label class="coop-label mt-4">Equipment Pack</label>
          <div id="coop-equipment" class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"></div>
          <button type="button" class="coop-seal-btn mt-6" data-seal="3">Seal Phase 3 · +40 EXP</button>`;
      } else if (ph === 4) {
        html = `
          <label class="coop-label">Event Date</label>
          <input type="datetime-local" id="coop-event-date" class="coop-input" value="${p.eventDate || ''}">
          <label class="coop-label mt-4">Plan B Location</label>
          <select id="coop-planb" class="coop-input">${(window.COOP_LOCATIONS || []).map((l) =>
            `<option value="${l.id}" ${p.planBLocationId === l.id ? 'selected' : ''}>${escapeHtml(l.name)}</option>`
          ).join('')}</select>
          <label class="coop-label mt-4">Follow-Up (Post-Production)</label>
          <input type="datetime-local" id="coop-followup" class="coop-input" value="${p.followUpDate || ''}">
          <button type="button" class="coop-seal-btn mt-6" data-seal="4">Seal Phase 4 · +30 EXP</button>`;
      } else {
        html = `
          <pre id="coop-brief-preview" class="coop-brief text-xs text-white/70 whitespace-pre-wrap max-h-48 overflow-y-auto"></pre>
          <div class="flex flex-wrap gap-2 mt-4">
            <button type="button" class="coop-seal-btn" data-seal="5">Seal The Bon · +50 EXP</button>
            <button type="button" id="coop-export" class="coop-chip on">Download Brief</button>
            <button type="button" id="coop-sanctuary" class="coop-chip on">Open Sanctuary Chat</button>
          </div>`;
      }

      targets.forEach((el) => { el.innerHTML = html; this.bindPhaseForm(el); });
      if (ph === 2) this.renderCrew();
      if (ph === 3) { this.renderGuests(); this.renderEquipment(); }
      if (ph === 5) this.renderBriefing();
    },

    bindPhaseForm(el) {
      if (!el) return;
      const p = this.project;
      el.querySelector('#coop-title')?.addEventListener('input', (e) => this.save({ title: e.target.value }));
      el.querySelector('#coop-title')?.addEventListener('change', (e) => this.saveNow({ title: e.target.value }));
      el.querySelectorAll('[data-adinkra]').forEach((b) => b.addEventListener('click', () => {
        this.save({ adinkraSoul: b.dataset.adinkra });
        this.renderPhaseForm();
      }));
      el.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => {
        this.save({ projectType: b.dataset.type, adinkraSoul: window.COOP_ADINKRA_BY_VIBE?.[b.dataset.type] || p.adinkraSoul });
        this.renderPhaseForm();
      }));
      el.querySelectorAll('[data-scale]').forEach((b) => b.addEventListener('click', () => {
        this.save({ scale: b.dataset.scale, adinkraSoul: window.COOP_ADINKRA_BY_VIBE?.[b.dataset.scale] || p.adinkraSoul });
        this.renderPhaseForm();
      }));
      el.querySelector('#coop-location')?.addEventListener('change', (e) => this.save({ locationId: e.target.value }));
      el.querySelector('#coop-location-custom')?.addEventListener('input', (e) => this.save({ locationCustom: e.target.value }));
      el.querySelector('#coop-guest-add')?.addEventListener('click', () => {
        const inp = el.querySelector('#coop-guest-input');
        this.addGuest(inp?.value?.trim());
        if (inp) inp.value = '';
      });
      el.querySelector('#coop-event-date')?.addEventListener('change', (e) => this.saveNow({ eventDate: e.target.value }));
      el.querySelector('#coop-planb')?.addEventListener('change', (e) => this.save({ planBLocationId: e.target.value }));
      el.querySelector('#coop-followup')?.addEventListener('change', (e) => this.saveNow({ followUpDate: e.target.value }));
      el.querySelector('#coop-export')?.addEventListener('click', () => this.exportBriefing());
      el.querySelector('#coop-sanctuary')?.addEventListener('click', () => this.openSanctuary());
      el.querySelectorAll('[data-seal]').forEach((b) => {
        b.addEventListener('click', () => this.completePhase(parseInt(b.dataset.seal, 10)));
      });
    },

    renderCrew() {
      const grid = document.getElementById('coop-crew-grid');
      const track = document.getElementById('coop-crew-track');
      const cards = (window.COOP_CORE_CREW || []).map((member) => this.crewCardHtml(member)).join('');
      if (grid) {
        grid.innerHTML = cards;
        this.bindCrewChips(grid);
      }
      if (track) {
        track.innerHTML = cards;
        this.bindCrewChips(track);
        if (window.CoopMobile) window.CoopMobile.afterCrewRender();
      }
    },

    crewCardHtml(member) {
      const assigned = this.project.crew?.[member.id]?.roles || [];
      return `<div class="coop-crew-card coop-crew-slide">
        <div class="flex items-center gap-3 mb-2">
          <img src="${member.avatar}" class="w-10 h-10 rounded-full border border-tao-fire/30" alt="">
          <div><div class="font-bold text-sm">${escapeHtml(member.name)}</div><div class="text-[10px] text-white/40">${escapeHtml(member.strengths)}</div></div>
        </div>
        <div class="flex flex-wrap gap-1">${(window.COOP_ROLES || []).map((r) =>
          `<button type="button" class="coop-role-chip ${assigned.includes(r.id) ? 'on' : ''}" data-member="${member.id}" data-role="${r.id}">${escapeHtml(r.label)}</button>`
        ).join('')}</div>
      </div>`;
    },

    bindCrewChips(root) {
      root.querySelectorAll('.coop-role-chip').forEach((btn) => {
        btn.addEventListener('click', () => this.toggleRole(btn.dataset.member, btn.dataset.role));
      });
    },

    renderGapAlert() {
      ['coop-gap-alert', 'coop-gap-alert-m'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const gaps = getGapRoles(this.project);
        el.innerHTML = gaps.length
          ? `<span class="material-symbols-outlined text-sm">warning</span> Gaps: ${gaps.map((rid) => window.getCoopRole?.(rid)?.label).join(', ')}`
          : '<span class="material-symbols-outlined text-sm">verified</span> All required roles covered';
        el.className = gaps.length ? 'coop-gap warn' : 'coop-gap ok';
      });
    },

    renderEquipment() {
      const mobile = window.matchMedia('(max-width: 1023px)').matches;
      const root = document.getElementById(mobile ? 'coop-phase-form-m' : 'coop-phase-form');
      const el = root?.querySelector('#coop-equipment') || document.getElementById('coop-equipment');
      if (!el) return;
      const list = window.getEquipmentForProject?.(this.project.projectType || 'organic', this.project.scale || 'get_together') || window.COOP_EQUIPMENT || [];
      el.innerHTML = list.map((g) => {
        const on = (this.project.equipment || []).includes(g.id);
        return `<button type="button" class="coop-eq-chip ${on ? 'on' : ''}" data-eq="${g.id}">
          <span class="material-symbols-outlined text-sm">${g.icon}</span>${g.name}</button>`;
      }).join('');
      el.querySelectorAll('.coop-eq-chip').forEach((b) => b.addEventListener('click', () => this.toggleEquipment(b.dataset.eq)));
    },

    renderGuests() {
      const mobile = window.matchMedia('(max-width: 1023px)').matches;
      const root = document.getElementById(mobile ? 'coop-phase-form-m' : 'coop-phase-form');
      const el = root?.querySelector('#coop-guests') || document.getElementById('coop-guests');
      if (!el) return;
      el.innerHTML = (this.project.guests || []).map((g) =>
        `<span class="coop-guest-tag">${g}</span>`
      ).join('') || '<span class="text-xs text-white/30">No guests yet</span>';
    },

    renderChat() {
      const feed = document.getElementById('coop-bar-chat');
      if (!feed) return;
      feed.innerHTML = this.chat.map((m) => {
        const isFlowee = m.who === 'flowee';
        return `<div class="coop-chat-msg ${isFlowee ? 'flowee' : 'user'}">
          <span class="coop-chat-who">${isFlowee ? '◈ Flowee' : escapeHtml(m.who)}</span>
          <div class="coop-chat-bubble">${escapeHtml(m.text).replace(/\n/g, '<br>')}</div>
        </div>`;
      }).join('');
      feed.scrollTop = feed.scrollHeight;
      this.syncMobileMirrors();
    },

    renderBriefing() {
      const text = buildBriefing(this.project);
      document.querySelectorAll('#coop-brief-preview').forEach((el) => { el.textContent = text; });
    },

    renderFocus() {
      const loc = (window.COOP_LOCATIONS || []).find((l) => l.id === this.project.locationId);
      const title = this.project.title || 'New Session';
      const sub = `${loc?.name || 'Planning'} · Phase ${this.project.phase}/5`;
      [['coop-focus-title', title], ['coop-focus-title-m', title]].forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      });
      [['coop-focus-subtitle', sub], ['coop-focus-subtitle-m', sub]].forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      });
    },

    syncMobileMirrors() {
      const chatHtml = document.getElementById('coop-bar-chat')?.innerHTML;
      const chatM = document.getElementById('coop-bar-chat-m');
      if (chatM && chatHtml) chatM.innerHTML = chatHtml;
      if (window.GamificationEngine?.renderQuests) window.GamificationEngine.renderQuests();
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('coop-bar-root')) window.CoopBarkeeper.init();
  });
})();
