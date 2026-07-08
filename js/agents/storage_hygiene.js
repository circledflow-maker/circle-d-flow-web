/**
 * Storage Hygiene — trim localStorage, prefer external D: media roots
 */
(function () {
  const MEDIA_ROOT_KEY = 'cdf_media_root';
  const DEFAULT_MEDIA_ROOT = 'D:\\cdf27jue\\cdfevent';

  const SAFE_KEEP = new Set([
    'cdf_coop_project', 'cdf_coop_tutorial_done', 'cdf_coop_guide_spoken',
    'cdf_kitchen_cart', 'cdf_user_username', 'cdf_name', 'cdf_xp', 'cdf_user_xp',
    'cdf_trust_points', 'cdf_user_karma', 'cdf_wallet_flow', 'cdf_notify_enabled',
    'sb-', // supabase auth keys start with sb-
  ]);

  function shouldKeep(key) {
    if ([...SAFE_KEEP].some((k) => key.startsWith(k) || key === k)) return true;
    if (key.startsWith('sb-') || key.includes('supabase')) return true;
    if (key.startsWith('cdf_adinkra') || key.startsWith('cdf_tutorial')) return true;
    return false;
  }

  window.StorageHygiene = {
    mediaRoot: localStorage.getItem(MEDIA_ROOT_KEY) || DEFAULT_MEDIA_ROOT,

    setMediaRoot(path) {
      localStorage.setItem(MEDIA_ROOT_KEY, path);
      this.mediaRoot = path;
    },

    /** Remove bulky stale keys; keep auth + active project state */
    prune(maxChatLines = 40) {
      let removed = 0;
      try {
        const chat = JSON.parse(localStorage.getItem('cdf_coop_bar_chat') || '[]');
        if (chat.length > maxChatLines) {
          localStorage.setItem('cdf_coop_bar_chat', JSON.stringify(chat.slice(-maxChatLines)));
        }
      } catch (_) { /* ignore */ }

      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (shouldKeep(key)) return;
        if (key.startsWith('cdf_coop_reminders') || key.startsWith('cdf_initiation_')) return;
        if (key.length > 80 && localStorage.getItem(key).length > 50000) {
          localStorage.removeItem(key);
          removed++;
        }
      });

      if (removed && window.Pusher) window.Pusher.showToast(`Storage cleaned (${removed} bulky keys)`, 'success');
      return removed;
    },

    init() {
      if (!localStorage.getItem(MEDIA_ROOT_KEY)) {
        localStorage.setItem(MEDIA_ROOT_KEY, DEFAULT_MEDIA_ROOT);
      }
      this.prune();
    },
  };

  document.addEventListener('DOMContentLoaded', () => window.StorageHygiene?.init());
})();
