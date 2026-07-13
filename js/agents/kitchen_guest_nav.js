/**
 * Kitchen Guest Nav — Flowee-guided routing for visitors vs registered Navigators
 */
(function () {
  async function getSessionProfile() {
    if (!window.supabaseClient) return { user: null, profile: null };
    try {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (!user) return { user: null, profile: null };
      const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('id, username, email, exp, level, karma')
        .eq('id', user.id)
        .maybeSingle();
      return { user, profile };
    } catch (_) {
      return { user: null, profile: null };
    }
  }

  function nameOf(profile, user) {
    if (window.NavigatorDisplay) return window.NavigatorDisplay.displayNavigatorName(profile || user);
    return profile?.username || user?.email?.split('@')[0] || 'Navigator';
  }

  async function isRegisteredNavigator() {
    const { user, profile } = await getSessionProfile();
    return !!(user && profile?.id);
  }

  async function guestRoute(targetUrl, opts = {}) {
    const { user, profile } = await getSessionProfile();
    if (user && profile) {
      window.location.href = targetUrl;
      return;
    }
    const de = opts.de || 'Als Besucher bist du eingeladen, Bantaba zu besuchen — oder registriere dich für den vollen Orbit.';
    const en = opts.en || 'As a guest, visit Bantaba for first impressions — or register for full Orbit access.';
    const msg = window.TasteI18n?.lang === 'en' ? en : de;
    if (window.Flowee) window.Flowee.talk(true, msg, 'guide');
    const bantaba = 'bantaba.html' + (opts.bantabaQuery || '?from=kitchen');
    const login = `login.html?redirect=${encodeURIComponent(targetUrl)}`;
    setTimeout(() => {
      const visitBantaba = window.confirm(`${msg}\n\nOK → Bantaba besuchen\nCancel → Registrieren / Login`);
      window.location.href = visitBantaba ? bantaba : login;
    }, window.Flowee ? 900 : 0);
  }

  window.KitchenGuestNav = {
    async goMap() {
      window.location.href = 'quest_map.html?focus=secret_garden_lx';
    },
    async goQuests() {
      const ok = await isRegisteredNavigator();
      if (ok) window.location.href = 'flavor_quest.html';
      else await guestRoute('flavor_quest.html', {
        de: 'Flavor Quests sind für registrierte Navigators. Besuche Bantaba für erste Eindrücke — oder registriere dich.',
        bantabaQuery: '?from=taste',
      });
    },
    async goRank() {
      await guestRoute('hall_of_legends.html', {
        de: 'Brotherhood Rank zeigt live Navigators aus der Datenbank. Besuche Bantaba — oder registriere dich, um auf dem Register zu erscheinen.',
      });
    },
    async goOrbit() {
      await guestRoute('dashboard.html', {
        de: 'Der Orbit öffnet sich für registrierte Navigators. Bantaba zeigt dir die Welten — oder erstelle jetzt deinen Soul Pass.',
      });
    },
    async greetIfGuest() {
      const { user, profile } = await getSessionProfile();
      if (user && profile) {
        if (window.Flowee) {
          window.Flowee.talk(true, `Welcome back, ${nameOf(profile, user)}. Taste the flow at AkwabaLX.`, 'guide');
        }
        return;
      }
      if (window.Flowee) {
        window.Flowee.talk(true, 'Willkommen, Besucher. Du bist eingeladen Bantaba zu besuchen — oder registriere dich als Navigator.', 'guide');
      }
    },
  };
})();
