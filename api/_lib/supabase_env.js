/**
 * Shared env helpers for Vercel serverless handlers.
 * Folder `_lib` is not deployed as its own function.
 */
function cleanEnv(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

/**
 * Accepts either project URL or mistaken /rest/v1 URL from dashboard copy-paste.
 * @returns {string} https://PROJECT.supabase.co
 */
function normalizeSupabaseUrl(raw) {
  let url = cleanEnv(raw);
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const u = new URL(url);
    // Always collapse to project origin — drop /rest/v1, /auth/v1, etc.
    if (/\.supabase\.co$/i.test(u.hostname)) {
      return `https://${u.hostname}`;
    }
    return `${u.protocol}//${u.host}`.replace(/\/+$/, '');
  } catch (_) {
    url = url.replace(/\/+$/, '');
    url = url.replace(/\/rest\/v1(?:\/.*)?$/i, '');
    url = url.replace(/\/auth\/v1(?:\/.*)?$/i, '');
    return url.replace(/\/+$/, '');
  }
}

function requireEnv(name) {
  const value = cleanEnv(process.env[name]);
  if (!value) {
    const err = new Error(`Missing required environment variable: ${name}`);
    err.status = 503;
    err.code = 'MISSING_ENV';
    throw err;
  }
  return value;
}

function getSupabaseUrl() {
  const url = normalizeSupabaseUrl(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  );
  if (!url) {
    const err = new Error('Missing required environment variable: SUPABASE_URL');
    err.status = 503;
    err.code = 'MISSING_ENV';
    throw err;
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    const err = new Error(
      'SUPABASE_URL must look like https://YOUR_PROJECT.supabase.co (no /rest/v1)'
    );
    err.status = 503;
    err.code = 'BAD_SUPABASE_URL';
    throw err;
  }
  return url;
}

function getServiceRoleKey() {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

module.exports = {
  cleanEnv,
  normalizeSupabaseUrl,
  requireEnv,
  getSupabaseUrl,
  getServiceRoleKey,
};
