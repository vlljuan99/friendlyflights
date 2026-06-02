'use strict';
/*
  scraper.js — multi-source flight search with automatic fallback chain.
  Strategy:
    1. Skyscanner — intercept FPS3 JSON + DOM fallback.
    2. Ryanair farfnd API — direct REST call, works for budget EU routes.
    3. Google Flights — Playwright scrape (lighter bot-protection than Skyscanner).
    4. Kayak — Playwright scrape as last resort.
  Returns: up to 5 flights sorted by price.
*/

const { chromium } = require('playwright');

// ─── Singleton browser ────────────────────────────────────────────
let _browser = null;

async function getBrowser() {
  if (_browser) {
    try { await _browser.version(); return _browser; } catch { _browser = null; }
  }
  _browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
    ],
  });
  _browser.on('disconnected', () => { _browser = null; });
  return _browser;
}

// ─── Scraper entry point (fallback provider) ──────────────────────
// Renamed from searchFlights → scrapeFlights: this module is now the
// FALLBACK behind SearchAPI. The router in flightSearch.js decides which
// provider to use. Kept fully functional so the app works with no API key.
async function scrapeFlights(origin, dest, depDate) {
  const browser = await getBrowser();

  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
  });

  // Minimal stealth overrides
  await ctx.addInitScript(`
    Object.defineProperty(navigator, 'webdriver',  { get: () => undefined });
    Object.defineProperty(navigator, 'plugins',    { get: () => [1,2,3,4,5] });
    Object.defineProperty(navigator, 'languages',  { get: () => ['en-GB','en'] });
    window.chrome = { runtime: {} };
  `);

  // Block heavy resources to speed up loading
  await ctx.route('**/*', route => {
    const t = route.request().resourceType();
    if (['image', 'media', 'font'].includes(t)) return route.abort();
    route.continue();
  });

  const page     = await ctx.newPage();
  const captured = [];     // flights found via network
  let   legMap   = {};     // accumulated leg objects across responses

  // ── Network interception ───────────────────────────────────────
  page.on('response', async resp => {
    try {
      const url = resp.url();
      // Only care about skyscanner JSON responses
      if (!url.includes('skyscanner')) return;
      const ct = resp.headers()['content-type'] ?? '';
      if (!ct.includes('application/json')) return;

      const body = await resp.json().catch(() => null);
      if (!body) return;

      // Accumulate leg data (may arrive in separate responses)
      if (body.legs && typeof body.legs === 'object') {
        Object.assign(legMap, body.legs);
      }

      const parsed = parseSkyscannerJSON(body, legMap, origin, dest, depDate);
      if (parsed.length) captured.push(...parsed);
    } catch { /* ignore parse errors */ }
  });

  // ── Navigate ───────────────────────────────────────────────────
  const skyDate = toSkyDate(depDate);
  const url = `https://www.skyscanner.com/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${skyDate}/`;

  let pageLoaded = false;
  try {
    console.log(`[scraper] ${origin}→${dest} ${depDate}  →  ${url}`);
    await page.goto(url, { timeout: 35000, waitUntil: 'domcontentloaded' });
    await handleCookies(page);

    // Wait for result cards to appear
    pageLoaded = await page.waitForSelector(
      '[data-testid="result-card"], .BpkFlightCard, [class*="FlightCard"], [class*="itinerary" i]',
      { timeout: 28000 }
    ).then(() => true).catch(() => false);

    // Let a few more results load
    if (pageLoaded) await page.waitForTimeout(2500);
  } catch (err) {
    console.warn(`[scraper] Navigation error for ${origin}→${dest}: ${err.message.slice(0, 80)}`);
  }

  // ── DOM fallback ───────────────────────────────────────────────
  if (!captured.length && pageLoaded) {
    try {
      const domFlights = await extractDOM(page, origin, dest, depDate);
      captured.push(...domFlights);
    } catch {}
  }

  await ctx.close();

  if (captured.length) {
    console.log(`[scraper] ✓ Skyscanner: ${captured.length} raw flights for ${origin}→${dest}`);
    return selectBestFlights(captured);
  }

  // ── Ryanair API fallback ───────────────────────────────────────
  console.log(`[scraper] ↩ Ryanair fallback for ${origin}→${dest}`);
  const ryanairResults = await ryanairFallback(origin, dest, depDate);
  if (ryanairResults.length) return ryanairResults;

  // ── Google Flights fallback ─────────────────────────────────────
  console.log(`[scraper] ↩ Google Flights fallback for ${origin}→${dest}`);
  const googleResults = await googleFlightsFallback(origin, dest, depDate);
  if (googleResults.length) return googleResults;

  // ── Kayak fallback ──────────────────────────────────────────────
  console.log(`[scraper] ↩ Kayak fallback for ${origin}→${dest}`);
  return kayakFallback(origin, dest, depDate);
}

