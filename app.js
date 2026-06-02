/* ============================================================
   FriendlyFlights — app.js
   Fetches Skyscanner prices (via server scraper) for each
   traveler, then builds and ranks every flight combination so
   the group can find their optimal shared trip.
   ============================================================ */

const API_BASE = '';

// ──────────────────────────────────────────────
// AIRPORTS DATABASE
// Bootstrap list shown immediately; replaced with the full OpenFlights
// catalogue (~7k IATA airports) once /api/airports resolves.
// ──────────────────────────────────────────────
let AIRPORTS = [
  { code:'MAD', city:'Madrid',        country:'Spain',         name:'Adolfo Suárez Madrid–Barajas' },
  { code:'BCN', city:'Barcelona',     country:'Spain',         name:'El Prat' },
  { code:'VLC', city:'Valencia',      country:'Spain',         name:'Valencia Airport' },
  { code:'SVQ', city:'Sevilla',       country:'Spain',         name:'San Pablo' },
  { code:'BIO', city:'Bilbao',        country:'Spain',         name:'Loiu Airport' },
  { code:'PMI', city:'Mallorca',      country:'Spain',         name:'Palma de Mallorca' },
  { code:'AGP', city:'Málaga',        country:'Spain',         name:'Costa del Sol' },
  { code:'LHR', city:'London',        country:'UK',            name:'Heathrow' },
  { code:'LGW', city:'London',        country:'UK',            name:'Gatwick' },
  { code:'STN', city:'London',        country:'UK',            name:'Stansted' },
  { code:'MAN', city:'Manchester',    country:'UK',            name:'Manchester Airport' },
  { code:'EDI', city:'Edinburgh',     country:'UK',            name:'Edinburgh Airport' },
  { code:'CDG', city:'Paris',         country:'France',        name:'Charles de Gaulle' },
  { code:'ORY', city:'Paris',         country:'France',        name:'Orly' },
  { code:'NCE', city:'Nice',          country:'France',        name:'Côte d\'Azur' },
  { code:'LYS', city:'Lyon',          country:'France',        name:'Saint-Exupéry' },
  { code:'MRS', city:'Marseille',     country:'France',        name:'Provence' },
  { code:'FRA', city:'Frankfurt',     country:'Germany',       name:'Frankfurt Airport' },
  { code:'MUC', city:'Munich',        country:'Germany',       name:'Franz Josef Strauss' },
  { code:'BER', city:'Berlin',        country:'Germany',       name:'Brandenburg' },
  { code:'HAM', city:'Hamburg',       country:'Germany',       name:'Hamburg Airport' },
  { code:'DUS', city:'Düsseldorf',    country:'Germany',       name:'Düsseldorf Airport' },
  { code:'AMS', city:'Amsterdam',     country:'Netherlands',   name:'Schiphol' },
  { code:'BRU', city:'Brussels',      country:'Belgium',       name:'Zaventem' },
  { code:'ZRH', city:'Zurich',        country:'Switzerland',   name:'Zurich Airport' },
  { code:'GVA', city:'Geneva',        country:'Switzerland',   name:'Genève Aéroport' },
  { code:'FCO', city:'Rome',          country:'Italy',         name:'Fiumicino' },
  { code:'MXP', city:'Milan',         country:'Italy',         name:'Malpensa' },
  { code:'LIN', city:'Milan',         country:'Italy',         name:'Linate' },
  { code:'VCE', city:'Venice',        country:'Italy',         name:'Marco Polo' },
  { code:'NAP', city:'Naples',        country:'Italy',         name:'Capodichino' },
  { code:'ATH', city:'Athens',        country:'Greece',        name:'Eleftherios Venizelos' },
  { code:'SKG', city:'Thessaloniki',  country:'Greece',        name:'Macedonia' },
  { code:'IST', city:'Istanbul',      country:'Turkey',        name:'Istanbul Airport' },
  { code:'SAW', city:'Istanbul',      country:'Turkey',        name:'Sabiha Gökçen' },
  { code:'JFK', city:'New York',      country:'USA',           name:'John F. Kennedy' },
  { code:'EWR', city:'New York',      country:'USA',           name:'Newark Liberty' },
  { code:'LAX', city:'Los Angeles',   country:'USA',           name:'Los Angeles Intl.' },
  { code:'ORD', city:'Chicago',       country:'USA',           name:'O\'Hare' },
  { code:'MIA', city:'Miami',         country:'USA',           name:'Miami Intl.' },
  { code:'SFO', city:'San Francisco', country:'USA',           name:'San Francisco Intl.' },
  { code:'BOS', city:'Boston',        country:'USA',           name:'Logan Intl.' },
  { code:'ATL', city:'Atlanta',       country:'USA',           name:'Hartsfield-Jackson' },
  { code:'YYZ', city:'Toronto',       country:'Canada',        name:'Pearson Intl.' },
  { code:'MEX', city:'Mexico City',   country:'Mexico',        name:'Benito Juárez' },
  { code:'GRU', city:'São Paulo',     country:'Brazil',        name:'Guarulhos Intl.' },
  { code:'EZE', city:'Buenos Aires',  country:'Argentina',     name:'Ministro Pistarini' },
  { code:'BOG', city:'Bogotá',        country:'Colombia',      name:'El Dorado' },
  { code:'DXB', city:'Dubai',         country:'UAE',           name:'Dubai Intl.' },
  { code:'DOH', city:'Doha',          country:'Qatar',         name:'Hamad Intl.' },
  { code:'DEL', city:'Delhi',         country:'India',         name:'Indira Gandhi Intl.' },
  { code:'BOM', city:'Mumbai',        country:'India',         name:'Chhatrapati Shivaji' },
  { code:'HND', city:'Tokyo',         country:'Japan',         name:'Haneda' },
  { code:'NRT', city:'Tokyo',         country:'Japan',         name:'Narita' },
  { code:'ICN', city:'Seoul',         country:'South Korea',   name:'Incheon Intl.' },
  { code:'SIN', city:'Singapore',     country:'Singapore',     name:'Changi' },
  { code:'BKK', city:'Bangkok',       country:'Thailand',      name:'Suvarnabhumi' },
  { code:'SYD', city:'Sydney',        country:'Australia',     name:'Kingsford Smith' },
  { code:'MEL', city:'Melbourne',     country:'Australia',     name:'Tullamarine' },
  { code:'JNB', city:'Johannesburg',  country:'South Africa',  name:'O.R. Tambo' },
  { code:'CAI', city:'Cairo',         country:'Egypt',         name:'Cairo Intl.' },
  { code:'CMN', city:'Casablanca',    country:'Morocco',       name:'Mohammed V' },
  { code:'RAK', city:'Marrakech',     country:'Morocco',       name:'Menara' },
  { code:'WAW', city:'Warsaw',        country:'Poland',        name:'Chopin' },
  { code:'PRG', city:'Prague',        country:'Czech Rep.',    name:'Václav Havel' },
  { code:'VIE', city:'Vienna',        country:'Austria',       name:'Vienna Intl.' },
  { code:'BUD', city:'Budapest',      country:'Hungary',       name:'Ferenc Liszt' },
  { code:'HEL', city:'Helsinki',      country:'Finland',       name:'Helsinki-Vantaa' },
  { code:'ARN', city:'Stockholm',     country:'Sweden',        name:'Arlanda' },
  { code:'CPH', city:'Copenhagen',    country:'Denmark',       name:'Kastrup' },
  { code:'OSL', city:'Oslo',          country:'Norway',        name:'Gardermoen' },
  { code:'DUB', city:'Dublin',        country:'Ireland',       name:'Dublin Airport' },
  { code:'LIS', city:'Lisbon',        country:'Portugal',      name:'Humberto Delgado' },
  { code:'OPO', city:'Porto',         country:'Portugal',      name:'Francisco Sá Carneiro' },
];

// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────
let travelers    = [];
let lastSearch   = null;
let scoredCombos = [];   // current scored combinations (mutable for sort)
let currentSort  = 'value';
let directOnly   = false; // true = show only nonstop flights
let activeResultsView = 'flights';   // 'flights' | 'combos' | 'destinations'

// ──────────────────────────────────────────────
// ROUTE CACHE
// Keyed by IATA code → Set<IATA> of known destinations.
// Populated in the background when a traveler picks an origin.
// ──────────────────────────────────────────────
const routeCache = {};   // { IATA: Set<IATA> | null }

// Fetch the full IATA airport catalogue from the server (OpenFlights data).
// Falls back silently to the bootstrap list if the call fails.
async function loadAllAirports() {
  try {
    const res  = await fetch(`${API_BASE}/api/airports`);
    const data = await res.json();
    if (Array.isArray(data.airports) && data.airports.length > AIRPORTS.length) {
      AIRPORTS = data.airports;
      console.log(`[airports] catalogue loaded: ${AIRPORTS.length} airports`);
      // Planner uses AIRPORTS for the origin chips and destination filter.
      renderPlanner();
    }
  } catch (err) {
    console.warn('[airports] fetch failed:', err.message);
  }
}

async function prefetchRoutes(iata) {
  if (routeCache[iata] !== undefined) return;   // already fetched or in-flight
  routeCache[iata] = null;                       // sentinel: loading
  try {
    const res  = await fetch(`${API_BASE}/api/routes/${iata}`);
    const data = await res.json();
    routeCache[iata] = new Set(data.destinations ?? []);
  } catch {
    routeCache[iata] = new Set();
  }
  renderPlanner();   // update planner once routes arrive
}

