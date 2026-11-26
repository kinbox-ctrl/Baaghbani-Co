// Cloudflare Worker entry: serves /public as static assets and handles the small API.
// Sign-ups are stored in the SUBSCRIBERS KV namespace (key = email).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_MAX = 5; // sign-up attempts per IP
const RATE_WINDOW = 600; // seconds

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS },
  });
}

async function subscribe(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'That email doesn’t look quite right.' }, 400);
  }
  const email = String((body && body.email) || '').trim().toLowerCase();
  if (body && body.website) return json({ ok: true }); // honeypot: quietly ignore bots
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, message: 'That email doesn’t look quite right.' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rlKey = `rl:${ip}`;
  const hits = Number((await env.SUBSCRIBERS.get(rlKey)) || 0) + 1;
  if (hits > RATE_MAX) {
    return json({ ok: false, message: 'Easy there — try again in a few minutes.' }, 429);
  }
  await env.SUBSCRIBERS.put(rlKey, String(hits), { expirationTtl: RATE_WINDOW });

  const key = `email:${email}`;
  if (await env.SUBSCRIBERS.get(key)) {
    return json({ ok: true, message: 'You’re already on the list — we’ll be in touch soon.' });
  }
  await env.SUBSCRIBERS.put(
    key,
    JSON.stringify({ email, at: new Date().toISOString(), country: request.cf && request.cf.country })
  );
  return json({ ok: true, message: 'You’re on the list. A little green is on its way to you.' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/config' && request.method === 'GET') {
      return json({ launchDate: env.LAUNCH_DATE || null, instagram: env.INSTAGRAM_URL || 'https://www.instagram.com/' });
    }
    if (url.pathname === '/api/subscribe') {
      if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed' }, 405);
      try {
        return await subscribe(request, env);
      } catch (err) {
        console.error('subscribe failed', err);
        return json({ ok: false, message: 'Something went wrong. Please try again.' }, 500);
      }
    }
    if (url.pathname === '/healthz') return json({ ok: true });
    if (url.pathname.startsWith('/api/')) return json({ ok: false, message: 'Not found' }, 404);

    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
    return out;
  },
};