// ─── Parse Skyscanner FPS3 JSON ───────────────────────────────────
function parseSkyscannerJSON(body, legMap, origin, dest, depDate) {
  const flights = [];

  // FPS3: body.content.results.itineraries  OR  body.itineraries
  const itineraries =
    body?.content?.results?.itineraries ??
    body?.itineraries ??
    null;

  if (!itineraries || typeof itineraries !== 'object') return flights;

  for (const [, it] of Object.entries(itineraries)) {
    try {
      const pOpt  = it?.pricingOptions?.[0];
      const price = pOpt?.price?.amount ?? pOpt?.price?.value ?? 0;
      if (!price || price <= 0) continue;

      // Deep link → booking URL
      const deepLink = pOpt?.items?.[0]?.deepLink ?? pOpt?.deepLink ?? '';
      const bookUrl  = deepLink ||
        `https://www.skyscanner.com/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${toSkyDate(depDate)}/`;

      // Find the outbound leg
      const legId = (it.legIds ?? it.legs ?? [])[0];
      const leg   = legMap[legId] ?? body?.legs?.[legId];
      if (!leg) continue;

      const durMin    = leg.durationInMinutes ?? 0;
      const stopCount = leg.stopCount ?? 0;

      // Departure / arrival times from structured datetime objects
      const dep     = leg.departureDateTime;
      const arr     = leg.arrivalDateTime;
      const depTime = dep ? `${pad2(dep.hour)}:${pad2(dep.minute)}` : '';
      const arrTime = arr ? `${pad2(arr.hour)}:${pad2(arr.minute)}` : '';
      const legDate = dep
        ? `${dep.year}-${pad2(dep.month)}-${pad2(dep.day)}`
        : depDate;

      // Carrier (marketing carrier preferred)
      const mkt     = leg.carriers?.marketing ?? [];
      const carrier = (typeof mkt[0] === 'object' ? mkt[0] : null) ?? {};

      flights.push({
        airline: {
          code:    carrier.id ?? carrier.iataCode ?? '',
          name:    carrier.name ?? carrier.displayCode ?? 'Unknown',
          logoUrl: carrier.logoUrl ?? '',
        },
        origin, dest,
        flightNumber: '',
        depTime, arrTime,
        depDate: legDate,
        duration:    durMin > 0 ? formatDur(durMin) : '',
        durationMin: durMin,
        stops:       stopCount,
        price,
        bookUrl,
        source: 'skyscanner',
      });
    } catch { /* skip malformed itinerary */ }
  }

  return flights;
}

