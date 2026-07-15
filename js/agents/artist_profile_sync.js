/**
 * Artist Profile Sync — Soul Imprint ↔ profiles ↔ Connection (Coop) Resonance Bar
 */
(function () {
  const SOULPRINT_KEY = 'cdf_artist_soulprint';
  const COOP_KEY = 'cdf_coop_project';

  const EQUIPMENT_KEYWORDS = {
    d850: ['camera', 'nikon', 'canon', 'photo', 'dslr', 'mirrorless'],
    zoom_h6: ['recorder', 'zoom h6', 'field record', 'h6', 'portable audio'],
    rode_mic: ['mic', 'microphone', 'lav', 'shotgun', 'wireless mic'],
    led_panel: ['light', 'led', 'lighting', 'panel'],
    tripod: ['tripod', 'fluid head', 'stand'],
    gimbal: ['gimbal', 'stabilizer', 'steadicam'],
    projector: ['projector', 'projection', 'screen'],
    pa_system: ['pa', 'speaker', 'monitor', 'sound system'],
    dj_controller: ['dj', 'controller', 'decks', 'turntable'],
    stream_pc: ['stream', 'obs', 'livestream', 'laptop'],
    power_ext: ['power', 'extension', 'cable', 'electric'],
    backdrop: ['backdrop', 'cloth', 'azulejo', 'set design'],
  };

  const STRINGS = {
    en: {
      category: 'Art discipline',
      tech: 'Tech rider / gear',
      artifact: 'Artifact of power',
      inspiration: 'Creative spark',
      connection: 'Connection (Resonance Bar)',
      equipment: 'Equipment pack',
      project: 'Session title',
      openCoop: 'Open Resonance Bar',
      synced: 'Soul Imprint synced to Connection',
      incomplete: 'Soul Imprint incomplete',
    },
    de: {
      category: 'Kunst-Disziplin',
      tech: 'Tech Rider / Equipment',
      artifact: 'Artefakt der Kraft',
      inspiration: 'Kreativer Funke',
      connection: 'Connection (Resonance Bar)',
      equipment: 'Equipment-Pack',
      project: 'Session-Titel',
      openCoop: 'Resonance Bar öffnen',
      synced: 'Soul Imprint mit Connection synchronisiert',
      incomplete: 'Soul Imprint unvollständig',
    },
    pt: {
      category: 'Disciplina artística',
      tech: 'Tech rider / equipamento',
      artifact: 'Artefato de poder',
      inspiration: 'Faísca criativa',
      connection: 'Connection (Resonance Bar)',
      equipment: 'Pack de equipamento',
      project: 'Título da sessão',
      openCoop: 'Abrir Resonance Bar',
      synced: 'Soul Imprint sincronizado com Connection',
      incomplete: 'Soul Imprint incompleto',
    },
  };

  function getLang() {
    const raw = localStorage.getItem('cdf_language')
      || localStorage.getItem('cdf_lang')
      || localStorage.getItem('cqr_lang')
      || (navigator.language || 'en');
    const code = String(raw).slice(0, 2).toLowerCase();
    if (code === 'de') return 'de';
    if (code === 'pt') return 'pt';
    return 'en';
  }

  function t(key) {
    return (STRINGS[getLang()] || STRINGS.en)[key] || STRINGS.en[key] || key;
  }

  function parseJson(raw, fallback) {
    try { return JSON.parse(raw || ''); } catch (_) { return fallback; }
  }

  function matchEquipment(text, selectedIds) {
    const ids = new Set(selectedIds || []);
    const lower = String(text || '').toLowerCase();
    Object.entries(EQUIPMENT_KEYWORDS).forEach(([id, keys]) => {
      if (keys.some((k) => lower.includes(k))) ids.add(id);
    });
    return Array.from(ids);
  }

  function equipmentLabels(ids) {
    return (ids || []).map((id) => (window.COOP_EQUIPMENT || []).find((e) => e.id === id)?.name || id);
  }

  function categoryToProjectType(category) {
    const c = String(category || '').toLowerCase();
    if (c.includes('audio') || c.includes('visual') || c.includes('music') || c.includes('media')) {
      return 'social_media';
    }
    return 'organic';
  }

  window.ArtistProfileSync = {
    getLang,
    t,

    getSoulprint() {
      return parseJson(localStorage.getItem(SOULPRINT_KEY), {});
    },

    needsSoulprint(artist, localData) {
      if (!artist || artist.artist_type === 'traveler') return false;
      const sp = this.getSoulprint();
      if (sp.completed_at && sp.artistId === artist.id) return false;
      const local = localData || parseJson(localStorage.getItem('soul_data_' + artist.id), null);
      if (artist.exp > 0 || local?.artifact || local?.cut) return false;
      if (artist.artist_type === 'performance') {
        return !(sp.category && (sp.tech || sp.equipmentIds?.length));
      }
      return artist.community_cut_percentage == null && !local?.cut;
    },

    saveSoulprint(patch) {
      const next = { ...this.getSoulprint(), ...patch, updated_at: new Date().toISOString() };
      localStorage.setItem(SOULPRINT_KEY, JSON.stringify(next));
      if (patch.artistId) {
        const legacy = parseJson(localStorage.getItem('soul_data_' + patch.artistId), {});
        localStorage.setItem('soul_data_' + patch.artistId, JSON.stringify({
          ...legacy,
          category: patch.category || patch.artCategory,
          tech: patch.tech,
          artifact: patch.artifact,
          insp: patch.insp,
          cut: patch.cut,
          inventory: patch.inventory,
          equipmentIds: patch.equipmentIds,
        }));
      }
      return next;
    },

    seedCoopProject(sp) {
      let project = parseJson(localStorage.getItem(COOP_KEY), null);
      if (!project?.id) {
        project = {
          id: 'coop_' + Date.now(),
          title: 'Untitled Session',
          phase: 1,
          phasesDone: [],
          projectType: null,
          scale: 'get_together',
          adinkraSoul: null,
          crew: {},
          guests: [],
          locationId: 'secret_garden',
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

      const eqIds = matchEquipment(sp.tech, sp.equipmentIds || []);
      if (sp.name && (!project.title || project.title === 'Untitled Session')) {
        project.title = `${sp.name} · Session`;
      }
      if (sp.category || sp.artCategory) {
        project.artistCategory = sp.category || sp.artCategory;
        project.projectType = categoryToProjectType(sp.category || sp.artCategory);
      } else if (sp.artist_type === 'performance') {
        project.projectType = project.projectType || 'social_media';
      } else if (sp.artist_type === 'service') {
        project.projectType = project.projectType || 'organic';
      }
      if (eqIds.length) {
        project.equipment = [...new Set([...(project.equipment || []), ...eqIds])];
      }
      project.soulprint = {
        category: sp.category || sp.artCategory,
        tech: sp.tech,
        artifact: sp.artifact,
        inspiration: sp.insp,
        artist_type: sp.artist_type,
        synced_at: new Date().toISOString(),
      };
      project.updatedAt = new Date().toISOString();
      localStorage.setItem(COOP_KEY, JSON.stringify(project));
      localStorage.setItem('circle_selected_event', JSON.stringify({
        title: project.title,
        type: project.projectType === 'social_media' ? 'Social Media Production' : 'Organic Gathering',
        equipment: project.equipment,
      }));
      window.dispatchEvent(new CustomEvent('COOP_PROJECT_UPDATED', { detail: project }));
      return project;
    },

    async syncToProfile(sp, userId) {
      if (!window.supabaseClient || !userId) return { ok: false };
      const eqIds = matchEquipment(sp.tech, sp.equipmentIds || []);
      try {
        const { data: profile } = await window.supabaseClient
          .from('profiles')
          .select('contact_details, role_calling')
          .eq('id', userId)
          .maybeSingle();
        let contact = profile?.contact_details || {};
        if (typeof contact === 'string') contact = parseJson(contact, {});
        contact.artist_profile = {
          artist_type: sp.artist_type,
          category: sp.category || sp.artCategory,
          tech_rider: sp.tech,
          artifact: sp.artifact,
          inspiration: sp.insp,
          equipment_ids: eqIds,
          soul_color: sp.soulColor,
          updated_at: sp.updated_at,
        };
        const roleCalling = profile?.role_calling
          || (sp.category ? `${sp.category} Artist` : null);
        const patch = { contact_details: contact };
        if (roleCalling) patch.role_calling = roleCalling;
        const { error } = await window.supabaseClient.from('profiles').update(patch).eq('id', userId);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },

    async markDeepFlowComplete(userId) {
      if (!window.supabaseClient || !userId) return;
      try {
        await window.supabaseClient.from('sanctuary_onboarding').upsert({
          user_id: userId,
          deep_flow_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (_) { /* table optional */ }
    },

    async applyFromFlow(tempFlowData, artistData, artistId) {
      const sp = this.saveSoulprint({
        artistId,
        artist_type: artistData?.artist_type,
        name: artistData?.name,
        category: tempFlowData.category || tempFlowData.artCategory,
        artCategory: tempFlowData.category || tempFlowData.artCategory,
        tech: tempFlowData.tech,
        artifact: tempFlowData.artifact,
        insp: tempFlowData.insp,
        equipmentIds: tempFlowData.equipmentIds || [],
        cut: tempFlowData.cut,
        inventory: tempFlowData.inventory,
        soulColor: localStorage.getItem('soul_color_' + artistId),
        completed_at: new Date().toISOString(),
      });
      const project = this.seedCoopProject(sp);
      let userId = null;
      if (window.supabaseClient) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        userId = user?.id || null;
        if (userId) {
          await this.syncToProfile(sp, userId);
          await this.markDeepFlowComplete(userId);
        }
      }
      return { soulprint: sp, project, userId };
    },

    renderDataPanelHtml(artistId) {
      const sp = this.getSoulprint();
      const local = parseJson(localStorage.getItem('soul_data_' + artistId), {});
      const coop = parseJson(localStorage.getItem(COOP_KEY), {});
      const category = sp.category || sp.artCategory || local.category;
      const tech = sp.tech || local.tech;
      const eqIds = matchEquipment(tech, sp.equipmentIds || local.equipmentIds || coop.equipment || []);
      const eqLabels = equipmentLabels(eqIds);
      let html = '';
      if (category) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('category')}:</strong> ${category}</div>`;
      }
      if (tech) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('tech')}:</strong> ${tech}</div>`;
      }
      if (eqLabels.length) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('equipment')}:</strong> ${eqLabels.join(', ')}</div>`;
      }
      if (coop.title) {
        html += `<div class="mb-3 mt-3 pt-3 border-t border-white/10">
          <strong class="text-[#00ffcc]">${t('connection')}</strong>
          <div class="text-xs mt-1"><span class="text-white/50">${t('project')}:</span> ${coop.title}</div>
          <a href="coop.html" class="inline-block mt-2 text-[10px] uppercase tracking-widest text-[#D47E3D] border border-[#D47E3D]/40 px-3 py-1 rounded-full hover:bg-[#D47E3D]/20">${t('openCoop')}</a>
        </div>`;
      }
      return html;
    },
  };
})();
