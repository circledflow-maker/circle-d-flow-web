/**
 * Flowee Soulprint — artist profile questionnaire for Connection & Coop
 */
(function () {
  const ARTIST_PATHS = [
    { id: 'musician', label: 'Musician / Producer', type: 'performance' },
    { id: 'visual_creator', label: 'Visual / Photo / Film', type: 'performance' },
    { id: 'performer', label: 'Performer / Dance / Host', type: 'performance' },
    { id: 'service_vendor', label: 'Service / Vendor', type: 'service' },
    { id: 'multi_creator', label: 'Multi-Creator', type: 'performance' },
  ];

  const MUSIC_ROLES = [
    'Vocalist', 'Rapper', 'Producer / Beatmaker', 'DJ', 'Instrumentalist', 'Live Band', 'Sound Engineer',
  ];

  const COOP_ROLE_PICKS = [
    'host', 'audio_engineer', 'dop', 'photographer', 'streamer', 'creative_director',
    'social_bts', 'graphic_design', 'philosopher', 'guest_relations',
  ];

  const EQUIP_QUICK = [
    { id: 'd850', label: 'Camera' },
    { id: 'zoom_h6', label: 'Field Recorder' },
    { id: 'rode_mic', label: 'Mic Kit' },
    { id: 'led_panel', label: 'LED Lights' },
    { id: 'gimbal', label: 'Gimbal' },
    { id: 'stream_pc', label: 'Stream Setup' },
    { id: 'pa_system', label: 'PA / Speakers' },
    { id: 'dj_controller', label: 'DJ Controller' },
  ];

  const LOCATIONS = [
    { id: 'secret_garden', label: 'Secret Garden LX' },
    { id: 'akwaba_kitchen', label: 'Akwaba Kitchen Bar' },
    { id: 'lx_factory', label: 'LX Factory' },
    { id: 'mir_graca', label: 'Miradouro da Graça' },
    { id: 'climalabs', label: 'ClimaLabs Studio' },
  ];

  window.FloweeSoulprint = {
    _data: {},
    _artist: null,
    _artistId: null,
    _onComplete: null,

    t(key) {
      return window.ArtistProfileSync?.t(key) || key;
    },

    msg(html) {
      if (typeof fMsg === 'function') fMsg(html);
      else if (window.Flowee) window.Flowee.talk(true, html, 'guide');
    },

    setInput(html) {
      if (typeof setFInput === 'function') setFInput(html);
    },

    userVal(val) {
      if (typeof uMsg === 'function' && val) uMsg(val);
    },

    chipGrid(items, onclickFn) {
      return `<div class="grid grid-cols-2 gap-2">${items.map((item) => {
        const label = item.label || item;
        const id = item.id || item;
        const safe = String(id).replace(/'/g, "\\'");
        return `<button type="button" onclick="window.FloweeSoulprint.${onclickFn}('${safe}')" class="bg-[#00ffcc]/10 border border-[#00ffcc]/40 text-[#00ffcc] py-2 px-2 rounded text-[10px] font-bold uppercase leading-tight">${label}</button>`;
      }).join('')}</div>`;
    },

    start(artistData, artistId, onComplete) {
      this._artist = artistData;
      this._artistId = artistId;
      this._onComplete = onComplete;
      this._data = { equipmentIds: [], coopRoles: [] };
      if (window.Flowee?.shush) window.Flowee.shush();
      document.getElementById('flowee-overlay')?.classList.remove('hidden');
      this.msg(`Welcome, <b>${artistData?.name || 'Navigator'}</b>. Let's build your Soul Imprint — Connection & Resonance Bar will sync from your answers.`);
      setTimeout(() => this.stepArtistPath(), 1100);
    },

    stepArtistPath() {
      this.msg('First: what kind of artist are you in the Circle? This sets your Cooperation profile.');
      this.setInput(this.chipGrid(ARTIST_PATHS, 'pickArtistPath'));
    },

    pickArtistPath(id) {
      const path = ARTIST_PATHS.find((p) => p.id === id) || ARTIST_PATHS[0];
      this._data.artistPath = path.id;
      this._data.artist_type = path.type;
      this._data.is_musician = path.id === 'musician';
      this.userVal(path.label);
      if (path.id === 'service_vendor') {
        setTimeout(() => this.stepServiceType(), 500);
      } else if (path.id === 'musician') {
        setTimeout(() => this.stepMusicRole(), 500);
      } else {
        setTimeout(() => this.stepDiscipline(), 500);
      }
    },

    stepMusicRole() {
      this.msg('Musician profile — what is your primary lane?');
      this.setInput(this.chipGrid(MUSIC_ROLES.map((r) => ({ id: r, label: r })), 'pickMusicRole'));
    },

    pickMusicRole(role) {
      this._data.musicRole = role;
      this._data.category = `Music · ${role}`;
      if (!this._data.equipmentIds.includes('dj_controller') && /dj|producer/i.test(role)) {
        this._data.equipmentIds.push('dj_controller');
      }
      if (/sound|engineer/i.test(role) && !this._data.equipmentIds.includes('zoom_h6')) {
        this._data.equipmentIds.push('zoom_h6');
      }
      this.userVal(role);
      setTimeout(() => this.stepCoopRoles(), 500);
    },

    stepServiceType() {
      this.msg('What service do you bring to the collective?');
      this.setInput(this.chipGrid([
        { id: 'Food & Kitchen', label: 'Food & Kitchen' },
        { id: 'Fashion & Styling', label: 'Fashion' },
        { id: 'Healing & Wellness', label: 'Healing' },
        { id: 'Tech & Creative', label: 'Tech / Creative' },
        { id: 'Other', label: 'Other' },
      ], 'pickServiceType'));
    },

    pickServiceType(type) {
      this._data.category = type;
      this._data.serviceType = type;
      this.userVal(type);
      setTimeout(() => this.stepServiceCut(), 500);
    },

    stepDiscipline() {
      const opts = {
        visual_creator: ['Photography', 'Cinematography', 'Graphic Design', 'Mixed Visual'],
        performer: ['Dance / Movement', 'Host / MC', 'Theater / Spoken Word', 'Fashion Performance'],
        multi_creator: ['Audiovisual', 'Music + Visual', 'Community Art', 'Hybrid Creator'],
      };
      const list = opts[this._data.artistPath] || opts.multi_creator;
      this.msg('Your creative discipline — pick the closest match.');
      this.setInput(this.chipGrid(list.map((l) => ({ id: l, label: l })), 'pickDiscipline'));
    },

    pickDiscipline(d) {
      this._data.category = d;
      this.userVal(d);
      setTimeout(() => this.stepCoopRoles(), 500);
    },

    stepCoopRoles() {
      const roles = (window.COOP_ROLES || []).filter((r) => COOP_ROLE_PICKS.includes(r.id));
      this.msg('Which roles do you usually hold on a session? Pick up to 3 — Connection uses this for crew planning.');
      const picked = this._data.coopRoles || [];
      this.setInput(`
        <div class="flex flex-wrap gap-2 mb-2 max-h-32 overflow-y-auto">
          ${roles.map((r) =>
            `<button type="button" onclick="window.FloweeSoulprint.toggleRole('${r.id}')" id="sp-role-${r.id}" class="text-[9px] px-2 py-1 rounded-full border ${picked.includes(r.id) ? 'border-[#00ffcc] bg-[#00ffcc]/25 text-white' : 'border-white/20 text-white/60'}">${r.label}</button>`
          ).join('')}
        </div>
        <button type="button" onclick="window.FloweeSoulprint.submitRoles()" class="w-full bg-[#00ffcc] text-black py-2 rounded font-bold text-xs uppercase">Continue</button>`);
    },

    toggleRole(id) {
      let list = this._data.coopRoles || [];
      if (list.includes(id)) list = list.filter((x) => x !== id);
      else if (list.length < 3) list = [...list, id];
      this._data.coopRoles = list;
      const btn = document.getElementById('sp-role-' + id);
      if (btn) {
        btn.classList.toggle('border-[#00ffcc]', list.includes(id));
        btn.classList.toggle('bg-[#00ffcc]/25', list.includes(id));
        btn.classList.toggle('text-white', list.includes(id));
      }
    },

    submitRoles() {
      if (!(this._data.coopRoles || []).length) {
        this._data.coopRoles = this._data.is_musician ? ['audio_engineer'] : ['creative_director'];
      }
      this.userVal((this._data.coopRoles || []).join(', '));
      setTimeout(() => this.stepProjectVibe(), 400);
    },

    stepProjectVibe() {
      this.msg('How do you usually show up in Cooperation sessions?');
      this.setInput(this.chipGrid([
        { id: 'organic', label: 'Organic IRL Jam' },
        { id: 'social_media', label: 'Social / Reels / Tiny Desk' },
      ], 'pickProjectVibe'));
    },

    pickProjectVibe(vibe) {
      this._data.projectType = vibe;
      this.userVal(vibe === 'social_media' ? 'Social Media Capture' : 'Organic IRL');
      setTimeout(() => this.stepScale(), 400);
    },

    stepScale() {
      this.msg('Typical session scale for your Resonance Bar blueprint?');
      this.setInput(this.chipGrid([
        { id: 'get_together', label: 'Get Together' },
        { id: 'bigger_event', label: 'Bigger Event' },
      ], 'pickScale'));
    },

    pickScale(scale) {
      this._data.scale = scale;
      this.userVal(scale === 'bigger_event' ? 'Bigger Event' : 'Get Together');
      setTimeout(() => this.stepLocation(), 400);
    },

    stepLocation() {
      this.msg('Preferred Lisbon zone for your sessions?');
      this.setInput(this.chipGrid(LOCATIONS, 'pickLocation'));
    },

    pickLocation(locId) {
      this._data.locationId = locId;
      const label = LOCATIONS.find((l) => l.id === locId)?.label || locId;
      this.userVal(label);
      setTimeout(() => this.stepEquipment(), 400);
    },

    stepEquipment() {
      this.msg('Gear you need on stage or on set. Tap chips + add notes.');
      const picked = this._data.equipmentIds || [];
      this.setInput(`
        <div class="flex flex-wrap gap-2 mb-2">
          ${EQUIP_QUICK.map((e) =>
            `<button type="button" onclick="window.FloweeSoulprint.toggleEquip('${e.id}')" id="sp-eq-${e.id}" class="text-[10px] px-3 py-1 rounded-full border ${picked.includes(e.id) ? 'border-[#00ffcc] bg-[#00ffcc]/25 text-white' : 'border-white/20 text-white/60'}">${e.label}</button>`
          ).join('')}
        </div>
        <div class="flex gap-2">
          <input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white text-sm outline-none focus:border-[#00ffcc]" placeholder="Extra gear / tech rider…">
          <button type="button" onclick="window.FloweeSoulprint.submitEquipment()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">NEXT</button>
        </div>`);
    },

    toggleEquip(id) {
      const list = this._data.equipmentIds || [];
      const idx = list.indexOf(id);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(id);
      this._data.equipmentIds = list;
      const btn = document.getElementById('sp-eq-' + id);
      if (btn) {
        btn.classList.toggle('border-[#00ffcc]', list.includes(id));
        btn.classList.toggle('bg-[#00ffcc]/25', list.includes(id));
        btn.classList.toggle('text-white', list.includes(id));
      }
    },

    submitEquipment() {
      const extra = document.getElementById('fc-input')?.value?.trim() || '';
      const names = (this._data.equipmentIds || []).map((id) =>
        (window.COOP_EQUIPMENT || []).find((e) => e.id === id)?.name || id
      );
      this._data.tech = [names.join(', '), extra].filter(Boolean).join(' · ');
      if (extra) this.userVal(extra);
      else if (names.length) this.userVal(names.join(', '));
      this.setInput('');
      setTimeout(() => this.stepCollaboration(), 400);
    },

    stepCollaboration() {
      this.msg('How do you prefer to cooperate in Connection?');
      this.setInput(this.chipGrid([
        { id: 'solo', label: 'Solo + Crew Support' },
        { id: 'collab', label: 'Open Collab' },
        { id: 'crew_lead', label: 'I Lead Sessions' },
      ], 'pickCollaboration'));
    },

    pickCollaboration(mode) {
      this._data.collaboration = mode;
      this.userVal(mode.replace('_', ' '));
      if (this._data.artist_type === 'service') {
        setTimeout(() => this.stepServiceCut(), 400);
      } else {
        setTimeout(() => this.stepArtifact(), 400);
      }
    },

    stepArtifact() {
      this.msg("Your artifact of power — pendant, instrument, lens, shoes…");
      this.setInput(`<div class="flex gap-2"><input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]"><button type="button" onclick="window.FloweeSoulprint.submitArtifact()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">SEND</button></div>`);
    },

    submitArtifact() {
      const val = document.getElementById('fc-input')?.value?.trim();
      if (!val) return;
      this._data.artifact = val;
      this.userVal(val);
      this.setInput('');
      setTimeout(() => this.stepInspiration(), 400);
    },

    stepInspiration() {
      this.msg('Who or what ignited your creative fire?');
      this.setInput(`<div class="flex gap-2"><input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]"><button type="button" onclick="window.FloweeSoulprint.submitInspiration()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">SEND</button></div>`);
    },

    submitInspiration() {
      const val = document.getElementById('fc-input')?.value?.trim();
      if (!val) return;
      this._data.insp = val;
      this.userVal(val);
      this.setInput('');
      setTimeout(() => this.stepSocial(), 400);
    },

    stepSocial() {
      this.msg('Optional: Instagram / Linktree / portfolio link for Connection invites.');
      this.setInput(`<div class="flex gap-2"><input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white text-sm outline-none focus:border-[#00ffcc]" placeholder="@handle or URL — skip with NEXT"><button type="button" onclick="window.FloweeSoulprint.submitSocial()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">NEXT</button></div>`);
    },

    submitSocial() {
      const val = document.getElementById('fc-input')?.value?.trim();
      if (val) { this._data.socialLink = val; this.userVal(val); }
      this.setInput('');
      setTimeout(() => this.stepColor(), 400);
    },

    stepColor() {
      this.msg('Soul color for your Sanctuary aura? (e.g. cyan, gold, #ff00cc)');
      this.setInput(`<div class="flex gap-2"><input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]"><button type="button" onclick="window.FloweeSoulprint.submitColor()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">SEND</button></div>`);
    },

    submitColor() {
      const val = document.getElementById('fc-input')?.value?.trim() || '#00ffcc';
      if (typeof setSoulColor === 'function') setSoulColor(val);
      else localStorage.setItem('soul_color_' + this._artistId, val);
      this._data.soulColor = val;
      this.userVal(val);
      this.setInput('');
      setTimeout(() => this.stepPayment(), 600);
    },

    stepPayment() {
      this.msg('Payout route for the collective? (IBAN, PayPal, Revolut)');
      this.setInput(`<div class="flex gap-2"><input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]" placeholder="IBAN / PayPal / Tag"><button type="button" onclick="window.FloweeSoulprint.submitPayment()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">FINISH</button></div>`);
    },

    async submitPayment() {
      const val = document.getElementById('fc-input')?.value?.trim();
      if (val && typeof savePaymentDetails === 'function') await savePaymentDetails(val);
      this.userVal(val || '—');
      if (this._data.artist_type === 'service') await this.finishService();
      else await this.finishPerformance();
    },

    stepServiceCut() {
      this.msg('Community cut — what % of sales do you share with the collective?');
      this.setInput(`<div class="flex gap-2"><input type="number" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]" placeholder="%"><button type="button" onclick="window.FloweeSoulprint.submitCut()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">SEND</button></div>`);
    },

    submitCut() {
      const val = document.getElementById('fc-input')?.value?.trim();
      if (!val) return;
      this._data.cut = val;
      this._data.inventory = this._data.inventory || [];
      this.userVal(val + '%');
      this.setInput('');
      if (typeof handleFC === 'function' && typeof tempFlowData !== 'undefined') {
        Object.assign(tempFlowData, this._data);
        handleFC('cut');
        return;
      }
      setTimeout(() => this.stepArtifact(), 400);
    },

    async finishPerformance() {
      if (typeof tempFlowData !== 'undefined') Object.assign(tempFlowData, this._data);
      if (typeof finishPerfFlow === 'function') await finishPerfFlow();
      else if (window.ArtistProfileSync) await window.ArtistProfileSync.applyFromFlow(this._data, this._artist, this._artistId);
      if (typeof initData === 'function') initData();
      if (this._onComplete) this._onComplete(this._data);
    },

    async finishService() {
      if (typeof tempFlowData !== 'undefined') Object.assign(tempFlowData, this._data);
      if (typeof finishServFlow === 'function') await finishServFlow();
      else if (window.ArtistProfileSync) await window.ArtistProfileSync.applyFromFlow(this._data, this._artist, this._artistId);
      if (typeof initData === 'function') initData();
      if (this._onComplete) this._onComplete(this._data);
    },
  };
})();