// Returns the airports that are reachable from ALL travelers who have
// an origin airport selected AND whose routes are already in cache.
// Falls back to the full AIRPORTS list when the intersection is empty.
function getDestinationCandidates() {
  const selectedCodes = travelers.map(t => t.airportCode).filter(Boolean);
  if (!selectedCodes.length) return AIRPORTS;

  const loadedSets = selectedCodes
    .map(c => routeCache[c])
    .filter(s => s && s.size > 0);   // only airports whose routes are cached

  if (!loadedSets.length) return AIRPORTS;   // routes not ready yet → show all

  // Intersection: destinations reachable from every selected origin
  const intersection = loadedSets.reduce(
    (acc, set) => new Set([...acc].filter(x => set.has(x)))
  );

  // Too restrictive (< 3 results)? → show all
  const candidates = AIRPORTS.filter(
    a => intersection.has(a.code) && !selectedCodes.includes(a.code)
  );
  return candidates.length >= 3 ? candidates : AIRPORTS;
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];
  const todayIso    = new Date().toISOString().split('T')[0];
  const depInput    = document.getElementById('departureDate');
  const retInput    = document.getElementById('returnDate');
  depInput.value = tomorrowIso;
  depInput.min   = todayIso;
  retInput.min   = todayIso;
  // Keep return >= departure as the user changes the departure.
  depInput.addEventListener('change', () => {
    retInput.min = depInput.value || todayIso;
    if (retInput.value && retInput.value < depInput.value) retInput.value = '';
  });

  populateFlexSelects();
  loadAllAirports();   // async — expands AIRPORTS to the full catalogue

  addTraveler('Alex');
  addTraveler('Sam');

  document.getElementById('addTravelerBtn').addEventListener('click', () => addTraveler());
  document.getElementById('searchBtn').addEventListener('click', runSearch);
  document.getElementById('editSearchBtn').addEventListener('click', editSearch);

  // Logo → back to home/start
  ['navLogo', 'footerLogo'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', goHome);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHome(); }
    });
  });
  document.getElementById('whatsappBtn').addEventListener('click', shareWhatsApp);
  document.getElementById('copyBtn').addEventListener('click', copyLinks);
  document.getElementById('imgBtn')?.addEventListener('click', shareAsImage);

  // Language switcher
  document.getElementById('langSwitcher')?.addEventListener('click', () => {
    setLang(currentLang === 'en' ? 'es' : 'en');
    rerenderAll();
  });

  // Planner CTA banner — scroll to planner section on click
  document.getElementById('plannerCtaBanner')?.addEventListener('click', () => {
    document.getElementById('plannerSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Destination info modal — close handlers
  document.getElementById('destModalClose').addEventListener('click', closeDestinationModal);
  document.getElementById('destModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDestinationModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDestinationModal();
  });

  setupAirportAutocomplete(
    document.getElementById('destinationInput'),
    document.getElementById('destDropdown'),
    null
  );

  renderPlanner();
  applyI18n();
});

// ──────────────────────────────────────────────
// TRAVELER MANAGEMENT
// ──────────────────────────────────────────────
const COLORS        = ['color-0','color-1','color-2','color-3','color-4','color-5'];
const DEFAULT_NAMES = ['Alex','Sam','Jordan','Morgan','Riley','Casey'];

function addTraveler(name) {
  const id  = Date.now() + Math.random();
  const idx = travelers.length;
  travelers.push({
    id,
    name:        name || DEFAULT_NAMES[idx % DEFAULT_NAMES.length],
    airportCode: '',
    airportCity: '',
    colorClass:  COLORS[idx % COLORS.length],
    pax:         1,
  });
  renderTravelers();
}

// Always works. With 2+ travelers, the targeted row slides out and is
// detached on its own — the other rows in the DOM are NOT rebuilt, so
// they stay put and don't flicker. With only one traveler left, the X
// instead clears the row's values in place (name / airport / pax → 1)
// with a brief flash.
function removeTraveler(id) {
  const row = document.querySelector(`.btn-remove[data-id="${id}"]`)?.closest('.traveler-row');

  if (travelers.length > 1) {
    const cleanup = () => {
      if (row && row.parentNode) row.remove();
      travelers = travelers.filter(t => t.id !== id);
      // Note: each remaining traveler's colorClass is intentionally kept
      // as-is — reassigning would force a full re-render to update the
      // avatar classes, which is precisely what caused the flash.
    };
    if (row) {
      row.classList.add('row-removing');
      setTimeout(cleanup, 280);
    } else {
      cleanup();
    }
    return;
  }

  // Only one traveler left — clear values in place. No re-render.
  const t = travelers[0];
  if (!t) return;
  t.name        = '';
  t.airportCode = '';
  t.airportCity = '';
  t.pax         = 1;
  if (row) {
    const nameInput    = row.querySelector('.traveler-name-input');
    const airportInput = row.querySelector('.traveler-airport-input');
    const paxCount     = row.querySelector('.pax-count');
    const avatar       = row.querySelector('.traveler-avatar');
    if (nameInput)    nameInput.value = '';
    if (airportInput) {
      airportInput.value = '';
      delete airportInput.dataset.selectedCode;
      delete airportInput.dataset.selectedCity;
    }
    if (paxCount) paxCount.textContent = '1';
    if (avatar)   avatar.textContent = '?';
    row.classList.add('row-clearing');
    setTimeout(() => row.classList.remove('row-clearing'), 600);
  }
}

function renderTravelers() {
  const list = document.getElementById('travelersList');
  list.innerHTML = '';
  travelers.forEach(tvl => {
    const row   = document.createElement('div');
    row.className = 'traveler-row';
    const dropId  = `drop_${tvl.id}`;
    row.innerHTML = `
      <div class="traveler-name-group">
        <div class="traveler-avatar ${tvl.colorClass}">${getInitials(tvl.name)}</div>
        <input class="traveler-name-input" type="text" value="${escHtml(tvl.name)}"
          placeholder="${t('traveler_name_ph')}" data-id="${tvl.id}" />
      </div>
      <div class="airport-input-wrap">
        <span class="field-icon">✈</span>
        <input type="text" placeholder="${t('airport_ph')}" autocomplete="off"
          class="traveler-airport-input" data-id="${tvl.id}"
          value="${tvl.airportCity ? tvl.airportCity + ' (' + tvl.airportCode + ')' : ''}" />
        <div class="airport-dropdown" id="${dropId}"></div>
      </div>
      <div class="pax-stepper" title="Number of passengers">
        <button class="pax-btn pax-minus" data-id="${tvl.id}">−</button>
        <span class="pax-count" data-id="${tvl.id}">${tvl.pax}</span>
        <button class="pax-btn pax-plus"  data-id="${tvl.id}">+</button>
        <span class="pax-label">${t('pax_label')}</span>
      </div>
      <button class="btn-remove" data-id="${tvl.id}">✕</button>`;
    list.appendChild(row);

    row.querySelector('.traveler-name-input').addEventListener('input', e => {
      const tr = travelers.find(x => x.id == e.target.dataset.id);
      if (tr) {
        tr.name = e.target.value;
        row.querySelector('.traveler-avatar').textContent = getInitials(e.target.value);
      }
    });
    row.querySelector('.pax-minus').addEventListener('click', e => {
      const tr = travelers.find(x => x.id == e.currentTarget.dataset.id);
      if (tr && tr.pax > 1) {
        tr.pax--;
        row.querySelector(`.pax-count[data-id="${tr.id}"]`).textContent = tr.pax;
      }
    });
    row.querySelector('.pax-plus').addEventListener('click', e => {
      const tr = travelers.find(x => x.id == e.currentTarget.dataset.id);
      if (tr && tr.pax < 99) {
        tr.pax++;
        row.querySelector(`.pax-count[data-id="${tr.id}"]`).textContent = tr.pax;
      }
    });
    row.querySelector('.btn-remove').addEventListener('click', e =>
      removeTraveler(Number(e.currentTarget.dataset.id))
    );
    setupAirportAutocomplete(
      row.querySelector('.traveler-airport-input'),
      document.getElementById(dropId),
      tvl.id
    );
  });
}

// ──────────────────────────────────────────────
// AIRPORT AUTOCOMPLETE
// travelerId === null  → destination field (uses route-filtered candidates)
// travelerId !== null  → origin field       (always shows full list)
// ──────────────────────────────────────────────
function setupAirportAutocomplete(input, dropdown, travelerId) {
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { closeDD(); return; }

    // For the destination field, filter by routes reachable from all origins
    const pool = travelerId === null ? getDestinationCandidates() : AIRPORTS;

    // Score by relevance so the cleanest matches (exact code, city
     // starts-with) surface above incidental name/country substring hits.
    const matches = pool
      .map(a => {
        const code = (a.code || '').toLowerCase();
        const city = (a.city || '').toLowerCase();
        const name = (a.name || '').toLowerCase();
        const ctry = (a.country || '').toLowerCase();
        let score = -1;
        if (code === q)              score = 0;
        else if (city === q)         score = 1;
        else if (code.startsWith(q)) score = 2;
        else if (city.startsWith(q)) score = 3;
        else if (city.includes(q))   score = 4;
        else if (name.includes(q))   score = 5;
        else if (ctry.includes(q))   score = 6;
        return score < 0 ? null : { a, score };
      })
      .filter(Boolean)
      .sort((x, y) => x.score - y.score)
      .slice(0, 8)
      .map(x => x.a);
    if (!matches.length) { closeDD(); return; }
    dropdown.innerHTML = matches.map(a => `
      <div class="airport-option" data-code="${a.code}" data-city="${escHtml(a.city)}">
        <span class="airport-code">${a.code}</span>
        <div class="airport-name-text">
          <span class="airport-city">${escHtml(a.city)}</span>, ${escHtml(a.country)}<br>
          <small>${escHtml(a.name)}</small>
        </div>
      </div>`).join('');
    dropdown.classList.add('open');
    dropdown.querySelectorAll('.airport-option').forEach(opt => {
      opt.addEventListener('mousedown', e => {
        e.preventDefault();
        const code = opt.dataset.code, city = opt.dataset.city;
        input.value = `${city} (${code})`;
        if (travelerId !== null) {
          const tr = travelers.find(x => x.id == travelerId);
          if (tr) {
            tr.airportCode = code;
            tr.airportCity = city;
            prefetchRoutes(code);   // background fetch — no await
            renderPlanner();        // immediate update (routes still loading)
          }
        } else {
          input.dataset.selectedCode = code;
          input.dataset.selectedCity = city;
        }
        closeDD();
      });
    });
  });
  input.addEventListener('blur', () => setTimeout(closeDD, 150));
  function closeDD() { dropdown.classList.remove('open'); dropdown.innerHTML = ''; }
}

