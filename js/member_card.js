/**
 * Wako Kungo Member Card — claim → profiles.exp, Stripe tiers, partner links
 */
(function () {
  const STORAGE_KEY = 'cdf_wako_member_card';
  const XP_CLAIM = 25;

  const PARTNERS = {
    wako: 'https://linktr.ee/wako.kungo',
    humble: 'https://humble-project.com/',
    kreativlon: 'https://www.kreativlon.shop',
  };

  const els = {
    card: document.getElementById('wk-card'),
    nameSlot: document.getElementById('wk-member-name'),
    qr: document.getElementById('wk-qr'),
    nameInput: document.getElementById('member-name-input'),
    emailInput: document.getElementById('member-email-input'),
    claimBtn: document.getElementById('claim-card-btn'),
    flipBtn: document.getElementById('flip-card-btn'),
    shareBtn: document.getElementById('share-card-btn'),
    copyBtn: document.getElementById('copy-link-btn'),
    expChip: document.getElementById('chip-exp'),
    tierChip: document.getElementById('chip-tier'),
    statusChip: document.getElementById('chip-status'),
    claimPanel: document.getElementById('claim-panel'),
    invitePanel: document.getElementById('invite-panel'),
    msg: document.getElementById('wk-status-msg'),
  };

  function loadCard() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
    } catch (_) {
      return {};
    }
  }

  function saveCard(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function publicId(card) {
    if (card.publicId) return card.publicId;
    const id = 'wk_' + Math.random().toString(36).slice(2, 10);
    card.publicId = id;
    saveCard(card);
    return id;
  }

  function cardUrl(card) {
    const id = publicId(card);
    const u = new URL(window.location.origin + '/member-card');
    u.searchParams.set('ref', id);
    if (card.displayName) u.searchParams.set('n', card.displayName);
    return u.toString();
  }

  function setMsg(text, ok) {
    if (!els.msg) return;
    els.msg.hidden = !text;
    els.msg.textContent = text || '';
    els.msg.style.borderColor = ok === false ? 'rgba(231,76,60,0.5)' : 'rgba(61,224,255,0.35)';
  }

  function speak(msg, type) {
    if (window.FloweeMemberCardGuide && typeof window.FloweeMemberCardGuide.say === 'function') {
      window.FloweeMemberCardGuide.say(msg, type);
      return;
    }
    const a = window.flowee || window.Flowee;
    if (a && typeof a.talk === 'function') a.talk(true, msg, type || 'guide');
  }

  function renderName(name) {
    const empty = !name;
    els.nameSlot.textContent = empty ? 'Your name here' : name;
    els.nameSlot.classList.toggle('is-empty', empty);
  }

  function renderQr(url) {
    if (!els.qr) return;
    els.qr.innerHTML = '';
    if (window.QRCode && typeof QRCode.toCanvas === 'function') {
      const canvas = document.createElement('canvas');
      QRCode.toCanvas(
        canvas,
        url,
        { width: 180, margin: 1, color: { dark: '#0b0f18', light: '#ffffff' } },
        (err) => {
          if (err) fallbackQr(url);
          else els.qr.appendChild(canvas);
        }
      );
    } else {
      fallbackQr(url);
    }
  }

  function fallbackQr(url) {
    const img = document.createElement('img');
    img.alt = 'Membership QR';
    img.src =
      'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(url);
    els.qr.appendChild(img);
  }

  function setChips(card, exp) {
    els.expChip.innerHTML = 'EXP <strong>' + (exp != null ? exp : '—') + '</strong>';
    const tier = card.tier || 'registered';
    const labels = {
      registered: 'Registered',
      flow_supporter: 'Flow Supporter',
      flow_crew: 'Flow Crew',
    };
    els.tierChip.innerHTML = 'Tier <strong>' + (labels[tier] || tier) + '</strong>';
    els.statusChip.innerHTML = card.claimed
      ? 'Card <strong>Active</strong>'
      : 'Card <strong>Draft</strong>';
  }

  async function sessionJwt() {
    const sc = window.supabaseClient;
    if (!sc) return { jwt: '', user: null };
    const { data } = await sc.auth.getSession();
    return {
      jwt: data?.session?.access_token || '',
      user: data?.session?.user || null,
    };
  }

  async function readExp() {
    try {
      const sc = window.supabaseClient;
      if (sc) {
        const { data: sess } = await sc.auth.getSession();
        const uid = sess?.session?.user?.id;
        if (uid) {
          const { data } = await sc
            .from('profiles')
            .select('exp, username, full_name, member_display_name, membership_tier, membership_status, member_card_public_id, email')
            .eq('id', uid)
            .maybeSingle();
          if (data) {
            return {
              exp: data.exp ?? 0,
              name: data.member_display_name || data.full_name || data.username || '',
              email: data.email || sess.session.user.email || '',
              tier: data.membership_tier || 'registered',
              membershipStatus: data.membership_status || 'none',
              publicId: data.member_card_public_id || '',
              authed: true,
              uid,
            };
          }
        }
      }
    } catch (_) {
      /* ignore */
    }
    let localXp = 0;
    try {
      const g = JSON.parse(localStorage.getItem('user_gamification_data') || '{}');
      localXp = g.xp || g.exp || 0;
    } catch (_) {
      /* ignore */
    }
    return { exp: localXp, name: '', email: '', tier: 'registered', authed: false, uid: null };
  }

  async function claim() {
    const name = (els.nameInput?.value || '').trim();
    if (name.length < 2) {
      speak('I need a name for the gold plate — at least two letters.', 'error');
      els.nameInput?.focus();
      return;
    }

    const card = loadCard();
    card.displayName = name;
    card.claimed = true;
    card.tier = card.tier || 'registered';
    card.claimedAt = new Date().toISOString();
    card.source = new URLSearchParams(window.location.search).get('src') || 'direct';
    publicId(card);
    saveCard(card);

    const { jwt, user } = await sessionJwt();
    let expShown = null;

    if (jwt) {
      try {
        const res = await fetch('/api/claim-member-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + jwt,
          },
          body: JSON.stringify({
            displayName: name,
            publicId: card.publicId,
            source: card.source,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          expShown = data.exp;
          card.publicId = data.publicId || card.publicId;
          card.profileBound = true;
          saveCard(card);
          setMsg('Card saved to your Circle profile · +' + (data.xpAwarded || 0) + ' EXP', true);
          speak(
            data.alreadyClaimed
              ? 'Card already on your profile. EXP stays synced.'
              : 'Beautiful. Card + EXP are on your profile now.',
            'guide'
          );
        } else if (data.code === 'AUTH_REQUIRED') {
          setMsg('Log in to lock EXP onto your profile. Card is ready locally.', false);
          speak('Log in so I can write EXP into your profile. Card still works locally.', 'guide');
        } else {
          setMsg(data.error || 'Profile save failed — card kept locally.', false);
        }
      } catch (e) {
        setMsg('Network issue — card kept on this device.', false);
      }
    } else {
      // Soft local XP until login
      try {
        const g = JSON.parse(localStorage.getItem('user_gamification_data') || '{}');
        if (!card.xpAwarded) {
          g.xp = (g.xp || 0) + XP_CLAIM;
          g.exp = (g.exp || 0) + XP_CLAIM;
          localStorage.setItem('user_gamification_data', JSON.stringify(g));
          card.xpAwarded = true;
          saveCard(card);
          expShown = g.exp;
        }
      } catch (_) {
        /* ignore */
      }
      setMsg('Card claimed on device. Log in to sync EXP to your profile.', true);
      speak(
        'Card claimed. Log in (same email as events) so EXP lands on your profile.',
        'guide'
      );
      if (user) {
        /* noop */
      }
    }

    const profile = await readExp();
    renderName(name);
    renderQr(cardUrl(card));
    setChips({ ...card, tier: profile.tier || card.tier }, expShown != null ? expShown : profile.exp);
    els.card?.classList.add('is-flipped');
    els.invitePanel?.removeAttribute('hidden');
  }

  async function startCheckout(tier) {
    const card = loadCard();
    const name = (els.nameInput?.value || card.displayName || '').trim();
    const email = (els.emailInput?.value || '').trim();
    const { user } = await sessionJwt();

    if (!name) {
      speak('Claim your name on the card first.', 'error');
      return;
    }

    setMsg('Opening Stripe Checkout…', true);
    speak('Taking you to Stripe — secure monthly membership.', 'guide');

    try {
      const res = await fetch('/api/create-membership-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          displayName: name,
          email: email || user?.email || '',
          userId: user?.id || '',
          source: card.source || 'member_card',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Checkout unavailable');
      }
      window.location.href = data.url;
    } catch (e) {
      setMsg(e.message || 'Stripe checkout failed', false);
      speak(e.message || 'Stripe is not ready yet. Check STRIPE_SECRET_KEY on Vercel.', 'error');
    }
  }

  async function activatePaidSession(sessionId) {
    setMsg('Confirming membership with Stripe…', true);
    try {
      const res = await fetch('/api/membership-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Activation failed');
      }
      const card = loadCard();
      card.tier = data.tier || card.tier;
      card.claimed = true;
      saveCard(card);
      els.invitePanel?.removeAttribute('hidden');
      if (data.pendingClaim) {
        setMsg('Payment received. Log in with ' + (data.email || 'your email') + ' to bind the tier.', true);
        speak('Payment clear. Log in with the same email to bind Flow Crew to your profile.', 'guide');
      } else {
        setMsg(
          'Membership active · ' +
            (data.tier || '') +
            (data.xpAwarded ? ' · +' + data.xpAwarded + ' EXP' : ''),
          true
        );
        speak('Welcome to the Crew. Your profile tier and EXP are updated.', 'guide');
      }
      await refresh();
    } catch (e) {
      setMsg(e.message || 'Could not activate membership', false);
    }
  }

  function flip() {
    els.card?.classList.toggle('is-flipped');
  }

  async function share() {
    const card = loadCard();
    const url = cardUrl(card);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wako Kungo Membership Card',
          text: (card.displayName || 'Flow member') + ' — Circle D Flow',
          url,
        });
        return;
      } catch (_) {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      speak('Link copied.', 'guide');
    } catch (_) {
      prompt('Copy your card link:', url);
    }
  }

  async function refresh() {
    const card = loadCard();
    const params = new URLSearchParams(window.location.search);
    const refName = params.get('n');
    if (refName && !card.displayName) {
      card.displayName = refName;
      saveCard(card);
    }
    const profile = await readExp();
    if (!card.displayName && profile.name) {
      card.displayName = profile.name;
      saveCard(card);
    }
    if (profile.tier && profile.tier !== 'registered') {
      card.tier = profile.tier;
      saveCard(card);
    }
    if (profile.publicId) {
      card.publicId = profile.publicId;
      card.claimed = true;
      saveCard(card);
    }
    if (els.nameInput && card.displayName) els.nameInput.value = card.displayName;
    if (els.emailInput && profile.email) els.emailInput.value = profile.email;
    renderName(card.displayName || '');
    renderQr(cardUrl(card));
    setChips(card, profile.exp);
    if (card.claimed) els.invitePanel?.removeAttribute('hidden');
    return { card, profile };
  }

  els.card?.addEventListener('click', flip);
  els.flipBtn?.addEventListener('click', flip);
  els.claimBtn?.addEventListener('click', claim);
  els.shareBtn?.addEventListener('click', share);
  els.copyBtn?.addEventListener('click', share);

  document.querySelectorAll('[data-tier-select]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tier = btn.getAttribute('data-tier-select');
      if (tier === 'registered') {
        const card = loadCard();
        card.tier = 'registered';
        saveCard(card);
        setChips(card, null);
        speak('Registered is a strong start. Explore partners below anytime.', 'guide');
        return;
      }
      startCheckout(tier);
    });
  });

  document.querySelectorAll('[data-partner]').forEach((a) => {
    const key = a.getAttribute('data-partner');
    if (PARTNERS[key]) a.href = PARTNERS[key];
  });

  const params = new URLSearchParams(window.location.search);
  refresh().then(async ({ card }) => {
    if (params.get('paid') === '1' && params.get('session_id')) {
      await activatePaidSession(params.get('session_id'));
      return;
    }
    if (params.get('canceled') === '1') {
      setMsg('Checkout canceled — your free card stays active.', true);
      speak('No rush. Your Registered card remains.', 'guide');
      return;
    }
    if (card.claimed) {
      speak('Welcome back. Flip for name + QR. Partners live below.', 'guide');
    } else {
      speak(
        'I am Flowee. Claim your Wako Kungo card — EXP goes to your profile when you are logged in.',
        'guide'
      );
    }
  });
})();
