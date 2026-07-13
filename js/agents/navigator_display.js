/**
 * Navigator display helpers — real registered profiles only, no "Unknown"
 */
(function () {
  function displayNavigatorName(profile) {
    if (!profile) return 'Navigator';
    const username = String(profile.username || '').trim();
    if (username && !/^unknown$/i.test(username)) return username;
    const full = String(profile.full_name || profile.display_name || '').trim();
    if (full) return full;
    const email = String(profile.email || '').trim();
    if (email.includes('@')) return email.split('@')[0];
    if (profile.id) return `Navigator ${String(profile.id).slice(0, 6)}`;
    return 'Navigator';
  }

  function isRealProfile(profile) {
    if (!profile?.id) return false;
    const username = String(profile.username || '').trim();
    if (username && !/^unknown$/i.test(username)) return true;
    if (profile.full_name || profile.display_name || profile.email) return true;
    return (profile.exp || 0) > 0 || (profile.karma || 0) > 0;
  }

  window.NavigatorDisplay = {
    displayNavigatorName,
    isRealProfile,
  };
})();
