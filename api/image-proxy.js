/**
 * Same-origin image proxy for html2canvas / flyer export (avoids CORS taint).
 * GET /api/image-proxy?url=https://...
 */
const ALLOWED_HOSTS = [
    'circle-d-flow-web.vercel.app',
    'millionsandbox.com',
    'images.subvert.pw',
    'supabase.co',
    'googleusercontent.com',
    'drive.google.com',
];

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const raw = req.query?.url;
    if (!raw) return res.status(400).json({ error: 'url required' });

    let target;
    try {
        target = new URL(raw);
    } catch {
        return res.status(400).json({ error: 'invalid url' });
    }

    if (target.protocol !== 'https:' && target.protocol !== 'http:') {
        return res.status(400).json({ error: 'invalid protocol' });
    }

    const hostOk = ALLOWED_HOSTS.some((h) => target.hostname === h || target.hostname.endsWith('.' + h));
    const sameDeploy = process.env.VERCEL_URL && target.hostname === process.env.VERCEL_URL;
    if (!hostOk && !sameDeploy && !target.hostname.includes('localhost')) {
        return res.status(403).json({ error: 'host not allowed' });
    }

    try {
        const upstream = await fetch(target.toString(), {
            headers: { 'User-Agent': 'CircleDFlow-ImageProxy/1.0' },
        });
        if (!upstream.ok) {
            return res.status(upstream.status).json({ error: 'upstream failed' });
        }
        const ct = upstream.headers.get('content-type') || 'image/jpeg';
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(buf);
    } catch (e) {
        return res.status(502).json({ error: e.message || 'proxy error' });
    }
};