// ──────────────────────────────────────────────
// SEARCH
// ──────────────────────────────────────────────
async function runSearch() {
  const destInput = document.getElementById('destinationInput');
  const destCode  = destInput.dataset.selectedCode;
  const destCity  = destInput.dataset.selectedCity || destInput.value.trim();
  const depDate   = document.getElementById('departureDate').value;
  const retDate   = document.getElementById('returnDate').value || null;
  const flexDep   = parseInt(document.getElementById('flexDep')?.value, 10) || 0;
  const flexRet   = parseInt(document.getElementById('flexRet')?.value, 10) || 0;

  if (!destCity)  { shake(destInput); return; }
  if (!depDate)   { shake(document.getElementById('departureDate')); return; }
  const missing = travelers.find(t => !t.airportCode);
  if (missing) {
    shake(document.querySelector(`[data-id="${missing.id}"].traveler-airport-input`));
    return;
  }
  // ── Date sanity — past dates fail at the server (Pydantic in fli) and
  //    waste calls; catch them here with a clear message instead.
  const todayIso = new Date().toISOString().slice(0, 10);
  if (depDate < todayIso) {
    shake(document.getElementById('departureDate'));
    showToast(t('error_past_date'), true);
    return;
  }
  if (retDate && retDate < depDate) {
    shake(document.getElementById('returnDate'));
    showToast(t('error_return_order'), true);
    return;
  }

  lastSearch        = { destCode: destCode || destCity, destCity, depDate, retDate, flexDep, flexRet };
  directOnly        = false;   // always start fresh — user can re-toggle from results
  activeTravelerId  = null;    // reset tab → first traveler shows in the picker
  activeResultsView = 'flights'; // default landing view after a search

  // Init flex price maps — undefined = loading, null = no result, object = flight
  travelers.forEach(t => { t.flexOut = {}; t.flexRet = {}; });

  showLoading(travelers, !!retDate);

  // ── Outbound per traveler ──────────────────
  const outResults = await Promise.all(
    travelers.map((tvl, i) => fetchRoute(tvl.airportCode, lastSearch.destCode, depDate, `out_${i}`))
  );

  // ── Return per traveler (parallel) ─────────
  const retResults = retDate
    ? await Promise.all(
        travelers.map((tvl, i) => fetchRoute(lastSearch.destCode, tvl.airportCode, retDate, `ret_${i}`))
      )
    : travelers.map(() => []);

  hideLoading();

  travelers.forEach((tvl, i) => {
    tvl.flights       = outResults[i];
    tvl.returnFlights = retResults[i];
    // Seed flex maps with the already-fetched result
    tvl.flexOut[depDate] = tvl.flights[0]       ?? null;
    if (retDate) tvl.flexRet[retDate] = tvl.returnFlights[0] ?? null;
  });

  // Surface a clear message when the search came back empty across the board
  // (anti-bot block, dead route, broken provider…). The user otherwise just
  // sees the "no results" panel deep inside the results view.
  const totalOut = outResults.reduce((s, r) => s + r.length, 0);
  if (totalOut === 0) showToast(t('error_no_flights'), true);

  document.querySelector('.hero').style.display = 'none';
  document.querySelector('.search-panel-section').style.display = 'none';
  document.getElementById('howSection').style.display = 'none';
  document.getElementById('resultsSection').style.display = 'block';
  renderResultsSection();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // ── Background: fetch ±2 days ───────────────
  if (flexDep || flexRet) fetchFlexPrices();
}

async function fetchRoute(origin, dest, date, rowId) {
  markLoadingActive(rowId);
  try {
    const params = new URLSearchParams({ origin, dest, date });
    const res    = await fetch(`${API_BASE}/api/flights?${params}`);
    const data   = await res.json();
    markLoadingDone(rowId, data.flights?.length ?? 0, data.flights?.[0]?.source);
    return data.flights ?? [];
  } catch {
    markLoadingDone(rowId, 0, null);
    return [];
  }
}

// ── Fetch ±2-day prices in background ─────────
async function fetchFlexPrices() {
  const { destCode, depDate, retDate, flexDep, flexRet } = lastSearch;

  const promises = [];

  travelers.forEach(tvl => {
    if (flexDep) {
      flexOffsets(flexDep).forEach(off => {
        const d = addDaysISO(depDate, off);
        promises.push(
          fetchRoute(tvl.airportCode, destCode, d, null)
            .then(flights => {
              tvl.flexOut[d] = flights[0] ?? null;
              refreshFlexGrid(tvl.id, false);
            })
        );
      });
    }
    if (flexRet && retDate) {
      flexOffsets(flexRet).forEach(off => {
        const d = addDaysISO(retDate, off);
        promises.push(
          fetchRoute(destCode, tvl.airportCode, d, null)
            .then(flights => {
              tvl.flexRet[d] = flights[0] ?? null;
              refreshFlexGrid(tvl.id, true);
            })
        );
      });
    }
  });

  await Promise.all(promises);
}

function editSearch() {
  document.querySelector('.hero').style.display = '';
  document.querySelector('.search-panel-section').style.display = '';
  document.getElementById('howSection').style.display = 'block';
  document.getElementById('resultsSection').style.display = 'none';
  // We may have hidden the planner inside one of the result tabs — restore
  // it now that we're back on the home view.
  const planner = document.getElementById('plannerSection');
  if (planner) planner.style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Logo click — return to the start view (search panel) from anywhere.
function goHome() {
  closeDestinationModal();
  editSearch();
}

// Offsets to fetch around a base date for ±N flexibility (excludes 0,
// which is the exact date already fetched). e.g. flexOffsets(3) → [-3,-2,-1,1,2,3]
function flexOffsets(n) {
  const out = [];
  for (let i = -n; i <= n; i++) if (i !== 0) out.push(i);
  return out;
}
// Inclusive range for the flex grid display: [-n … 0 … n].
function flexRange(n) {
  const out = [];
  for (let i = -n; i <= n; i++) out.push(i);
  return out;
}

// Build the ±days flexibility dropdowns (0 = exact, up to ±5 days).
const FLEX_MAX = 5;
function populateFlexSelects() {
  ['flexDep', 'flexRet'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value || '0';
    sel.innerHTML = '';
    for (let n = 0; n <= FLEX_MAX; n++) {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = n === 0 ? t('flex_exact') : t('flex_days', n);
      sel.appendChild(opt);
    }
    sel.value = current;
  });
}

// ──────────────────────────────────────────────
// COMBINATION LOGIC
// ──────────────────────────────────────────────
function buildCombinations(travelers) {
  const active = travelers.filter(t => getFilteredFlights(t.flights).length);
  if (!active.length) return [];

  let combos = [[]];
  for (const t of active) {
    const next = [];
    for (const combo of combos) {
      for (const flight of getFilteredFlights(t.flights)) {
        next.push([...combo, { traveler: t, flight }]);
      }
    }
    combos = next;
  }
  return combos;
}

function scoreCombinations(combos) {
  if (!combos.length) return [];

  // Total price accounts for passenger count per group
  const totals   = combos.map(c => c.reduce((s, x) => s + x.flight.price * x.traveler.pax, 0));
  const totalPax = combos[0].reduce((s, x) => s + x.traveler.pax, 0);
  const maxDurs  = combos.map(c => Math.max(...c.map(x => x.flight.durationMin || 0)));
  const hasKnownDur = maxDurs.some(d => d > 0);

  const minT = Math.min(...totals), maxT = Math.max(...totals);
  const minD = Math.min(...maxDurs.filter(d => d > 0)), maxD = Math.max(...maxDurs);
  const norm = (v, lo, hi) => (hi === lo || !hi) ? 0 : (v - lo) / (hi - lo);

  return combos.map((combo, i) => {
    const total   = totals[i];
    const maxDur  = maxDurs[i];
    const pax     = combo.reduce((s, c) => s + c.traveler.pax, 0);
    const valueScore = hasKnownDur
      ? 0.60 * norm(total, minT, maxT) + 0.40 * norm(maxDur, minD, maxD)
      : norm(total, minT, maxT);
    return {
      combo,
      totalPrice:    total,
      totalPax:      pax,
      pricePerPax:   total / pax,
      maxPrice:      Math.max(...combo.map(c => c.flight.price)),
      maxDurMin:     maxDur,
      avgDurMin:     combo.reduce((s, c) => s + (c.flight.durationMin || 0), 0) / combo.length,
      valueScore,
      qualityPct:    Math.round((1 - valueScore) * 100),
    };
  });
}

function sortCombos(combos, sortKey) {
  const copy = [...combos];
  if      (sortKey === 'total') copy.sort((a, b) => a.totalPrice - b.totalPrice);
  else if (sortKey === 'fair')  copy.sort((a, b) => a.maxPrice   - b.maxPrice);
  else if (sortKey === 'quick') copy.sort((a, b) => a.maxDurMin  - b.maxDurMin);
  else                          copy.sort((a, b) => a.valueScore - b.valueScore);
  return copy;
}

// Returns flights array filtered to nonstop only when directOnly is active.
function getFilteredFlights(flights) {
  if (!directOnly || !flights) return flights || [];
  return flights.filter(f => f.stops === 0);
}

