/**
 * Meta WhatsApp webhook — verify + receive inbound messages for Flowee.
 * Set Callback URL in Meta Developer Console:
 *   https://circle-d-flow-web.vercel.app/api/whatsapp-webhook
 */

const META_VERSION = 'v22.0';

function cleanToken(value) {
  return String(value || '').replace(/\s/g, '');
}

function cfg() {
  return {
    verifyToken: String(process.env.WHATSAPP_VERIFY_TOKEN || 'CDF_NEXUS_2026').trim(),
    token: cleanToken(process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN),
    phoneId: String(process.env.WHATSAPP_PHONE_ID || '1011847962012735').trim(),
    supabaseUrl: String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    supabaseKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim(),
  };
}

async function storeInbound(c, row) {
  if (!c.supabaseUrl || !c.supabaseKey) return;
  await fetch(`${c.supabaseUrl}/rest/v1/whatsapp_signals`, {
    method: 'POST',
    headers: {
      apikey: c.supabaseKey,
      Authorization: `Bearer ${c.supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
}

async function autoReply(c, from, text) {
  if (!c.token || !text) return;
  const lower = text.toLowerCase().trim();
  let reply = null;

  if (['hi', 'hello', 'ola', 'flow', 'flowee'].some((k) => lower.includes(k))) {
    reply = 'Flowee online. I am your Circle D Flow navigator. Reply *quest*, *dashboard*, or *help* for paths.';
  } else if (lower.includes('quest')) {
    reply = 'Open your Quest Grid: https://circle-d-flow-web.vercel.app/pages/dashboard';
  } else if (lower.includes('dashboard') || lower.includes('orbit')) {
    reply = 'Captain\'s Quarters: https://circle-d-flow-web.vercel.app/pages/dashboard';
  } else if (lower.includes('help')) {
    reply = 'Commands: quest | dashboard | sanctuary | notify\nI can ping you when quests complete.';
  } else if (lower.includes('sanctuary')) {
    reply = 'Artist Sanctuary: https://circle-d-flow-web.vercel.app/pages/artist_sanctuary.html';
  }

  if (!reply) return;

  await fetch(`https://graph.facebook.com/${META_VERSION}/${c.phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: from.replace(/\+/g, ''),
      type: 'text',
      text: { body: reply },
    }),
  });
}

module.exports = async function handler(req, res) {
  const c = cfg();

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
    const value = data?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (message) {
      const text = message.text?.body || '(media)';
      const from = message.from;
      await storeInbound(c, {
        direction: 'inbound',
        sender: from,
        recipient: value?.metadata?.phone_number_id || c.phoneId,
        body: text,
        raw: data,
        consumed: false,
      });
      await autoReply(c, from, text);
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (e) {
    res.status(400).end();
  }
}
