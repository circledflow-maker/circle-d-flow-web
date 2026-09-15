/**
 * WhatsApp Cloud API proxy — keeps Meta token server-side (Vercel env).
 * POST { action: 'send'|'template'|'status', text?, template?, to? }
 * GET  ?action=poll|status
 */

const META_VERSION = 'v22.0';

function cleanToken(value) {
  return String(value || '').replace(/\s/g, '');
}

function safeError(message) {
  if (!message) return message;
  return String(message).replace(/EAAN[A-Za-z0-9]+/g, '[redacted]');
}

function metaConfig() {
  const token = cleanToken(process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN);
  return {
    token,
    phoneId: String(process.env.WHATSAPP_PHONE_ID || '1011847962012735').trim(),
    defaultTo: String(process.env.WHATSAPP_RECIPIENT || '+391912828940').trim(),
    verifyToken: String(process.env.WHATSAPP_VERIFY_TOKEN || 'CDF_NEXUS_2026').trim(),
    supabaseUrl: String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    supabaseKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim(),
  };
}

async function metaPost(apiPath, payload, token) {
  const res = await fetch(`https://graph.facebook.com/${META_VERSION}/${apiPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function verifyMetaToken(token, phoneId) {
  if (!token) {
    return { ok: false, error: 'WHATSAPP_ACCESS_TOKEN not set on server' };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/${META_VERSION}/${phoneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data && data.error && data.error.message ? data.error.message : `Meta HTTP ${res.status}`;
      return { ok: false, error: safeError(msg) };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: safeError(e.message) };
  }
}

async function storeInbound(cfg, row) {
  if (!cfg.supabaseUrl || !cfg.supabaseKey) return null;
  try {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/whatsapp_signals`, {
      method: 'POST',
      headers: {
        apikey: cfg.supabaseKey,
        Authorization: `Bearer ${cfg.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function pollInbound(cfg) {
  if (!cfg.supabaseUrl || !cfg.supabaseKey) return null;
  try {
    const res = await fetch(
      `${cfg.supabaseUrl}/rest/v1/whatsapp_signals?direction=eq.inbound&consumed=eq.false&order=created_at.desc&limit=1`,
      {
        headers: {
          apikey: cfg.supabaseKey,
          Authorization: `Bearer ${cfg.supabaseKey}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const row = rows && rows[0];
    if (!row) return null;

    await fetch(`${cfg.supabaseUrl}/rest/v1/whatsapp_signals?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: {
        apikey: cfg.supabaseKey,
        Authorization: `Bearer ${cfg.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ consumed: true }),
    });

    return row;
  } catch {
    return null;
  }
}

function simDeviceLabel() {
  const raw = process.env.FLOWEE_SIM_ROOT || 'E:/';
  return String(raw).replace(/\\/g, '/');
}


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
          'Commands: quest | dashboard | sanctuary | notify\nI can ping you when quests complete.';
      } else if (lower.includes('sanctuary')) {
        reply = 'Artist Sanctuary: https://circle-d-flow-web.vercel.app/pages/artist_sanctuary.html';
      }

      if (reply && c.token) {
        await metaPost(
          c.phoneId + '/messages',
          {
            messaging_product: 'whatsapp',
            to: String(from).replace(/\+/g, ''),
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
  if (req.query && (req.query.webhook === '1' || req.query.webhook === 'true')) return true;
  if ((req.query && req.query.op) === 'webhook') return true;
  if (req.query && req.query['hub.mode']) return true;
  return String(req.url || '').includes('whatsapp-webhook');
}

export default async function handler(req, res) {
  if (isWhatsappWebhook(req)) {
    return handleWhatsappWebhook(req, res);
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const cfg = metaConfig();

  try {
    if (req.method === 'GET') {
      const action = (req.query && req.query.action) || 'status';

      if (action === 'poll') {
        const row = await pollInbound(cfg);
        return res.status(200).json({ message: row });
      }

      const check = await verifyMetaToken(cfg.token, cfg.phoneId);
      return res.status(200).json({
        connected: !!check.ok,
        phoneId: cfg.phoneId,
        simDevice: simDeviceLabel(),
        bridgeBuild: '2026-07-07c',
        error: check.ok ? null : safeError(check.error || 'Bridge offline'),
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const action = body.action || 'send';
    const to = (body.to || cfg.defaultTo || '').replace(/\+/g, '');

    if (!cfg.token) {
      return res.status(503).json({ error: 'WHATSAPP_ACCESS_TOKEN missing in Vercel env' });
    }

    if (action === 'status') {
      const check = await verifyMetaToken(cfg.token, cfg.phoneId);
      return res.status(check.ok ? 200 : 401).json(check);
    }

    if (action === 'template') {
      const template = body.template || 'hello_world';
      const result = await metaPost(
        `${cfg.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: { name: template, language: { code: body.language || 'en_US' } },
        },
        cfg.token
      );
      return res.status(result.ok ? 200 : result.status).json(result.data);
    }

    if (action === 'send') {
      const text = body.text || body.message;
      if (!text) return res.status(400).json({ error: 'text required' });

      const result = await metaPost(
        `${cfg.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: text },
        },
        cfg.token
      );

      if (result.ok) {
        await storeInbound(cfg, {
          direction: 'outbound',
          sender: cfg.phoneId,
          recipient: to,
          body: text,
          consumed: true,
        });
      }

      return res.status(result.ok ? 200 : result.status).json(result.data);
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('[api/whatsapp]', e);
    return res.status(200).json({ connected: false, error: safeError(e.message || 'Bridge error') });
  }
}
