/**
 * Unified registrations API (Vercel Hobby — one function, many routes via rewrite)
 * /api/register-event      → ?route=event
 * /api/register-guest      → ?route=guest
 * /api/admin-registrations → ?route=admin
 * /api/kyh-feedback-invite → ?route=kyh-feedback
 */
async function invoke(mod, req, res) {
  const fn = mod && (mod.default || mod);
  if (typeof fn !== 'function') {
    return res.status(500).json({ error: 'Handler not loaded' });
  }
  return fn(req, res);
}

module.exports = async function handler(req, res) {
  const route = String(req.query?.route || '').trim();
  switch (route) {
    case 'event':
      return invoke(require('../lib/cdf-api/register-event'), req, res);
    case 'guest':
      return invoke(require('../lib/cdf-api/register-guest'), req, res);
    case 'admin':
      return invoke(require('../lib/cdf-api/admin-registrations'), req, res);
    case 'kyh-feedback':
      return invoke(require('../lib/cdf-api/kyh-feedback-invite'), req, res);
    default:
      return res.status(404).json({ error: 'Unknown registrations route', route });
  }
};
