/*
  FriendlyFlights — API contract tests
  Run with: node tests/api.test.js [BASE_URL]
  Default BASE_URL: http://localhost:3001

  Tests cover blocks B (API contract), parts of C (security headers),
  I (robots/sitemap/static assets) and N (resilience/error messages).

  Exit code: 0 = all pass, 1 = one or more failures.
*/

'use strict';

const BASE = process.argv[2] || 'http://localhost:3001';

let passed = 0;
let failed = 0;
const failures = [];

async function get(path, opts = {}) {
  const url = BASE + path;
  const res  = await fetch(url, { redirect: 'manual', ...opts });
  const body = res.headers.get('content-type')?.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => '');
  return { res, body, url };
}

function assert(label, cond, detail = '') {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
    failures.push(label + (detail ? ': ' + detail : ''));
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: check a security header exists and optionally matches a pattern
function assertHeader(headers, name, pattern, label) {
  const val = headers.get(name);
  if (pattern) {
    assert(label || `Header ${name} matches ${pattern}`, val && pattern.test(val), `got: ${val}`);
  } else {
    assert(label || `Header ${name} present`, !!val, `got: ${val}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK A-ish / I — Static assets + SEO files
async function testStaticAssets() {
  console.log('\n[Static assets & SEO]');

  const { res: r1 } = await get('/');
  assert('GET / returns 200', r1.status === 200);
  assertHeader(r1.headers, 'content-type', /text\/html/, 'GET / content-type is HTML');

  for (const asset of ['/styles.css', '/app.js', '/i18n.js', '/destinations.js',
                        '/html2canvas.min.js', '/icon.svg', '/manifest.json',
                        '/sw.js']) {
    const { res } = await get(asset);
    assert(`GET ${asset} → 200`, res.status === 200, `got ${res.status}`);
  }

  const { res: r2, body: robots } = await get('/robots.txt');
  assert('GET /robots.txt → 200', r2.status === 200);
  assert('/robots.txt disallows /api/', typeof robots === 'string' && robots.includes('Disallow: /api/'));
  assert('/robots.txt has Sitemap directive', typeof robots === 'string' && robots.includes('Sitemap:'));

  const { res: r3 } = await get('/sitemap.xml');
  assert('GET /sitemap.xml → 200', r3.status === 200);
  assertHeader(r3.headers, 'content-type', /xml/, '/sitemap.xml content-type is XML');

  for (const page of ['/aviso-legal.html', '/politica-privacidad.html']) {
    const { res } = await get(page);
    assert(`GET ${page} → 200`, res.status === 200, `got ${res.status}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK C — Security headers
async function testSecurityHeaders() {
  console.log('\n[Security headers]');

  const { res } = await get('/');
  const h = res.headers;

  assertHeader(h, 'x-content-type-options', /nosniff/, 'X-Content-Type-Options: nosniff');
  assertHeader(h, 'x-frame-options', /DENY|SAMEORIGIN/, 'X-Frame-Options present');
  assertHeader(h, 'content-security-policy', null, 'Content-Security-Policy present');
  assertHeader(h, 'referrer-policy', null, 'Referrer-Policy present');
  assertHeader(h, 'x-dns-prefetch-control', null, 'X-DNS-Prefetch-Control present');

  const csp = h.get('content-security-policy') || '';
  assert("CSP blocks default-src to 'self'", csp.includes("default-src 'self'"), csp.slice(0, 80));
  assert("CSP blocks frame-src 'none'", csp.includes("frame-src 'none'") || csp.includes("frame-ancestors 'none'"), csp.slice(0, 80));
  assert("CSP blocks object-src 'none'", csp.includes("object-src 'none'"), csp.slice(0, 80));
}

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK B — /api/airports
async function testAirports() {
  console.log('\n[/api/airports]');

  const { res, body } = await get('/api/airports');
  assert('GET /api/airports → 200', res.status === 200, `got ${res.status}`);
  assert('Response is JSON array { airports: [...] }', Array.isArray(body?.airports), JSON.stringify(body).slice(0, 80));
  assert('airports array is non-empty', (body?.airports?.length ?? 0) > 0, `length: ${body?.airports?.length}`);

  const sample = body?.airports?.[0];
  assert('airport has code field (3-char IATA)', typeof sample?.code === 'string' && sample.code.length === 3, JSON.stringify(sample));
  assert('airport has name field', typeof sample?.name === 'string', JSON.stringify(sample));
  assert('airport has city field', typeof sample?.city === 'string', JSON.stringify(sample));
  assert('airport has country field', typeof sample?.country === 'string', JSON.stringify(sample));
}

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK B — /api/routes/:iata
async function testRoutes() {
  console.log('\n[/api/routes/:iata]');

  // Valid IATA
  const { res: r1, body: b1 } = await get('/api/routes/MAD');
  assert('GET /api/routes/MAD → 200', r1.status === 200, `got ${r1.status}`);
  assert('routes/MAD has iata field = MAD', b1?.iata === 'MAD', JSON.stringify(b1).slice(0, 80));
  assert('routes/MAD destinations is array', Array.isArray(b1?.destinations));
  assert('routes/MAD destinations is non-empty', (b1?.destinations?.length ?? 0) > 0, `length: ${b1?.destinations?.length}`);

  // Lowercase IATA — should normalise to uppercase
  const { res: r2, body: b2 } = await get('/api/routes/mad');
  assert('GET /api/routes/mad (lowercase) → 200', r2.status === 200);
  assert('routes/mad normalised to MAD', b2?.iata === 'MAD', JSON.stringify(b2).slice(0, 80));

  // Unknown IATA → 200 with empty destinations
  const { res: r3, body: b3 } = await get('/api/routes/XXX');
  assert('GET /api/routes/XXX → 200 (not 404)', r3.status === 200);
  assert('routes/XXX destinations is empty array', Array.isArray(b3?.destinations) && b3.destinations.length === 0, JSON.stringify(b3).slice(0, 80));

  // LHR — busy international hub
  const { body: b4 } = await get('/api/routes/LHR');
  assert('routes/LHR non-empty', (b4?.destinations?.length ?? 0) > 0);
}

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK B — /api/flights
async function testFlights() {
  console.log('\n[/api/flights — contract & validation]');

  // Missing params
  const { res: r1, body: b1 } = await get('/api/flights');
  assert('GET /api/flights (no params) → 400', r1.status === 400, `got ${r1.status}`);
  assert('400 body has error field', typeof b1?.error === 'string', JSON.stringify(b1));

  const { res: r2 } = await get('/api/flights?origin=MAD&dest=BCN');
  assert('GET /api/flights (missing date) → 400', r2.status === 400, `got ${r2.status}`);

  const { res: r3 } = await get('/api/flights?dest=BCN&date=2099-01-01');
  assert('GET /api/flights (missing origin) → 400', r3.status === 400, `got ${r3.status}`);

  // Past date — server should refuse without calling scraper
  const past = '2020-01-01';
  const { res: r4, body: b4 } = await get(`/api/flights?origin=MAD&dest=BCN&date=${past}`);
  assert('GET /api/flights past date → non-5xx', r4.status < 500, `got ${r4.status}`);
  assert('past date returns empty flights array', Array.isArray(b4?.flights) && b4.flights.length === 0,
    JSON.stringify(b4).slice(0, 80));

  // Same origin and destination
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const { res: r5, body: b5 } = await get(`/api/flights?origin=MAD&dest=MAD&date=${tomorrow}`);
  assert('GET /api/flights origin=dest → 200 or 400 (not 500)', r5.status !== 500, `got ${r5.status}`);

  // Malformed date
  const { res: r6 } = await get('/api/flights?origin=MAD&dest=BCN&date=not-a-date');
  assert('GET /api/flights malformed date → non-500', r6.status !== 500, `got ${r6.status}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK B — /api/book
async function testBook() {
  console.log('\n[/api/book — contract]');

  const { res: r1 } = await get('/api/book');
  assert('GET /api/book (no params) → 400', r1.status === 400, `got ${r1.status}`);

  const { res: r2 } = await get('/api/book?origin=MAD&dest=BCN&date=2099-06-01');
  assert('GET /api/book (missing dep_time) → 400', r2.status === 400, `got ${r2.status}`);

  // Valid params with a fallback URL — should redirect to fallback if capture times out.
  // We only test that the response is a redirect (302), not that it lands on the airline site.
  const fb = encodeURIComponent('https://www.google.com/travel/flights');
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const { res: r3 } = await get(
    `/api/book?origin=MAD&dest=BCN&date=${tomorrow}&dep_time=10:00&fallback=${fb}`,
    { redirect: 'manual' }
  );
  assert('GET /api/book valid params → 302 redirect', r3.status === 302, `got ${r3.status}`);
  assert('GET /api/book redirect has Location header', !!r3.headers.get('location'),
    `Location: ${r3.headers.get('location')}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK B / C — /api/imgproxy
async function testImgProxy() {
  console.log('\n[/api/imgproxy — contract & SSRF guard]');

  // Missing url param
  const { res: r1 } = await get('/api/imgproxy');
  assert('GET /api/imgproxy (no url) → 400', r1.status === 400, `got ${r1.status}`);

  // Invalid url
  const { res: r2 } = await get('/api/imgproxy?url=not-a-url');
  assert('GET /api/imgproxy (invalid url) → 400', r2.status === 400, `got ${r2.status}`);

  // Disallowed host — SSRF guard
  const evil = encodeURIComponent('https://evil.example.com/img.jpg');
  const { res: r3 } = await get(`/api/imgproxy?url=${evil}`);
  assert('GET /api/imgproxy non-wikimedia → 403', r3.status === 403, `got ${r3.status}`);

  // Another disallowed host — internal IP style
  const internal = encodeURIComponent('http://169.254.169.254/latest/meta-data/');
  const { res: r4 } = await get(`/api/imgproxy?url=${internal}`);
  assert('GET /api/imgproxy metadata endpoint → 403', r4.status === 403, `got ${r4.status}`);

  // Allowed host — valid Wikimedia URL (may fail if upstream is down, so tolerate 5xx)
  const wm = encodeURIComponent('https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png');
  const { res: r5 } = await get(`/api/imgproxy?url=${wm}`);
  assert('GET /api/imgproxy valid Wikimedia → 200 or upstream error (not 403)', r5.status !== 403, `got ${r5.status}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK C — Rate limiting
async function testRateLimiting() {
  console.log('\n[Rate limiting]');

  // We only verify that the RateLimit headers are present on /api/airports
  // (lightweight endpoint). We don't actually flood the heavy endpoints.
  const { res } = await get('/api/airports');
  const rl = res.headers.get('ratelimit-limit') || res.headers.get('x-ratelimit-limit');
  assert('Rate-limit headers present on /api endpoints', !!rl,
    `RateLimit-Limit: ${rl} (check RateLimit-Limit or X-RateLimit-Limit)`);
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
(async () => {
  console.log(`\nFriendlyFlights API tests — ${BASE}\n${'─'.repeat(60)}`);
  try {
    await testStaticAssets();
    await testSecurityHeaders();
    await testAirports();
    await testRoutes();
    await testFlights();
    await testBook();
    await testImgProxy();
    await testRateLimiting();
  } catch (err) {
    console.error('\n[FATAL]', err);
    process.exit(1);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Passed: ${passed}   Failed: ${failed}`);
  if (failures.length) {
    console.error('\nFailing tests:');
    failures.forEach(f => console.error(`  ✗ ${f}`));
  }
  process.exit(failed > 0 ? 1 : 0);
})();
