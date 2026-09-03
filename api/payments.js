/**
 * Unified payments API (Vercel Hobby — one function)
 * /api/create-checkout       → ?route=checkout
 * /api/create-payment-intent → ?route=intent
 * /api/support-checkout      → ?route=support
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
    case 'checkout':
      return invoke(require('../lib/cdf-api/create-checkout'), req, res);
    case 'intent':
      return invoke(require('../lib/cdf-api/create-payment-intent'), req, res);
    case 'support':
      return invoke(require('../lib/cdf-api/support-checkout'), req, res);
    default:
      return res.status(404).json({ error: 'Unknown payments route', route });
  }
};
