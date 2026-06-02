#!/usr/bin/env python3
"""
scripts/build_routes.py — one-shot scraper that builds ../data/routes.json
from Wikipedia's "Airlines and destinations" tables.

Why: OpenFlights routes.dat (the fallback) is a 2017 snapshot, so a lot of
modern long-haul routes (BCN-HKG, MAD-ICN, etc.) are missing. Wikipedia is
hand-maintained and far more current.

Setup (one-time):
    pip install requests beautifulsoup4

Run:
    python scripts/build_routes.py

Output: data/routes.json — { "BCN": ["MAD","LHR","HKG", ...], ... }

server.js prefers this file at startup; if absent, it falls back to the
remote OpenFlights routes.dat. Resume is supported — re-running picks up
where it left off (an existing routes.json is loaded and only missing
origins are scraped).
"""

import csv
import io
import json
import re
import sys
import time
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Missing deps. First run:\n  pip install requests beautifulsoup4")


# ── Curated origin set — airports users are likely to fly FROM. ────
# Combines:
#   1. The 50 worldwide tourist hubs in destinations.js
#   2. Spanish secondary airports (our user base)
#   3. Major European secondaries the planner shows
#   4. A handful of intercontinental hubs for completeness
ORIGIN_IATAS = [
    # World's busiest tourist hubs
    'DXB','LHR','CDG','AMS','IST','SIN','HKG','ICN','HND','NRT','BKK','HKT',
    'DPS','KUL','DOH','AUH','FCO','MXP','MAD','BCN','PMI','LIS','ATH','JTR',
    'DUB','VIE','ZRH','MUC','FRA','CPH','OSL','ARN','KEF','JFK','LAX','MIA',
    'MCO','LAS','SFO','HNL','CUN','MEX','YYZ','YVR','GRU','GIG','EZE','LIM',
    'RAK','CAI',
    # Spain — most likely origins for our users
    'AGP','SVQ','VLC','BIO','IBZ','TFS','LPA','ACE','FUE','GRX','VGO','SCQ',
    'OVD','LEI','RMU','XRY','EAS','GRO','VLL','REU','PNA',
    # Other Europe (planner shows these)
    'OPO','FAO','HEL','BER','HAM','CGN','GVA','SZG','PRG','BUD','WAW','KRK',
    'GDN','RIX','TLL','VNO','BEG','SOF','OTP','EDI','MAN','STN','LGW','ORY',
    'NCE','MRS','BOD','LYS','VCE','NAP','PSA','BLQ','FLR','CTA','PMO','HER',
    'RHO','JMK','CFU','ZTH','SKG','DBV','SPU','ZAG','BRU','ADB','AYT','CMN',
    'TNG',
    # Major intercontinental
    'EWR','BOS','ORD','ATL','DFW','SEA','SAN','PHX','DEN','TPA','BWI',
    'CGK','MNL','TPE','PVG','PEK','SYD','MEL','AKL',
    'TLV','RUH','JED','JNB','CPT','NBO',
    'DEL','BOM','BLR',
]
ORIGIN_IATAS = list(dict.fromkeys(ORIGIN_IATAS))   # de-dup, preserve order

# ── Constants ──────────────────────────────────────────────────────
WIKI_API   = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "FriendlyFlights-routes-builder/1.0 (https://github.com/friendlyflights)"
SLEEP_SEC  = 0.4   # be polite to Wikipedia


def slugify(s):
    s = (s or "").lower()
    s = re.sub(r"[\s\-–—]+", "_", s)
    s = re.sub(r"[^\w_]", "", s)
    return s


def build_name_index():
    """Build name/slug -> IATA lookup tables from OpenFlights airports.dat."""
    print("-> Building airport-name -> IATA index from OpenFlights ...")
    r = requests.get(
        "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat",
        timeout=30, headers={"User-Agent": USER_AGENT},
    )
    r.raise_for_status()
    by_name, by_slug = {}, {}
    for row in csv.reader(io.StringIO(r.text)):
        if len(row) < 5: continue
        name, city, country, iata = row[1], row[2], row[3], row[4]
        if not iata or iata == "\\N" or len(iata) != 3: continue
        # Several forms because Wikipedia link text varies a lot
        for form in {
            name.lower(),
            re.sub(r"\s+(international|airport|airfield|aerodrome|regional)\b", "", name.lower()).strip(),
            f"{city.lower()} airport",
            f"{city.lower()}–{name.split()[0].lower()}",
        }:
            if form: by_name.setdefault(form, iata)
        for form in {slugify(name), slugify(re.sub(r"\b(international|airport)\b", "", name)).strip("_"), slugify(city)}:
            if form and len(form) > 2: by_slug.setdefault(form, iata)
    print(f"  {len(by_name):,} name forms - {len(by_slug):,} slugs")
    return by_name, by_slug


