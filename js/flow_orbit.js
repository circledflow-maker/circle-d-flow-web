/**
 * Flow Orbit — post-claim member card stack / feed
 * Horizontal swipe between interactive cards; vertical detail on events/locations.
 * Deep links: ?view=events|event|benefit|partner|location|saved|profile&event=slug&…
 */
(function () {
  const STORAGE_KEY = 'cdf_wako_member_card';
  const SAVED_LOCAL_KEY = 'cdf_flow_saves';

  const els = {
    claimShell: document.getElementById('wk-claim-shell'),
    orbitShell: document.getElementById('wk-orbit-shell'),
    track: document.getElementById('orbit-track'),
    guide: document.getElementById('wk-guide'),
    dock: document.getElementById('orbit-dock'),
    detail: document.getElementById('orbit-detail'),
    detailBody: document.getElementById('orbit-detail-body'),
    detailClose: document.getElementById('orbit-detail-close'),
    chips: {
      status: document.getElementById('chip-status'),
      member: document.getElementById('chip-member'),
      exp: document.getElementById('chip-exp'),
    },
  };

  const state = {
    cards: [],
    index: 0,
    detailLayer: 0,
    swiping: false,
    feed: null,
    mode: 'flow', // card | flow | saved | me
  };

  function loadCard() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
    } catch (_) {
      return {};
    }
  }

  function localSaves() {
    try {
      return JSON.parse(localStorage.getItem(SAVED_LOCAL_KEY) || '[]');
    } catch (_) {
      return [];
    }
  }

  function setLocalSaves(list) {
    localStorage.setItem(SAVED_LOCAL_KEY, JSON.stringify(list));
  }

  function qs() {
    return new URLSearchParams(window.location.search);
  }

  function setGuide(line) {
    if (els.guide) els.guide.textContent = line;
    try {
      window.dispatchEvent(new CustomEvent('cdf:flowee-orbit', { detail: { line } }));
    } catch (_) {
      /* ignore */
    }
  }

  function formatDate(d) {
    if (!d) return '';
    try {
      const dt = new Date(String(d).slice(0, 10) + 'T12:00:00');
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
    } catch (_) {
      return d;
    }
  }

  function formatTime(t) {
    if (!t) return '';
    return String(t).slice(0, 5);
  }

  function memberNumber(card) {
    if (card.memberNumber) return card.memberNumber;
    const id = card.publicId || 'wk';
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return 'WK-' + String(100000 + (h % 900000)).slice(0, 6);
  }

  function tierProgress(exp) {
    const e = Number(exp) || 0;
    const cap = 400;
    return Math.max(8, Math.min(100, Math.round((e / cap) * 100)));
  }

  function isClaimed(card) {
    return Boolean(card.claimedAt || card.memberCardClaimedAt || card.claimed);
  }

  async function authHeaders() {
    const h = { 'Content-Type': 'application/json' };
    try {
      const sb = window.supabaseClient || window.cdfSupabase;
      if (sb?.auth?.getSession) {
        const { data } = await sb.auth.getSession();
        const token = data?.session?.access_token;
        if (token) h.Authorization = 'Bearer ' + token;
      }
    } catch (_) {
      /* ignore */
    }
    return h;
  }

  async function fetchFeed() {
    const headers = await authHeaders();
    const res = await fetch('/api/member-orbit?action=feed', { headers });
    if (!res.ok) throw new Error('Feed unavailable');
    return res.json();
  }

  async function toggleSave(itemType, itemId) {
    const headers = await authHeaders();
    try {
      const res = await fetch('/api/member-orbit?action=save', {
        method: 'POST',
        headers,
        body: JSON.stringify({ itemType, itemId }),
      });
      if (res.status === 401) {
        const saves = localSaves();
        const key = itemType + ':' + itemId;
        const i = saves.indexOf(key);
        if (i >= 0) saves.splice(i, 1);
        else saves.push(key);
        setLocalSaves(saves);
        return { saved: i < 0 };
      }
      const data = await res.json();
      return data;
    } catch (_) {
      return { saved: false };
    }
  }

  function renderMemberCard(card) {
    const no = memberNumber(card);
    const name = card.displayName || card.name || 'Navigator';
    const exp = card.exp ?? '—';
    return `
      <article class="orbit-card orbit-card--member" data-type="member">
        <p class="orbit-kicker">MEMBER CARD</p>
        <div class="orbit-hero orbit-hero--emblem"></div>
        <h2>WAKO KUNGO</h2>
        <p class="orbit-id">${esc(no)}</p>
        <p class="orbit-meta">${esc(name)} · EXP ${esc(String(exp))}</p>
        <p class="orbit-hint">Swipe → enter the Flow Orbit</p>
      </article>`;
  }

  function renderEventCard(item) {
    const ev = item.data || {};
    const loc = ev.location?.name || 'Lisbon';
    const city = ev.location?.city || '';
    return `
      <article class="orbit-card orbit-card--event" data-type="event" data-id="${esc(ev.id || '')}" data-slug="${esc(ev.slug || '')}">
        <p class="orbit-kicker">${esc(ev.statusLabel || 'EVENT')} ${ev.status === 'live' ? '●' : ''}</p>
        <div class="orbit-hero">${ev.coverImage ? `<img src="${esc(ev.coverImage)}" alt="">` : '<div class="orbit-hero-fallback"></div>'}</div>
        <h2>${esc(ev.title || 'Event')}</h2>
        <p class="orbit-meta">${esc(formatDate(ev.eventDate))} · ${esc(formatTime(ev.startTime))}</p>
        <p class="orbit-sub">${esc(loc)}${city ? ' · ' + esc(city) : ''}</p>
        <div class="orbit-actions">
          <button type="button" class="wk-btn wk-btn--gold" data-orbit-save="event" data-orbit-id="${esc(ev.slug || ev.id)}">${item.saved ? 'Saved ♥' : 'Save'}</button>
          <button type="button" class="wk-btn wk-btn--cyan" data-orbit-detail="event">Details ↑</button>
        </div>
        <p class="orbit-hint">↑ swipe for access · details</p>
      </article>`;
  }

  function renderBenefitCard(item) {
    const c = item.data || {};
    const partner = c.partner?.name || 'Partner';
    return `
      <article class="orbit-card orbit-card--benefit" data-type="benefit" data-slug="${esc(c.code || '')}">
        <p class="orbit-kicker">BENEFIT</p>
        <h2>${esc(partner)}</h2>
        <p class="orbit-lead">${esc(c.title || 'Member benefit')}</p>
        <p class="orbit-code">${esc(c.code || '')}</p>
        <p class="orbit-sub">${esc(c.benefitText || '')}</p>
        <div class="orbit-actions">
          <button type="button" class="wk-btn wk-btn--gold" data-orbit-copy="${esc(c.code || '')}">Copy</button>
          <button type="button" class="wk-btn wk-btn--cyan" data-orbit-benefit-qr="${esc(c.code || '')}" data-orbit-benefit-label="${esc(c.title || partner)}">Open QR</button>
          <button type="button" class="wk-btn wk-btn--ghost" data-orbit-save="benefit" data-orbit-id="${esc(c.code || c.id)}">${item.saved ? '♥' : 'Save'}</button>
        </div>
        <p class="orbit-hint">Staff scans once · refills next month</p>
      </article>`;
  }

  function renderPartnerCard(item) {
    const p = item.data || {};
    return `
      <article class="orbit-card orbit-card--partner" data-type="partner" data-slug="${esc(p.slug || '')}">
        <p class="orbit-kicker">PARTNER</p>
        <h2>${esc(p.name || 'Partner')}</h2>
        <p class="orbit-lead">Member access</p>
        <div class="orbit-actions">
          <a class="wk-btn wk-btn--gold" href="${esc(p.url || '#')}" target="_blank" rel="noopener">Explore</a>
          <button type="button" class="wk-btn wk-btn--ghost" data-orbit-save="partner" data-orbit-id="${esc(p.slug || p.id)}">${item.saved ? 'Saved ♥' : 'Save'}</button>
        </div>
      </article>`;
  }

  function renderLocationCard(item) {
    const loc = item.data || {};
    return `
      <article class="orbit-card orbit-card--location" data-type="location" data-slug="${esc(loc.slug || '')}">
        <p class="orbit-kicker">LOCATION</p>
        <div class="orbit-hero">${loc.coverImage ? `<img src="${esc(loc.coverImage)}" alt="">` : '<div class="orbit-hero-fallback orbit-hero-fallback--loc"></div>'}</div>
        <h2>${esc(loc.name || 'Venue')}</h2>
        <p class="orbit-meta">${esc(loc.city || 'Lisbon')}</p>
        <p class="orbit-sub">${loc.upcomingCount || 0} upcoming · Flow Point</p>
        <div class="orbit-actions">
          <button type="button" class="wk-btn wk-btn--gold" data-orbit-detail="location">Explore ↑</button>
          <a class="wk-btn wk-btn--cyan" href="${esc(loc.mapUrl || '#')}" target="_blank" rel="noopener">Map</a>
          <button type="button" class="wk-btn wk-btn--ghost" data-orbit-save="location" data-orbit-id="${esc(loc.slug || loc.id)}">${item.saved ? '♥' : 'Save'}</button>
        </div>
      </article>`;
  }

  function renderProfileCard(card, feed) {
    const no = memberNumber(card);
    const name = card.displayName || feed?.profile?.member_display_name || 'Navigator';
    const exp = card.exp ?? feed?.profile?.exp ?? 0;
    const pct = tierProgress(exp);
    const email = card.email || feed?.profile?.email || '';
    const phone = card.phone || '';
    const ig = card.instagram || card.instagram_handle || '';
    const tier = card.tier || 'registered';
    const tierLabel =
      tier === 'flow_crew' ? 'Gold' : tier === 'flow_supporter' ? 'Silver' : 'Bronze';
    return `
      <article class="orbit-card orbit-card--profile" data-type="profile">
        <p class="orbit-kicker">ME · SOUL NEXUS</p>
        <h2>${esc(name)}</h2>
        <p class="orbit-id">${esc(no)} · ${esc(tierLabel)}</p>
        <p class="orbit-meta">EXP ${esc(String(exp))}</p>
        <div class="orbit-bar"><span style="width:${pct}%"></span></div>
        <form class="orbit-me-form" id="orbit-me-form">
          <label>Display name<input name="displayName" value="${esc(name)}" required minlength="2"></label>
          <label>Email (sync key)<input name="email" type="email" value="${esc(email)}" placeholder="you@email.com"></label>
          <label>Phone <span class="muted">(optional)</span><input name="phone" type="tel" value="${esc(phone)}" placeholder="+351…"></label>
          <label>Instagram <span class="muted">(optional)</span><input name="instagram" value="${esc(ig)}" placeholder="@handle"></label>
          <button type="submit" class="wk-btn wk-btn--gold">Save profile</button>
        </form>
        <p class="orbit-hint">Profile syncs when email matches your Circle login.</p>
        <div class="orbit-actions">
          <button type="button" class="wk-btn wk-btn--cyan" data-orbit-nav="saved">My Benefits</button>
          <a class="wk-btn wk-btn--ghost" href="/pages/artist_sanctuary.html?welcome=card">3D Sanctuary</a>
        </div>
      </article>`;
  }

  function renderSavedDeck(feed, card) {
    const saves = feed?.saves || [];
    const local = localSaves();
    const rows = [];
    (feed?.events || []).forEach((ev) => {
      if (saves.some((s) => s.type === 'event' && (s.id === ev.id || s.id === ev.slug)) || local.includes('event:' + ev.slug)) {
        rows.push(`<li><strong>${esc(ev.title)}</strong><span>${esc(formatDate(ev.eventDate))}</span><button type="button" data-jump-slug="${esc(ev.slug)}" data-jump-type="event">Open</button></li>`);
      }
    });
    (feed?.coupons || []).forEach((c) => {
      if (saves.some((s) => s.type === 'benefit' && (s.id === c.code || s.id === c.id)) || local.includes('benefit:' + c.code)) {
        rows.push(`<li><strong>${esc(c.title)}</strong><span class="code">${esc(c.code)}</span></li>`);
      }
    });
    if (!rows.length) rows.push('<li class="muted">Nothing saved yet — heart an Event or Benefit.</li>');
    return `
      <article class="orbit-card orbit-card--saved" data-type="saved">
        <p class="orbit-kicker">MY FLOW</p>
        <h2>Saved</h2>
        <ul class="orbit-saved-list">${rows.join('')}</ul>
        <p class="orbit-hint">${esc(memberNumber(card))} · your orbit</p>
      </article>`;
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function buildCards(feed, card) {
    const list = [];
    list.push({ type: 'member', html: renderMemberCard(card) });
    (feed.cards || []).forEach((c) => {
      if (c.type === 'member' || c.type === 'profile') return;
      if (c.type === 'event') list.push({ ...c, html: renderEventCard(c) });
      if (c.type === 'benefit') list.push({ ...c, html: renderBenefitCard(c) });
      if (c.type === 'partner') list.push({ ...c, html: renderPartnerCard(c) });
      if (c.type === 'location') list.push({ ...c, html: renderLocationCard(c) });
    });
    list.push({ type: 'profile', html: renderProfileCard(card, feed) });
    list.push({ type: 'saved', html: renderSavedDeck(feed, card) });
    return list;
  }

  function paint() {
    if (!els.track) return;
    els.track.innerHTML = state.cards.map((c) => c.html).join('');
    goTo(state.index, false);
    bindCardActions();
  }

  function goTo(i, animate) {
    const n = state.cards.length;
    if (!n) return;
    state.index = ((i % n) + n) % n;
    const x = -state.index * 100;
    els.track.style.transition = animate === false ? 'none' : 'transform 0.35s cubic-bezier(.2,.8,.2,1)';
    els.track.style.transform = `translateX(${x}%)`;
    updateGuideForCard(state.cards[state.index]);
    updateDeepLink(state.cards[state.index]);
  }

  function updateGuideForCard(c) {
    if (!c) return;
    const lines = {
      member: 'Welcome back. Your next Flow is waiting.',
      event: 'Your next session — swipe up for access.',
      benefit: 'You unlocked something. Copy the code when ready.',
      partner: 'A partner in the Circle. Explore when you feel it.',
      location: 'A Flow Point — venue, community, connection.',
      profile: 'Your orbit identity. Tier grows with EXP.',
      saved: 'My Flow — everything you saved.',
    };
    setGuide(lines[c.type] || 'Swipe the Orbit.');
  }

  function updateDeepLink(c) {
    if (!c || !window.history?.replaceState) return;
    const u = new URL(window.location.href);
    u.searchParams.set('view', c.type === 'saved' ? 'saved' : c.type === 'member' ? 'card' : c.type);
    if (c.slug) {
      if (c.type === 'event') u.searchParams.set('event', c.slug);
      if (c.type === 'location') u.searchParams.set('location', c.slug);
      if (c.type === 'benefit') u.searchParams.set('benefit', c.slug);
      if (c.type === 'partner') u.searchParams.set('partner', c.slug);
    } else {
      ['event', 'location', 'benefit', 'partner'].forEach((k) => u.searchParams.delete(k));
    }
    history.replaceState({}, '', u.pathname + u.search);
  }

  function bindCardActions() {
    els.track.querySelectorAll('[data-orbit-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const code = btn.getAttribute('data-orbit-copy');
        try {
          await navigator.clipboard.writeText(code);
          setGuide('Copied. Show it at the partner.');
        } catch (_) {
          setGuide(code);
        }
      });
    });
    els.track.querySelectorAll('[data-orbit-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const type = btn.getAttribute('data-orbit-save');
        const id = btn.getAttribute('data-orbit-id');
        const r = await toggleSave(type, id);
        btn.textContent = r.saved ? 'Saved ♥' : type === 'benefit' ? 'Save' : 'Save';
        setGuide(r.saved ? 'Saved to My Flow.' : 'Removed from My Flow.');
      });
    });
    els.track.querySelectorAll('[data-orbit-detail]').forEach((btn) => {
      btn.addEventListener('click', () => openDetail(state.cards[state.index]));
    });
    els.track.querySelectorAll('[data-orbit-nav="saved"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = state.cards.findIndex((c) => c.type === 'saved');
        if (i >= 0) goTo(i);
      });
    });
    els.track.querySelectorAll('[data-jump-slug]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slug = btn.getAttribute('data-jump-slug');
        const type = btn.getAttribute('data-jump-type');
        const i = state.cards.findIndex((c) => c.type === type && c.slug === slug);
        if (i >= 0) goTo(i);
      });
    });
    els.track.querySelectorAll('[data-orbit-benefit-qr]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-orbit-benefit-qr');
        const label = btn.getAttribute('data-orbit-benefit-label') || 'Benefit';
        showOrbitBenefitQr(code, label);
      });
    });
    const meForm = document.getElementById('orbit-me-form');
    if (meForm) {
      meForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(meForm);
        saveMeProfile({
          displayName: String(fd.get('displayName') || '').trim(),
          email: String(fd.get('email') || '').trim().toLowerCase(),
          phone: String(fd.get('phone') || '').trim(),
          instagram: String(fd.get('instagram') || '').trim().replace(/^@/, ''),
        });
      });
    }
  }

  function showOrbitBenefitQr(code, label) {
    let modal = document.getElementById('wk-benefit-qr-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'wk-benefit-qr-modal';
      modal.className = 'wk-benefit-qr-modal';
      modal.innerHTML =
        '<div class="wk-benefit-qr-card">' +
        '<button type="button" class="wk-benefit-qr-close" aria-label="Close">×</button>' +
        '<p class="wk-benefit-qr-label"></p>' +
        '<img class="wk-benefit-qr-img" alt="QR" width="220" height="220">' +
        '<p class="wk-benefit-qr-code"></p>' +
        '<p class="wk-hint">Staff scans once. Refills next month.</p></div>';
      document.body.appendChild(modal);
      modal.querySelector('.wk-benefit-qr-close').onclick = () => {
        modal.hidden = true;
      };
      modal.onclick = (ev) => {
        if (ev.target === modal) modal.hidden = true;
      };
    }
    modal.querySelector('.wk-benefit-qr-label').textContent = label;
    modal.querySelector('.wk-benefit-qr-code').textContent = code;
    modal.querySelector('.wk-benefit-qr-img').src = window.CdfBenefitGrants
      ? window.CdfBenefitGrants.qrUrl(code)
      : 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent('CDF-BENEFIT:' + code);
    modal.hidden = false;
    setGuide('Show QR to staff — one scan this month.');
  }

  async function saveMeProfile(fields) {
    if (!fields.displayName || fields.displayName.length < 2) {
      setGuide('Name needs at least 2 letters.');
      return;
    }
    let card = {};
    try {
      card = JSON.parse(localStorage.getItem('cdf_wako_member_card') || '{}');
    } catch (_) {
      card = {};
    }
    card.displayName = fields.displayName;
    card.email = fields.email || card.email || '';
    card.phone = fields.phone || '';
    card.instagram = fields.instagram || '';
    try {
      localStorage.setItem('cdf_wako_member_card', JSON.stringify(card));
    } catch (_) { /* ignore */ }

    // Sync to Supabase profile when session email matches
    try {
      const sb = window.supabaseClient || window.cdfSupabase;
      if (sb?.auth) {
        const { data: sess } = await sb.auth.getSession();
        const user = sess?.session?.user;
        if (user?.id && fields.email && user.email && user.email.toLowerCase() === fields.email) {
          await sb
            .from('profiles')
            .update({
              member_display_name: fields.displayName,
              email: fields.email,
              instagram_handle: fields.instagram || null,
              phone: fields.phone || null,
            })
            .eq('id', user.id);
          setGuide('Profile saved & synced to your Circle account.');
        } else if (user?.id) {
          await sb
            .from('profiles')
            .update({
              member_display_name: fields.displayName,
              instagram_handle: fields.instagram || null,
            })
            .eq('id', user.id);
          setGuide('Profile saved. Use the same email as login for full sync.');
        } else {
          setGuide('Saved on this device. Sign in with the same email to sync.');
        }
      } else {
        setGuide('Saved on this device.');
      }
    } catch (_) {
      setGuide('Saved locally. Cloud sync retry later.');
    }
    state.card = card;
    paint();
  }

  function openDetail(card) {
    if (!els.detail || !els.detailBody || !card) return;
    let html = '';
    if (card.type === 'event') {
      const ev = card.data || {};
      html = `
        <p class="orbit-kicker">${esc(ev.statusLabel)}</p>
        <h3>${esc(ev.title)}</h3>
        <p>${esc(ev.description || '')}</p>
        <hr>
        <p><strong>Location</strong><br>${esc(ev.location?.name || '')} · ${esc(ev.location?.city || '')}</p>
        <p><strong>Your access</strong><br>✓ Member access<br>✓ ${esc(ev.memberBenefit || 'Community benefit')}</p>
        <div class="orbit-actions">
          <button type="button" class="wk-btn wk-btn--gold" data-orbit-save="event" data-orbit-id="${esc(ev.slug || ev.id)}">Save event</button>
          <a class="wk-btn wk-btn--cyan" href="${esc(ev.location?.mapUrl || '#')}" target="_blank" rel="noopener">Get directions</a>
        </div>`;
    } else if (card.type === 'location') {
      const loc = card.data || {};
      const upcoming = (loc.upcoming || [])
        .map((e) => `<li><strong>${esc(e.title)}</strong> · ${esc(formatDate(e.eventDate))}</li>`)
        .join('') || '<li>No upcoming listed</li>';
      html = `
        <p class="orbit-kicker">LOCATION</p>
        <h3>${esc(loc.name)}</h3>
        <p>${esc(loc.description || '')}</p>
        <p><strong>Upcoming</strong></p>
        <ul>${upcoming}</ul>
        <div class="orbit-actions">
          <a class="wk-btn wk-btn--gold" href="${esc(loc.mapUrl || '#')}" target="_blank" rel="noopener">Map</a>
          <a class="wk-btn wk-btn--cyan" href="${esc(loc.instagramUrl || '#')}" target="_blank" rel="noopener">Venue</a>
        </div>`;
    } else {
      return;
    }
    els.detailBody.innerHTML = html;
    els.detail.hidden = false;
    els.detailBody.querySelectorAll('[data-orbit-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const r = await toggleSave(btn.getAttribute('data-orbit-save'), btn.getAttribute('data-orbit-id'));
        setGuide(r.saved ? 'Saved.' : 'Removed.');
      });
    });
  }

  function closeDetail() {
    if (els.detail) els.detail.hidden = true;
  }

  function bindSwipe() {
    const stage = document.getElementById('orbit-stage');
    if (!stage) return;
    let startX = 0;
    let startY = 0;
    stage.addEventListener(
      'touchstart',
      (e) => {
        startX = e.changedTouches[0].clientX;
        startY = e.changedTouches[0].clientY;
      },
      { passive: true }
    );
    stage.addEventListener(
      'touchend',
      (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) goTo(state.index + 1);
          else goTo(state.index - 1);
        } else if (dy < -60 && Math.abs(dy) > Math.abs(dx)) {
          openDetail(state.cards[state.index]);
        } else if (dy > 60) {
          closeDetail();
        }
      },
      { passive: true }
    );
  }

  function bindDock() {
    if (!els.dock) return;
    els.dock.querySelectorAll('[data-orbit-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-orbit-mode');
        els.dock.querySelectorAll('[data-orbit-mode]').forEach((b) => b.classList.toggle('on', b === btn));
        if (mode === 'card') goTo(state.cards.findIndex((c) => c.type === 'member'));
        if (mode === 'flow') goTo(Math.max(1, state.cards.findIndex((c) => c.type === 'event')));
        if (mode === 'saved') goTo(state.cards.findIndex((c) => c.type === 'saved'));
        if (mode === 'me') goTo(state.cards.findIndex((c) => c.type === 'profile'));
      });
    });
  }

  function applyQueryJump() {
    const p = qs();
    const view = p.get('view');
    const event = p.get('event');
    const location = p.get('location');
    const benefit = p.get('benefit');
    const partner = p.get('partner');
    let i = 0;
    if (event) i = state.cards.findIndex((c) => c.type === 'event' && c.slug === event);
    else if (location) i = state.cards.findIndex((c) => c.type === 'location' && c.slug === location);
    else if (benefit) i = state.cards.findIndex((c) => c.type === 'benefit' && c.slug === benefit);
    else if (partner) i = state.cards.findIndex((c) => c.type === 'partner' && c.slug === partner);
    else if (view === 'events' || view === 'event') i = state.cards.findIndex((c) => c.type === 'event');
    else if (view === 'saved') i = state.cards.findIndex((c) => c.type === 'saved');
    else if (view === 'profile' || view === 'me') i = state.cards.findIndex((c) => c.type === 'profile');
    else if (view === 'card' || view === 'member') i = 0;
    if (i < 0) i = 0;
    goTo(i, false);
  }

  function showOrbit() {
    if (els.claimShell) els.claimShell.hidden = true;
    if (els.orbitShell) els.orbitShell.hidden = false;
    document.body.classList.add('wk-orbit-mode');
  }

  function showClaim() {
    if (els.claimShell) els.claimShell.hidden = false;
    if (els.orbitShell) els.orbitShell.hidden = true;
    document.body.classList.remove('wk-orbit-mode');
  }

  function syncChips(card, feed) {
    const no = memberNumber(card);
    const exp = card.exp ?? feed?.profile?.exp ?? '—';
    if (els.chips.status) els.chips.status.innerHTML = 'Card <strong>Active</strong>';
    if (els.chips.member) els.chips.member.innerHTML = 'No. <strong>' + esc(no) + '</strong>';
    if (els.chips.exp) els.chips.exp.innerHTML = 'EXP <strong>' + esc(String(exp)) + '</strong>';
  }

  async function enterOrbit() {
    const card = loadCard();
    showOrbit();
    setGuide('Loading your Orbit…');
    let feed;
    try {
      feed = await fetchFeed();
    } catch (_) {
      feed = { cards: [], events: [], coupons: [], locations: [], saves: [], flowee: { line: 'Offline Orbit — local card ready.' } };
    }
    state.feed = feed;
    state.cards = buildCards(feed, card);
    syncChips(card, feed);
    paint();
    applyQueryJump();
    setGuide(feed.flowee?.line || 'Welcome back. Your next Flow is waiting.');
  }

  function shouldEnterOrbit(card) {
    const p = qs();
    if (p.get('orbit') === '1' || p.get('view')) return isClaimed(card) || p.get('preview') === '1';
    return isClaimed(card);
  }

  function init() {
    if (!els.orbitShell) return;
    const card = loadCard();
    if (els.detailClose) els.detailClose.addEventListener('click', closeDetail);
    bindSwipe();
    bindDock();

    // After claim, member_card.js can call this
    window.cdfEnterFlowOrbit = enterOrbit;
    window.cdfFlowOrbitGo = (type) => {
      const i = state.cards.findIndex((c) => c.type === type);
      if (i >= 0) goTo(i);
    };

    if (shouldEnterOrbit(card)) {
      enterOrbit();
    } else {
      showClaim();
    }

    // Preview deep link for public event without claim
    const p = qs();
    if (p.get('event') && !isClaimed(card) && p.get('preview') !== '0') {
      setGuide('Event waiting — claim your card to unlock member access.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
