/**
 * Coop Sync — Supabase shared projects, team profiles, invites
 */
(function () {
  const TEAM_MATCH = [
    { slot: 'kyheart', patterns: ['kyheart', 'kyheartlx', 'dark'] },
    { slot: 'naru', patterns: ['naru', 'naruthetoken', 'naru the token'] },
    { slot: 'criz', patterns: ['criz', 'c-riz', 'c_riz', 'c-rizlx'] },
  ];

  function norm(s) {
    return (s || '').toLowerCase().replace(/[\s_-]+/g, '');
  }

  function matchSlot(username) {
    const n = norm(username);
    for (const row of TEAM_MATCH) {
      if (row.patterns.some((p) => n.includes(norm(p)) || n === norm(p))) return row.slot;
    }
    return null;
  }

  window.CoopSync = {
    teamProfiles: {},
    cloudProjectId: null,
    pendingInvites: [],

    async init() {
      if (!window.supabaseClient) return;
      await this.loadTeamProfiles();
      await this.resolveCurrentUserSlot();
      await this.pullInvites();
      await this.pullSharedProject();
      this.subscribeRealtime();
    },

    get sb() {
      return window.supabaseClient;
    },

    async loadTeamProfiles() {
      if (!this.sb) return;
      const { data, error } = await this.sb.from('profiles').select('id,username,exp,karma,flow_credits,avatar_url,level').limit(200);
      if (error) {
        console.warn('[CoopSync] profiles load:', error.message);
        return;
      }
      this.teamProfiles = {};
      (data || []).forEach((p) => {
        const slot = matchSlot(p.username);
        if (slot) this.teamProfiles[slot] = p;
      });
      this.applyTeamToCrew();
      this.renderTeamStatus();
      await this.sendDefaultInvites();
      window.dispatchEvent(new CustomEvent('COOP_TEAM_LOADED', { detail: this.teamProfiles }));
    },

    async sendDefaultInvites() {
      if (!this.sb || localStorage.getItem('cdf_coop_default_invites_sent') === 'true') return;
      const { data: { session } } = await this.sb.auth.getSession();
      if (!session) return;
      const defaults = (window.COOP_CORE_CREW || []).filter((m) => m.inviteDefault);
      for (const m of defaults) {
        const prof = this.teamProfiles[m.id];
        if (prof?.username) await this.inviteUser(prof.username);
      }
      localStorage.setItem('cdf_coop_default_invites_sent', 'true');
    },

    applyTeamToCrew() {
      if (!window.CoopBarkeeper?.project) return;
      const crew = { ...window.CoopBarkeeper.project.crew };
      (window.COOP_CORE_CREW || []).forEach((member) => {
        const prof = this.teamProfiles[member.id];
        if (!prof) return;
        crew[member.id] = {
          ...(crew[member.id] || { memberId: member.id, name: member.name, roles: [...(member.defaultRoles || [])] }),
          userId: prof.id,
          username: prof.username,
          exp: prof.exp,
          karma: prof.karma,
          online: true,
        };
      });
      window.CoopBarkeeper.save({ crew });
    },

    async resolveCurrentUserSlot() {
      const { data: { session } } = await this.sb.auth.getSession();
      if (!session?.user) return null;
      const { data: profile } = await this.sb.from('profiles').select('id,username,exp,karma').eq('id', session.user.id).maybeSingle();
      if (!profile) return null;
      const slot = matchSlot(profile.username);
      if (slot && window.CoopBarkeeper) {
        const crew = { ...window.CoopBarkeeper.project.crew };
        crew[slot] = {
          ...(crew[slot] || {}),
          userId: profile.id,
          username: profile.username,
          name: crew[slot]?.name || profile.username,
          roles: crew[slot]?.roles || [],
          isMe: true,
        };
        window.CoopBarkeeper.save({ crew, mySlot: slot });
        await this.upsertMember(slot, profile);
      }
      return slot;
    },

    async pushProject() {
      if (!this.sb || !window.CoopBarkeeper) return;
      const { data: { session } } = await this.sb.auth.getSession();
      if (!session) return;
      const p = window.CoopBarkeeper.project;
      const row = {
        local_id: p.id,
        title: p.title || 'Untitled Session',
        payload: p,
        created_by: session.user.id,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await this.sb.from('coop_projects').upsert(row, { onConflict: 'local_id' }).select('id').maybeSingle();
      if (error) {
        console.warn('[CoopSync] push:', error.message);
        return;
      }
      if (data?.id) {
        this.cloudProjectId = data.id;
        await this.syncAllMembers(data.id);
      }
    },

    async pullSharedProject() {
      if (!this.sb || !window.CoopBarkeeper) return;
      const localId = window.CoopBarkeeper.project?.id;
      if (!localId) return;
      const { data, error } = await this.sb.from('coop_projects').select('*').eq('local_id', localId).maybeSingle();
      if (error || !data?.payload) return;
      const remote = data.payload;
      const localUpdated = new Date(window.CoopBarkeeper.project.updatedAt || 0).getTime();
      const remoteUpdated = new Date(data.updated_at || 0).getTime();
      if (remoteUpdated > localUpdated) {
        window.CoopBarkeeper.project = { ...remote, id: localId };
        localStorage.setItem('cdf_coop_project', JSON.stringify(window.CoopBarkeeper.project));
        window.CoopBarkeeper.renderAll();
        if (window.Pusher) window.Pusher.showToast('Team plan updated from cloud', 'success');
      }
      this.cloudProjectId = data.id;
    },

    async syncAllMembers(projectId) {
      const crew = window.CoopBarkeeper?.project?.crew || {};
      const pid = projectId || this.cloudProjectId;
      if (!pid) return;
      const entries = Object.entries(crew).filter(([, c]) => c.userId);
      for (const [slot, c] of entries) {
        await this.sb.from('coop_project_members').upsert({
          project_id: pid,
          user_id: c.userId,
          crew_slot: slot,
          roles: c.roles || [],
          display_name: c.name || c.username,
          status: 'active',
        }, { onConflict: 'project_id,user_id' });
      }
    },

    async upsertMember(slot, profile) {
      if (!this.cloudProjectId || !profile?.id) return;
      await this.sb.from('coop_project_members').upsert({
        project_id: this.cloudProjectId,
        user_id: profile.id,
        crew_slot: slot,
        roles: window.CoopBarkeeper?.project?.crew?.[slot]?.roles || [],
        display_name: profile.username,
        status: 'active',
      }, { onConflict: 'project_id,user_id' });
    },

    async inviteUser(username) {
      if (!this.sb || !username?.trim()) return { ok: false, msg: 'Enter a username' };
      const { data: { session } } = await this.sb.auth.getSession();
      if (!session) return { ok: false, msg: 'Sign in to invite teammates' };

      const q = username.trim();
      const { data: matches } = await this.sb.from('profiles').select('id,username').ilike('username', `%${q}%`).limit(5);
      const target = (matches || []).find((p) => norm(p.username).includes(norm(q))) || matches?.[0];

      const project = window.CoopBarkeeper?.project;
      const row = {
        project_local_id: project?.id,
        project_id: this.cloudProjectId || null,
        inviter_id: session.user.id,
        invitee_username: target?.username || q,
        invitee_id: target?.id || null,
        status: 'pending',
        message: `Join our Resonance Bar plan: ${project?.title || 'Coop Session'}`,
      };

      const { error } = await this.sb.from('coop_invites').insert(row);
      if (error) return { ok: false, msg: error.message };

      if (window.FloweeNotify) window.FloweeNotify.coopReminder('Coop Invite', `${row.invitee_username} invited to ${project?.title}`);
      if (window.Pusher) window.Pusher.showToast(`Invite sent to ${row.invitee_username}`, 'success');
      await this.pullInvites();
      return { ok: true, msg: `Invited ${row.invitee_username}` };
    },

    async pullInvites() {
      if (!this.sb) return;
      const { data: { session } } = await this.sb.auth.getSession();
      if (!session) return;
      const { data } = await this.sb.from('coop_invites').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(20);
      this.pendingInvites = data || [];
      this.renderInviteList();
    },

    async acceptInvite(inviteId) {
      const inv = this.pendingInvites.find((i) => i.id === inviteId);
      if (!inv || !this.sb) return;
      const { data: { session } } = await this.sb.auth.getSession();
      await this.sb.from('coop_invites').update({ status: 'accepted', invitee_id: session?.user?.id }).eq('id', inviteId);
      if (inv.project_local_id) {
        const { data: proj } = await this.sb.from('coop_projects').select('payload').eq('local_id', inv.project_local_id).maybeSingle();
        if (proj?.payload) {
          localStorage.setItem('cdf_coop_project', JSON.stringify(proj.payload));
          if (window.CoopBarkeeper) {
            window.CoopBarkeeper.project = proj.payload;
            window.CoopBarkeeper.renderAll();
          }
        }
      }
      await this.resolveCurrentUserSlot();
      await this.pullInvites();
      if (window.Flowee) window.Flowee.talk(true, 'You joined the team plan. Your role changes now sync for everyone.', 'celebrate');
    },

    renderInviteList() {
      const el = document.getElementById('coop-invite-list');
      if (!el) return;
      if (!this.pendingInvites.length) {
        el.innerHTML = '<p class="text-xs text-white/40">No pending invites</p>';
        return;
      }
      el.innerHTML = this.pendingInvites.map((inv) => `
        <div class="coop-invite-row">
          <span class="text-xs text-white/80">${inv.invitee_username || 'Navigator'}</span>
          <span class="text-[10px] text-white/40">${inv.message || 'Coop invite'}</span>
          <button type="button" class="coop-chip on text-[9px]" data-accept-invite="${inv.id}">Accept</button>
        </div>
      `).join('');
      el.querySelectorAll('[data-accept-invite]').forEach((btn) => {
        btn.addEventListener('click', () => this.acceptInvite(btn.dataset.acceptInvite));
      });
    },

    renderTeamStatus() {
      const el = document.getElementById('coop-team-status');
      if (!el) return;
      el.innerHTML = (window.COOP_CORE_CREW || []).map((m) => {
        const prof = this.teamProfiles[m.id];
        const crew = window.CoopBarkeeper?.project?.crew?.[m.id];
        const linked = !!(prof?.id || crew?.userId);
        return `<div class="coop-team-pill ${linked ? 'linked' : 'pending'}">
          <span class="font-bold text-xs">${m.name}</span>
          <span class="text-[9px] opacity-70">${linked ? `@${prof?.username || crew?.username} · ${prof?.exp ?? '—'} EXP` : 'Not linked — invite'}</span>
        </div>`;
      }).join('');
    },

    subscribeRealtime() {
      if (!this.sb) return;
      this.sb.channel('coop-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'coop_projects' }, () => this.pullSharedProject())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'coop_invites' }, () => this.pullInvites())
        .subscribe();
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('SUPABASE_READY', () => window.CoopSync?.init());
    if (window.supabaseClient) window.CoopSync?.init();
  });

  window.addEventListener('COOP_PROJECT_UPDATED', () => {
    clearTimeout(window._coopPushTimer);
    window._coopPushTimer = setTimeout(() => window.CoopSync?.pushProject(), 800);
  });
})();