// ──────────────────────────────────────────────
// RENDER — RESULTS SECTION
// ──────────────────────────────────────────────
function renderResultsSection() {
  const { destCity, depDate, retDate } = lastSearch;
  const depLabel = formatDateLong(depDate);
  const retLabel = retDate ? ` → ${formatDateLong(retDate)}` : '';

  document.getElementById('resultsTitle').textContent    = `✈ ${destCity}`;
  document.getElementById('resultsSubtitle').textContent =
    `${t('travelers_label', travelers.length)} · ${depLabel}${retLabel} ${retDate ? t('round_trip') : t('one_way')}`;

  renderItinerarySection();
  renderAllFlightsSection();

  const combos   = buildCombinations(travelers);
  scoredCombos   = scoreCombinations(combos);
  currentSort    = 'value';

  renderSortBar();
  renderCombinations();
  renderDeepLinksSection();

  // Show the view tabs and default to the individual-flights view.
  renderViewTabs();
  setResultsView(activeResultsView || 'flights');
}

// ── View tabs ─────────────────────────────────
// Three modes (one visible at a time):
//   flights       — per-traveler picker + deep links
//   combos        — sort bar + best group combinations
//   destinations  — the planner section (sibling of resultsSection)
function renderViewTabs() {
  const bar = document.getElementById('viewTabs');
  if (!bar) return;
  const tabs = [
    { id: 'flights',      label: t('view_tab_flights') },
    { id: 'combos',       label: t('view_tab_combos') },
    { id: 'destinations', label: t('view_tab_destinations') },
  ];
  bar.innerHTML = tabs.map(tab => `
    <button class="view-tab${tab.id === activeResultsView ? ' active' : ''}"
            data-view="${tab.id}" role="tab"
            aria-selected="${tab.id === activeResultsView ? 'true' : 'false'}">
      ${tab.label}
    </button>`).join('');
  bar.querySelectorAll('.view-tab').forEach(btn => {
    btn.addEventListener('click', () => setResultsView(btn.dataset.view));
  });
}

function setResultsView(view) {
  activeResultsView = view;
  const flightsView      = document.getElementById('resultsViewFlights');
  const combosView       = document.getElementById('resultsViewCombos');
  const destinationsView = document.getElementById('plannerSection');
  if (flightsView)      flightsView.style.display      = view === 'flights'      ? '' : 'none';
  if (combosView)       combosView.style.display       = view === 'combos'       ? '' : 'none';
  // The planner is a sibling section of resultsSection, but acts as the
  // "destinations" tab's content when results are visible.
  if (destinationsView) destinationsView.style.display = view === 'destinations' ? '' : 'none';

  document.querySelectorAll('#viewTabs .view-tab').forEach(btn => {
    const isActive = btn.dataset.view === view;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

// ── Itinerary section ─────────────────────────
function renderItinerarySection() {
  const section = document.getElementById('itinerarySection');
  if (!section) return;
  const { destCode, destCity, depDate, retDate, flexDep, flexRet } = lastSearch;
  const depLabel = formatDateMedium(depDate);
  const retLabel = retDate ? ` → ${formatDateMedium(retDate)}` : '';

  section.innerHTML = `
    <div class="itin-banner">
      <div class="itin-banner-left">
        <span class="itin-banner-icon">✈</span>
        <div>
          <div class="itin-banner-title">${t('itin_title')}</div>
          <div class="itin-banner-sub">${depLabel}${retLabel} · ${t('travelers_label', travelers.length)}</div>
        </div>
      </div>
      <div class="itin-banner-dest">${escHtml(destCity)}</div>
    </div>
    <div class="itin-cards">
      ${travelers.map(tvl => renderItinCard(tvl, destCode, depDate, retDate, flexDep, flexRet)).join('')}
    </div>`;

  // Wire flex-day click buttons
  section.querySelectorAll('.flex-day[data-action="select"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tvlId   = Number(btn.dataset.tvl);
      const isRet   = btn.dataset.isret === 'true';
      const date    = btn.dataset.date;
      const tvl     = travelers.find(x => x.id === tvlId);
      if (!tvl) return;

      if (isRet) {
        lastSearch.retDate = date;
        tvl.returnFlights  = tvl.flexRet[date] ? [tvl.flexRet[date]] : [];
      } else {
        lastSearch.depDate = date;
        tvl.flights        = tvl.flexOut[date] ? [tvl.flexOut[date]] : [];
      }
      // Rebuild itinerary and combos with new selection
      renderItinerarySection();
      const combos = buildCombinations(travelers);
      scoredCombos = scoreCombinations(combos);
      renderCombinations();
    });
  });
}

// Which traveler's flights the picker currently shows.
let activeTravelerId = null;

// ── All-flights picker — tabs at the top (one per traveler) keep the page
//    short regardless of group size. The selected tab shows that
//    traveler's outbound flights and, for a round trip, the return flights
//    in a second column beside them on desktop (stacked on mobile).
function renderAllFlightsSection() {
  const section = document.getElementById('allFlightsSection');
  if (!section) return;
  const { destCode, retDate } = lastSearch;

  // Only consider travelers that actually got results back.
  const withFlights = travelers.filter(t => (t.flights || []).length);
  if (!withFlights.length) { section.innerHTML = ''; return; }

  // Default / repair the active tab if it points at a removed traveler.
  if (!activeTravelerId || !withFlights.find(t => t.id === activeTravelerId)) {
    activeTravelerId = withFlights[0].id;
  }
  const active    = withFlights.find(t => t.id === activeTravelerId);
  const hasReturn = !!retDate;

  const renderColumn = (label, icon, fromCode, toCode, list, isReturn) => {
    const cards = (getFilteredFlights(list) || [])
      .map(f => renderFlightPickCard(active, f, f === list[0], isReturn))
      .join('');
    return `
      <div class="aft-direction-block">
        <div class="aft-direction-header">
          <span class="aft-dir-icon">${icon}</span><span>${label}</span>
          <span class="aft-dir-route">${escHtml(fromCode)} → ${escHtml(toCode)}</span>
        </div>
        <div class="aft-flights">
          ${cards || `<div class="aft-empty">${t('itin_noresult')}</div>`}
        </div>
      </div>`;
  };

  section.innerHTML = `
    <div class="aft-header-block">
      <h3 class="aft-title">${t('all_flights_title')}</h3>
      <p class="aft-hint">${t('all_flights_hint')}</p>
    </div>

    <div class="aft-tabs" role="tablist">
      ${withFlights.map(tvl => {
        const isActive = tvl.id === activeTravelerId;
        const out      = tvl.flights?.[0];
        const ret      = hasReturn ? tvl.returnFlights?.[0] : null;
        const total    = (out ? out.price : 0) + (ret ? ret.price : 0);
        return `
          <button class="aft-tab${isActive ? ' active' : ''}"
                  data-tvl="${tvl.id}" role="tab"
                  aria-selected="${isActive ? 'true' : 'false'}">
            <span class="aft-tab-avatar ${tvl.colorClass}">${getInitials(tvl.name)}</span>
            <span class="aft-tab-info">
              <span class="aft-tab-name">${escHtml(tvl.name)}</span>
              <span class="aft-tab-route">${escHtml(tvl.airportCode)} → ${escHtml(destCode)}</span>
            </span>
            ${total > 0 ? `<span class="aft-tab-price">€${Math.round(total * tvl.pax)}</span>` : ''}
          </button>`;
      }).join('')}
    </div>

    <div class="aft-direction-grid${hasReturn ? ' has-return' : ''}">
      ${renderColumn(t('itin_outbound'), '↗', active.airportCode, destCode,
                     active.flights || [], false)}
      ${hasReturn
        ? renderColumn(t('itin_return'), '↩', destCode, active.airportCode,
                       active.returnFlights || [], true)
        : ''}
    </div>`;

  // Tab clicks — switch which traveler's flights are visible.
  section.querySelectorAll('.aft-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTravelerId = Number(tab.dataset.tvl);
      renderAllFlightsSection();
    });
  });

  // Card clicks — promote that flight to the front of its array.
  section.querySelectorAll('.flight-pick-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;          // let Reservar link work
      const tvlId    = Number(card.dataset.tvl);
      const isReturn = card.dataset.isret === 'true';
      const tvl      = travelers.find(x => x.id === tvlId);
      const list     = isReturn ? tvl?.returnFlights : tvl?.flights;
      const flight   = list?.find(f =>
        f.depTime === card.dataset.dep &&
        Math.round(f.price) === Number(card.dataset.price)
      );
      if (flight) selectFlightForTraveler(tvlId, flight, isReturn);
    });
  });
}

function renderFlightPickCard(tvl, flight, isChosen, isReturn) {
  const airline = flight.airline?.name || '';
  const stops   = flight.stops === 0
    ? `<span class="direct-dot">●</span> ${t('combo_direct')}`
    : `<span class="stop-dot">●</span> ${t('combo_stop', flight.stops)}`;
  const paxNote = tvl.pax > 1 ? `<span class="fp-price-sub">€${Math.round(flight.price)}/pax × ${tvl.pax}</span>` : '';

  return `
    <div class="flight-pick-card${isChosen ? ' selected' : ''}"
         data-tvl="${tvl.id}"
         data-dep="${flight.depTime || ''}"
         data-price="${Math.round(flight.price)}"
         data-isret="${isReturn ? 'true' : 'false'}">
      <div class="fp-times">
        ${flight.depTime || '--:--'}<span class="fp-arrow">→</span>${flight.arrTime || '--:--'}
      </div>
      <div class="fp-info">
        <div class="fp-airline">${escHtml(airline)}</div>
        <div class="fp-meta">${flight.duration ? `<span>${flight.duration}</span>` : ''}${stops}</div>
      </div>
      <div class="fp-price-wrap">
        <div class="fp-price">€${Math.round(flight.price * tvl.pax)}</div>
        ${paxNote}
      </div>
      <div class="fp-action">
        ${isChosen
          ? `<span class="fp-chosen-badge">${t('flight_selected')}</span>`
          : `<span class="fp-choose-cta">${t('flight_select')}</span>`}
        ${flight.bookUrl ? `<a href="${escHtml(bookHref(flight))}" class="fp-book" target="_blank" rel="noopener">${t('combo_book')}</a>` : ''}
      </div>
    </div>`;
}