// ─── DOM fallback extraction ──────────────────────────────────────
async function extractDOM(page, origin, dest, depDate) {
  return page.evaluate(({ origin, dest, depDate }) => {
    function parseDurMin(text) {
      const m = text.match(/(\d+)\s*h(?:r|rs)?(?:[^\d]+(\d+)\s*m(?:in)?)?/i);
      return m ? parseInt(m[1]) * 60 + parseInt(m[2] || 0) : 0;
    }

    const cards = Array.from(document.querySelectorAll(
      '[data-testid="result-card"], .BpkFlightCard, [class*="FlightCard"]'
    )).slice(0, 20);

    return cards.map(card => {
      try {
        // Price
        const priceEl  = card.querySelector('[data-testid*="price" i], [class*="price" i]');
        const priceNum = parseFloat((priceEl?.textContent ?? '').replace(/[^\d.]/g, '')) || 0;
        if (!priceNum) return null;

        // Times (hh:mm pattern)
        const timeTexts = Array.from(card.querySelectorAll('*'))
          .map(el => el.childNodes)
          .reduce((acc, nodes) => {
            nodes.forEach(n => { if (n.nodeType === 3) acc.push(n.textContent.trim()); });
            return acc;
          }, [])
          .filter(t => /^\d{1,2}:\d{2}$/.test(t));
        const [depTime = '', arrTime = ''] = timeTexts;

        // Duration
        const durEl  = card.querySelector('[data-testid*="duration" i], [class*="duration" i]');
        const durTxt = durEl?.textContent ?? '';
        const durMin = parseDurMin(durTxt);

        // Stops
        const stopEl  = card.querySelector('[data-testid*="stop" i], [class*="stop" i]');
        const stopTxt = (stopEl?.textContent ?? '').toLowerCase();
        const stops   = stopTxt.includes('direct') || stopTxt.includes('nonstop') ? 0 : (parseInt(stopTxt) || 0);

        // Airline name
        const airlineEl  = card.querySelector('[data-testid*="carrier" i], [class*="airline" i], [class*="carrier" i]');
        const airlineName = (airlineEl?.textContent ?? '').trim();

        return {
          airline: { code: '', name: airlineName, logoUrl: '' },
          origin, dest,
          flightNumber: '',
          depTime, arrTime,
          depDate,
          duration:    durMin > 0 ? `${Math.floor(durMin/60)}h${durMin%60>0?' '+(durMin%60)+'m':''}` : durTxt.trim().slice(0, 12),
          durationMin: durMin,
          stops,
          price: priceNum,
          bookUrl: card.querySelector('a[href]')?.href ?? '',
          source: 'skyscanner-dom',
        };
      } catch { return null; }
    }).filter(Boolean);
  }, { origin, dest, depDate });
}

// ─── Cookie consent dismissal ─────────────────────────────────────
async function handleCookies(page) {
  const candidates = [
    '#didomi-notice-agree-button',
    '[data-testid="cookie-popup-accept"]',
    'button:has-text("Accept all")',
    'button:has-text("Accept cookies")',
    'button:has-text("I agree")',
    '[class*="cookie" i] button:has-text("Accept")',
    '[id*="accept" i]',
  ];
  for (const sel of candidates) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1500 })) {
        await btn.click();
        await page.waitForTimeout(600);
        return;
      }
    } catch { /* not present, try next */ }
  }
}

