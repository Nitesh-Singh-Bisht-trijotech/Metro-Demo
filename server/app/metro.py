"""
Delhi Metro (DMRC) API Router.

Provides REST endpoints for stations, journeys, fares, live status,
ticket bookings, lost & found, and helpline info.
"""

import time
from datetime import datetime, timezone, timedelta
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["metro"])

LINES = {
    "red": {"name": "Red Line", "color": "#d32f2f"},
    "yellow": {"name": "Yellow Line", "color": "#e0a800"},
    "blue": {"name": "Blue Line", "color": "#1e63d6"},
    "green": {"name": "Green Line", "color": "#2e9d4a"},
    "violet": {"name": "Violet Line", "color": "#7b3fa0"},
    "pink": {"name": "Pink Line", "color": "#e86aa6"},
    "magenta": {"name": "Magenta Line", "color": "#c2188a"},
    "grey": {"name": "Grey Line", "color": "#8a8f98"},
    "airport": {"name": "Airport Express", "color": "#f08a24"},
    "aqua": {"name": "Aqua Line", "color": "#14a9b4"},
    "rapid": {"name": "Rapid Metro", "color": "#3b4cc0"},
}

STATION_DB = {
    "Rithala": ["red"],
    "Pitampura": ["red"],
    "Netaji Subhash Place": ["red", "pink"],
    "Kanhaiya Nagar": ["red"],
    "Inderlok": ["red", "green"],
    "Pratap Nagar": ["red"],
    "Pul Bangash": ["red"],
    "Tis Hazari": ["red"],
    "Kashmere Gate": ["red", "yellow", "violet"],
    "Shastri Park": ["red"],
    "Welcome": ["red", "pink"],
    "Dilshad Garden": ["red"],
    "Vidhan Sabha": ["yellow"],
    "Civil Lines": ["yellow"],
    "Chandni Chowk": ["yellow"],
    "New Delhi": ["yellow", "airport"],
    "Rajiv Chowk": ["yellow", "blue"],
    "Central Secretariat": ["yellow", "violet"],
    "Hauz Khas": ["yellow", "magenta"],
    "Saket": ["yellow"],
    "Qutab Minar": ["yellow"],
    "Huda City Centre": ["yellow"],
    "Dwarka Sector 21": ["blue", "airport"],
    "Mandi House": ["blue", "violet"],
    "Yamuna Bank": ["blue"],
    "Akshardham": ["blue"],
    "Noida Sector 18": ["blue", "aqua"],
    "Lal Qila": ["violet"],
    "ITO": ["violet"],
    "Lajpat Nagar": ["violet", "pink"],
    "Kalkaji Mandir": ["violet", "magenta"],
    "Escorts Mujesar": ["violet"],
    "Delhi Aerocity": ["airport"],
}

FACILITIES = ["Lift", "Escalator", "Parking", "Accessible toilets", "Feeder bus", "Cloak room", "ATM"]

FARE_SLABS = [(2, 11), (5, 21), (12, 32), (21, 43), (32, 54), (float("inf"), 64)]


def hash_of(s: str) -> int:
    h = 2166136261
    for char in s:
        h ^= ord(char)
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def fare_for(km: float) -> int:
    for max_km, fare in FARE_SLABS:
        if km <= max_km:
            return fare
    return 64


def pair_metrics(frm: str, to: str) -> dict:
    key = "|".join(sorted([frm, to]))
    h = hash_of(key)
    distance_km = round(2.5 + (h % 340) / 10.0, 1)
    stops = max(2, round(distance_km / 1.1) + 1)
    duration_min = round(distance_km * 2.1 + 4)
    fare = fare_for(distance_km)
    return {
        "distanceKm": distance_km,
        "stops": stops,
        "durationMin": duration_min,
        "fare": fare,
    }


def build_legs(frm: str, to: str, stops: int):
    lf = STATION_DB.get(frm, ["yellow"])
    lt = STATION_DB.get(to, ["yellow"])
    common = [l for l in lf if l in lt]
    if common:
        line_key = common[0]
        return [{"line": LINES[line_key], "from": frm, "to": to, "stops": stops}]

    hub_name = "Rajiv Chowk"
    for n, lines in STATION_DB.items():
        if any(l in lf for l in lines) and any(l in lt for l in lines):
            hub_name = n
            break

    hl = STATION_DB.get(hub_name, ["yellow"])
    l1 = next((l for l in hl if l in lf), lf[0])
    l2 = next((l for l in hl if l in lt and l != l1), lt[0])
    first = (stops + 1) // 2
    return [
        {"line": LINES[l1], "from": frm, "to": hub_name, "stops": first},
        {"line": LINES[l2], "from": hub_name, "to": to, "stops": max(1, stops - first)},
    ]