def find_article_url(iata):
    """Wikipedia opensearch: returns (title, url) of the most-likely match."""
    r = requests.get(WIKI_API, params={
        "action": "opensearch", "search": f"{iata} Airport",
        "limit": 3, "namespace": 0, "format": "json",
    }, timeout=15, headers={"User-Agent": USER_AGENT})
    r.raise_for_status()
    titles, _, urls = r.json()[1], r.json()[2], r.json()[3]
    if not urls: return None, None
    for t, u in zip(titles, urls):
        if "airport" in t.lower():
            return t, u
    return titles[0], urls[0]


def resolve_iata(href, text, title, by_name, by_slug):
    """Best-effort: find IATA of a destination from a Wikipedia link."""
    # 1) Match the href slug (most accurate)
    if href and href.startswith("/wiki/"):
        slug = href.rsplit("/", 1)[-1].split("#", 1)[0].lower()
        if slug in by_slug: return by_slug[slug]
        s2 = re.sub(r"(_international)?_airport$", "", slug)
        if s2 in by_slug: return by_slug[s2]
        s3 = re.sub(r"^(london|new_york|tokyo|paris|rome|moscow|chicago|washington|los_angeles)_", "", slug)
        if s3 in by_slug: return by_slug[s3]
    # 2) Try the title or visible text against the name index
    for candidate in (title or "", text or ""):
        low = candidate.lower().strip()
        if not low: continue
        if low in by_name: return by_name[low]
        cleaned = re.sub(r"\s+(international|airport|airfield)\s*$", "", low).strip()
        if cleaned in by_name: return by_name[cleaned]
    return None


def extract_destinations(html, by_name, by_slug):
    """Pull all destination IATAs from the article's destinations table."""
    soup = BeautifulSoup(html, "html.parser")

    # Find the "Airlines and destinations" heading (case + wording vary)
    heading = None
    for h in soup.find_all(["h2", "h3"]):
        text = h.get_text(" ", strip=True).lower()
        if (("airline" in text or "airlines" in text) and "destination" in text) \
           or "destinations served" in text:
            heading = h
            break
    if not heading:
        return []

    # Walk forward until the next h2 (= next section). Within that window,
    # gather every table — some articles split passenger / cargo / charter.
    found = set()
    el = heading
    while True:
        el = el.find_next(["table", "h2"])
        if el is None: break
        if el.name == "h2": break        # next top-level section
        for row in el.find_all("tr"):
            cells = row.find_all("td")
            if len(cells) < 2: continue
            for cell in cells[1:]:       # column 1 is usually the airline
                for a in cell.find_all("a"):
                    href = a.get("href") or ""
                    if not href.startswith("/wiki/") or ":" in href:
                        continue
                    iata = resolve_iata(href, a.get_text(" ", strip=True),
                                        a.get("title", ""), by_name, by_slug)
                    if iata: found.add(iata)
    return sorted(found)


def main():
    root      = Path(__file__).resolve().parent.parent
    out_file  = root / "data" / "routes.json"
    out_file.parent.mkdir(exist_ok=True)

    # Resume support
    routes = {}
    if out_file.exists():
        try:
            routes = json.loads(out_file.read_text(encoding="utf-8"))
            print(f"Resuming — {len(routes)} airports already in {out_file.relative_to(root)}")
        except Exception:
            routes = {}

    by_name, by_slug = build_name_index()

    todo = [c for c in ORIGIN_IATAS if c not in routes]
    print(f"\n-> {len(todo)} of {len(ORIGIN_IATAS)} airports to scrape "
          f"(skipping {len(routes)} already done)\n")

    for i, iata in enumerate(todo, 1):
        try:
            title, url = find_article_url(iata)
            if not url:
                print(f"  [{i:3d}/{len(todo)}] {iata}: no Wikipedia article")
                continue
            r = requests.get(url, timeout=20,
                             headers={"User-Agent": USER_AGENT})
            r.raise_for_status()
            dests = extract_destinations(r.text, by_name, by_slug)
            routes[iata] = dests
            print(f"  [{i:3d}/{len(todo)}] {iata}: {len(dests):4d} routes  ({title})")
            if i % 10 == 0:
                out_file.write_text(json.dumps(routes, sort_keys=True), encoding="utf-8")
            time.sleep(SLEEP_SEC)
        except Exception as e:
            print(f"  [{i:3d}/{len(todo)}] {iata}: ERROR  {e}")

    out_file.write_text(json.dumps(routes, sort_keys=True), encoding="utf-8")
    total = sum(len(v) for v in routes.values())
    print(f"\n[OK] Saved {out_file.relative_to(root)}")
    print(f"     {len(routes)} airports - {total:,} total direct routes")


if __name__ == "__main__":
    main()
