/**
 * Wako Kungo Member Card — Flowee-guided swipe claim flow
 * Steps: welcome → name → contact method → details → password/profile → claim → optional tier → sanctuary
 */
(function () {
  const STORAGE_KEY = 'cdf_wako_member_card';
  const INVENTORY_KEY = 'cdf_inventory';
  const XP_CLAIM = 25;
  const SANCTUARY_URL = '/pages/artist_sanctuary.html?welcome=card';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed ' + src));
      document.head.appendChild(s);
    });
  }

  let libsPromise = null;
  function ensureLibs() {
    if (!libsPromise) {
      libsPromise = Promise.all([
        window.supabase || window.supabaseClient
          ? Promise.resolve()
          : loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'),
        window.QRCode
          ? Promise.resolve()
          : loadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js'),
      ]).then(() => {
        // supabase_client.js (defer) may init after CDN loads
        return new Promise((r) => setTimeout(r, 50));
      });
    }
    return libsPromise;
  }

  function sanctuaryDest() {
    try {
      const n = new URLSearchParams(window.location.search).get('next');
      if (n && n.startsWith('/') && !n.startsWith('//')) return n;
    } catch (_) { /* ignore */ }
    return SANCTUARY_URL;
  }
  const TOTAL_STEPS = 7;

  const GUIDE = [
    'Tap the card to see the Wako Kungo emblem. Then swipe — I guide every step.',
    'What name goes on the gold plate? Type it, then Next.',
    'How do you want to connect? Google, email, Instagram, or another contact — same spirit as Circle D Flow.',
    'Almost there. Confirm how we reach you so the profile can bind.',
    'No profile yet? Create a password. Already in the Circle? Sign in with the same credentials.',
    'Claim locks your member number + QR into inventory, then we open the 3D Sanctuary.',
    'Optional Silver (€5) or Gold (€10) — or enter Sanctuary with Bronze free.',
  ];

  const state = {
    step: 0,
    contact: '',
    swiping: false,
  };

  const els = {
    track: document.getElementById('wk-track'),
    deck: document.getElementById('wk-deck'),
    dots: document.getElementById('wk-dots'),
    guide: document.getElementById('wk-guide'),
    card: document.getElementById('wk-card'),
    nameText: document.getElementById('wk-name-text'),
    nameSlot: document.getElementById('wk-member-name'),
    memberNo: document.getElementById('wk-member-no'),
    qr: document.getElementById('wk-qr'),
    nameInput: document.getElementById('member-name-input'),
    emailInput: document.getElementById('member-email-input'),
    igInput: document.getElementById('member-ig-input'),
    otherInput: document.getElementById('member-other-input'),
    passwordInput: document.getElementById('member-password-input'),
    password2Input: document.getElementById('member-password2-input'),
    fieldIg: document.getElementById('field-instagram'),
    fieldOther: document.getElementById('field-other'),
    fieldEmail: document.getElementById('field-email'),
    fieldPassword: document.getElementById('field-password'),
    fieldPassword2: document.getElementById('field-password2'),
    contactTitle: document.getElementById('contact-detail-title'),
    contactHint: document.getElementById('contact-detail-hint'),
    authHint: document.getElementById('auth-hint'),
    authBtn: document.getElementById('auth-submit-btn'),
    skipAuthed: document.getElementById('skip-if-authed-btn'),
    claimBtn: document.getElementById('claim-card-btn'),
    flipBtn: document.getElementById('flip-card-btn'),
    shareBtn: document.getElementById('share-card-btn'),
    goSanctuary: document.getElementById('go-sanctuary-btn'),
    couponsBox: document.getElementById('wk-coupons'),
    afterClaimNav: document.getElementById('wk-after-claim-nav'),
    msg: document.getElementById('wk-status-msg'),
    issueMsg: document.getElementById('wk-issue-msg'),
    expChip: document.getElementById('chip-exp'),
    memberChip: document.getElementById('chip-member'),
    statusChip: document.getElementById('chip-status'),
  };

  const DEFAULT_COUPONS = [
    {
      code: 'WK-PLUS1-ENTRY',
      title: 'Guest +1 free entry',
      benefitText: 'Freier Eintritt für dich +1 bei Wako Kungo und Partner-Events.',
      partner: { name: 'Wako Kungo', url: 'https://www.instagram.com/wako.kungo/', slug: 'wako' },
    },
    {
      code: 'WK-FREE-DRINK',
      title: 'Wako free drink',
      benefitText: 'Ein Free Drink bei Wako Kungo (Mitgliedskarte zeigen).',
      partner: { name: 'Wako Kungo', url: 'https://www.instagram.com/wako.kungo/', slug: 'wako' },
    },
    {
      code: 'WK-HUMBLE-15',
      title: 'Humble 15% off',
      benefitText: '15% Rabatt bei Humble.project mit Mitgliedscode.',
      discountPercent: 15,
      partner: { name: 'Humble.project', url: 'https://humble-project.com/', slug: 'humble' },
    },
    {
      code: 'WK-KREATIV-20',
      title: 'Kreativlon 20% off',
      benefitText: '20% Rabatt bei Kreativlon.art mit Mitgliedscode.',
      discountPercent: 20,
      partner: { name: 'Kreativlon.art', url: 'https://www.kreativlon.shop', slug: 'kreativlon' },
    },
  ];

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

  /** Stable member number from publicId → WK-###### */
  function memberNumber(card) {
    if (card.memberNumber) return card.memberNumber;
    const id = publicId(card);
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    const num = String(100000 + (h % 900000));
    card.memberNumber = 'WK-' + num;
    saveCard(card);
    return card.memberNumber;
  }

  function cardUrl(card) {
    const id = publicId(card);
    const u = new URL(window.location.origin + '/member-card');
    u.searchParams.set('ref', id);
    if (card.displayName) u.searchParams.set('n', card.displayName);
    if (card.memberNumber) u.searchParams.set('m', card.memberNumber);
    return u.toString();
  }

  const WAKO_IG = 'https://www.instagram.com/wako.kungo/';

  function profileQrUrl(_card, _uid) {
    return WAKO_IG;
  }

  function speak(msg, type) {
    if (els.guide) els.guide.textContent = String(msg || '');
    if (window.FloweeMemberCardGuide && typeof window.FloweeMemberCardGuide.say === 'function') {
      window.FloweeMemberCardGuide.say(msg, type);
      return;
    }
    const a = window.flowee || window.Flowee;
    if (a && typeof a.talk === 'function') a.talk(true, msg, type || 'guide');
  }

  function setMsg(el, text, ok) {
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || '';
    el.style.borderColor = ok === false ? 'rgba(231,76,60,0.5)' : 'rgba(61,224,255,0.35)';
  }

  function renderName(name, number) {
    const empty = !name;
    if (els.nameText) els.nameText.textContent = empty ? 'Your name here' : name;
    els.nameSlot?.classList.toggle('is-empty', empty);
    if (els.memberNo) {
      if (number) {
        els.memberNo.hidden = false;
        els.memberNo.textContent = number;
      } else {
        els.memberNo.hidden = true;
      }
    }
  }

  async function renderQr(url) {
    if (!els.qr) return;
    els.qr.innerHTML = '';
    try {
      await ensureLibs();
    } catch (_) { /* fallback below */ }
    if (window.QRCode && typeof QRCode.toCanvas === 'function') {
      const canvas = document.createElement('canvas');
      QRCode.toCanvas(
        canvas,
        url,
        { width: 160, margin: 1, color: { dark: '#0b0f18', light: '#ffffff' } },
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
      'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(url);
    els.qr.appendChild(img);
  }

  function renderCoupons(list) {
    const box = els.couponsBox;
    if (!box) return;
    const coupons = Array.isArray(list) && list.length ? list : DEFAULT_COUPONS;
    box.hidden = false;
    box.innerHTML =
      '<p class="wk-hint" style="margin:0 0 0.35rem">Deine Partner-Gutscheine (shared codes — kopieren &amp; einlösen):</p>' +
      coupons
        .map((c) => {
          const partner = c.partner || {};
          const url = partner.url || '#';
          const name = partner.name || 'Partner';
          const code = c.code || '';
          return (
            '<article class="wk-coupon" data-code="' +
            code.replace(/"/g, '') +
            '">' +
            '<strong>' +
            name +
            ' · ' +
            (c.title || 'Perk') +
            '</strong>' +
            '<div class="wk-code">' +
            code +
            '</div>' +
            '<p>' +
            (c.benefitText || c.benefit_text || '') +
            '</p>' +
            '<div class="wk-coupon-actions">' +
            '<button type="button" class="wk-btn wk-btn--gold wk-copy-code" data-code="' +
            code.replace(/"/g, '') +
            '">Copy code</button>' +
            '<a class="wk-btn wk-btn--partner" href="' +
            url +
            '" target="_blank" rel="noopener noreferrer">Open partner</a>' +
            '</div></article>'
          );
        })
        .join('');

    box.querySelectorAll('.wk-copy-code').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const code = btn.getAttribute('data-code') || '';
        try {
          await navigator.clipboard.writeText(code);
          speak('Code ' + code + ' copied.', 'guide');
          btn.textContent = 'Copied';
          setTimeout(() => {
            btn.textContent = 'Copy code';
          }, 1200);
        } catch (_) {
          prompt('Copy code:', code);
        }
      });
    });

    try {
      const card = loadCard();
      card.coupons = coupons;
      saveCard(card);
      localStorage.setItem('cdf_member_coupons', JSON.stringify(coupons));
    } catch (_) {
      /* ignore */
    }
  }

  function tierLabel(tier) {
    if (tier === 'flow_crew') return 'Gold · €10';
    if (tier === 'flow_supporter') return 'Silver · €5';
    return 'Bronze · Free';
  }

  function setChips(card, exp) {
    if (els.expChip) els.expChip.innerHTML = 'EXP <strong>' + (exp != null ? exp : '—') + '</strong>';
    if (els.memberChip) {
      els.memberChip.innerHTML =
        'No. <strong>' + (card.memberNumber || '—') + '</strong>';
    }
    if (els.statusChip) {
      els.statusChip.innerHTML = card.claimed
        ? 'Card <strong>Active</strong>'
        : 'Card <strong>Draft</strong>';
    }
    const tierChip = document.getElementById('wk-tier-chip');
    if (tierChip) tierChip.textContent = tierLabel(card.tier || 'registered');
    const upBtn = document.getElementById('wk-upgrade-btn');
    if (upBtn) {
      const t = card.tier || 'registered';
      if (t === 'flow_crew') upBtn.textContent = 'Gold · Active';
      else if (t === 'flow_supporter') upBtn.textContent = 'Upgrade · Gold €10';
      else upBtn.textContent = 'Upgrade · Silver / Gold';
    }
  }

  function goStep(n, opts) {
    const max = TOTAL_STEPS - 1;
    state.step = Math.max(0, Math.min(max, n));
    if (els.track) {
      els.track.style.transform = 'translateX(-' + state.step * 100 + '%)';
    }
    if (els.dots) {
      const spans = els.dots.querySelectorAll('span');
      // Map 7 flow steps onto 5 progress dots
      const map = [0, 1, 2, 2, 3, 4, 4];
      const active = map[state.step] ?? 0;
      spans.forEach((s, i) => s.classList.toggle('on', i === active));
    }
    if (!opts || !opts.silent) {
      speak(GUIDE[state.step] || '', 'guide');
    }
    if (state.step === 0) {
      // Show emblem briefly then flip to name plate
      els.card?.classList.remove('is-flipped');
      setTimeout(() => els.card?.classList.add('is-flipped'), 900);
    }
    if (state.step === 4) refreshAuthUi();
    if (state.step === 3) syncContactDetailUi();
  }

  function syncContactDetailUi() {
    const c = state.contact || loadCard().contactMethod || 'email';
    state.contact = c;
    els.fieldIg && (els.fieldIg.hidden = c !== 'instagram');
    els.fieldOther && (els.fieldOther.hidden = c !== 'other');
    els.fieldEmail && (els.fieldEmail.hidden = c === 'google');
    if (els.contactTitle) {
      const titles = {
        google: 'Google sign-in',
        email: 'Your email',
        instagram: 'Instagram + email',
        other: 'Other contact + email',
      };
      els.contactTitle.textContent = titles[c] || 'Your contact';
    }
    if (els.contactHint) {
      els.contactHint.textContent =
        c === 'google'
          ? 'Continue opens Google. We return here to issue your card.'
          : 'Email binds Stripe and your Circle profile.';
    }
    document.querySelectorAll('[data-contact]').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.getAttribute('data-contact') === c);
    });
  }

  async function sessionJwt() {
    try {
      await ensureLibs();
    } catch (_) { /* ignore */ }
    const sc = window.supabaseClient;
    if (!sc) return { jwt: '', user: null };
    const { data } = await sc.auth.getSession();
    return {
      jwt: data?.session?.access_token || '',
      user: data?.session?.user || null,
    };
  }

  async function refreshAuthUi() {
    const { user } = await sessionJwt();
    const hasSession = Boolean(user);
    if (els.fieldPassword) els.fieldPassword.hidden = hasSession;
    if (els.fieldPassword2) els.fieldPassword2.hidden = hasSession;
    if (els.skipAuthed) els.skipAuthed.hidden = !hasSession;
    if (els.authBtn) {
      els.authBtn.textContent = hasSession ? 'Continue · Issue card' : 'Create / sign in';
    }
    if (els.authHint) {
      els.authHint.textContent = hasSession
        ? 'You are already signed in as ' + (user.email || 'member') + '.'
        : 'No profile yet? We create one. Existing account? Same email + password signs you in.';
    }
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
            .select(
              'exp, username, member_display_name, membership_tier, membership_status, member_card_public_id, email, instagram_handle'
            )
            .eq('id', uid)
            .maybeSingle();
          if (data) {
            return {
              exp: data.exp ?? 0,
              name: data.member_display_name || data.username || '',
              email: data.email || sess.session.user.email || '',
              tier: data.membership_tier || 'registered',
              publicId: data.member_card_public_id || '',
              instagram: data.instagram_handle || '',
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

  function pushInventory(card, uid) {
    let inv = [];
    try {
      inv = JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
      if (!Array.isArray(inv)) inv = [];
    } catch (_) {
      inv = [];
    }
    const item = {
      id: 'wako_member_card_' + publicId(card),
      type: 'membership_card',
      name: 'Wako Kungo Membership Card',
      label: 'Wako Kungo · ' + (card.memberNumber || ''),
      memberNumber: card.memberNumber,
      displayName: card.displayName,
      publicId: card.publicId,
      qrUrl: profileQrUrl(card, uid),
      cardUrl: cardUrl(card),
      qty: 1,
      acquiredAt: new Date().toISOString(),
      icon: 'badge',
    };
    inv = inv.filter((x) => x.type !== 'membership_card' && x.id !== item.id);
    inv.unshift(item);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));

    // Sanctuary / soulprint habit
    try {
      const g = JSON.parse(localStorage.getItem('user_gamification_data') || '{}');
      g.inventory = g.inventory || [];
      g.inventory = g.inventory.filter((x) => x.type !== 'membership_card');
      g.inventory.unshift(item);
      localStorage.setItem('user_gamification_data', JSON.stringify(g));
    } catch (_) {
      /* ignore */
    }
    return item;
  }

  function validateName() {
    const name = (els.nameInput?.value || '').trim();
    if (name.length < 2) {
      speak('I need at least two letters for the gold plate.', 'error');
      els.nameInput?.focus();
      return null;
    }
    const card = loadCard();
    card.displayName = name;
    saveCard(card);
    renderName(name, card.memberNumber);
    return name;
  }

  function validateContactChoice() {
    if (!state.contact) {
      speak('Pick how you join — Google, email, Instagram, or other.', 'error');
      return false;
    }
    const card = loadCard();
    card.contactMethod = state.contact;
    saveCard(card);
    return true;
  }

  function validateContactDetails() {
    const card = loadCard();
    const c = state.contact || card.contactMethod || 'email';
    if (c === 'google') return true;

    if (c === 'instagram') {
      let ig = (els.igInput?.value || '').trim();
      if (!ig) {
        speak('Drop your Instagram handle — with or without @.', 'error');
        els.igInput?.focus();
        return false;
      }
      if (!ig.startsWith('@')) ig = '@' + ig.replace(/^@+/, '');
      card.instagram = ig;
    }
    if (c === 'other') {
      const other = (els.otherInput?.value || '').trim();
      if (other.length < 3) {
        speak('Add a contact we can recognize — WhatsApp, Discord, or phone.', 'error');
        els.otherInput?.focus();
        return false;
      }
      card.otherContact = other;
    }

    const email = (els.emailInput?.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      speak('A valid email binds your profile and Stripe.', 'error');
      els.emailInput?.focus();
      return false;
    }
    card.email = email;
    saveCard(card);
    return true;
  }

  async function startGoogleOAuth() {
    const sc = window.supabaseClient;
    if (!sc) {
      speak('Auth is offline. Try email instead.', 'error');
      return;
    }
    const redirectTo =
      window.location.origin + '/member-card?step=issue&oauth=1';
    speak('Opening Google… come back and we issue the card.', 'guide');
    const { error } = await sc.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      setMsg(els.msg, error.message, false);
      speak(error.message, 'error');
    }
  }

  async function ensureProfile() {
    const { user } = await sessionJwt();
    if (user) {
      goStep(5);
      return true;
    }

    const card = loadCard();
    if (card.contactMethod === 'google' || state.contact === 'google') {
      await startGoogleOAuth();
      return false;
    }

    const email = (els.emailInput?.value || card.email || '').trim();
    const password = els.passwordInput?.value || '';
    const password2 = els.password2Input?.value || '';

    if (!email) {
      speak('Email is missing — swipe back one step.', 'error');
      goStep(3);
      return false;
    }
    if (password.length < 6) {
      speak('Password needs at least 6 characters.', 'error');
      els.passwordInput?.focus();
      return false;
    }
    if (password !== password2) {
      speak('Passwords do not match.', 'error');
      els.password2Input?.focus();
      return false;
    }

    const sc = window.supabaseClient;
    if (!sc) {
      speak('Supabase client missing — refresh and try again.', 'error');
      return false;
    }

    setMsg(els.msg, 'Creating your Circle profile…', true);
    speak('Forging your profile in the Circle…', 'guide');

    const meta = {
      member_display_name: card.displayName || '',
      username: card.displayName || '',
      instagram_handle: (card.instagram || '').replace(/^@/, ''),
      other_contact: card.otherContact || '',
      contact_method: card.contactMethod || state.contact || 'email',
      source: 'member_card',
    };

    let { data, error } = await sc.auth.signUp({
      email,
      password,
      options: { data: meta },
    });

    if (error) {
      // Existing user → sign in
      if (/already|registered|exists/i.test(error.message)) {
        const signed = await sc.auth.signInWithPassword({ email, password });
        if (signed.error) {
          setMsg(els.msg, signed.error.message, false);
          speak(signed.error.message, 'error');
          return false;
        }
        data = signed.data;
      } else {
        setMsg(els.msg, error.message, false);
        speak(error.message, 'error');
        return false;
      }
    }

    if (!data?.session && data?.user) {
      // Email confirm may be required
      const signed = await sc.auth.signInWithPassword({ email, password });
      if (signed.error) {
        setMsg(
          els.msg,
          'Account created. Confirm your email if required, then sign in.',
          true
        );
        speak('Check your inbox if confirmation is on — then come back.', 'guide');
        return false;
      }
    }

    setMsg(els.msg, 'Profile ready.', true);
    speak('Profile locked in. Now we stamp your membership card.', 'guide');
    goStep(5);
    return true;
  }

  async function claimAndEnter() {
    const name = (els.nameInput?.value || loadCard().displayName || '').trim();
    if (name.length < 2) {
      speak('Name first — swipe back to the name step.', 'error');
      goStep(1);
      return;
    }

    const card = loadCard();
    card.displayName = name;
    card.claimed = true;
    card.tier = card.tier || 'registered';
    card.claimedAt = new Date().toISOString();
    card.source = new URLSearchParams(window.location.search).get('src') || 'direct';
    publicId(card);
    memberNumber(card);
    saveCard(card);

    const { jwt, user } = await sessionJwt();
    let expShown = null;
    let uid = user?.id || null;

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
            memberNumber: card.memberNumber,
            source: card.source,
            instagram: card.instagram || '',
            contactMethod: card.contactMethod || '',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          expShown = data.exp;
          card.publicId = data.publicId || card.publicId;
          card.profileBound = true;
          if (data.tier) card.tier = data.tier;
          saveCard(card);
          setMsg(
            els.issueMsg,
            'Card on profile · ' + card.memberNumber + ' · +' + (data.xpAwarded || 0) + ' EXP',
            true
          );
          renderCoupons(data.coupons);
        } else if (data.code === 'AUTH_REQUIRED') {
          setMsg(els.issueMsg, 'Session expired — swipe back to sign in.', false);
          if (data.coupons) renderCoupons(data.coupons);
          else renderCoupons(DEFAULT_COUPONS);
        } else {
          setMsg(els.issueMsg, data.error || 'Profile save failed — card kept locally.', false);
          renderCoupons(DEFAULT_COUPONS);
        }
      } catch (_) {
        setMsg(els.issueMsg, 'Network issue — card kept on this device.', false);
        renderCoupons(DEFAULT_COUPONS);
      }
    } else {
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
      setMsg(els.issueMsg, 'Card claimed on device. Sign in later to sync EXP.', true);
      renderCoupons(DEFAULT_COUPONS);
    }

    pushInventory(card, uid);
    renderName(name, card.memberNumber);
    renderQr(profileQrUrl(card, uid));
    const profile = await readExp();
    setChips(card, expShown != null ? expShown : profile.exp);
    els.card?.classList.add('is-flipped');
    if (els.afterClaimNav) els.afterClaimNav.hidden = false;
    if (els.claimBtn) els.claimBtn.hidden = true;

    speak('Card ' + card.memberNumber + ' claimed. Opening your Flow Orbit…', 'guide');
    setTimeout(() => {
      if (typeof window.cdfEnterFlowOrbit === 'function') window.cdfEnterFlowOrbit();
    }, 650);
  }

  async function startCheckout(tier) {
    const card = loadCard();
    const name = (els.nameInput?.value || card.displayName || '').trim();
    const email = (els.emailInput?.value || card.email || '').trim();
    const { user } = await sessionJwt();
    if (!name) {
      speak('Claim your name first.', 'error');
      goStep(1);
      return;
    }
    const billing =
      document.querySelector('input[name="wk-billing"]:checked')?.value || 'month';
    const billToggle = document.getElementById('wk-billing-toggle');
    if (billToggle) billToggle.hidden = false;
    speak(
      billing === 'year'
        ? 'Opening Stripe — yearly membership (2 months free).'
        : 'Opening Stripe — monthly membership.',
      'guide'
    );
    try {
      const res = await fetch('/api/create-membership-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          interval: billing,
          displayName: name,
          email: email || user?.email || '',
          userId: user?.id || '',
          source: card.source || 'member_card',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      speak(err.message || 'Checkout failed', 'error');
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
          text: (card.displayName || 'Flow member') + ' · ' + (card.memberNumber || ''),
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

  function tryAdvanceFrom(step) {
    if (step === 1 && !validateName()) return false;
    if (step === 2 && !validateContactChoice()) return false;
    if (step === 3) {
      if (!validateContactDetails()) return false;
      if (state.contact === 'google') {
        startGoogleOAuth();
        return false;
      }
    }
    return true;
  }

  // ——— Swipe ———
  function bindSwipe() {
    const deck = els.deck;
    if (!deck) return;
    let startX = 0;
    let startY = 0;
    let dx = 0;

    deck.addEventListener(
      'touchstart',
      (e) => {
        if (!e.touches[0]) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dx = 0;
        state.swiping = true;
      },
      { passive: true }
    );

    deck.addEventListener(
      'touchmove',
      (e) => {
        if (!state.swiping || !e.touches[0]) return;
        dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    deck.addEventListener(
      'touchend',
      () => {
        if (!state.swiping) return;
        state.swiping = false;
        if (dx < -56) {
          if (tryAdvanceFrom(state.step)) goStep(state.step + 1);
        } else if (dx > 56) {
          goStep(state.step - 1);
        }
        dx = 0;
      },
      { passive: true }
    );
  }

  // ——— Events ———
  document.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (btn.id === 'contact-continue-btn' || btn.hasAttribute('data-next')) {
        if (!tryAdvanceFrom(state.step)) return;
        if (state.step === 3 && state.contact === 'google') return;
        goStep(state.step + 1);
      }
    });
  });

  document.querySelectorAll('[data-prev]').forEach((btn) => {
    btn.addEventListener('click', () => goStep(state.step - 1));
  });

  document.querySelectorAll('[data-contact]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.contact = btn.getAttribute('data-contact') || '';
      document.querySelectorAll('[data-contact]').forEach((b) => {
        b.classList.toggle('is-selected', b === btn);
      });
      const card = loadCard();
      card.contactMethod = state.contact;
      saveCard(card);
      speak(
        state.contact === 'google'
          ? 'Google it is — fast gate into the Circle.'
          : state.contact === 'instagram'
            ? 'Instagram handle next — then email for the profile.'
            : 'Good. Next we collect the details.',
        'guide'
      );
    });
  });

  els.authBtn?.addEventListener('click', () => ensureProfile());
  els.skipAuthed?.addEventListener('click', () => goStep(5));
    els.claimBtn?.addEventListener('click', () => claimAndEnter());
    document.getElementById('enter-orbit-btn')?.addEventListener('click', () => {
      if (typeof window.cdfEnterFlowOrbit === 'function') window.cdfEnterFlowOrbit();
    });
  els.flipBtn?.addEventListener('click', flip);
  els.shareBtn?.addEventListener('click', share);
  els.card?.addEventListener('click', flip);
  els.card?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flip();
    }
  });

  els.nameInput?.addEventListener('input', () => {
    const n = (els.nameInput.value || '').trim();
    renderName(n, loadCard().memberNumber);
  });

  document.querySelectorAll('[data-tier-select]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tier = btn.getAttribute('data-tier-select');
      if (tier === 'registered') {
        window.location.href = sanctuaryDest();
        return;
      }
      startCheckout(tier);
    });
  });

  bindSwipe();

  async function boot() {
    const params = new URLSearchParams(window.location.search);
    const card = loadCard();
    const profile = await readExp();

    if (params.get('n') && !card.displayName) {
      card.displayName = params.get('n');
      saveCard(card);
    }
    if (profile.name && !card.displayName) {
      card.displayName = profile.name;
      saveCard(card);
    }
    if (profile.publicId) {
      card.publicId = profile.publicId;
      card.claimed = true;
      saveCard(card);
    }
    if (profile.email && els.emailInput) els.emailInput.value = profile.email;
    if (card.displayName && els.nameInput) els.nameInput.value = card.displayName;
    if ((card.instagram || profile.instagram) && els.igInput) {
      els.igInput.value = card.instagram || profile.instagram;
    }
    if (card.otherContact && els.otherInput) els.otherInput.value = card.otherContact;
    if (card.contactMethod) state.contact = card.contactMethod;

    if (card.claimed) memberNumber(card);
    renderName(card.displayName || '', card.memberNumber || '');
    renderQr(WAKO_IG);
    setChips(card, profile.exp);

    // Paid return
    if (params.get('paid') === '1' && params.get('session_id')) {
      goStep(6, { silent: true });
      speak('Payment return — confirming membership…', 'guide');
      try {
        const res = await fetch('/api/membership-activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: params.get('session_id') }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          card.tier = data.tier || card.tier;
          card.claimed = true;
          saveCard(card);
          speak('Membership active. Enter the Sanctuary when ready.', 'guide');
        }
      } catch (_) {
        speak('Could not confirm payment — card still works.', 'error');
      }
      return;
    }

    if (params.get('oauth') === '1' || params.get('step') === 'issue') {
      const { user } = await sessionJwt();
      if (user) {
        if (card.displayName) {
          goStep(5);
          speak('Google connected. Claim your card to enter the Sanctuary.', 'guide');
        } else {
          goStep(1);
          speak('Google connected. First — your name on the card.', 'guide');
        }
        return;
      }
    }

    if (card.claimed && profile.authed) {
      if (typeof window.cdfEnterFlowOrbit === 'function') {
        window.cdfEnterFlowOrbit();
        return;
      }
      goStep(5, { silent: true });
      try {
        const saved = JSON.parse(localStorage.getItem('cdf_member_coupons') || 'null');
        renderCoupons(saved || card.coupons || DEFAULT_COUPONS);
      } catch (_) {
        renderCoupons(DEFAULT_COUPONS);
      }
      if (els.afterClaimNav) els.afterClaimNav.hidden = false;
      if (els.claimBtn) els.claimBtn.hidden = true;
      speak('Welcome back. Your card and partner codes are ready.', 'guide');
      return;
    }

    if (card.claimed) {
      // Local claim without session — still open Orbit
      if (typeof window.cdfEnterFlowOrbit === 'function') {
        window.cdfEnterFlowOrbit();
        return;
      }
    }

    goStep(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
