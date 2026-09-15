/**
 * POST /api/register-event
 * Lapa 71 x Tagus Drop — Member & Jam registration.
 * Saves event_registrations, upserts shadow profile when possible.
 * Resend / Stripe are optional stubs (no hard requireEnv).
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const {
  getSupabaseUrl,
  getServiceRoleKey,
} = require('./_lib/supabase_env');

const EVENT_ID = 'lapa71-tagus-drop-20260829';
const DEFAULT_SOURCE = 'social_join';

function cors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-key'
  );
}

function clean(str) {
  if (str == null) return null;
  const s = String(str).trim();
  return s.length ? s : null;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeInstagram(handle) {
  const h = clean(handle);
  if (!h) return null;
  return h.replace(/^@+/, '');
}

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (v === 'yes' || v === 'true' || v === '1') return true;
  if (v === 'no' || v === 'false' || v === '0') return false;
  return null;
}

function randomPassword() {
  return crypto.randomBytes(24).toString('base64url');
}

async function softNotifyResend({ email, fullName, stageName, registrationId }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { skipped: true, reason: 'RESEND_API_KEY not set' };
  }
  try {
    const { Resend } = require('resend');
    const resend = new Resend(key);
    const name = stageName || fullName;
    const result = await resend.emails.send({
      from: 'Circle D Flow <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to Lapa 71 x Tagus Drop Rhythm',
      text:
        `Hi ${name},\n\n` +
        `You are registered for Lapa 71 x Tagus Drop Rhythm (Member & Jam).\n` +
        `Venue: R. Garcia de Orta 71C, 1200-678 Lisboa — Aug 29 @ 19:30.\n` +
        `Registration id: ${registrationId}\n\n` +
        `See you in the Flow,\nCircle D Flow C4C`,
    });
    if (result.error) {
      console.warn('[register-event] Resend soft-fail:', result.error);
      return { skipped: false, error: result.error };
    }
    return { skipped: false, ok: true };
  } catch (err) {
    console.warn('[register-event] Resend soft-fail:', err.message);
    return { skipped: false, error: err.message };
  }
}

/** Stripe hook stub — wire checkout later when STRIPE_SECRET_KEY is available. */
function softStripeHook(_payload) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { skipped: true, reason: 'STRIPE_SECRET_KEY not set' };
  }
  // Future: create Customer / Checkout Session for responsible donation.
  return { skipped: true, reason: 'Stripe checkout not wired yet' };
}

async function findProfileByEmail(supabase, email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, username, is_shadow_profile')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('[register-event] profile lookup:', error.message);
    return null;
  }
  return data;
}

async function createShadowAuthUser(supabase, { email, stageName, fullName, phone, instagram, disciplines }) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: randomPassword(),
      user_metadata: {
        stage_name: stageName || fullName,
        full_name: fullName,
        source: 'lapa71-join',
        is_shadow: true,
      },
    });
    if (error) {
      // Already registered in auth — try list by email
      console.warn('[register-event] createUser:', error.message);
      const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = (listed.data?.users || []).find(
        (u) => (u.email || '').toLowerCase() === email
      );
      if (existing) return existing.id;
      return null;
    }
    return data?.user?.id || null;
  } catch (err) {
    console.warn('[register-event] createUser exception:', err.message);
    return null;
  }
}

