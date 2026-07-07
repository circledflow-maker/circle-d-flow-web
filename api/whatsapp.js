/**
 * WhatsApp Cloud API proxy — keeps Meta token server-side (Vercel env).
 * POST { action: 'send'|'template'|'status', text?, template?, to? }
 * GET  ?action=poll|status
 */

const META_VERSION = 'v22.0';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(body));
}

function metaConfig() {
  return {
    token: process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_ID || '1011847962012735',
    defaultTo: process.env.WHATSAPP_RECIPIENT || '+391912828940',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'CDF_NEXUS_2026',
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  };
}

async function metaPost(path, payload, token) {
  const res = await fetch(`https://graph.facebook.com/${META_VERSION}/${path}`, {
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
      return { ok: false, error: data?.error?.message || `Meta HTTP ${res.status}` };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
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
    const row = rows?.[0];
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const cfg = metaConfig();

  try {
    if (req.method === 'GET') {
      const action = (req.query && req.query.action) || 'status';

      if (action === 'poll') {
        const row = await pollInbound(cfg);
        return json(res, 200, { message: row });
      }

      const check = await verifyMetaToken(cfg.token, cfg.phoneId);
      return json(res, 200, {
        connected: !!check.ok,
        phoneId: cfg.phoneId,
        simDevice: process.env.FLOWEE_SIM_ROOT || 'E:\\',
        error: check.ok ? null : (check.error || check.data?.error?.message || 'Bridge offline'),
      });
    }

    if (req.method !== 'POST') {
      return json(res, 405, { error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const action = body.action || 'send';
    const to = (body.to || cfg.defaultTo || '').replace(/\+/g, '');

    if (!cfg.token) {
      return json(res, 503, { error: 'WHATSAPP_ACCESS_TOKEN missing in Vercel env' });
    }

    if (action === 'status') {
      const check = await verifyMetaToken(cfg.token, cfg.phoneId);
      return json(res, check.ok ? 200 : 401, check);
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
      return json(res, result.ok ? 200 : result.status, result.data);
    }

    if (action === 'send') {
      const text = body.text || body.message;
      if (!text) return json(res, 400, { error: 'text required' });

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

      return json(res, result.ok ? 200 : result.status, result.data);
    }

    return json(res, 400, { error: 'Unknown action' });
  } catch (e) {
    console.error('[api/whatsapp]', e);
    return json(res, 200, { connected: false, error: e.message });
  }
};
