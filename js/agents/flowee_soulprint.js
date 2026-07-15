/**
 * Flowee Soulprint — guided artist profile questionnaire (i18n via ArtistProfileSync)
 */
(function () {
  const CATEGORIES = [
    { id: 'Movement', icon: 'directions_run' },
    { id: 'Audiovisual', icon: 'videocam' },
    { id: 'Visual Arts', icon: 'palette' },
    { id: 'Music & Sound', icon: 'headphones' },
    { id: 'Mixed Media', icon: 'hub' },
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

    start(artistData, artistId, onComplete) {
      this._artist = artistData;
      this._artistId = artistId;
      this._onComplete = onComplete;
      this._data = { equipmentIds: [] };
      const overlay = document.getElementById('flowee-overlay');
      if (overlay) overlay.classList.remove('hidden');
      this.msg(`Welcome to your Sanctuary, <b>${artistData?.name || 'Navigator'}</b>. Let's complete your Soul Imprint for Connection & Resonance Bar.`);
      setTimeout(() => this.stepCategory(), 1200);
    },

    stepCategory() {
      if (this._artist?.artist_type === 'service') {
        this.stepServiceCut();
        return;
      }
      this.msg('What type of art do you create? This sets your Resonance Bar session profile.');
      this.setInput(`
        <div class="grid grid-cols-2 gap-2">
          ${CATEGORIES.map((c) =>
            `<button type="button" onclick="window.FloweeSoulprint.pickCategory('${c.id}')" class="bg-[#00ffcc]/10 border border-[#00ffcc]/40 text-[#00ffcc] py-2 px-2 rounded text-[10px] font-bold uppercase">${c.id}</button>`
          ).join('')}
        </div>`);
    },

    pickCategory(id) {
      this._data.category = id;
      this.userVal(id);
      setTimeout(() => this.stepEquipment(), 600);
    },

    stepEquipment() {
      this.msg('Select gear you need on stage or on set. Tap chips, then add anything else in the field.');
      const picked = this._data.equipmentIds || [];
      this.setInput(`
        <div class="flex flex-wrap gap-2 mb-2">
          ${EQUIP_QUICK.map((e) =>
            `<button type="button" onclick="window.FloweeSoulprint.toggleEquip('${e.id}')" id="sp-eq-${e.id}" class="text-[10px] px-3 py-1 rounded-full border ${picked.includes(e.id) ? 'border-[#00ffcc] bg-[#00ffcc]/25 text-white' : 'border-white/20 text-white/60'}">${e.label}</button>`
          ).join('')}
        </div>
        <div class="flex gap-2">
          <input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white text-sm outline-none focus:border-[#00ffcc]" placeholder="Extra gear / tech rider notes…">
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
      if (extra) this._data.tech = extra;
      else if (this._data.equipmentIds?.length) {
        this._data.tech = this._data.equipmentIds.map((id) =>
          (window.COOP_EQUIPMENT || []).find((e) => e.id === id)?.name || id
        ).join(', ');
      }
      if (extra) this.userVal(extra);
      this.setInput('');
      setTimeout(() => this.stepArtifact(), 500);
    },

    stepArtifact() {
      this.msg("Every artist carries an artifact of power. What's yours? (pendant, pen, shoes, instrument…)");
      this.setInput(`<div class="flex gap-2"><input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]"><button type="button" onclick="window.FloweeSoulprint.submitArtifact()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">SEND</button></div>`);
    },

    submitArtifact() {
      const val = document.getElementById('fc-input')?.value?.trim();
      if (!val) return;
      this._data.artifact = val;
      this.userVal(val);
      this.setInput('');
      setTimeout(() => this.stepInspiration(), 500);
    },

    stepInspiration() {
      this.msg('Which artist or moment ignited your creative fire?');
      this.setInput(`<div class="flex gap-2"><input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]"><button type="button" onclick="window.FloweeSoulprint.submitInspiration()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">SEND</button></div>`);
    },

    submitInspiration() {
      const val = document.getElementById('fc-input')?.value?.trim();
      if (!val) return;
      this._data.insp = val;
      this.userVal(val);
      this.setInput('');
      setTimeout(() => this.stepColor(), 500);
    },

    stepColor() {
      this.msg('What is the color of your soul? (e.g. cyan, purple, #ff00cc)');
      this.setInput(`<div class="flex gap-2"><input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]"><button type="button" onclick="window.FloweeSoulprint.submitColor()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">SEND</button></div>`);
    },

    submitColor() {
      const val = document.getElementById('fc-input')?.value?.trim() || '#00ffcc';
      if (typeof setSoulColor === 'function') setSoulColor(val);
      else localStorage.setItem('soul_color_' + this._artistId, val);
      this.userVal(val);
      this.setInput('');
      setTimeout(() => this.stepPayment(), 800);
    },

    stepPayment() {
      this.msg('Where should the collective send payouts? (IBAN, PayPal, or Revolut tag)');
      this.setInput(`<div class="flex gap-2"><input type="text" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]" placeholder="IBAN / PayPal / Tag"><button type="button" onclick="window.FloweeSoulprint.submitPayment()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">SEND</button></div>`);
    },

    async submitPayment() {
      const val = document.getElementById('fc-input')?.value?.trim();
      if (val && typeof savePaymentDetails === 'function') await savePaymentDetails(val);
      this.userVal(val || '—');
      await this.finishPerformance();
    },

    stepServiceCut() {
      this.msg('Community first — what % of sales do you share with the collective?');
      this.setInput(`<div class="flex gap-2"><input type="number" id="fc-input" class="flex-1 bg-black/50 border border-white/20 rounded p-2 text-white outline-none focus:border-[#00ffcc]" placeholder="%"><button type="button" onclick="window.FloweeSoulprint.submitCut()" class="bg-[#00ffcc] text-black px-4 rounded font-bold">SEND</button></div>`);
    },

    submitCut() {
      const val = document.getElementById('fc-input')?.value?.trim();
      if (!val) return;
      this._data.cut = val;
      this._data.inventory = this._data.inventory || [];
      this.userVal(val + '%');
      this.setInput('');
      if (typeof handleFC === 'function') {
        if (typeof tempFlowData !== 'undefined') Object.assign(tempFlowData, this._data);
        handleFC('cut');
        return;
      }
      this.finishService();
    },

    async finishPerformance() {
      if (typeof tempFlowData !== 'undefined') Object.assign(tempFlowData, this._data);
      if (typeof finishPerfFlow === 'function') {
        await finishPerfFlow();
      } else if (window.ArtistProfileSync) {
        await window.ArtistProfileSync.applyFromFlow(this._data, this._artist, this._artistId);
        this.msg('Soul Imprint saved. Resonance Bar is pre-filled with your gear.');
        this.setInput(`<button type="button" onclick="document.getElementById('flowee-overlay')?.classList.add('hidden')" class="w-full bg-[#00ffcc]/20 border border-[#00ffcc]/50 text-[#00ffcc] py-3 rounded font-bold uppercase text-xs">Enter Sanctuary</button>`);
      }
      if (typeof initData === 'function') initData();
      if (this._onComplete) this._onComplete(this._data);
    },

    async finishService() {
      if (window.ArtistProfileSync) {
        await window.ArtistProfileSync.applyFromFlow(this._data, this._artist, this._artistId);
      }
      if (typeof finishServFlow === 'function') await finishServFlow();
      if (typeof initData === 'function') initData();
    },
  };
})();