// Promote a flight to the front of its traveler's outbound or return array.
// Updates the itinerary + picker in place; doesn't scroll.
function selectFlightForTraveler(travelerId, flight, isReturn = false) {
  const tvl  = travelers.find(x => x.id === travelerId);
  if (!tvl) return;
  const list = isReturn ? tvl.returnFlights : tvl.flights;
  if (!list) return;
  const idx  = list.indexOf(flight);
  if (idx > 0) { list.splice(idx, 1); list.unshift(flight); }
  renderItinerarySection();
  renderAllFlightsSection();
}

function renderItinCard(tvl, destCode, depDate, retDate, flexDep, flexRet) {
  const outFlight = getFilteredFlights(tvl.flights)[0]       ?? null;
  const retFlight = getFilteredFlights(tvl.returnFlights)[0] ?? null;
  const outTotal  = outFlight ? Math.round(outFlight.price * tvl.pax) : 0;
  const retTotal  = retFlight ? Math.round(retFlight.price * tvl.pax) : 0;
  const tripTotal = outTotal + retTotal;

  return `
    <div class="itin-card" data-itin-tvl="${tvl.id}">
      <div class="itin-card-header">
        <div class="itin-card-avatar ${tvl.colorClass}">${getInitials(tvl.name)}</div>
        <span class="itin-card-name">${escHtml(tvl.name)}</span>
        <span class="itin-card-route">
          ${tvl.airportCode} <span class="itin-route-arr">→</span> ${destCode}
          ${retDate ? `<span style="color:var(--gray-400)"> / </span>${destCode} <span class="itin-route-arr">→</span> ${tvl.airportCode}` : ''}
        </span>
      </div>

      ${renderItinSegment(outFlight, tvl, tvl.airportCode, destCode, depDate, false)}
      ${flexDep ? renderFlexGrid(tvl, false) : ''}

      ${retDate ? renderItinSegment(retFlight, tvl, destCode, tvl.airportCode, retDate, true) : ''}
      ${retDate && flexRet ? renderFlexGrid(tvl, true) : ''}

      ${tripTotal > 0 ? `
        <div class="itin-total">
          <span class="itin-total-label">${t('itin_total')}${tvl.pax > 1 ? ` · ${tvl.pax} pax` : ''}</span>
          <span class="itin-total-price">€${tripTotal}</span>
        </div>` : ''}
    </div>`;
}

function renderItinSegment(flight, tvl, origin, dest, date, isRet) {
  const dirBadge = `<span class="itin-dir-badge ${isRet ? 'ret' : 'out'}">${isRet ? t('itin_return') : t('itin_outbound')}</span>`;
  const dateLabel = formatDateMedium(date);

  if (!flight) {
    const fallback = `https://www.kayak.com/flights/${origin}-${dest}/${date}?sort=price_a`;
    return `
      <div class="itin-segment">
        <div class="itin-seg-label">${dirBadge}<span class="itin-seg-date">${dateLabel}</span></div>
        <div class="itin-no-flight">
          <span>${t('itin_noresult')}</span>
          <a href="${escHtml(fallback)}" target="_blank" rel="noopener">${t('itin_search')} →</a>
        </div>
      </div>`;
  }

  const airline  = flight.airline?.name || '';
  const stops    = flight.stops === 0
    ? `<span class="direct-dot">●</span> ${t('combo_direct')}`
    : `<span class="stop-dot">●</span> ${t('combo_stop', flight.stops)}`;
  const paxNote  = tvl.pax > 1 ? `<span class="itin-seg-price-sub">€${Math.round(flight.price)}/pax × ${tvl.pax}</span>` : '';

  return `
    <div class="itin-segment">
      <div class="itin-seg-label">${dirBadge}<span class="itin-seg-date">${dateLabel}</span></div>
      <div class="itin-seg-body">
        <div class="itin-seg-left">
          <div class="itin-seg-airline">${escHtml(airline)}</div>
          <div class="itin-seg-times">
            ${flight.depTime || '--:--'}<span class="itin-seg-arrow">→</span><span class="seg-arr">${flight.arrTime || '--:--'}</span>
          </div>
          <div class="itin-seg-meta">
            ${flight.duration ? `<span>${flight.duration}</span>` : ''}
            ${stops}
          </div>
        </div>
        <div class="itin-seg-right">
          <div class="itin-seg-price">€${Math.round(flight.price * tvl.pax)}</div>
          ${paxNote}
          ${flight.bookUrl ? `<a href="${escHtml(bookHref(flight))}" class="itin-book-btn" target="_blank" rel="noopener">${t('combo_book')}</a>` : ''}
        </div>
      </div>
    </div>`;
}

function renderFlexGrid(tvl, isRet) {
  const baseDate = isRet ? lastSearch.retDate : lastSearch.depDate;
  if (!baseDate) return '';
  const flexN    = (isRet ? lastSearch.flexRet : lastSearch.flexDep) || 2;
  const flexMap  = isRet ? tvl.flexRet : tvl.flexOut;
  const dates    = flexRange(flexN).map(off => addDaysISO(baseDate, off));

  // Find cheapest non-null date
  let cheapestDate = null, cheapestPrice = Infinity;
  dates.forEach(d => {
    const f = flexMap[d];
    if (f && f.price < cheapestPrice) { cheapestPrice = f.price; cheapestDate = d; }
  });

  const cells = dates.map(d => {
    const f         = flexMap[d];
    const selected  = d === baseDate;
    const cheapest  = d === cheapestDate && !selected;
    const loading   = f === undefined;
    const noFlight  = f === null;
    const priceStr  = loading ? '···' : noFlight ? '–' : `€${Math.round(f.price)}`;
    let cls = 'flex-day';
    if (selected)  cls += ' flex-day-selected';
    if (cheapest)  cls += ' flex-day-cheapest';
    if (loading)   cls += ' flex-loading';

    return `<button class="${cls}" data-action="select" data-tvl="${tvl.id}" data-isret="${isRet}" data-date="${d}">
      <span class="flex-day-date">${formatDateShort(d)}</span>
      <span class="flex-day-price">${priceStr}</span>
    </button>`;
  }).join('');

  return `<div class="flex-grid-wrap">
    <div class="flex-grid-label">${t('flex_dates_label')}</div>
    <div class="flex-grid">${cells}</div>
  </div>`;
}

// Re-render just a traveler's flex grid without full re-render
function refreshFlexGrid(tvlId, isRet) {
  const tvl  = travelers.find(x => x.id === tvlId);
  if (!tvl) return;
  const card = document.querySelector(`.itin-card[data-itin-tvl="${tvlId}"]`);
  if (!card) return;
  const grids = card.querySelectorAll('.flex-grid-wrap');
  const idx   = isRet ? 1 : 0;
  const grid  = grids[idx];
  if (!grid) return;

  const baseDate = isRet ? lastSearch.retDate : lastSearch.depDate;
  if (!baseDate) return;
  const flexN    = (isRet ? lastSearch.flexRet : lastSearch.flexDep) || 2;
  const flexMap  = isRet ? tvl.flexRet : tvl.flexOut;
  const dates    = flexRange(flexN).map(off => addDaysISO(baseDate, off));

  let cheapestDate = null, cheapestPrice = Infinity;
  dates.forEach(d => {
    const f = flexMap[d];
    if (f && f.price < cheapestPrice) { cheapestPrice = f.price; cheapestDate = d; }
  });

  grid.querySelector('.flex-grid').innerHTML = dates.map(d => {
    const f        = flexMap[d];
    const selected = d === baseDate;
    const cheapest = d === cheapestDate && !selected;
    const loading  = f === undefined;
    const priceStr = loading ? '···' : f === null ? '–' : `€${Math.round(f.price)}`;
    let cls = 'flex-day';
    if (selected) cls += ' flex-day-selected';
    if (cheapest) cls += ' flex-day-cheapest';
    if (loading)  cls += ' flex-loading';

    return `<button class="${cls}" data-action="select" data-tvl="${tvl.id}" data-isret="${isRet}" data-date="${d}">
      <span class="flex-day-date">${formatDateShort(d)}</span>
      <span class="flex-day-price">${priceStr}</span>
    </button>`;
  }).join('');

  // Re-wire click handlers
  grid.querySelectorAll('.flex-day[data-action="select"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tvlId   = Number(btn.dataset.tvl);
      const isRet   = btn.dataset.isret === 'true';
      const date    = btn.dataset.date;
      const tvl     = travelers.find(x => x.id === tvlId);
      if (!tvl) return;
      if (isRet) { lastSearch.retDate = date; tvl.returnFlights = tvl.flexRet[date] ? [tvl.flexRet[date]] : []; }
      else       { lastSearch.depDate = date; tvl.flights = tvl.flexOut[date] ? [tvl.flexOut[date]] : []; }
      renderItinerarySection();
      const combos = buildCombinations(travelers);
      scoredCombos = scoreCombinations(combos);
      renderCombinations();
    });
  });
}

