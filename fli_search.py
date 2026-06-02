#!/usr/bin/env python3
"""
fli_search.py — one-way flight search wrapper around the `fli` library
(https://github.com/punitarani/fli), which reads Google Flights directly.

Called by the Node backend (fli.js) as:
    python fli_search.py <ORIGIN_IATA> <DEST_IATA> <YYYY-MM-DD>

Prints exactly one JSON object to stdout:
    {"flights": [ {normalized flight}, ... ]}
or, on a recoverable problem:
    {"flights": [], "error": "<reason>"}

The normalized flight shape matches what the frontend already consumes,
so no frontend changes are needed when switching providers.

This is free (no API key, no monthly minimum) — the reason we moved off
SearchAPI's $40/mo floor.
"""

import sys
import json
from datetime import datetime, date as date_t


def fmt_dur(minutes):
    try:
        m = int(minutes)
    except (TypeError, ValueError):
        return ""
    h, mm = divmod(m, 60)
    return f"{h}h" + (f" {mm}m" if mm else "")


def main():
    if len(sys.argv) < 4:
        print(json.dumps({"flights": [], "error": "usage: fli_search.py ORIGIN DEST DATE"}))
        return

    origin = sys.argv[1].strip().upper()
    dest   = sys.argv[2].strip().upper()
    date   = sys.argv[3].strip()

    # Date sanity. fli's Pydantic model already rejects past dates, but its
    # error message is opaque; we short-circuit with a clear reason instead.
    try:
        parsed = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        print(json.dumps({"flights": [], "error": f"invalid date format: {date}"}))
        return
    if parsed < date_t.today():
        print(json.dumps({"flights": [], "error": f"date_in_past: {date}"}))
        return

    try:
        from fli.models import (
            Airport, PassengerInfo, SeatType, MaxStops, SortBy,
            FlightSearchFilters, FlightSegment,
        )
        from fli.search import SearchFlights
    except Exception as e:  # pragma: no cover - import/env failure
        print(json.dumps({"flights": [], "error": f"fli import failed: {e}"}))
        return

    # Resolve IATA codes to the library's Airport enum.
    try:
        dep_ap = Airport[origin]
        arr_ap = Airport[dest]
    except KeyError as e:
        print(json.dumps({"flights": [], "error": f"unknown airport {e}"}))
        return

    try:
        filters = FlightSearchFilters(
            passenger_info=PassengerInfo(adults=1),
            flight_segments=[FlightSegment(
                departure_airport=[[dep_ap, 0]],
                arrival_airport=[[arr_ap, 0]],
                travel_date=date,
            )],
            seat_type=SeatType.ECONOMY,
            stops=MaxStops.ANY,
            sort_by=SortBy.CHEAPEST,
        )
        results = SearchFlights().search(filters) or []
    except Exception as e:
        print(json.dumps({"flights": [], "error": f"search failed: {e}"}))
        return

    # Google Flights' old "#flt=" hash deep link is no longer honored (it
    # dumps you on the homepage). The natural-language "?q=" search URL
    # reliably lands on the exact route + date with the bookable flights.
    from urllib.parse import quote
    book_url = (
        "https://www.google.com/travel/flights?q="
        + quote(f"Flights from {origin} to {dest} on {date} one way")
    )

    flights = []
    for r in results:
        try:
            legs = list(getattr(r, "legs", []) or [])
            if not legs:
                continue
            first, last = legs[0], legs[-1]

            price = float(getattr(r, "price", 0) or 0)
            if price <= 0:
                continue

            dur_min = int(getattr(r, "duration", 0) or 0)
            stops   = int(getattr(r, "stops", max(0, len(legs) - 1)) or 0)

            dep_dt = first.departure_datetime
            arr_dt = last.arrival_datetime

            # Airline name + IATA code for the logo.
            name = getattr(r, "primary_airline_name", None) or str(getattr(first.airline, "value", first.airline))
            prim = getattr(r, "primary_airline", None) or first.airline
            code = getattr(prim, "name", "") or ""
            logo = f"https://www.gstatic.com/flights/airline_logos/70px/{code}.png" if code else ""

            flights.append({
                "airline": {"code": code, "name": name, "logoUrl": logo},
                "origin": origin,
                "dest": dest,
                "flightNumber": (f"{code} {first.flight_number}".strip()
                                 if getattr(first, "flight_number", "") else ""),
                "depTime": dep_dt.strftime("%H:%M"),
                "arrTime": arr_dt.strftime("%H:%M"),
                "depDate": dep_dt.strftime("%Y-%m-%d"),
                "duration": fmt_dur(dur_min),
                "durationMin": dur_min,
                "stops": stops,
                "price": round(price, 2),
                "bookUrl": book_url,
                "source": "fli",
            })
        except Exception:
            continue

    print(json.dumps({"flights": flights}))


if __name__ == "__main__":
    main()
