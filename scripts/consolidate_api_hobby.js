/**
 * Collapse Hobby-over-limit serverless entrypoints (14 → 11).
 * Public URLs preserved via vercel.json rewrites.
 */
const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const api = path.join(repo, 'api');

function utf8(p, t) {
  const body = t.endsWith('\n') ? t : `${t}\n`;
  fs.writeFileSync(p, body);
}

// --- 1) admin-registrations → register-event ---
let reg = fs.readFileSync(path.join(api, 'register-event.js'), 'utf8');
let admin = fs.readFileSync(path.join(api, 'admin-registrations.js'), 'utf8');

admin = admin.replace(
  /^[\s\S]*?const \{ createClient \} = require\('@supabase\/supabase-js'\);\s*/,
  ''
);
admin = admin.replace(
  /const DEFAULT_EVENT = 'lapa71-tagus-drop-20260829';\s*/,
  "const ADMIN_DEFAULT_EVENT = 'lapa71-tagus-drop-20260829';\n"
);
admin = admin.replace(/function requireEnv\(name\) \{[\s\S]*?\n\}\n\n/, '');
admin = admin.replace(/function cors\(res\) \{[\s\S]*?\n\}\n\n/, '');
admin = admin.split('DEFAULT_EVENT').join('ADMIN_DEFAULT_EVENT');
admin = admin.replace(
  /export default async function handler\(req, res\) \{/,
  'async function handleAdmin(req, res) {'
);

reg = reg.replace(
  /export default async function handler\(req, res\) \{/,
  'async function handleRegister(req, res) {'
);

const router = `
function resolveOp(req) {
  const q = (req.query && req.query.op) || '';
  if (q === 'admin' || q === 'register') return q;
  const url = String(req.url || '');
  if (url.includes('admin-registrations')) return 'admin';
  return 'register';
}

export default async function handler(req, res) {
  if (resolveOp(req) === 'admin') return handleAdmin(req, res);
  return handleRegister(req, res);
}
`;

utf8(path.join(api, 'register-event.js'), `${reg.trimEnd()}\n\n${admin.trim()}\n${router}`);
fs.unlinkSync(path.join(api, 'admin-registrations.js'));
console.log('merged admin-registrations -> register-event');

// --- 2) whatsapp-webhook → whatsapp ---
let wa = fs.readFileSync(path.join(api, 'whatsapp.js'), 'utf8');
const webhookBlock = `
async function handleWhatsappWebhook(req, res) {
  const c = metaConfig();

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === c.verifyToken) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const value =
      data &&
      data.entry &&
      data.entry[0] &&
      data.entry[0].changes &&
      data.entry[0].changes[0] &&
      data.entry[0].changes[0].value;
    const message = value && value.messages && value.messages[0];

    if (message) {
      const text = (message.text && message.text.body) || '(media)';
      const from = message.from;
      await storeInbound(c, {
        direction: 'inbound',
        sender: from,
        recipient: (value.metadata && value.metadata.phone_number_id) || c.phoneId,
        body: text,
        raw: data,
        consumed: false,
      });

      const lower = String(text).toLowerCase().trim();
      let reply = null;
      if (['hi', 'hello', 'ola', 'flow', 'flowee'].some((k) => lower.includes(k))) {
        reply =
          'Flowee online. I am your Circle D Flow navigator. Reply *quest*, *dashboard*, or *help* for paths.';
      } else if (lower.includes('quest')) {
        reply = 'Open your Quest Grid: https://circle-d-flow-web.vercel.app/pages/dashboard';
      } else if (lower.includes('dashboard') || lower.includes('orbit')) {
        reply = "Captain's Quarters: https://circle-d-flow-web.vercel.app/pages/dashboard";
      } else if (lower.includes('help')) {
        reply =
          'Commands: quest | dashboard | sanctuary | notify\\nI can ping you when quests complete.';
      } else if (lower.includes('sanctuary')) {
        reply = 'Artist Sanctuary: https://circle-d-flow-web.vercel.app/pages/artist_sanctuary.html';
      }

      if (reply && c.token) {
        await metaPost(
          c.phoneId + '/messages',
          {
            messaging_product: 'whatsapp',
            to: String(from).replace(/\\+/g, ''),
            type: 'text',
            text: { body: reply },
          },
          c.token
        );
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (e) {
    res.status(400).end();
  }
}

function isWhatsappWebhook(req) {
  if ((req.query && req.query.op) === 'webhook') return true;
  if (req.query && req.query['hub.mode']) return true;
  return String(req.url || '').includes('whatsapp-webhook');
}
`;

wa = wa.replace(
  /export default async function handler\(req, res\) \{/,
  `${webhookBlock}
export default async function handler(req, res) {
  if (isWhatsappWebhook(req)) {
    return handleWhatsappWebhook(req, res);
  }
`
);
utf8(path.join(api, 'whatsapp.js'), wa);
fs.unlinkSync(path.join(api, 'whatsapp-webhook.js'));
console.log('merged whatsapp-webhook -> whatsapp');

// --- 3) support-checkout → create-payment-intent ---
let pi = fs.readFileSync(path.join(api, 'create-payment-intent.js'), 'utf8');
const support = `
async function handleSupportCheckout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  try {
    const stripeClient = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { eventId, amount } = req.body || {};
    if (!amount || isNaN(amount) || amount < 1) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    let productName = 'Circle D Flow Support';
    if (eventId === 'criz') productName = 'Support: C-RIZ Listening Party';
    else if (eventId === 'circledflow') productName = 'Support: Circle D Flow Awakening';
    const host = process.env.VERCEL_URL
      ? 'https://' + process.env.VERCEL_URL
      : process.env.URL || 'https://circle-d-flow-web.vercel.app';
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description:
                'Your contribution of ' + amount + '€ to support the artist and community.',
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: host + '/success.html?event=' + (eventId || ''),
      cancel_url: host + '/pages/bantaba.html',
      metadata: { eventId: eventId || 'unknown', type: 'support' },
    });
    return res.status(200).json({ checkout_url: session.url });
  } catch (error) {
    console.error('Support Checkout Error:', error);
    return res.status(500).json({ error: error.message || 'Payment service unavailable.' });
  }
}

function resolvePaymentOp(req) {
  const q = (req.query && req.query.op) || '';
  if (q === 'support-checkout') return q;
  if (String(req.url || '').includes('support-checkout')) return 'support-checkout';
  return 'payment-intent';
}
`;

pi = pi.replace(
  /module\.exports = async \(req, res\) => \{/,
  `${support}
module.exports = async (req, res) => {
    if (resolvePaymentOp(req) === 'support-checkout') {
        return handleSupportCheckout(req, res);
    }
`
);
utf8(path.join(api, 'create-payment-intent.js'), pi);
fs.unlinkSync(path.join(api, 'support-checkout.js'));
console.log('merged support-checkout -> create-payment-intent');

// --- 4) vercel.json rewrites (UTF-8, no BOM) ---
const vercelPath = path.join(repo, 'vercel.json');
const vj = JSON.parse(fs.readFileSync(vercelPath, 'utf8').replace(/^\uFEFF/, ''));
vj.rewrites = [
  { source: '/api/admin-registrations', destination: '/api/register-event?op=admin' },
  { source: '/api/whatsapp-webhook', destination: '/api/whatsapp?op=webhook' },
  {
    source: '/api/support-checkout',
    destination: '/api/create-payment-intent?op=support-checkout',
  },
];
utf8(vercelPath, JSON.stringify(vj, null, 2));
console.log('updated vercel.json rewrites');

const left = fs.readdirSync(api).filter((f) => f.endsWith('.js')).sort();
console.log('api_count=' + left.length);
console.log(left.join('\n'));
if (left.length > 12) {
  console.error('Still over Hobby limit');
  process.exit(1);
}