async function upsertShadowProfile(supabase, userId, fields) {
  const row = {
    id: userId,
    email: fields.email,
    username: fields.stageName || fields.fullName,
    instagram_handle: fields.instagram,
    is_shadow_profile: true,
    role_calling: (fields.disciplines || []).join(', ') || null,
    contact_details: {
      phone: fields.phone,
      whatsapp: fields.phone,
      source: 'lapa71-join',
      stage_name: fields.stageName,
      full_name: fields.fullName,
    },
    preferred_contact_method: 'whatsapp',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select('id')
    .maybeSingle();

  if (error) {
    console.warn('[register-event] profiles upsert:', error.message);
    return null;
  }
  return data?.id || userId;
}

async function tryGuestRegistration(supabase, { fullName, email }) {
  try {
    const { error } = await supabase.from('guest_registrations').insert({
      name: fullName,
      email,
      event_id: null, // guest_registrations.event_id is uuid→quests; leave null for social joins
    });
    if (error) console.warn('[register-event] guest_registrations:', error.message);
  } catch (err) {
    console.warn('[register-event] guest_registrations exception:', err.message);
  }
}

async function handleRegister(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseServiceRole = getServiceRoleKey();
    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = req.body || {};
    const fullName = clean(body.fullName || body.full_name);
    const stageName = clean(body.stageName || body.stage_name || body.preferredName);
    const phone = clean(body.phone || body.whatsapp);
    const email = normalizeEmail(body.email);
    const instagram = normalizeInstagram(body.instagramHandle || body.instagram_handle || body.instagram);
    const disciplines = Array.isArray(body.disciplines)
      ? body.disciplines.map((d) => String(d).trim()).filter(Boolean)
      : [];
    const disciplineOther = clean(body.disciplineOther || body.discipline_other);
    const attendingAug29 = asBool(body.attendingAug29 ?? body.attending_aug29);
    const jamInterested = asBool(body.jamInterested ?? body.jam_interested);
    const jamPerformStyle = clean(body.jamPerformStyle || body.jam_perform_style);
    const jamInstruments = clean(body.jamInstruments || body.jam_instruments);
    const jamSongDetails = clean(body.jamSongDetails || body.jam_song_details);
    const jamArtDescription = clean(
      body.jamArtDescription || body.jam_art_description || body.artDescription
    );
    const jamBackingTrack = asBool(body.jamBackingTrack ?? body.jam_backing_track);
    const source = clean(body.source) || DEFAULT_SOURCE;
    const eventId = clean(body.eventId || body.event_id) || EVENT_ID;
    const allowedStyles = ['solo', 'jam_with_musicians', 'freestyle', 'art_showcase'];

    if (!fullName || !phone || !email) {
      return res.status(400).json({ error: 'Missing required fields: fullName, phone, email' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!disciplines.length) {
      return res.status(400).json({ error: 'Select at least one artistic discipline' });
    }
    if (attendingAug29 === null) {
      return res.status(400).json({ error: 'Please indicate Aug 29 attendance' });
    }
    if (jamInterested === null) {
      return res.status(400).json({ error: 'Please indicate jam interest' });
    }
    if (jamInterested && !jamPerformStyle) {
      return res.status(400).json({ error: 'Jam section: how will you perform or showcase?' });
    }
    if (jamInterested && jamPerformStyle && !allowedStyles.includes(jamPerformStyle)) {
      return res.status(400).json({ error: 'Invalid jam perform style' });
    }
    if (
      jamInterested &&
      (jamPerformStyle === 'art_showcase' ||
        disciplines.some((d) => /visual|fashion|designer|other/i.test(String(d)))) &&
      !jamArtDescription
    ) {
      return res.status(400).json({
        error: 'Describe your art / performance so we know what you bring.',
      });
    }

    // 1) Source of truth — always insert event_registrations
    const insertRow = {
      event_id: eventId,
      source,
      status: 'pending',
      full_name: fullName,
      stage_name: stageName,
      phone,
      email,
      instagram_handle: instagram,
      disciplines,
      discipline_other: disciplineOther,
      attending_aug29: attendingAug29,
      jam_interested: jamInterested,
      jam_perform_style: jamInterested ? jamPerformStyle : null,
      jam_instruments: jamInterested ? jamInstruments : null,
      jam_song_details: jamInterested ? jamSongDetails : null,
      jam_art_description: jamInterested ? jamArtDescription : null,
      jam_backing_track: jamInterested ? jamBackingTrack : null,
      metadata: {
        userAgent: req.headers['user-agent'] || null,
        submittedAt: new Date().toISOString(),
        artDescription: jamInterested ? jamArtDescription : null,
      },
    };

    const { data: reg, error: insertError } = await supabase
      .from('event_registrations')
      .insert(insertRow)
      .select('id')
      .single();

    if (insertError) {
      console.error('[register-event] insert:', insertError.message);
      let supabaseHost = null;
      try {
        supabaseHost = new URL(supabaseUrl).host;
      } catch (_) {
        supabaseHost = 'unparseable';
      }
      return res.status(500).json({
        error: 'Database error',
        details: insertError.message,
        supabaseHost,
        hint:
          insertError.message && /Invalid path/i.test(insertError.message)
            ? 'Set Vercel SUPABASE_URL to https://YOUR_PROJECT.supabase.co (no /rest/v1).'
            : 'Apply sql/event_registrations_lapa71.sql if the table is missing.',
      });
    }

    const registrationId = reg.id;
    let profileId = null;

    // 2) Link or create shadow system user
    const existing = await findProfileByEmail(supabase, email);
    if (existing?.id) {
      profileId = existing.id;
      await supabase
        .from('profiles')
        .update({
          username: stageName || existing.username || fullName,
          instagram_handle: instagram || undefined,
          role_calling: disciplines.join(', '),
          contact_details: {
            phone,
            whatsapp: phone,
            source: 'lapa71-join',
            stage_name: stageName,
            full_name: fullName,
          },
          is_shadow_profile: existing.is_shadow_profile !== false ? true : existing.is_shadow_profile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      const userId = await createShadowAuthUser(supabase, {
        email,
        stageName,
        fullName,
        phone,
        instagram,
        disciplines,
      });
      if (userId) {
        profileId = await upsertShadowProfile(supabase, userId, {
          email,
          stageName,
          fullName,
          phone,
          instagram,
          disciplines,
        });
      } else {
        // profiles.id FK → auth.users; leave null and keep registration as source of truth
        await tryGuestRegistration(supabase, { fullName, email });
      }
    }

    if (profileId) {
      await supabase
        .from('event_registrations')
        .update({ profile_id: profileId })
        .eq('id', registrationId);
    }

    const notify = await softNotifyResend({
      email,
      fullName,
      stageName,
      registrationId,
    });
    const stripe = softStripeHook({ email, registrationId, attendingAug29 });

    return res.status(200).json({
      success: true,
      registrationId,
      profileId,
      eventId,
      notify,
      stripe,
      note: profileId
        ? 'Shadow profile linked. Full auth claim available at login.'
        : 'Registration saved. Profile linking deferred until login / invite (profiles.id requires auth.users).',
    });
  } catch (e) {
    console.error('[register-event] API error:', e);
    const status = e.status || 500;
    return res.status(status).json({
      error: e.message || 'Internal Server Error',
      details: e.message,
      code: e.code || null,
    });
  }
}

const ADMIN_DEFAULT_EVENT = 'lapa71-tagus-drop-20260829';

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
  const raw = String(eventIdParam || ADMIN_DEFAULT_EVENT).trim();
  if (!raw) return ADMIN_DEFAULT_EVENT;
  // Support short alias from admin UI: lapa71-tagus-drop
  if (raw === 'lapa71-tagus-drop') return ADMIN_DEFAULT_EVENT;
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

async function handleAdmin(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    assertAdmin(req);

    const supabase = createClient(getSupabaseUrl(), getServiceRoleKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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
      if (body.jam_art_description != null || body.jamArtDescription != null) {
        patch.jam_art_description = body.jam_art_description ?? body.jamArtDescription;
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