// ─── Ryanair farfnd fallback ──────────────────────────────────────
async function ryanairFallback(origin, dest, date) {
  const offsets = [0, 1, 2, 4, 6];
  const calls   = offsets.map(off => {
    const from   = addDays(date, off);
    const to     = addDays(date, off + 2);
    const params = new URLSearchParams({
      departureAirportIataCode:   origin,
      arrivalAirportIataCode:     dest,
      outboundDepartureDateFrom:  from,
      outboundDepartureDateTo:    to,
      currency: 'EUR',
    });
    return fetch(
      `https://www.ryanair.com/api/farfnd/v4/oneWayFares?${params}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    ).then(r => r.ok ? r.json() : { fares: [] }).catch(() => ({ fares: [] }));
  });

  const responses = await Promise.all(calls);
  const seen    = new Set();
  const results = [];

  for (const data of responses) {
    for (const f of (data.fares ?? [])) {
      const ob    = f.outbound;
      const dep   = ob.departureDate ?? '';
      const arr   = ob.arrivalDate   ?? '';
      const dDate = dep.slice(0, 10);
      const key   = `${ob.flightNumber}-${dDate}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const durMin = Math.round((new Date(arr) - new Date(dep)) / 60000);
      const price  = ob.price?.value ?? 0;
      if (price <= 0) continue;

      results.push({
        airline:     { code: 'FR', name: 'Ryanair', color: '#073590' },
        origin, dest,
        flightNumber: ob.flightNumber ?? '',
        depTime:     dep.slice(11, 16),
        arrTime:     arr.slice(11, 16),
        depDate:     dDate,
        duration:    durMin > 0 ? formatDur(durMin) : '',
        durationMin: durMin,
        stops:       0,
        price,
        bookUrl:     `https://www.ryanair.com/en/gb/booking/home/${origin}/${dest}/${dDate}/null/1/0/0/0`,
        source: 'ryanair',
      });
    }
  }

  return results.sort((a, b) => a.price - b.price).slice(0, 5);
}

// ─── easyJet fallback ─────────────────────────────────────────────
// The GetLowestDailyFares API is protected by Akamai WAF and needs
// a real browser session to pass. Strategy:
//   1. Navigate to easyJet's route page (light load, resources blocked).
//   2. The page fires GetLowestDailyFares automatically — we intercept it.
//   3. Find the fare matching our date and build the flight object.
async function easyjetFallback(origin, dest, date) {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
  });

  await ctx.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins',   { get: () => [1,2,3,4,5] });
    window.chrome = { runtime: {} };
  `);

  // Block heavy resources — the route page loads fast with these blocked
  await ctx.route('**/*', route => {
    const t = route.request().resourceType();
    if (['image', 'media', 'font', 'stylesheet'].includes(t)) return route.abort();
    route.continue();
  });

  const page = await ctx.newPage();

  // Promise that resolves as soon as the daily-fares API call returns JSON
  let resolveFares;
  const faresPromise = new Promise(resolve => { resolveFares = resolve; });

  page.on('response', async resp => {
    try {
      if (!resp.url().includes('GetLowestDailyFares')) return;
      const data = await resp.json().catch(() => null);
      if (Array.isArray(data) && data.length) resolveFares(data);
    } catch {}
  });

  // The route page automatically fires GetLowestDailyFares on load.
  // IATA codes work in the URL (easyjet.com redirects to city-name URL).
  const routeUrl = `https://www.easyjet.com/en/cheap-flights/${origin.toLowerCase()}/${dest.toLowerCase()}`;

  try {
    console.log(`[scraper] easyJet route page → ${routeUrl}`);
    await page.goto(routeUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });

    // Wait up to 12 s for the fares API call to arrive
    const data = await Promise.race([
      faresPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000)),
    ]).catch(() => null);

    await ctx.close();

    if (!Array.isArray(data)) {
      console.warn(`[scraper] easyJet: no fare data for ${origin}→${dest}`);
      return [];
    }

    console.log(`[scraper] easyJet: ${data.length} daily fares for ${origin}→${dest}`);

    // Look for the exact date; if not present the route may not fly that day
    const fare = data.find(f => (f.departureDateTime ?? '').slice(0, 10) === date);
    if (!fare || !fare.outboundPrice || fare.serviceError) {
      console.warn(`[scraper] easyJet: no fare on ${date} for ${origin}→${dest}`);
      return [];
    }

    const dep    = fare.departureDateTime ?? '';
    const arr    = fare.arrivalDateTime   ?? '';
    const durMin = Math.round((new Date(arr) - new Date(dep)) / 60000);

    const result = {
      airline:      { code: 'U2', name: 'easyJet', logoUrl: '' },
      origin, dest,
      flightNumber: fare.flightNumber ? `EZY${fare.flightNumber}` : '',
      depTime:      dep.slice(11, 16),
      arrTime:      arr.slice(11, 16),
      depDate:      date,
      duration:     durMin > 0 ? formatDur(durMin) : '',
      durationMin:  durMin,
      stops:        0,
      price:        Math.round(fare.outboundPrice * 100) / 100,
      bookUrl:      `https://www.easyjet.com/en/booking/home/${origin}/${dest}/${date}/null/1/0/0/0`,
      source:       'easyjet',
    };

    console.log(`[scraper] ✓ easyJet: ${origin}→${dest} ${date} ${result.depTime}→${result.arrTime} €${result.price}`);
    return [result];
  } catch (err) {
    console.warn(`[scraper] easyJet error: ${err.message?.slice(0, 80)}`);
    await ctx.close().catch(() => {});
    return [];
  }
}

