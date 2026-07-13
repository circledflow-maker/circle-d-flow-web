/**
 * Kitchen sync API — bypasses RLS for verified kitchen ops (service role).
 * POST { action, slug, ops_code, payload }
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agkmbaephgsnunlarntm.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OPS_CODE = process.env.KITCHEN_OPS_CODE || 'AKWABA-CREW';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getKitchen(db, slug) {
  const { data, error } = await db.from('kitchens').select('id, slug').eq('slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Kitchen not found');
  return data;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, slug = 'akwabalx', ops_code, payload = {} } = req.body || {};
  if (ops_code !== OPS_CODE) {
    return res.status(403).json({ error: 'Invalid kitchen ops code' });
  }
  if (!SERVICE_KEY) {
    return res.status(503).json({ error: 'Cloud sync not configured — changes saved locally on device' });
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    const kitchen = await getKitchen(db, slug);
    const kitchenId = payload.kitchen_id || kitchen.id;

    if (action === 'update_menu_item') {
      const { id, ...fields } = payload;
      if (!id) return res.status(400).json({ error: 'Missing item id' });
      const { error } = await db.from('kitchen_menu_items').update(fields).eq('id', id).eq('kitchen_id', kitchenId);
      if (error) throw new Error(error.message);
      return res.status(200).json({ ok: true });
    }

    if (action === 'insert_menu_item') {
      const row = { ...payload, kitchen_id: kitchenId };
      delete row.id;
      const { data, error } = await db.from('kitchen_menu_items').insert([row]).select('id').single();
      if (error) throw new Error(error.message);
      return res.status(200).json({ ok: true, id: data.id });
    }

    if (action === 'delete_menu_item') {
      const { id } = payload;
      if (!id) return res.status(400).json({ error: 'Missing item id' });
      const { error } = await db.from('kitchen_menu_items').delete().eq('id', id).eq('kitchen_id', kitchenId);
      if (error) throw new Error(error.message);
      return res.status(200).json({ ok: true });
    }

    if (action === 'update_branding') {
      const patch = {};
      ['logo_url', 'cover_url', 'reel_url', 'menu_board_url'].forEach((k) => {
        if (payload[k] != null) patch[k] = payload[k];
      });
      if (!Object.keys(patch).length) return res.status(400).json({ error: 'No branding fields' });
      const { error } = await db.from('kitchens').update(patch).eq('id', kitchenId);
      if (error) throw new Error(error.message);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('[kitchen-sync]', e.message);
    return res.status(500).json({ error: e.message });
  }
};
