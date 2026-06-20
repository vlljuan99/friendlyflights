/*
  FriendlyFlights — server.js
  - Serves the static frontend
  - GET /api/flights   → flightSearch router: fli (free Google Flights
                         reader) primary + Playwright scraper fallback, cached
  - GET /api/routes/:iata → Known destinations from an airport (OpenFlights data)

  fli needs no API key — just Python with the `flights` package installed
  (pip install flights). Set PYTHON_BIN in .env if `python` isn't on PATH.
*/

'use strict';
const express      = require('express');
const path         = require('path');
const fs           = require('fs');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');

// ── Minimal .env loader (zero-dependency) ─────────────────────────
(function loadDotEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim().replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch { /* ignore */ }
})();

const { searchFlights }      = require('./flightSearch');
const { captureBookingUrl }  = require('./bookingCapture');

// ── Structured logger (adds ISO timestamp + level prefix) ─────────
const log = {
  info:  (...a) => console.log( `[${new Date().toISOString()}] INFO `, ...a),
  warn:  (...a) => console.warn( `[${new Date().toISOString()}] WARN `, ...a),
  error: (...a) => console.error(`[${new Date().toISOString()}] ERROR`, ...a),
};

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Minimal HTTP request logger ───────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log[level](`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// ── Security headers (Helmet + custom CSP) ────────────────────────
// html2canvas is loaded from cdnjs; Inter font from Google Fonts.
// SRI is added in index.html for html2canvas (see there).
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", 'cdnjs.cloudflare.com'],
      styleSrc:       ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc:        ["'self'", 'fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:', 'upload.wikimedia.org'],
      connectSrc:     ["'self'"],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,  // needed for html2canvas cross-origin images
}));

// ── CORS — only needed for /api/* (static files don't need it) ────
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// ── Rate limiting ─────────────────────────────────────────────────
// /api/flights and /api/book spin up Playwright (expensive). Limit
// generously so real users never notice, but DoS becomes impractical.
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 20,               // 20 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a minute and try again.' },
});
const lightLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a minute and try again.' },
});

app.use('/api/flights', heavyLimiter);
app.use('/api/book',    heavyLimiter);
app.use('/api',         lightLimiter);

// ── Static assets with cache headers ──────────────────────────────
app.use(express.static(path.join(__dirname), {
  setHeaders(res, filePath) {
    const ext = path.extname(filePath);
    if (['.css', '.js', '.svg', '.json', '.png', '.webp'].includes(ext)) {
      // Versioned assets (hashed in name) can be cached long; unversioned use
      // a short window so deploys propagate quickly.
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }
  },
}));

// ─────────────────────────────────────────────────────────────────
// Routes index — loaded once at startup from OpenFlights routes.dat
// Format: { IATA_origin: Set<IATA_dest> }
// Covers 700+ airlines: Ryanair, easyJet, Vueling, Wizz, Iberia…
// ─────────────────────────────────────────────────────────────────
let routesIndex = {};   // populated below

async function loadRoutesData() {
  // 1. Prefer the curated dataset built by scripts/build_routes.py — its
  //    Wikipedia source is far fresher than OpenFlights' 2017 snapshot.
  const localPath = path.join(__dirname, 'data', 'routes.json');
  if (fs.existsSync(localPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      const index = {};
      let count = 0;
      for (const [origin, dests] of Object.entries(data)) {
        if (!Array.isArray(dests)) continue;
        index[origin] = new Set(dests.filter(d => typeof d === 'string' && d.length === 3));
        count += index[origin].size;
      }
      routesIndex = index;
      log.info(`[routes] Loaded ${count.toLocaleString()} curated routes from data/routes.json (${Object.keys(index).length} origin airports)`);
      return;
    } catch (err) {
      log.warn(`[routes] data/routes.json present but unreadable: ${err.message} — falling back to OpenFlights`);
    }
  }

  // 2. Fallback — OpenFlights 2017 snapshot (incomplete for long-haul).
  const url = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat';
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    const index = {};
    let count   = 0;
    for (const line of text.split('\n')) {
      const p = line.split(',');
      // columns: airline, id, src_iata, src_id, dst_iata, dst_id, codeshare, stops, equip
      if (p.length < 5) continue;
      const src = p[2]?.trim();
      const dst = p[4]?.trim();
      if (!src || !dst || src.length !== 3 || dst.length !== 3) continue;
      if (src === '\\N' || dst === '\\N') continue;
      if (!index[src]) index[src] = new Set();
      index[src].add(dst);
      count++;
    }

    routesIndex = index;
    log.info(`[routes] Loaded ${count.toLocaleString()} routes from OpenFlights 2017 fallback (${Object.keys(index).length} origin airports)`);
    log.info('[routes] Tip: run `python scripts/build_routes.py` to build a fresher data/routes.json from Wikipedia.');
  } catch (err) {
    log.warn(`[routes] Could not load OpenFlights data: ${err.message} — destination filter will show all airports`);
  }
}

// Kick off in the background — server starts immediately, routes load async
loadRoutesData();

// ─────────────────────────────────────────────────────────────────
// Airports index — loaded once at startup from OpenFlights airports.dat
// Provides every IATA-coded airport so the autocomplete isn't limited
// to the small hardcoded fallback. Keyed by IATA.
// ─────────────────────────────────────────────────────────────────
let airportsIndex = {};

// CSV with quoted strings — fields can contain commas inside quotes.
function parseCsvLine(line) {
  const out = []; let cur = ''; let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuote = !inQuote; continue; }
    if (c === ',' && !inQuote) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

// Manual overrides for fields where OpenFlights' 2017 snapshot is outdated.
// Each entry is { name?, city?, country? } — only the keys you set are applied.
const AIRPORT_OVERRIDES = {
  LAS: { name: 'Harry Reid International Airport' },        // renamed 2021
  AUH: { name: 'Zayed International Airport' },             // renamed 2024
  HND: { name: 'Tokyo Haneda Airport' },                    // tidy capitalisation
  CAI: { name: 'Cairo International Airport' },
};

async function loadAirportsData() {
  const url = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text  = await resp.text();
    const index = {};
    let count   = 0;
    for (const line of text.split('\n')) {
      const p = parseCsvLine(line);
      if (p.length < 5) continue;
      // 1=Name, 2=City, 3=Country, 4=IATA, 12=type (optional)
      const iata = (p[4] || '').trim();
      if (!iata || iata.length !== 3 || iata === '\\N') continue;
      const type = (p[12] || '').trim();
      if (type && type !== 'airport') continue;   // skip stations/ports/etc.
      if (!index[iata]) {
        const ovr = AIRPORT_OVERRIDES[iata] || {};
        index[iata] = {
          code:    iata,
          name:    ovr.name    ?? (p[1] || '').trim(),
          city:    ovr.city    ?? (p[2] || '').trim(),
          country: ovr.country ?? (p[3] || '').trim(),
        };
        count++;
      }
    }
    airportsIndex = index;
    log.info(`[airports] Loaded ${count} IATA airports from OpenFlights`);
  } catch (err) {
    log.warn(`[airports] Could not load OpenFlights data: ${err.message} — frontend will use built-in fallback list`);
  }
}
loadAirportsData();

// ─────────────────────────────────────────────────────────────────
// GET /api/airports
// Returns every IATA-coded airport for the autocomplete pool.
// ─────────────────────────────────────────────────────────────────
app.get('/api/airports', (req, res) => {
  res.json({ airports: Object.values(airportsIndex) });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/routes/:iata
// Returns all known destination IATA codes from the given airport.
// ─────────────────────────────────────────────────────────────────
app.get('/api/routes/:iata', (req, res) => {
  const iata  = req.params.iata.toUpperCase().trim();
  const dests = routesIndex[iata];
  res.json({ iata, destinations: dests ? Array.from(dests) : [] });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/flights?origin=STN&dest=BCN&date=2026-06-15
// Scrapes Skyscanner via Playwright; falls back to Ryanair farfnd.
// ─────────────────────────────────────────────────────────────────
app.get('/api/flights', async (req, res) => {
  const { origin, dest, date } = req.query;
  if (!origin || !dest || !date) {
    return res.status(400).json({ error: 'Missing: origin, dest, date' });
  }
  // Validate date format (YYYY-MM-DD) and that it is a real calendar date.
  const dateStr = String(date).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(Date.parse(dateStr))) {
    return res.status(400).json({ error: 'Invalid date — expected YYYY-MM-DD', flights: [] });
  }
  // Validate IATA codes (3 uppercase letters).
  const originStr = String(origin).trim().toUpperCase();
  const destStr   = String(dest).trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(originStr) || !/^[A-Z]{3}$/.test(destStr)) {
    return res.status(400).json({ error: 'Invalid IATA code — expected 3 letters', flights: [] });
  }
  try {
    const flights = await searchFlights(originStr, destStr, dateStr);
    const source = flights[0]?.source ?? 'none';
    log.info(`✈  ${origin}→${dest}: ${flights.length} flights (${source})`);
    res.json({ flights });
  } catch (err) {
    log.error('[/api/flights]', err.message);
    res.status(500).json({ error: err.message, flights: [] });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/book?origin=SVQ&dest=AMS&date=2026-06-10&dep_time=09:55
//   &fallback=<url-encoded q= search URL>
// Captures the Google Flights booking deep link (tfs+tfu) for the
// specific flight and 302-redirects the user. ~5–15 s on first hit per
// flight, instant after that (in-memory cache). If capture fails or
// times out, redirects to the q= search URL fallback so the user still
// reaches a usable Google Flights page.
// ─────────────────────────────────────────────────────────────────
app.get('/api/book', async (req, res) => {
  const { origin, dest, date, dep_time: depTime, fallback } = req.query;
  if (!origin || !dest || !date || !depTime) {
    return res.status(400).send('Missing: origin, dest, date, dep_time');
  }
  const fb = fallback ||
    `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${origin} to ${dest} on ${date} one way`)}`;
  try {
    const url = await Promise.race([
      captureBookingUrl({
        origin: String(origin).toUpperCase(),
        dest:   String(dest).toUpperCase(),
        date,
        depTime,
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('capture timeout')), 28000)),
    ]);
    res.redirect(302, url);
  } catch (err) {
    log.warn(`[/api/book] ${origin}→${dest} ${date} ${depTime} — ${err.message}; using fallback`);
    res.redirect(302, fb);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/imgproxy?url=https://upload.wikimedia.org/...
// Proxies Wikimedia thumbnail images to avoid CSP / mixed-content issues.
// Only allows requests to upload.wikimedia.org for safety.
// ─────────────────────────────────────────────────────────────────
app.get('/api/imgproxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');

  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).send('Invalid url'); }

  if (parsed.hostname !== 'upload.wikimedia.org') {
    return res.status(403).send('Only upload.wikimedia.org is allowed');
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'FriendlyFlights/1.0 (https://github.com/friendlyflights; contact@friendlyflights.app)',
        'Accept': 'image/webp,image/jpeg,image/*,*/*',
        'Referer': 'https://en.wikipedia.org/',
      }
    });
    if (!upstream.ok) return res.status(upstream.status).send('Upstream error ' + upstream.status);
    const ct = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buf = await upstream.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch (err) {
    res.status(502).send('Proxy error: ' + err.message);
  }
});

app.listen(PORT, () => {
  log.info(`✈  FriendlyFlights → http://localhost:${PORT}`);
});