// ── Sort bar ─────────────────────────────────
function renderSortBar() {
  const bar = document.getElementById('sortBar');
  bar.innerHTML = `
    <span class="sort-label">${t('sort_by')}</span>
    <button class="sort-btn${currentSort === 'value' ? ' active' : ''}" data-sort="value">${t('sort_value')}</button>
    <button class="sort-btn${currentSort === 'total' ? ' active' : ''}" data-sort="total">${t('sort_total')}</button>
    <button class="sort-btn${currentSort === 'fair'  ? ' active' : ''}" data-sort="fair" >${t('sort_fair')}</button>
    <button class="sort-btn${currentSort === 'quick' ? ' active' : ''}" data-sort="quick">${t('sort_quick')}</button>
    <div class="sort-divider"></div>
    <button class="sort-btn direct-toggle${directOnly ? ' active' : ''}" id="directOnlyBtn">${t('direct_only')}</button>`;

  bar.querySelectorAll('.sort-btn[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSort = btn.dataset.sort;
      renderSortBar();
      renderCombinations();
    });
  });

  bar.querySelector('#directOnlyBtn').addEventListener('click', () => {
    directOnly = !directOnly;
    const combos = buildCombinations(travelers);
    scoredCombos = scoreCombinations(combos);
    renderSortBar();
    renderCombinations();
    renderItinerarySection();
    renderAllFlightsSection();
  });
}

// ── Combination grid ─────────────────────────
function renderCombinations() {
  const container = document.getElementById('comboGrid');
  container.innerHTML = '';

  if (!scoredCombos.length) {
    if (directOnly) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">✈</div>
          <p>${t('no_direct_flights')}</p>
          <p class="no-results-sub">${t('no_direct_hint')}</p>
          <button class="btn-ghost" id="clearDirectFilter">${t('show_all_flights')}</button>
        </div>`;
      container.querySelector('#clearDirectFilter')?.addEventListener('click', () => {
        directOnly = false;
        const combos = buildCombinations(travelers);
        scoredCombos = scoreCombinations(combos);
        renderSortBar();
        renderCombinations();
        renderItinerarySection();
        renderAllFlightsSection();
      });
    } else {
      const noFlight = travelers.filter(t => !t.flights?.length).map(t => t.name).join(', ');
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">✈</div>
          <p>${t('no_results')}</p>
          ${noFlight ? `<p class="no-results-sub">${t('no_results_for')} <strong>${escHtml(noFlight)}</strong></p>` : ''}
          <p class="no-results-sub">${t('no_results_hint')}</p>
        </div>`;
    }
    return;
  }

  const sorted = sortCombos(scoredCombos, currentSort).slice(0, 15);

  sorted.forEach((sc, rank) => {
    const isBest = rank === 0;
    const card = document.createElement('div');
    card.className = `combo-card${isBest ? ' combo-best' : ''}`;
    card.style.animationDelay = `${rank * 50}ms`;

    const badge = isBest
      ? `<span class="combo-badge best">${t('badge_best')}</span>`
      : rank <= 2 ? `<span class="combo-badge top">${t('badge_top')}</span>` : '';

    const rows = sc.combo.map(({ traveler, flight }) => {
      const airlineName = flight.airline?.name || (flight.source === 'ryanair' ? 'Ryanair' : '');
      const srcLabel = { fli: 'GF', searchapi: 'GF', google: 'GF', skyscanner: 'Sky',
        'skyscanner-dom': 'Sky', kayak: 'Kayak', ryanair: 'FR' }[flight.source] || '';
      const sourceTag = srcLabel
        ? `<span class="src-badge ${flight.source === 'ryanair' ? 'ry' : 'sky'}">${srcLabel}</span>`
        : '';
      return `
        <div class="combo-row">
          <div class="combo-traveler">
            <div class="combo-avatar ${traveler.colorClass}">${getInitials(traveler.name)}</div>
            <span class="combo-tname">${escHtml(traveler.name)}</span>
          </div>
          <div class="combo-flight">
            <span class="combo-route">${traveler.airportCode}<span class="combo-arrow">→</span>${lastSearch.destCode}</span>
            ${flight.depTime ? `<span class="combo-times">${flight.depTime}${flight.arrTime ? ' – ' + flight.arrTime : ''}</span>` : ''}
            ${flight.duration ? `<span class="combo-dur">${flight.duration}</span>` : ''}
            <span class="tc-fl-badge ${flight.stops === 0 ? 'direct' : 'stop'}">${flight.stops === 0 ? t('combo_direct') : t('combo_stop', flight.stops)}</span>
            ${airlineName ? `<span class="combo-airline">${escHtml(airlineName)}</span>` : ''}
            ${sourceTag}
          </div>
          <div class="combo-price-wrap">
            <div class="combo-price-stack">
              <span class="combo-price">€${Math.round(flight.price * traveler.pax)}</span>
              ${traveler.pax > 1 ? `<span class="combo-price-sub">€${Math.round(flight.price)}/pax × ${traveler.pax}</span>` : ''}
            </div>
            <a href="${escHtml(bookHref(flight))}" class="combo-book" target="_blank" rel="noopener">${t('combo_book')}</a>
          </div>
        </div>`;
    }).join('');

    const durLabel = sc.maxDurMin > 0
      ? `<span class="combo-stat"><span class="combo-stat-icon">⏱</span>${t('combo_maxdur', formatDur(sc.maxDurMin))}</span>`
      : '';
    const paxLabel = sc.totalPax > 1
      ? `<span class="combo-stat"><span class="combo-stat-icon">👥</span>${t('combo_pax_label', sc.totalPax)}</span>`
      : '';

    card.innerHTML = `
      <div class="combo-header">
        <div class="combo-totals">
          ${badge}
          <span class="combo-total">€${Math.round(sc.totalPrice)} ${t('combo_total_sfx')}</span>
          <span class="combo-avg">€${Math.round(sc.pricePerPax)}/pax</span>
          ${paxLabel}
          ${durLabel}
        </div>
        <div class="combo-score-wrap">
          <span class="combo-score">${sc.qualityPct}</span>
          <span class="combo-score-label">/100</span>
        </div>
      </div>
      <div class="combo-rows">${rows}</div>`;

    // Click a combo → make it the selected itinerary and jump to the top.
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;   // let the "Book" link work normally
      selectCombo(sc);
      document.querySelectorAll('.combo-card').forEach(c => c.classList.remove('combo-selected'));
      card.classList.add('combo-selected');
    });

    container.appendChild(card);
  });
}