// ─── Merge multiple airline sources ──────────────────────────────
// Combines results from different budget carriers, de-dupes,
// and caps to 5 flights (cheapest first).
function mergeFlightSources(...arrays) {
  const combined = arrays.flat();
  if (!combined.length) return [];
  return dedupFlights(combined).sort((a, b) => a.price - b.price).slice(0, 5);
}

// ─── Airline name lookup (IATA code → full name) ──────────────────
const AIRLINE_NAMES = {
  LX: 'Swiss', IB: 'Iberia', VY: 'Vueling', U2: 'easyJet',
  FR: 'Ryanair', BA: 'British Airways', AF: 'Air France',
  KL: 'KLM', LH: 'Lufthansa', AZ: 'ITA Airways', TP: 'TAP',
  SK: 'SAS', AY: 'Finnair', OS: 'Austrian', SN: 'Brussels Airlines',
  BT: 'airBaltic', PS: 'Ukraine Intl', TK: 'Turkish Airlines',
  PC: 'Pegasus', W6: 'Wizz Air', TO: 'Transavia France',
  HV: 'Transavia', EJU: 'easyJet Europe', EW: 'Eurowings',
  X3: 'TUI fly', LS: 'Jet2', EI: 'Aer Lingus', DY: 'Norwegian',
  WF: 'Widerøe', QR: 'Qatar Airways', EK: 'Emirates',
  AA: 'American Airlines', UA: 'United', DL: 'Delta',
  AC: 'Air Canada', AM: 'Aeromexico', LA: 'LATAM',
};

