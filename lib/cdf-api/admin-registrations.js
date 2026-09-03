/**
 * GET /api/admin-registrations — list + stats
 * PATCH /api/admin-registrations — update status / notes / jam fields
 * Gate: header x-admin-key must match ADMIN_API_KEY or ADMIN_OPS_CODE
 * Query: eventId=lapa71-tagus-drop (prefix match) or full event id
 */
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_EVENT = 'lapa71-tagus-drop-20260829';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-key'
  );
}

function getAdminKey(req) {
  return (
    req.headers['x-admin-key'] ||
    req.headers['X-Admin-Key'] ||
    (req.query && req.query.adminKey) ||
    ''
  );
}

function assertAdmin(req) {
  const provided = String(getAdminKey(req) || '').trim();
  const expected =
    process.env.ADMIN_API_KEY ||
    process.env.ADMIN_OPS_CODE ||
    '';
  if (!expected) {
    const err = new Error('Server misconfigured: set ADMIN_API_KEY or ADMIN_OPS_CODE');
    err.status = 503;
    throw err;
  }
  if (!provided || provided !== expected) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
}

function eventFilter(eventIdParam) {
  const raw = String(eventIdParam || DEFAULT_EVENT).trim();
  if (!raw) return DEFAULT_EVENT;
  // Support short alias from admin UI: lapa71-tagus-drop
  if (raw === 'lapa71-tagus-drop') return DEFAULT_EVENT;
  return raw;
}

function buildStats(rows) {
  const stats = {
    total: rows.length,
    members: rows.length,
    attendingYes: 0,
    jamYes: 0,
    byStatus: { pending: 0, confirmed: 0, waitlist: 0, cancelled: 0 },
    byDiscipline: {},
  };

  for (const r of rows) {
    if (r.attending_aug29) stats.attendingYes += 1;
    if (r.jam_interested) stats.jamYes += 1;
    if (stats.byStatus[r.status] != null) stats.byStatus[r.status] += 1;
    const discs = Array.isArray(r.disciplines) ? r.disciplines : [];
    for (const d of discs) {
      stats.byDiscipline[d] = (stats.byDiscipline[d] || 0) + 1;
    }
  }
  return stats;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    assertAdmin(req);

    const supabase = createClient(
      String(requireEnv('SUPABASE_URL')).replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (req.method === 'GET') {
      const eventId = eventFilter(req.query?.eventId || req.query?.event_id);
      const q = String(req.query?.q || '').trim().toLowerCase();

      let query = supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      let rows = data || [];
      if (q) {
        rows = rows.filter((r) => {
          const hay = [
            r.full_name,
            r.stage_name,
            r.email,
            r.phone,
            r.instagram_handle,
            (r.disciplines || []).join(' '),
            r.admin_notes,
            r.status,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
      }

      return res.status(200).json({
        success: true,
        eventId,
        stats: buildStats(data || []),
        filteredStats: buildStats(rows),
        registrations: rows,
      });
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const id = body.id || body.registrationId;
      if (!id) return res.status(400).json({ error: 'Missing registration id' });

      const allowedStatus = ['pending', 'confirmed', 'waitlist', 'cancelled'];
      const patch = { updated_at: new Date().toISOString() };

      if (body.status != null) {
        if (!allowedStatus.includes(body.status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        patch.status = body.status;
      }
      if (body.admin_notes != null || body.adminNotes != null) {
        patch.admin_notes = body.admin_notes ?? body.adminNotes;
      }
      if (body.attending_aug29 != null || body.attendingAug29 != null) {
        patch.attending_aug29 = Boolean(body.attending_aug29 ?? body.attendingAug29);
      }
      if (body.jam_interested != null || body.jamInterested != null) {
        patch.jam_interested = Boolean(body.jam_interested ?? body.jamInterested);
      }
      if (body.jam_perform_style != null || body.jamPerformStyle != null) {
        patch.jam_perform_style = body.jam_perform_style ?? body.jamPerformStyle;
      }
      if (body.jam_instruments != null || body.jamInstruments != null) {
        patch.jam_instruments = body.jam_instruments ?? body.jamInstruments;
      }
      if (body.jam_song_details != null || body.jamSongDetails != null) {
        patch.jam_song_details = body.jam_song_details ?? body.jamSongDetails;
      }
      if (body.jam_backing_track != null || body.jamBackingTrack != null) {
        patch.jam_backing_track = Boolean(body.jam_backing_track ?? body.jamBackingTrack);
      }

      const { data, error } = await supabase
        .from('event_registrations')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, registration: data });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'Internal Server Error' });
  }
}
