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
      artistPath: 'Artist type',
      musicRole: 'Music role',
      musicGenre: 'Genre / vibe',
      languages: 'Languages',
      sessionIntent: 'Connection goal',
      tech: 'Tech rider / gear',
      artifact: 'Artifact of power',
      inspiration: 'Creative spark',
      connection: 'Connection (Resonance Bar)',
      equipment: 'Equipment pack',
      project: 'Session title',
      roles: 'Coop roles',
      scale: 'Session scale',
      location: 'Preferred zone',
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

  function isValidUuid(v) {
    return typeof v === 'string'
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  }

  function safeEventId(raw) {
    return isValidUuid(raw) ? raw : null;
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
    isValidUuid,
    safeEventId,

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
          artistPath: patch.artistPath,
          musicRole: patch.musicRole,
          musicGenre: patch.musicGenre,
          languages: patch.languages,
          sessionIntent: patch.sessionIntent,
          is_musician: patch.is_musician,
          category: patch.category || patch.artCategory,
          coopRoles: patch.coopRoles,
          projectType: patch.projectType,
          scale: patch.scale,
          locationId: patch.locationId,
          tech: patch.tech,
          artifact: patch.artifact,
          insp: patch.insp,
          cut: patch.cut,
          inventory: patch.inventory,
          equipmentIds: patch.equipmentIds,
          collaboration: patch.collaboration,
          socialLink: patch.socialLink,
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
        project.projectType = sp.projectType || categoryToProjectType(sp.category || sp.artCategory);
      } else if (sp.artist_type === 'performance') {
        project.projectType = project.projectType || 'social_media';
      } else if (sp.artist_type === 'service') {
        project.projectType = project.projectType || 'organic';
      }
      if (sp.scale) project.scale = sp.scale;
      if (sp.locationId) project.locationId = sp.locationId;
      if (sp.projectType) project.projectType = sp.projectType;
      if (sp.adinkraSoul) project.adinkraSoul = sp.adinkraSoul;
      else if (sp.projectType && window.COOP_ADINKRA_BY_VIBE) {
        project.adinkraSoul = window.COOP_ADINKRA_BY_VIBE[sp.projectType] || window.COOP_ADINKRA_BY_VIBE.default;
      }
      if (sp.coopRoles?.length && project.crew) {
        const username = sp.name || 'artist';
        const slotId = 'artist_self';
        project.crew[slotId] = {
          memberId: slotId,
          name: username,
          roles: sp.coopRoles,
        };
      }
      if (sp.sessionIntent) project.sessionIntent = sp.sessionIntent;
      if (sp.languages?.length) project.languages = sp.languages;
      if (eqIds.length) {
        project.equipment = [...new Set([...(project.equipment || []), ...eqIds])];
      }
      project.soulprint = {
        artistPath: sp.artistPath,
        category: sp.category || sp.artCategory,
        musicRole: sp.musicRole,
        musicGenre: sp.musicGenre,
        languages: sp.languages,
        sessionIntent: sp.sessionIntent,
        is_musician: sp.is_musician,
        coopRoles: sp.coopRoles,
        collaboration: sp.collaboration,
        tech: sp.tech,
        artifact: sp.artifact,
        inspiration: sp.insp,
        artist_type: sp.artist_type,
        socialLink: sp.socialLink,
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
          artist_path: sp.artistPath,
          is_musician: !!sp.is_musician,
          music_role: sp.musicRole,
          music_genre: sp.musicGenre,
          languages: sp.languages || [],
          session_intent: sp.sessionIntent,
          category: sp.category || sp.artCategory,
          coop_roles: sp.coopRoles || [],
          collaboration: sp.collaboration,
          project_type: sp.projectType,
          scale: sp.scale,
          location_id: sp.locationId,
          tech_rider: sp.tech,
          artifact: sp.artifact,
          inspiration: sp.insp,
          equipment_ids: eqIds,
          social_link: sp.socialLink,
          soul_color: sp.soulColor,
          updated_at: sp.updated_at,
        };
        const roleCalling = sp.musicRole
          ? `${sp.musicRole}`
          : (sp.category ? `${sp.category} Artist` : profile?.role_calling);
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

    async syncPerformanceDetails(data, artistId, eventId) {
      if (!window.supabaseClient || !artistId) return { ok: false, local: true };
      const row = {
        artist_id: artistId,
        performance_category: data.category || data.artCategory || data.artistPath || 'Soulprint',
        technical_needs: data.tech || '',
        artifact_of_power: data.artifact || '',
        inspiration: data.insp || data.inspiration || '',
      };
      const eid = safeEventId(eventId);
      if (eid) row.event_id = eid;

      try {
        const { data: existing, error: selErr } = await window.supabaseClient
          .from('performance_details')
          .select('id')
          .eq('artist_id', artistId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (selErr && selErr.code !== 'PGRST116') throw selErr;

        if (existing?.id) {
          const { error } = await window.supabaseClient
            .from('performance_details')
            .update(row)
            .eq('id', existing.id);
          if (error) throw error;
          return { ok: true, updated: true };
        }
        const { error } = await window.supabaseClient.from('performance_details').insert([row]);
        if (error) throw error;
        return { ok: true, inserted: true };
      } catch (e) {
        const msg = e?.message || String(e);
        if (/relation.*does not exist|42P01/i.test(msg)) {
          console.warn('[ArtistProfileSync] performance_details table missing — saved locally.');
        } else {
          console.warn('[ArtistProfileSync] performance_details:', msg);
        }
        return { ok: false, error: msg, local: true };
      }
    },

    async applyFromFlow(tempFlowData, artistData, artistId) {
      const sp = this.saveSoulprint({
        artistId,
        artist_type: tempFlowData.artist_type || artistData?.artist_type,
        artistPath: tempFlowData.artistPath,
        is_musician: tempFlowData.is_musician,
        musicRole: tempFlowData.musicRole,
        musicGenre: tempFlowData.musicGenre,
        languages: tempFlowData.languages || [],
        sessionIntent: tempFlowData.sessionIntent,
        name: artistData?.name,
        category: tempFlowData.category || tempFlowData.artCategory,
        artCategory: tempFlowData.category || tempFlowData.artCategory,
        projectType: tempFlowData.projectType,
        scale: tempFlowData.scale,
        locationId: tempFlowData.locationId,
        coopRoles: tempFlowData.coopRoles || [],
        collaboration: tempFlowData.collaboration,
        socialLink: tempFlowData.socialLink,
        tech: tempFlowData.tech,
        artifact: tempFlowData.artifact,
        insp: tempFlowData.insp,
        equipmentIds: tempFlowData.equipmentIds || [],
        cut: tempFlowData.cut,
        inventory: tempFlowData.inventory,
        soulColor: tempFlowData.soulColor || localStorage.getItem('soul_color_' + artistId),
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
        if (artistId && sp.artist_type !== 'service') {
          const urlParams = new URLSearchParams(window.location.search);
          await this.syncPerformanceDetails(sp, artistId, urlParams.get('eventId'));
        }
        if (artistId && artistData?.artist_type !== 'traveler') {
          try {
            await window.supabaseClient.from('master_artists').update({
              artist_type: sp.artist_type || artistData.artist_type,
            }).eq('id', artistId);
          } catch (_) { /* optional */ }
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
      const roleLabels = (sp.coopRoles || []).map((id) => window.getCoopRole?.(id)?.label || id);
      let html = '';
      if (sp.artistPath || sp.is_musician) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('artistPath')}:</strong> ${sp.is_musician ? 'Musician' : (sp.artistPath || 'Artist').replace(/_/g, ' ')}</div>`;
      }
      if (sp.musicRole) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('musicRole')}:</strong> ${sp.musicRole}</div>`;
      }
      if (sp.musicGenre) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('musicGenre')}:</strong> ${sp.musicGenre}</div>`;
      }
      if (sp.languages?.length) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('languages')}:</strong> ${sp.languages.join(', ')}</div>`;
      }
      if (sp.sessionIntent) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('sessionIntent')}:</strong> ${sp.sessionIntent.replace(/_/g, ' ')}</div>`;
      }
      if (category) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('category')}:</strong> ${category}</div>`;
      }
      if (tech) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('tech')}:</strong> ${tech}</div>`;
      }
      if (eqLabels.length) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('equipment')}:</strong> ${eqLabels.join(', ')}</div>`;
      }
      if (roleLabels.length) {
        html += `<div class="mb-2"><strong class="text-[#d4af37]">${t('roles')}:</strong> ${roleLabels.join(', ')}</div>`;
      }
      if (coop.scale) {
        html += `<div class="mb-2 text-xs text-white/50">${t('scale')}: ${coop.scale.replace(/_/g, ' ')}</div>`;
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