// ─── Google Flights fallback ──────────────────────────────────────
async function googleFlightsFallback(origin, dest, date) {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'Europe/London',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  });

  await ctx.addInitScript(`
    Object.defineProperty(navigator, 'webdriver',  { get: () => undefined });
    Object.defineProperty(navigator, 'plugins',    { get: () => [1,2,3,4,5] });
    Object.defineProperty(navigator, 'languages',  { get: () => ['en-US','en'] });
    window.chrome = { runtime: {} };
  `);

  await ctx.route('**/*', route => {
    const t = route.request().resourceType();
    if (['image', 'media', 'font'].includes(t)) return route.abort();
    route.continue();
  });

  const page    = await ctx.newPage();
  const hashUrl = `https://www.google.com/travel/flights#flt=${origin}.${dest}.${date};c:EUR;e:1;sd:1;t:f`;

  try {
    console.log(`[scraper] Google Flights → ${hashUrl}`);

    // First load — may land on consent.google.com
    await page.goto(hashUrl, { timeout: 35000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Handle GDPR consent redirect (consent.google.com)
    if (page.url().includes('consent.google.com')) {
      console.log('[scraper] Google Flights: handling consent page...');
      try {
        await page.click('[jsname="b3VHJd"]');   // "Accept all" button
        await page.waitForNavigation({ timeout: 8000 }).catch(() => {});
      } catch {}
      // Re-navigate to the actual search URL — consent ate the hash
      await page.goto(hashUrl, { timeout: 35000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    // Programmatically trigger hash navigation if SPA didn't pick it up
    const currentUrl = page.url();
    if (!currentUrl.includes('flt=')) {
      await page.evaluate(u => { window.location.href = u; }, hashUrl);
      await page.waitForTimeout(8000);
    } else {
      await page.waitForTimeout(5000);
    }

    // Wait for actual flight rows — Google Flights uses many different class strategies
    const loaded = await page.waitForSelector(
      'li[data-gs], ul.Rk10dc li, [jsname="IWWMLc"], [aria-label*="nonstop"], [aria-label*="stop"]',
      { timeout: 20000 }
    ).then(() => true).catch(() => false);

    if (!loaded) {
      console.warn('[scraper] Google Flights: no result rows found');
      await ctx.close();
      return [];
    }

    await page.waitForTimeout(2000);

    const flights = await page.evaluate(({ origin, dest, date }) => {
      function parseDurMin(txt) {
        const m = (txt ?? '').match(/(\d+)\s*hr?s?(?:[^\d]+(\d+)\s*min?)?/i);
        return m ? parseInt(m[1]) * 60 + parseInt(m[2] || 0) : 0;
      }

      // Google renders results inside li[data-gs] or similar constructs
      let cards = Array.from(document.querySelectorAll('li[data-gs]'));
      if (!cards.length) cards = Array.from(document.querySelectorAll('ul.Rk10dc li'));
      if (!cards.length) cards = Array.from(document.querySelectorAll('[jsname="IWWMLc"]'));
      // Wider fallback: any list item that has a price AND times
      if (!cards.length) {
        cards = Array.from(document.querySelectorAll('[role="listitem"], li')).filter(el => {
          const t = el.textContent ?? '';
          return /€\s*\d+|\d+\s*€/.test(t) && /\d{1,2}:\d{2}/.test(t);
        });
      }
      cards = cards.slice(0, 15);

      const results = [];
      for (const card of cards) {
        try {
          const text = card.textContent ?? '';

          // Price
          const pm = text.match(/€\s*([\d,]+)|([\d,]+)\s*€/);
          if (!pm) continue;
          const price = parseFloat((pm[1] || pm[2]).replace(/,/g, ''));
          if (!price || price > 5000) continue;

          // Times hh:mm
          const times   = (text.match(/\b\d{1,2}:\d{2}\b/g) ?? []).slice(0, 2);
          const depTime = times[0] ?? '';
          const arrTime = times[1] ?? '';

          // Duration
          const durMatch = text.match(/(\d+)\s*hr?s?(?:[^\d]+(\d+)\s*min?)?/i);
          const durMin   = durMatch ? parseInt(durMatch[1]) * 60 + parseInt(durMatch[2] || 0) : 0;

          // Stops
          const nonstop = /nonstop|direct/i.test(text);
          const stopsM  = text.match(/(\d)\s*stop/i);
          const stops   = nonstop ? 0 : (stopsM ? parseInt(stopsM[1]) : 0);

          // Airline
          const imgEl   = card.querySelector('img[alt]');
          const airline = imgEl?.getAttribute('alt') ?? '';

          const bookUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${origin} to ${dest} on ${date} one way`)}`;

          results.push({
            airline:      { code: '', name: airline || 'Airline', logoUrl: '' },
            origin, dest,
            flightNumber: '',
            depTime, arrTime,
            depDate: date,
            duration:    durMin > 0 ? `${Math.floor(durMin/60)}h${durMin%60 > 0 ? ' '+(durMin%60)+'m' : ''}` : '',
            durationMin: durMin,
            stops,
            price,
            bookUrl,
            source: 'google',
          });
        } catch {}
      }
      return results;
    }, { origin, dest, date });

    console.log(`[scraper] ✓ Google Flights: ${flights.length} for ${origin}→${dest}`);
    await ctx.close();
    return flights.sort((a, b) => a.price - b.price).slice(0, 5);
  } catch (err) {
    console.warn(`[scraper] Google Flights error: ${err.message.slice(0, 80)}`);
    await ctx.close().catch(() => {});
    return [];
  }
}

// ─── Kayak fallback ───────────────────────────────────────────────
// Confirmed working selectors (2025-05):
//   card:     .nrc6
//   times:    [class*="vmXl"]  → "6:45 am – 8:45 am"
//   duration: [class*="xdW"]   → "2h 00m\nBCN\n-\nZRH"
//   stops:    [class*="JWEO"]  → "nonstop" | "1 stop ..."
//   price:    [class*="f8F"]   → "$131"
//   airline:  img[alt]
async function kayakFallback(origin, dest, date) {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
  });

  await ctx.addInitScript(`
    Object.defineProperty(navigator, 'webdriver',  { get: () => undefined });
    Object.defineProperty(navigator, 'plugins',    { get: () => [1,2,3,4,5] });
    Object.defineProperty(navigator, 'languages',  { get: () => ['en-GB','en'] });
    window.chrome = { runtime: {} };
  `);

  await ctx.route('**/*', route => {
    const t = route.request().resourceType();
    if (['image', 'media', 'font'].includes(t)) return route.abort();
    route.continue();
  });

  const page = await ctx.newPage();
  // Request EUR to avoid USD prices
  const baseUrl = `https://www.kayak.com/flights/${origin}-${dest}/${date}?sort=price_a&currency=EUR`;

  try {
    // ── Pass 1: cheapest overall (price-sorted) ──────────────────
    const loaded = await loadKayakPage(page, baseUrl);
    if (loaded === 'blocked') { await ctx.close(); return []; }
    if (!loaded)              { await ctx.close(); return []; }

    let flights = await scrapeKayakCards(page, origin, dest, date);
    console.log(`[scraper] ✓ Kayak: ${flights.length} raw for ${origin}→${dest}`);

    // ── Pass 2: nonstop-only ─────────────────────────────────────
    // Direct flights are often pricier than connections, so when sorted
    // by price they get buried below the cards we scrape (AGP→ZRH bug).
    // If pass 1 surfaced no direct, query Kayak's nonstop filter so we
    // never miss an existing direct flight.
    if (flights.length && !flights.some(f => f.stops === 0)) {
      console.log(`[scraper] Kayak: no direct in first pass — fetching nonstop-only`);
      const nsUrl = `${baseUrl}&fs=stops=0`;
      const ok2   = await loadKayakPage(page, nsUrl);
      if (ok2 === true) {
        const directCards = (await scrapeKayakCards(page, origin, dest, date))
          .filter(f => f.stops === 0);
        console.log(`[scraper] Kayak nonstop pass: ${directCards.length} direct flights`);
        flights = flights.concat(directCards);
      }
    }

    await ctx.close();
    return selectBestFlights(flights);
  } catch (err) {
    console.warn(`[scraper] Kayak error: ${err.message.slice(0, 80)}`);
    await ctx.close().catch(() => {});
    return [];
  }
}

// Navigate Kayak, dismiss consent, wait for cards.
// Returns true (loaded), false (no cards), or 'blocked' (bot wall).
async function loadKayakPage(page, url) {
  console.log(`[scraper] Kayak → ${url}`);
  await page.goto(url, { timeout: 40000, waitUntil: 'domcontentloaded' });

  for (const sel of [
    '#onetrust-accept-btn-handler',
    'button:has-text("Accept all")',
    'button:has-text("Accept")',
  ]) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); break; }
    } catch {}
  }

  await page.waitForTimeout(3000);

  if (/blocked|captcha|datadome/i.test(page.url())) {
    console.warn('[scraper] Kayak: bot-blocked');
    return 'blocked';
  }

  const loaded = await page.waitForSelector('.nrc6', { timeout: 25000 })
    .then(() => true).catch(() => false);
  if (!loaded) {
    console.warn('[scraper] Kayak: .nrc6 cards not found');
    return false;
  }
  await page.waitForTimeout(2000);
  return true;
}

