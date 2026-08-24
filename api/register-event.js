/**
 * POST /api/register-event
 * Lapa 71 x Tagus Drop — Member & Jam registration.
 * Saves event_registrations, upserts shadow profile when possible.
 * Resend / Stripe are optional stubs (no hard requireEnv).
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const EVENT_ID = 'lapa71-tagus-drop-20260829';
const DEFAULT_SOURCE = 'social_join';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

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

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseServiceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
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
    const jamBackingTrack = asBool(body.jamBackingTrack ?? body.jam_backing_track);
    const source = clean(body.source) || DEFAULT_SOURCE;
    const eventId = clean(body.eventId || body.event_id) || EVENT_ID;

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
      return res.status(400).json({ error: 'Jam section: how will you perform?' });
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
      jam_backing_track: jamInterested ? jamBackingTrack : null,
      metadata: {
        userAgent: req.headers['user-agent'] || null,
        submittedAt: new Date().toISOString(),
      },
    };

    const { data: reg, error: insertError } = await supabase
      .from('event_registrations')
      .insert(insertRow)
      .select('id')
      .single();

    if (insertError) {
      console.error('[register-event] insert:', insertError.message);
      return res.status(500).json({
        error: 'Database error',
        details: insertError.message,
        hint: 'Apply sql/event_registrations_lapa71.sql if the table is missing.',
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
    return res.status(500).json({ error: 'Internal Server Error', details: e.message });
  }
}
