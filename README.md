# FriendlyFlights

**Group flights, solved.** Everyone in your group searches from their own city, and FriendlyFlights finds the best combined trip — same destination, same dates, lowest total cost — automatically.

🌐 **Live**: [friendlyflights.es](https://friendlyflights.es)

---

## The problem

You want to meet up with friends in Lisbon next month. One of you flies from Madrid, another from Berlin, a third from Buenos Aires. On Kayak or Google Flights you have to:

1. Run three separate searches.
2. Juggle three browser tabs to compare prices and times.
3. Manually align departure/return windows so everyone arrives the same day.
4. Re-run everything when one person suggests a different destination.

FriendlyFlights collapses that into **one search**. Add each traveler with their home airport, pick a destination (or let the planner suggest ones reachable by everybody), and you get a single ranked list of combinations the whole group can book.

## Features

- **Multi-origin search** — One query covers every traveler from their own city.
- **Group combinations** — Results are ranked by total group cost, not per-person price.
- **Flexible dates** — ±1, ±3, or ±7 day windows on departure and return.
- **Where-can-we-meet planner** — Type travelers without a destination and FriendlyFlights surfaces cities everyone can reach.
- **Direct-only filter** — Toggle to hide multi-leg itineraries when convenience > price.
- **Deep links to book** — Each result opens straight at the airline / OTA checkout for that exact flight.
- **My Trips** — Saved favorites and recent searches kept locally in your browser (no account, no backend).
- **Bilingual** — Spanish 🇪🇸 and English 🇬🇧, swap with a single pill.
- **Mobile-first PWA** — Installable on iOS/Android, works offline for cached searches, native share sheet for sending a result to the group chat.
- **No API keys needed** — Uses the free `flights` Python library to read Google Flights, with a Playwright fallback scraper for resilience.

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Server | Node.js + Express | Tiny surface, fast cold-start in a container |
| Flight data | [`flights`](https://pypi.org/project/flights/) (Python) | Free reader for Google Flights — no monthly minimum |
| Fallback scraper | Playwright (Chromium) + stealth | When the primary provider hiccups |
| Frontend | Vanilla JS + CSS, no framework | Page-weight discipline; the whole UI ships in one HTML + one CSS file |
| Routes data | OpenFlights + a curated Wikipedia-fed snapshot | Powers the "destinations reachable from X" planner |
| Deploy | Docker on a Hetzner VPS, Caddy reverse proxy, Let's Encrypt | One `git push` → live in ~90s |

## Run locally

You need Node 20+ and Python 3 with the `flights` package.

```bash
npm install
pip install flights        # primary flight-data provider
npx playwright install chromium   # fallback scraper engine
npm start                  # → http://localhost:3001
```

Optional: copy `.env.example` to `.env` if you need to override the Python interpreter path (`PYTHON_BIN=python3`) or the listening port (`PORT=3001`).

### With Docker

```bash
docker compose up --build
```

The image bundles Node, Python, the `flights` lib, and a headless Chromium. First build takes ~3 min; subsequent builds ride the layer cache.

## Deploy

Pushes to `main` trigger [`/.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. The runner tars the source.
2. `scp` the tarball + compose file to the Hetzner VPS.
3. SSH in, `docker build`, and `docker compose up -d` only the changed service.
4. Reload Caddy.

The pipeline expects one repo secret: `HETZNER_SSH_KEY` — the private half of an ed25519 key whose public half lives in the server's `~/.ssh/authorized_keys`. Caddy handles TLS automatically via Let's Encrypt; new domains just need an A record pointing at the server.

Server-side layout lives under `deploy/` in this repo and is documented inline in those files.

## Project structure

```
.
├── server.js              Express app — static assets + /api routes
├── flightSearch.js        Provider orchestration (fli → scraper fallback) + cache
├── fli.js                 Spawns Python and parses JSON from the flights library
├── scraper.js             Playwright Chromium scraper (fallback only)
├── bookingCapture.js      Resolves the airline/OTA deep link for each result
├── destinations.js        Curated "where can we meet" suggestion engine
├── index.html             Single-page UI
├── styles.css             All visual styling, mobile-first
├── i18n.js                ES/EN translation strings + DOM swap helpers
├── data/routes.json       Curated airport→destinations index
├── scripts/               Build scripts for the routes dataset
└── deploy/                Server-side compose, Caddy snippet, build script
```

## Status

Active hobby project, deployed and used by a few people. Issues and PRs welcome.

---

**Built with the unreasonable belief that planning a trip with friends shouldn't take 47 browser tabs.** ✈