// Extract flight cards from a loaded Kayak results page.
async function scrapeKayakCards(page, origin, dest, date) {
  return page.evaluate(({ origin, dest, date }) => {
    // Convert 12h time string to HH:MM (24h)
    function to24h(t) {
      const m = (t ?? '').match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
      if (!m) return (t ?? '').slice(0, 5);
      let h = parseInt(m[1]);
      const min = m[2], ap = m[3].toLowerCase();
      if (ap === 'pm' && h !== 12) h += 12;
      if (ap === 'am' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${min}`;
    }

    function parseDurMin(txt) {
      const m = (txt ?? '').match(/(\d+)\s*h(?:rs?)?(?:[^\d]+(\d+)\s*m(?:in?)?)?/i);
      return m ? parseInt(m[1]) * 60 + parseInt(m[2] || 0) : 0;
    }

    const cards = Array.from(document.querySelectorAll('.nrc6')).slice(0, 25);
    const results = [];

    for (const card of cards) {
      try {
        // Price — first [class*="f8F"] element
        const priceEl  = card.querySelector('[class*="f8F"]');
        const priceStr = priceEl?.textContent?.replace(/[^\d.]/g, '') ?? '';
        const price    = parseFloat(priceStr);
        if (!price || price > 5000) continue;

        // Times — [class*="vmXl"] gives "6:45 am – 8:45 am"
        const timesEl  = card.querySelector('[class*="vmXl"]');
        const timesTxt = timesEl?.textContent ?? '';
        const timeParts = timesTxt.split(/\s*[–-]\s*/);
        const depTime   = to24h(timeParts[0]?.trim() ?? '');
        const arrTime   = to24h(timeParts[1]?.trim() ?? '');

        // Duration — [class*="xdW"] gives "2h 00m\nBCN..." → take first line
        const durEl  = card.querySelector('[class*="xdW"]');
        const durTxt = (durEl?.textContent ?? '').split('\n')[0].trim();
        const durMin = parseDurMin(durTxt);

        // Stops — [class*="JWEO"] gives "nonstop" or "1 stop ..."
        const stopEl  = card.querySelector('[class*="JWEO"]');
        const stopTxt = stopEl?.textContent?.trim() ?? '';
        const nonstop = /nonstop/i.test(stopTxt);
        const stopsM  = stopTxt.match(/(\d+)\s*stop/i);
        const stops   = nonstop ? 0 : (stopsM ? parseInt(stopsM[1]) : 0);

        // Airline — first img alt
        const imgEl   = card.querySelector('img[alt]');
        const airline = imgEl?.getAttribute('alt') ?? '';

        results.push({
          airline:      { code: '', name: airline || 'Airline', logoUrl: '' },
          origin, dest,
          flightNumber: '',
          depTime, arrTime,
          depDate: date,
          duration:    durMin > 0 ? `${Math.floor(durMin/60)}h${durMin%60 > 0 ? ' '+(durMin%60)+'m' : ''}` : durTxt,
          durationMin: durMin,
          stops,
          price,
          bookUrl: `https://www.kayak.com/flights/${origin}-${dest}/${date}?sort=price_a`,
          source: 'kayak',
        });
      } catch {}
    }
    return results;
  }, { origin, dest, date });
}

