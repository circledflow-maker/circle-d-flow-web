/**
 * Wako Member Card invite landing — i18n + Flowee greeting + CTA
 */
(function () {
  const COPY = {
    en: {
      kicker: 'Circle D Flow · Lisbon',
      title: 'Your digital Member Card is almost here',
      lead: 'Wako Kungo × Circle D Flow — claim a free Bronze card, unlock Flow Orbit & Sanctuary, or support the Circle with Silver / Gold. Flowee walks with you.',
      flowee: 'Welcome, Navigator. I am Flowee — tap Member Card and I open your Circle. Or visit Wako’s Linktree for music, nights and partners.',
      cta_card: 'Digital Member Card · with Flowee',
      cta_linktree: 'Wako Kungo · Linktree',
      cta_plans: 'See Bronze · Silver · Gold',
      t1_title: 'Bronze · Free',
      t1_body: 'Digital card · member number · +EXP · Flow Orbit & 3D Sanctuary. Enough to enter the Circle.',
      t2_title: 'Silver · €5 / month',
      t2_body: 'Partner codes · 1 free drink / month · support venues & nights that keep Lisbon flowing.',
      t3_title: 'Gold · €10 / month',
      t3_body: 'Everything in Silver · more guest access · 3 free drinks / month · crew status.',
      book: 'At the venue: write your name in the book — be among the first when the Member Card goes live. Online: tap the gold button and Flowee starts your registration now.',
      speak: 'Welcome to the Circle. I am Flowee. Tap Digital Member Card — I guide your free Bronze card. Or open Wako Linktree for the night.',
    },
    pt: {
      kicker: 'Circle D Flow · Lisboa',
      title: 'O teu Member Card digital está a chegar',
      lead: 'Wako Kungo × Circle D Flow — reivindica o cartão Bronze gratuito, desbloqueia Flow Orbit & Santuário, ou apoia o Círculo com Silver / Gold. A Flowee caminha contigo.',
      flowee: 'Bem-vindo, Navigator. Sou a Flowee — toca em Member Card e abro o teu Círculo. Ou visita o Linktree do Wako para música, noites e parceiros.',
      cta_card: 'Member Card digital · com Flowee',
      cta_linktree: 'Wako Kungo · Linktree',
      cta_plans: 'Ver Bronze · Silver · Gold',
      t1_title: 'Bronze · Grátis',
      t1_body: 'Cartão digital · número de membro · +EXP · Flow Orbit & Santuário 3D. Bastante para entrar no Círculo.',
      t2_title: 'Silver · €5 / mês',
      t2_body: 'Códigos de parceiros · 1 bebida grátis / mês · apoia espaços e noites que mantêm Lisboa a fluir.',
      t3_title: 'Gold · €10 / mês',
      t3_body: 'Tudo do Silver · mais acesso de convidados · 3 bebidas grátis / mês · estatuto crew.',
      book: 'No local: escreve o teu nome no livro — sê dos primeiros quando o Member Card ficar ativo. Online: toca no botão dourado e a Flowee inicia o teu registo agora.',
      speak: 'Bem-vindo ao Círculo. Sou a Flowee. Toca em Member Card digital — guio o teu Bronze gratuito. Ou abre o Linktree do Wako para a noite.',
    },
    de: {
      kicker: 'Circle D Flow · Lissabon',
      title: 'Deine digitale Member Card kommt',
      lead: 'Wako Kungo × Circle D Flow — hole die kostenlose Bronze-Karte, öffne Flow Orbit & Sanctuary, oder unterstütze den Circle mit Silver / Gold. Flowee geht mit dir.',
      flowee: 'Willkommen, Navigator. Ich bin Flowee — tippe auf Member Card und ich öffne deinen Circle. Oder öffne Wakos Linktree für Musik, Nights und Partner.',
      cta_card: 'Digitale Member Card · mit Flowee',
      cta_linktree: 'Wako Kungo · Linktree',
      cta_plans: 'Bronze · Silver · Gold ansehen',
      t1_title: 'Bronze · Kostenlos',
      t1_body: 'Digitale Karte · Mitgliedsnummer · +EXP · Flow Orbit & 3D Sanctuary. Genug, um den Circle zu betreten.',
      t2_title: 'Silver · €5 / Monat',
      t2_body: 'Partner-Codes · 1 Free Drink / Monat · unterstützt Venues & Nights, die Lissabon im Flow halten.',
      t3_title: 'Gold · €10 / Monat',
      t3_body: 'Alles aus Silver · mehr Guest Access · 3 Free Drinks / Monat · Crew-Status.',
      book: 'Vor Ort: trag dich ins Buch ein — sei unter den Ersten, wenn die Member Card live geht. Online: tippe auf Gold und Flowee startet deine Registrierung.',
      speak: 'Willkommen im Circle. Ich bin Flowee. Tippe auf Digitale Member Card — ich führe dich zur kostenlosen Bronze-Karte. Oder öffne Wako Linktree für die Night.',
    },
  };

  let lang = 'en';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && COPY[q]) lang = q;
    else {
      const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
      if (COPY[nav]) lang = nav;
    }
  } catch (_) { /* ignore */ }

  function apply(langKey) {
    lang = COPY[langKey] ? langKey : 'en';
    const c = COPY[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.getAttribute('data-i18n');
      if (c[k]) el.textContent = c[k];
    });
    document.querySelectorAll('.invite-lang button').forEach((b) => {
      b.classList.toggle('on', b.getAttribute('data-lang') === lang);
    });
    const card = document.getElementById('btn-card');
    if (card) {
      card.href =
        '/member-card?auth=register&orbit=0&from=flyer&lang=' +
        encodeURIComponent(lang);
    }
    try {
      sessionStorage.setItem('cdf_invite_lang', lang);
      sessionStorage.setItem('cdf_flowee_flyer_greet', c.speak);
    } catch (_) { /* ignore */ }
  }

  function greetFlowee() {
    const line = COPY[lang].speak;
    try {
      if (window.floweeAgent?.speak) {
        window.floweeAgent.speak(line, 'guide');
        return;
      }
      if (window.Flowee?.speak) {
        window.Flowee.speak(line);
        return;
      }
    } catch (_) { /* ignore */ }
  }

  document.querySelectorAll('.invite-lang button').forEach((btn) => {
    btn.addEventListener('click', () => {
      apply(btn.getAttribute('data-lang') || 'en');
      greetFlowee();
    });
  });

  apply(lang);

  document.getElementById('btn-card')?.addEventListener('click', () => {
    try {
      sessionStorage.setItem('cdf_flowee_auth_gate', '1');
      sessionStorage.setItem('cdf_flowee_flyer_greet', COPY[lang].speak);
    } catch (_) { /* ignore */ }
  });

  window.addEventListener('load', () => {
    setTimeout(greetFlowee, 700);
  });
})();
