'use strict';
/*
  flightSearch.js — provider router + cache.

  This is the single entry point the server calls. It implements the
  hybrid architecture recommended in the flight-API report:

    request → cache → primary provider (fli / Google Flights)
                    → fallback (self-hosted Playwright scraper)
                    → normalize → rank → cache → respond

  • Cache: short TTL per route key, to cut latency and avoid re-querying
    the same leg when several travelers share a route.
  • Primary: fli (free, key-less Google Flights reader via Python). No
    monthly minimum — chosen over SearchAPI's $40/mo floor.
  • Fallback: the existing Playwright chain (Skyscanner → Ryanair →
    Google Flights → Kayak), used only if fli returns nothing.
  • Ranking: selectBestFlights() keeps the 5 cheapest but always surfaces
    the cheapest nonstop flight even if it's beyond the top 5.
*/

const { scrapeFlights, selectBestFlights } = require('./scraper');
const { searchFli }                        = require('./fli');

// ─── Simple in-memory TTL cache (per route+date) ──────────────────
const CACHE_TTL_MS = 10 * 60 * 1000;   // 10 minutes (live-search freshness)
const _cache = new Map();              // key → { at, value }

function cacheGet(key) {
  const hit = _cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return hit.value;
}
function cacheSet(key, value) {
  _cache.set(key, { at: Date.now(), value });
  // Light eviction so the map can't grow unbounded.
  if (_cache.size > 500) {
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
}

// ─── Main entry point ─────────────────────────────────────────────
async function searchFlights(origin, dest, depDate) {
  // Refuse past dates upfront — fli (Pydantic) rejects them and the scraper
  // would burn ~50 s for nothing. The frontend already validates, this is
  // defence in depth against direct API hits.
  const todayIso = new Date().toISOString().slice(0, 10);
  if (depDate < todayIso) {
    console.warn(`[flightSearch] refusing past date ${depDate} (today is ${todayIso})`);
    return [];
  }

  const key = `${origin}-${dest}-${depDate}`;

  const cached = cacheGet(key);
  if (cached) {
    console.log(`[flightSearch] ⚡ cache hit ${key} (${cached.length})`);
    return cached;
  }

  let flights = [];

  // 1) Primary provider — fli (free, key-less Google Flights reader).
  try {
    const raw = await searchFli(origin, dest, depDate);
    if (raw.length) flights = selectBestFlights(raw);
  } catch (err) {
    console.warn(`[flightSearch] fli failed (${err.message}) — falling back to scraper`);
  }

  // 2) Fallback — self-hosted Playwright scraper chain.
  if (!flights.length) {
    flights = await scrapeFlights(origin, dest, depDate);
  }

  cacheSet(key, flights);
  return flights;
}

module.exports = { searchFlights };
