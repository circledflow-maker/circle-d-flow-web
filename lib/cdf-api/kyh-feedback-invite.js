const crypto = require('crypto');

function token() {
  return crypto.randomBytes(16).toString('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, project } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required.' });
  }

  const t = token();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const link = `${proto}://${host}/pages/kyh/feedback/session?token=${t}`;

  let emailed = false;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.KYH_FEEDBACK_FROM || 'Kiss Your Heart <onboarding@resend.dev>';

  if (resendKey) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from,
        to: email,
        subject: 'Your Kiss Your Heart feedback session',
        html: `<p>You are invited to share experience feedback for ${project || 'a Kiss Your Heart project'}.</p>
          <p><a href="${link}">Start your feedback session with Flowee</a></p>
          <p><em>when you intrinsically make the effort.</em></p>`,
      });
      emailed = true;
    } catch (e) {
      console.error('[kyh-feedback-invite]', e.message);
    }
  }

  return res.status(200).json({ ok: true, token: t, link, emailed });
}