// ─── Helpers ──────────────────────────────────────────────────────

// Return up to N cheapest flights for the per-traveler picker, while
// guaranteeing the cheapest nonstop is included even if it sits below
// the price cutoff (otherwise pricier directs get buried under cheap
// multi-stop fares). The frontend slices further (e.g. top 6) for the
// combinations grid; the rest power the "review all flights" picker.
const MAX_FLIGHTS_PER_TRAVELER = 30;
function selectBestFlights(flights) {
  const deduped = dedupFlights(flights).sort((a, b) => a.price - b.price);
  const top     = deduped.slice(0, MAX_FLIGHTS_PER_TRAVELER);

  const hasDirect = top.some(f => f.stops === 0);
  if (!hasDirect) {
    const cheapestDirect = deduped.find(f => f.stops === 0);
    if (cheapestDirect) {
      top.push(cheapestDirect);
      console.log(`[scraper] ✦ Added direct flight (${cheapestDirect.airline?.name ?? ''} €${cheapestDirect.price}) beyond the cheap-price cut`);
    }
  }
  return top;
}

function dedupFlights(flights) {
  const seen = new Set();
  return flights.filter(f => {
    const k = `${f.depTime}|${f.arrTime}|${Math.round(f.price)}|${f.stops}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function toSkyDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${y.slice(2)}${m}${d}`;
}

function addDays(iso, days) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDur(min) {
  return `${Math.floor(min / 60)}h${min % 60 > 0 ? ' ' + (min % 60) + 'm' : ''}`;
}

function pad2(n) { return String(n).padStart(2, '0'); }

module.exports = { scrapeFlights, selectBestFlights };
