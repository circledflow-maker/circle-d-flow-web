/**
 * OAuth / magic-link callback — consume hash tokens, then route into the Circle path.
 * Default: 3D Artist Sanctuary (visitor path). Honors cdf_auth_next / ?next=.
 */
(function () {
  const DEFAULT_NEXT = '/pages/artist_sanctuary.html?welcome=register';
  const STORAGE_KEY = 'cdf_auth_next';

  function setStatus(text) {
    const el = document.getElementById('status');
    if (el) el.textContent = text;
  }

  function setErr(text) {
    const el = document.getElementById('err');
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || '';
  }

  function safeNext(raw) {
    if (!raw) return null;
    try {
      const n = String(raw);
      if (n.startsWith('/') && !n.startsWith('//')) return n;
    } catch (_) { /* ignore */ }
    return null;
  }

  function resolveDestination() {
    try {
      const q = new URLSearchParams(window.location.search || '').get('next');
      const fromQ = safeNext(q);
      if (fromQ) return fromQ;
    } catch (_) { /* ignore */ }
    try {
      const stored = safeNext(sessionStorage.getItem(STORAGE_KEY));
      if (stored) {
        sessionStorage.removeItem(STORAGE_KEY);
        return stored;
      }
    } catch (_) { /* ignore */ }
    return DEFAULT_NEXT;
  }

  function go(url) {
    setStatus('Identity confirmed');
    const copy = document.getElementById('copy');
    if (copy) copy.textContent = 'Opening your Circle path…';
    // Clear hash so tokens are not left in history
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (_) { /* ignore */ }
    window.location.replace(url);
  }

  async function waitForClient(ms) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise((r) => setTimeout(r, 50));
    }
    return null;
  }

  async function run() {
    setStatus('Calibrating session…');
    const client = await waitForClient(8000);
    if (!client) {
      setErr('Auth client offline. Open login and try again.');
      return;
    }

    // detectSessionInUrl should parse #access_token — give it a beat
    let session = null;
    for (let i = 0; i < 25; i++) {
      const { data, error } = await client.auth.getSession();
      if (error) {
        setErr(error.message);
        break;
      }
      if (data?.session) {
        session = data.session;
        break;
      }
      // Explicit hash exchange for older clients
      if (i === 5 && window.location.hash && window.location.hash.includes('access_token')) {
        try {
          if (typeof client.auth.getSessionFromUrl === 'function') {
            await client.auth.getSessionFromUrl({ storeSession: true });
          }
        } catch (_) { /* ignore */ }
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    if (!session) {
      // Still no session — maybe error in hash
      const hash = window.location.hash || '';
      if (hash.includes('error')) {
        setErr('Sign-in was cancelled or blocked. Try email login or another Google account.');
        return;
      }
      setErr('No session yet. Try login again — or continue as guest via Join.');
      setStatus('Waiting…');
      return;
    }

    try {
      const username =
        session.user?.user_metadata?.username ||
        session.user?.user_metadata?.full_name ||
        session.user?.email?.split('@')[0] ||
        'Navigator';
      localStorage.setItem('cdf_user_username', username);
      localStorage.setItem('cqr_auth_state', 'logged_in');
      if (!localStorage.getItem('cdf_balance')) localStorage.setItem('cdf_balance', '0');
    } catch (_) { /* ignore */ }

    go(resolveDestination());
  }

  window.CdfAuthCallback = { run, resolveDestination, STORAGE_KEY };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