# Models
class JourneyRequest(BaseModel):
    from_: str = Field(..., alias="from")
    to: str
    filter: Literal["shortest", "interchange"] = "shortest"


class FareRequest(BaseModel):
    from_: str = Field(..., alias="from")
    to: str


class TicketRequest(BaseModel):
    from_: str = Field(..., alias="from")
    to: str
    passengers: int = Field(default=1, ge=1, le=6)


class LostFoundRequest(BaseModel):
    station: str
    item: str
    phone: str


# Endpoints
@router.get("/stations")
def get_stations():
    """Return all available Delhi Metro stations sorted alphabetically."""
    return sorted(list(STATION_DB.keys()))


@router.post("/journey")
def plan_journey(req: JourneyRequest):
    """Calculate best route and legs between two stations."""
    frm = req.from_.strip()
    to = req.to.strip()
    if frm not in STATION_DB:
        raise HTTPException(status_code=400, detail=f"Unknown origin station: {frm}")
    if to not in STATION_DB:
        raise HTTPException(status_code=400, detail=f"Unknown destination station: {to}")

    metrics = pair_metrics(frm, to)
    legs = build_legs(frm, to, metrics["stops"])
    return {
        "from": frm,
        "to": to,
        "filter": req.filter,
        "interchanges": len(legs) - 1,
        "legs": legs,
        **metrics,
    }


@router.post("/fare")
def calculate_fare(req: FareRequest):
    """Calculate token and smart card fares between stations."""
    frm = req.from_.strip()
    to = req.to.strip()
    if frm not in STATION_DB:
        raise HTTPException(status_code=400, detail=f"Unknown origin station: {frm}")
    if to not in STATION_DB:
        raise HTTPException(status_code=400, detail=f"Unknown destination station: {to}")

    metrics = pair_metrics(frm, to)
    f = metrics["fare"]
    return {
        "from": frm,
        "to": to,
        "distanceKm": metrics["distanceKm"],
        "token": f,
        "smartCard": round(f * 0.9),
        "offPeakCard": round(f * 0.8),
    }


@router.get("/stations/{station}")
def get_station_details(station: str):
    """Get platforms, gates, lines, and facilities for a station."""
    name = station.strip()
    if name not in STATION_DB:
        raise HTTPException(status_code=404, detail=f"Station not found: {name}")

    h = hash_of(name)
    facilities = [fac for i, fac in enumerate(FACILITIES) if i < 2 or ((h >> i) & 1)]
    lines = [LINES[k] for k in STATION_DB[name] if k in LINES]
    return {
        "name": name,
        "lines": lines,
        "interchange": len(lines) > 1,
        "gates": 2 + (h % 4),
        "platforms": 2,
        "firstTrain": "05:30",
        "lastTrain": "23:30",
        "facilities": facilities,
    }


@router.get("/status")
def get_service_status():
    """Get live service status across all metro lines."""
    now = datetime.now().strftime("%I:%M %p")
    lines_status = []
    for key, line in LINES.items():
        is_delayed = key == "yellow"
        lines_status.append({
            **line,
            "status": "delayed" if is_delayed else "normal",
            "note": "Minor delays between Kashmere Gate and Civil Lines." if is_delayed else "Running as per schedule.",
        })
    return {"updatedAt": now, "lines": lines_status}


@router.post("/tickets")
def book_ticket(req: TicketRequest):
    """Generate a digital QR ticket demo."""
    frm = req.from_.strip()
    to = req.to.strip()
    metrics = pair_metrics(frm, to)
    fare = metrics["fare"]
    valid_until = (datetime.now() + timedelta(hours=2)).strftime("%b %d, %Y, %I:%M %p")
    booking_id = f"DM{int(time.time() * 1000):X}"
    return {
        "bookingId": booking_id,
        "from": frm,
        "to": to,
        "passengers": req.passengers,
        "distanceKm": metrics["distanceKm"],
        "fare": fare,
        "total": fare * req.passengers,
        "validUntil": valid_until,
    }


@router.post("/lost-found")
def report_lost_item(req: LostFoundRequest):
    """Submit a lost & found report."""
    ref = f"LF-{int(time.time() * 1000):X}"
    masked = f"******{req.phone[-4:]}" if len(req.phone) >= 4 else req.phone
    return {
        "reference": ref,
        "station": req.station,
        "item": req.item,
        "phone": masked,
    }


@router.get("/help")
def get_help():
    """Return DMRC 24/7 passenger helpline contacts."""
    return {
        "helpline": "155370",
        "email": "feedback@dmrc.example",
        "hours": "24 hours, all days",
    }

