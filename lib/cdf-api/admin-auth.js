/**
 * Admin operators — username + personal password, then site password.
 * Configure CDF_ADMIN_USERS as "hope:secret1,bruce:secret2" (comma-separated).
 * Fallback demo ops (change in production via env).
 */
const crypto = require('crypto');

const SITE_PASSWORDS = [
  'FlowCreator!',
  process.env.MEMBERSHIP_ADMIN_PASSWORD,
  process.env.ADMIN_OPS_CODE,
  process.env.ADMIN_API_KEY,
].filter(Boolean).map((s) => String(s).trim());

function parseUsers() {
  const raw = process.env.CDF_ADMIN_USERS || 'hope:FlowHope!,admin:FlowAdmin!';
  const map = {};
  String(raw)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const i = pair.indexOf(':');
      if (i < 1) return;
      const user = pair.slice(0, i).trim().toLowerCase();
      const pass = pair.slice(i + 1).trim();
      if (user && pass) map[user] = pass;
    });
  return map;
}

function verifyOperator(username, password) {
  const users = parseUsers();
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '').trim();
  if (!u || !p) return null;
  if (users[u] && users[u] === p) return u;
  return null;
}

function verifySitePassword(sitePass) {
  const p = String(sitePass || '').trim();
  return SITE_PASSWORDS.includes(p);
}

function sessionToken(username) {
  const secret = process.env.ADMIN_SESSION_SECRET || 'cdf-admin-session';
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHmac('sha256', secret).update(username + '|' + day).digest('hex').slice(0, 32);
}

function verifySession(username, token) {
  if (!username || !token) return false;
  return sessionToken(String(username).toLowerCase()) === String(token);
}

module.exports = {
  parseUsers,
  verifyOperator,
  verifySitePassword,
  sessionToken,
  verifySession,
  SITE_PASSWORDS,
};
