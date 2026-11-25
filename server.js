'use strict';

const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const compression = require('compression');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
// Optional ISO date, e.g. 2027-01-15T10:00:00+05:30. Leave unset to hide the countdown.
const LAUNCH_DATE = process.env.LAUNCH_DATE || '';
const INSTAGRAM_URL = process.env.INSTAGRAM_URL || 'https://www.instagram.com/';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(compression());
app.use(express.json({ limit: '4kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

app.get('/api/config', (req, res) => {
  res.json({ launchDate: LAUNCH_DATE || null, instagram: INSTAGRAM_URL });
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

/* ---------- newsletter ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hits = new Map(); // ip -> [timestamps]
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_HITS;
}

let writeQueue = Promise.resolve();

async function readSubscribers() {
  try {
    return JSON.parse(await fs.readFile(SUBSCRIBERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function addSubscriber(entry) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const list = await readSubscribers();
    if (list.some((s) => s.email === entry.email)) return false;
    list.push(entry);
    await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2));
    return true;
  });
  return writeQueue;
}

app.post('/api/subscribe', async (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  const honeypot = req.body && req.body.website;

  if (honeypot) return res.json({ ok: true }); // quietly ignore bots
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ ok: false, message: 'That email doesn’t look quite right.' });
  }
  if (rateLimited(req.ip)) {
    return res.status(429).json({ ok: false, message: 'Easy there — try again in a few minutes.' });
  }

  try {
    const added = await addSubscriber({ email, at: new Date().toISOString() });
    res.json({
      ok: true,
      message: added
        ? 'You’re on the list. A little green is on its way to you.'
        : 'You’re already on the list — we’ll be in touch soon.',
    });
  } catch (err) {
    console.error('subscribe failed:', err);
    res.status(500).json({ ok: false, message: 'Something went wrong. Please try again.' });
  }
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`Baaghbani & Co. coming soon → http://localhost:${PORT}`);
});