// Apply a chosen combination to the itinerary: move each traveler's picked
// outbound flight to the front (so it shows in the itinerary and the shared
// message), then scroll back up to the itinerary.
function selectCombo(sc) {
  sc.combo.forEach(({ traveler, flight }) => {
    const arr = traveler.flights;
    if (!arr) return;
    const idx = arr.indexOf(flight);
    if (idx > 0) { arr.splice(idx, 1); arr.unshift(flight); }
  });
  renderItinerarySection();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Deep links per traveler ───────────────────
function renderDeepLinksSection() {
  const section = document.getElementById('deepLinksSection');
  section.innerHTML = `
    <div class="dl-title">${t('dl_title')}</div>
    <div class="dl-grid">
      ${travelers.map(t => {
        const links = buildLinks(t.airportCode, lastSearch.destCode, lastSearch.depDate, lastSearch.retDate);
        return `
          <div class="dl-card">
            <div class="dl-header">
              <div class="dl-avatar ${t.colorClass}">${getInitials(t.name)}</div>
              <div>
                <div class="dl-name">${escHtml(t.name)}</div>
                <div class="dl-route">${t.airportCode} → ${lastSearch.destCode}</div>
              </div>
            </div>
            <div class="dl-links">
              <a href="${links.skyscanner}" class="search-link link-skyscanner" target="_blank" rel="noopener">Skyscanner</a>
              <a href="${links.google}"     class="search-link link-google"     target="_blank" rel="noopener">Google Flights</a>
              <a href="${links.kayak}"      class="search-link link-kayak"      target="_blank" rel="noopener">Kayak</a>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// ──────────────────────────────────────────────
// DESTINATION PLANNER
// ──────────────────────────────────────────────

const TAG_LABELS = {
  beach:     { icon: '🏖️', label: 'Beach' },
  culture:   { icon: '🏛️', label: 'Culture' },
  nightlife: { icon: '🌃', label: 'Nightlife' },
  food:      { icon: '🍽️', label: 'Food' },
  nature:    { icon: '🏔️', label: 'Nature' },
  romantic:  { icon: '💑', label: 'Romantic' },
  party:     { icon: '🎉', label: 'Party' },
  ski:       { icon: '⛷️', label: 'Ski' },
  history:   { icon: '📜', label: 'History' },
  art:       { icon: '🎨', label: 'Art' },
  shopping:  { icon: '🛍️', label: 'Shopping' },
};

let plannerActiveTag  = 'all';
// Default to showing every destination — the OpenFlights 2017 route data is
// incomplete (e.g., BCN → HKG, BCN → ICN aren't in it even though they fly),
// so a strict "only directly reachable" filter hides legitimate options.
// The reach badges still indicate which destinations are confirmed direct,
// and the user can opt into the strict filter via the "Ver todos los
// destinos" toggle (it now means "stop showing all — only reachable").
let plannerShowAll    = true;

function renderPlanner() {
  const section = document.getElementById('plannerSection');
  if (!section) return;

  const selectedCodes = travelers.map(t => t.airportCode).filter(Boolean);
  const hasOrigins    = selectedCodes.length > 0;

  // Show/hide the "not sure where to go?" CTA banner in the search panel
  const ctaBanner = document.getElementById('plannerCtaBanner');
  if (ctaBanner) ctaBanner.style.display = hasOrigins ? 'flex' : 'none';

  // Build reachability map for each destination
  // A destination is "reachable" if all selected origins have a route to it
  function reachability(code) {
    if (!hasOrigins) return 'none';
    const loadedSets = selectedCodes.map(c => routeCache[c]).filter(s => s && s.size > 0);
    if (!loadedSets.length) return 'loading';
    const reachableFrom = loadedSets.filter(s => s.has(code)).length;
    if (reachableFrom === selectedCodes.length) return 'all';
    if (reachableFrom > 0)                      return 'some';
    return 'none';
  }

  // Filter destinations by active tag + reachability toggle, and surface the
  // directly-reachable ones first within their region.
  function visibleDestinations() {
    const reachScore = r => r === 'all' ? 0 : r === 'some' ? 1 : r === 'loading' ? 2 : 3;
    return DESTINATIONS
      .map((d, idx) => ({ d, idx, r: reachability(d.code) }))
      .filter(({ d, r }) => {
        if (!plannerShowAll && hasOrigins && r !== 'all' && r !== 'loading') return false;
        if (plannerActiveTag !== 'all' && !d.tags.includes(plannerActiveTag)) return false;
        return true;
      })
      .sort((a, b) => reachScore(a.r) - reachScore(b.r) || a.idx - b.idx)
      .map(x => x.d);
  }

  const visible = visibleDestinations();

  // Group by region
  const byRegion = {};
  visible.forEach(d => {
    if (!byRegion[d.region]) byRegion[d.region] = [];
    byRegion[d.region].push(d);
  });

  const regionOrder = ['Southern Europe','Western Europe','Central Europe','Northern Europe','Eastern Europe','North Africa','Middle East','Americas','Asia'];

  // Origin tags for header
  const originTags = selectedCodes.map(c => {
    const a = AIRPORTS.find(x => x.code === c);
    return a ? `<span class="planner-origin-tag">${c} <span class="planner-origin-city">${a.city}</span></span>` : '';
  }).join('');

  const reachableCount = DESTINATIONS.filter(d => reachability(d.code) === 'all').length;

  section.innerHTML = `
    <div class="planner-inner">
      <div class="planner-header">
        <div class="planner-title-row">
          <h2 class="planner-title">${t('planner_title')}</h2>
          ${hasOrigins
            ? `<div class="planner-origins">${t('planner_from')} ${originTags}</div>`
            : `<p class="planner-hint">${t('planner_hint')}</p>`
          }
        </div>
        ${hasOrigins ? `
        <div class="planner-controls">
          <label class="planner-toggle">
            <input type="checkbox" id="plannerShowAll" ${plannerShowAll ? 'checked' : ''}>
            <span>${t('planner_show_all')}</span>
          </label>
          ${reachableCount > 0 ? `<span class="planner-reachable-count">${t('planner_reachable', reachableCount)}</span>` : ''}
        </div>` : ''}
      </div>

      <div class="planner-tags" id="plannerTags">
        <button class="tag-chip ${plannerActiveTag === 'all' ? 'active' : ''}" data-tag="all">${t('planner_tag_all')}</button>
        ${Object.keys(TAG_LABELS).map(k => `
          <button class="tag-chip ${plannerActiveTag === k ? 'active' : ''}" data-tag="${k}">${t('tag_' + k)}</button>
        `).join('')}
      </div>

      ${visible.length === 0 ? `
        <div class="planner-empty">
          <p>${t('planner_empty')}</p>
          <button class="btn-ghost planner-show-all-btn" onclick="">${t('planner_show_all')}</button>
        </div>` : ''}

      <div class="planner-regions">
        ${regionOrder.filter(r => byRegion[r]).map(region => `
          <div class="planner-region">
            <div class="planner-region-header">${t(region)}</div>
            <div class="planner-cards">
              ${byRegion[region].map(d => {
                const r = reachability(d.code);
                const tagHtml = d.tags.slice(0, 3).map(tag =>
                  `<span class="dest-tag">${t('tag_' + tag)}</span>`
                ).join('');
                const badgeHtml = !hasOrigins ? '' :
                  r === 'all'     ? `<span class="reach-badge reach-all">${t('reach_all')}</span>` :
                  r === 'some'    ? `<span class="reach-badge reach-some">${t('reach_some')}</span>` :
                  r === 'loading' ? '<span class="reach-badge reach-loading">…</span>' : '';
                return `
                  <div class="dest-card${r === 'all' ? ' dest-reachable' : ''}" data-code="${d.code}">
                    ${badgeHtml ? `<div class="dest-reach-top">${badgeHtml}</div>` : ''}
                    <div class="dest-card-top">
                      <span class="dest-emoji">${d.emoji}</span>
                      <div class="dest-info">
                        <div class="dest-city">${d.flag} ${d.city}</div>
                        <div class="dest-country">${d.country}</div>
                      </div>
                    </div>
                    <div class="dest-vibe">${d.vibe}</div>
                    <div class="dest-tags">${tagHtml}</div>
                    <div class="dest-footer">
                      <button class="dest-info-btn" data-code="${d.code}">ℹ️ Info</button>
                      <button class="dest-plan-btn" data-code="${d.code}" data-city="${escHtml(d.city)}">${t('planner_plan')}</button>
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;

  // Wire up tag chips
  section.querySelectorAll('.tag-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      plannerActiveTag = btn.dataset.tag;
      renderPlanner();
    });
  });

  // Wire up show-all toggle
  const toggle = section.querySelector('#plannerShowAll');
  if (toggle) {
    toggle.addEventListener('change', () => {
      plannerShowAll = toggle.checked;
      renderPlanner();
    });
  }

  // Wire up "Plan trip" buttons
  section.querySelectorAll('.dest-plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      const city = btn.dataset.city;
      const destInput = document.getElementById('destinationInput');
      destInput.value = `${city} (${code})`;
      destInput.dataset.selectedCode = code;
      destInput.dataset.selectedCity = city;
      document.getElementById('searchPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      const searchBtn = document.getElementById('searchBtn');
      searchBtn.classList.add('pulse');
      setTimeout(() => searchBtn.classList.remove('pulse'), 1500);
    });
  });

  // Wire up "Info" buttons
  section.querySelectorAll('.dest-info-btn').forEach(btn => {
    btn.addEventListener('click', () => openDestinationInfo(btn.dataset.code));
  });
}

// ──────────────────────────────────────────────
// DEEP LINK BUILDERS
// ──────────────────────────────────────────────
function buildLinks(origin, dest, depDate, retDate) {
  return {
    skyscanner: retDate
      ? `https://www.skyscanner.com/transport/flights/${origin}/${dest}/${toSkyDate(depDate)}/${toSkyDate(retDate)}/`
      : `https://www.skyscanner.com/transport/flights/${origin}/${dest}/${toSkyDate(depDate)}/`,
    google: `https://www.google.com/travel/flights?q=${encodeURIComponent(
      `Flights from ${origin} to ${dest} on ${depDate}` + (retDate ? ` returning ${retDate}` : ' one way')
    )}`,
    kayak: retDate
      ? `https://www.kayak.com/flights/${origin}-${dest}/${depDate}/${retDate}`
      : `https://www.kayak.com/flights/${origin}-${dest}/${depDate}`,
  };
}

function toSkyDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${y.slice(2)}${m}${d}`;
}

// ──────────────────────────────────────────────
// SHARE AS IMAGE
// ──────────────────────────────────────────────
async function shareAsImage() {
  const btn = document.getElementById('imgBtn');
  const btnSpan = btn?.querySelector('span');
  if (btnSpan) btnSpan.textContent = t('saving_img');
  if (btn) btn.disabled = true;

  try {
    const section = document.getElementById('itinerarySection');
    // Temporarily hide flex grids and book buttons for a cleaner capture
    section.classList.add('capturing');
    const canvas = await html2canvas(section, {
      scale:           2,
      backgroundColor: '#f8f9fb',
      useCORS:         true,
      logging:         false,
      allowTaint:      false,
    });
    section.classList.remove('capturing');

    const filename = `FriendlyFlights-${(lastSearch?.destCity || 'trip').replace(/\s+/g,'-')}-${lastSearch?.depDate || ''}.png`;
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));

    // Try native share (iOS / Android)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `FriendlyFlights — ${lastSearch?.destCity}` });
        return;
      }
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    console.error('[shareAsImage]', err);
    section?.classList.remove('capturing');
  } finally {
    if (btnSpan) btnSpan.textContent = t('save_img');
    if (btn) btn.disabled = false;
  }
}

// ──────────────────────────────────────────────
// SHARE
// ──────────────────────────────────────────────
// "Sevilla (SVQ)" — always show both city and airport code.
function airportLabel(city, code) {
  if (city && code && city !== code) return `${city} (${code})`;
  return code || city || '';
}

// Server-mediated booking link. Clicking opens /api/book which captures the
// full Google Flights deep link (tfs+tfu) for THIS specific flight and
// redirects. Falls back to the plain Google Flights search URL on failure,
// so users always end up on a working page. Used only for the in-app
// "Reservar" buttons; the shared WhatsApp text keeps the direct q= URL so
// recipients on other networks aren't sent to our local server.
function bookHref(flight) {
  if (!flight) return '#';
  const fb = flight.bookUrl || '';
  const p  = new URLSearchParams({
    origin:   flight.origin   || '',
    dest:     flight.dest     || '',
    date:     flight.depDate  || '',
    dep_time: flight.depTime  || '',
    fallback: fb,
  });
  return `/api/book?${p.toString()}`;
}

// Emojis built at runtime from code points. This is immune to any source/HTTP
// charset mishap (which previously turned them into "�" in the WhatsApp text).
const SHARE_EMOJI = {
  plane: String.fromCodePoint(0x2708, 0xFE0F),                 // ✈️
  link:  String.fromCodePoint(0x1F517),                        // 🔗
  out:   String.fromCodePoint(0x2197, 0xFE0F),                 // ↗️
  ret:   String.fromCodePoint(0x21A9, 0xFE0F),                 // ↩️
  dots:  [0x1F535, 0x1F7E2, 0x1F7E0, 0x1F7E3, 0x1F7E1, 0x1F7E4].map(c => String.fromCodePoint(c)),
};

function buildShareText() {
  const { destCity, destCode, depDate, retDate } = lastSearch;
  const dateStr   = formatDateLong(depDate) + (retDate ? ` → ${formatDateLong(retDate)}` : '');
  const destLabel = airportLabel(destCity, destCode);
  const E         = SHARE_EMOJI;

  let msg = `${E.plane} FriendlyFlights — ${destLabel}, ${dateStr}\n\n`;

  // Per-traveler itinerary
  travelers.forEach((tvl, i) => {
    const out = tvl.flights?.[0];
    const ret = tvl.returnFlights?.[0];
    const em  = E.dots[i % E.dots.length];
    msg += `${em} ${tvl.name} · ${airportLabel(tvl.airportCity, tvl.airportCode)}\n`;
    if (out) {
      const airline = out.airline?.name || '';
      msg += `  ${E.out} ${formatDateLong(depDate)} ${out.depTime || ''}–${out.arrTime || ''} ${airline ? airline + ' · ' : ''}€${Math.round(out.price * tvl.pax)}\n`;
      if (out.bookUrl) msg += `  ${out.bookUrl}\n`;
    }
    if (ret) {
      const airline = ret.airline?.name || '';
      msg += `  ${E.ret} ${formatDateLong(retDate)} ${ret.depTime || ''}–${ret.arrTime || ''} ${airline ? airline + ' · ' : ''}€${Math.round(ret.price * tvl.pax)}\n`;
      if (ret.bookUrl) msg += `  ${ret.bookUrl}\n`;
    }
    const total = (out ? Math.round(out.price * tvl.pax) : 0) + (ret ? Math.round(ret.price * tvl.pax) : 0);
    if (total > 0) msg += `  ${t('share_total')}: €${total}\n`;
    msg += '\n';
  });

  msg += `${E.link} ${t('share_links_text')}\n`;
  travelers.forEach((tvl, i) => {
    const links = buildLinks(tvl.airportCode, lastSearch.destCode, depDate, retDate);
    msg += `${E.dots[i % E.dots.length]} ${tvl.name} · ${airportLabel(tvl.airportCity, tvl.airportCode)}: ${links.skyscanner}\n`;
  });

  return msg.trim();
}

function shareWhatsApp() {
  window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, '_blank');
}

function copyLinks() {
  navigator.clipboard.writeText(buildShareText()).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.querySelector('span').textContent = t('share_copied');
    btn.classList.add('copied');
    setTimeout(() => {
      btn.querySelector('span').textContent = t('share_copy');
      btn.classList.remove('copied');
    }, 2500);
  });
}

// ──────────────────────────────────────────────
// LOADING OVERLAY
// ──────────────────────────────────────────────
function showLoading(travelers, hasReturn) {
  document.getElementById('loadingText').textContent = t('loading_text');
  const rows = [];
  travelers.forEach((tvl, i) => {
    rows.push(`<div class="loading-traveler-row" id="lrow_out_${i}">
      <div class="dot"></div>
      <span>${escHtml(tvl.name)} · ${tvl.airportCode} → ${lastSearch.destCode}</span>
    </div>`);
    if (hasReturn) rows.push(`<div class="loading-traveler-row" id="lrow_ret_${i}">
      <div class="dot"></div>
      <span>${escHtml(tvl.name)} · ${lastSearch.destCode} → ${tvl.airportCode}</span>
    </div>`);
  });
  document.getElementById('loadingTravelers').innerHTML = rows.join('');
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function markLoadingActive(rowId) {
  if (rowId === null) return;
  document.getElementById(`lrow_${rowId}`)?.classList.add('active');
}

function markLoadingDone(rowId, count, source) {
  if (rowId === null) return;
  const row = document.getElementById(`lrow_${rowId}`);
  if (!row) return;
  row.classList.remove('active');
  row.classList.add('done');
  const srcName = (source === 'fli' || source === 'searchapi') ? 'Google Flights'
    : source === 'ryanair' ? 'Ryanair'
    : source === 'kayak' ? 'Kayak'
    : source === 'google' ? 'Google'
    : (source === 'skyscanner' || source === 'skyscanner-dom') ? 'Skyscanner'
    : null;
  row.querySelector('span').textContent +=
    count ? ' ' + t('loading_found', count, srcName) : ' ' + t('loading_none');
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function getInitials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDateLong(d)  {
  const locale = (typeof currentLang !== 'undefined' && currentLang === 'es') ? 'es-ES' : 'en-GB';
  return new Date(d + 'T12:00:00').toLocaleDateString(locale, { day:'numeric', month:'short', year:'numeric' });
}
function formatDur(min) {
  return `${Math.floor(min / 60)}h${min % 60 > 0 ? ' ' + (min % 60) + 'm' : ''}`;
}
function formatDateMedium(d) {
  if (!d) return '';
  const locale = (typeof currentLang !== 'undefined' && currentLang === 'es') ? 'es-ES' : 'en-GB';
  return new Date(d + 'T12:00:00').toLocaleDateString(locale, { weekday:'short', day:'numeric', month:'short' });
}
function formatDateShort(d) {
  if (!d) return '';
  const locale = (typeof currentLang !== 'undefined' && currentLang === 'es') ? 'es-ES' : 'en-GB';
  return new Date(d + 'T12:00:00').toLocaleDateString(locale, { day:'numeric', month:'short' });
}
function addDaysISO(iso, days) {
  const dt = new Date(iso + 'T12:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
function shake(el) {
  if (!el) return;
  el.style.borderColor = 'var(--red)';
  el.animate([
    {transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},
    {transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'},
  ], { duration:400, easing:'ease' }).onfinish = () => { el.style.borderColor = ''; };
}

// Lightweight toast at the bottom of the viewport. `isError=true` gives it
// the red variant; otherwise neutral dark. Auto-hides after 4 s. Reuses the
// same DOM node across calls so they don't pile up.
function showToast(message, isError = false) {
  let el = document.getElementById('ffToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ffToast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className   = 'ff-toast' + (isError ? ' error' : '') + ' visible';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('visible'), 4000);
}

// ──────────────────────────────────────────────
// DESTINATION INFO MODAL
// ──────────────────────────────────────────────
function closeDestinationModal() {
  document.getElementById('destModal').style.display = 'none';
  document.body.style.overflow = '';
}

async function openDestinationInfo(code) {
  const dest = DESTINATIONS.find(d => d.code === code);
  if (!dest) return;

  // Open modal immediately with placeholder content
  const modal = document.getElementById('destModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Emoji placeholder while image loads
  document.getElementById('destModalImg').style.display = 'none';
  document.getElementById('destModalEmojiPlaceholder').style.display = 'flex';
  document.getElementById('destModalEmoji').textContent = dest.emoji;

  // Static info
  document.getElementById('destModalTitle').textContent = dest.flag + ' ' + dest.city;
  document.getElementById('destModalSub').textContent   = dest.country + ' · ' + t(dest.region);
  document.getElementById('destModalVibe').textContent  = dest.vibe;

  // Description — loading pulse while fetching
  document.getElementById('destModalDesc').innerHTML = '<span class="dest-modal-loading">···</span>';

  // Tags
  document.getElementById('destModalTags').innerHTML =
    dest.tags.map(tag => `<span class="dest-tag">${t('tag_' + tag)}</span>`).join('');

  // Plan button
  const planBtn = document.getElementById('destModalPlan');
  planBtn.textContent = t('planner_plan');
  planBtn.onclick = () => {
    closeDestinationModal();
    const destInput = document.getElementById('destinationInput');
    destInput.value = `${dest.city} (${dest.code})`;
    destInput.dataset.selectedCode = dest.code;
    destInput.dataset.selectedCity = dest.city;
    document.getElementById('searchPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.classList.add('pulse');
    setTimeout(() => searchBtn.classList.remove('pulse'), 1500);
  };

  // Hide wiki link initially
  document.getElementById('destModalWiki').style.display = 'none';

  // Fetch Wikipedia summary
  try {
    const res  = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(dest.city)}`
    );
    const data = await res.json();

    if (data.extract) {
      // Cut to ~280 chars at a clean sentence boundary (avoid splitting "1.6 million" etc.)
      let extract = data.extract;
      if (extract.length > 280) {
        const slice = extract.slice(0, 280);
        const lastBoundary = Math.max(
          slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? ')
        );
        extract = lastBoundary > 80
          ? slice.slice(0, lastBoundary + 1)
          : slice + '…';
      }
      document.getElementById('destModalDesc').textContent = extract;
    } else {
      document.getElementById('destModalDesc').textContent = '';
    }

    // Image — proxied through our server to avoid CSP issues in preview/strict environments
    if (data.thumbnail?.source) {
      const imgEl    = document.getElementById('destModalImg');
      const proxySrc = `${API_BASE}/api/imgproxy?url=${encodeURIComponent(data.thumbnail.source)}`;
      imgEl.onload = () => {
        imgEl.style.display = 'block';
        document.getElementById('destModalEmojiPlaceholder').style.display = 'none';
      };
      imgEl.onerror = () => { imgEl.style.display = 'none'; };
      imgEl.src = proxySrc;
      imgEl.alt = dest.city;
    }

    // Wikipedia link
    const wikiLink = document.getElementById('destModalWiki');
    const wikiHref = data.content_urls?.desktop?.page;
    if (wikiHref) {
      wikiLink.href = wikiHref;
      wikiLink.style.display = 'inline';
    }
  } catch {
    document.getElementById('destModalDesc').textContent = '';
  }
}

// ──────────────────────────────────────────────
// RE-RENDER ALL (called on language switch)
// ──────────────────────────────────────────────
function rerenderAll() {
  applyI18n();
  populateFlexSelects();
  renderTravelers();
  renderPlanner();
  if (lastSearch) {
    renderItinerarySection();
    renderAllFlightsSection();
    renderSortBar();
    renderCombinations();
    renderDeepLinksSection();
    renderViewTabs();
    setResultsView(activeResultsView);
  }
}
