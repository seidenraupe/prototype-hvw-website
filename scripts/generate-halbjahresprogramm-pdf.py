#!/usr/bin/env python3
"""
Halbjahresprogramm-PDF aus Eventfrog (alle HVW-Org-IDs)
=======================================================

Erzeugt ein A5-PDF nach dem Muster «Halbjahresprogramm 2026_2.pdf»:
tabellarische / blockweise Aufstellung mit Datum, Titel, Kurztext, Ort.

Org-IDs (Default): 4936116, 5116588, 5137433

API-Key:
  EVENTFROG_API_KEY oder Datei cronjobs/eventfrog_api_key

Usage:
  EVENTFROG_API_KEY=… python3 scripts/generate-halbjahresprogramm-pdf.py
  python3 scripts/generate-halbjahresprogramm-pdf.py -o programm/HalbJahresprogramm.pdf

Ausgabe-Default: programm/HalbJahresprogramm.pdf
"""

from __future__ import print_function

import argparse
import json
import os
import re
import sys
from datetime import date, datetime, time, timezone

try:
    from datetime import timezone as _tz
except ImportError:
    _tz = None

import requests
from reportlab.lib.pagesizes import A5
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Frame,
    PageTemplate,
    BaseDocTemplate,
    Paragraph,
    Spacer,
    KeepTogether,
    HRFlowable,
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
DEFAULT_OUTPUT = os.path.join(ROOT_DIR, "programm", "HalbJahresprogramm.pdf")
DEFAULT_ORG_IDS = ["4936116", "5116588", "5137433"]
API_BASE = "https://api.eventfrog.net"
API_KEY_ENV = "EVENTFROG_API_KEY"
PREFERRED_LANGUAGES = ["de", "de_CH", "en", "fr", "it"]

WEEKDAYS_DE = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
]
MONTHS_DE = [
    "",
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
]


def pick_lang(value):
    if not value:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for lang in PREFERRED_LANGUAGES:
            text = value.get(lang)
            if text:
                return text
        for text in value.values():
            if text:
                return text
    return None


def strip_html(html_text):
    if not html_text:
        return None
    text = re.sub(r"<[^>]+>", " ", html_text)
    return re.sub(r"\s+", " ", text).strip() or None


def load_api_key():
    env_key = os.environ.get(API_KEY_ENV, "").strip()
    if env_key:
        return env_key
    candidates = [
        os.path.join(ROOT_DIR, "cronjobs", "eventfrog_api_key"),
        os.path.join(SCRIPT_DIR, "eventfrog_api_key"),
    ]
    for path in candidates:
        try:
            with open(path, "r", encoding="utf-8") as f:
                for raw in f:
                    line = raw.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        name, value = line.split("=", 1)
                        if name.strip() in (API_KEY_ENV, "API_KEY") and value.strip():
                            return value.strip().strip('"').strip("'")
                        continue
                    return line
        except OSError:
            continue
    return None


def api_get(path, params, api_key, timeout=60):
    url = "{0}{1}".format(API_BASE, path)
    # Public API akzeptiert apiKey als Query-Parameter
    query = dict(params)
    query["apiKey"] = api_key
    response = requests.get(url, params=query, timeout=timeout)
    if response.status_code != 200:
        raise RuntimeError(
            "Eventfrog API {0}: HTTP {1}\n{2}".format(
                path, response.status_code, response.text[:500]
            )
        )
    return response.json()


def get_all_events(org_ids, api_key, date_from=None):
    all_events = []
    page = 1
    per_page = 100
    while True:
        params = {
            "orgId": org_ids,
            "page": page,
            "perPage": per_page,
        }
        if date_from:
            params["from"] = date_from
        data = api_get("/public/v1/events", params, api_key)
        events = data.get("events", [])
        all_events.extend(events)
        total = data.get("totalNumberOfResources", len(all_events))
        if len(all_events) >= total or not events:
            break
        page += 1
    return all_events


def get_locations(api_key, location_ids):
    location_ids = [lid for lid in location_ids if lid]
    by_id = {}
    if not location_ids:
        return by_id
    batch_size = 20
    for i in range(0, len(location_ids), batch_size):
        batch = location_ids[i : i + batch_size]
        data = api_get("/public/v1/locations", {"id": batch}, api_key)
        for loc in data.get("locations", []):
            by_id[loc["id"]] = loc
    return by_id


def parse_iso(iso_string):
    if not iso_string:
        return None
    raw = str(iso_string).strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    # Python 3.6: fromisoformat may miss offsets with colon on older versions
    try:
        return datetime.fromisoformat(raw)
    except Exception:
        pass
    for fmt in (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            candidate = raw.replace("+02:00", "+0200").replace("+01:00", "+0100")
            return datetime.strptime(candidate, fmt)
        except Exception:
            continue
    return None


def half_year_bounds(today=None):
    """Aktuelles Halbjahr: Jan–Jun oder Jul–Dez."""
    today = today or date.today()
    year = today.year
    if today.month <= 6:
        start = date(year, 1, 1)
        end = date(year, 6, 30)
        label = "JANUAR BIS JUNI"
        slug = "{0}_1".format(year)
    else:
        start = date(year, 7, 1)
        end = date(year, 12, 31)
        label = "JULI BIS DEZEMBER"
        slug = "{0}_2".format(year)
    return start, end, label, year, slug


def format_date_line(begin_dt, end_dt):
    """z.B. «Sonntag, 23. August 2026, 17:00 Uhr» bzw. mit Endzeit."""
    if not begin_dt:
        return ""
    weekday = WEEKDAYS_DE[begin_dt.weekday()]
    month = MONTHS_DE[begin_dt.month]
    date_part = "{0}, {1}. {2} {3}".format(
        weekday, begin_dt.day, month, begin_dt.year
    )
    start_t = begin_dt.strftime("%H:%M")
    if end_dt and end_dt.date() == begin_dt.date():
        end_t = end_dt.strftime("%H:%M")
        if end_t != start_t:
            # Muster: «10:30 bis 11:30 Uhr» / «11:00 bis 12.30 Uhr»
            end_disp = end_t.replace(":", ".")
            return "{0}, {1} bis {2} Uhr".format(date_part, start_t, end_disp)
    return "{0}, {1} Uhr".format(date_part, start_t)


def format_location(location):
    if not location:
        return ""
    parts = []
    title = pick_lang(location.get("title"))
    street = location.get("addressLine") or ""
    zip_code = location.get("zip") or ""
    city = location.get("city") or ""
    if title:
        parts.append(title)
    addr = ", ".join([p for p in [street, "{0} {1}".format(zip_code, city).strip()] if p])
    if addr:
        if parts:
            return "{0}, {1}".format(parts[0], addr)
        return addr
    return parts[0] if parts else ""


def escape_xml(text):
    if not text:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build_story(events, locations_by_id, year, period_label):
    styles = getSampleStyleSheet()
    style_title = ParagraphStyle(
        "ProgTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        alignment=1,  # center
        spaceAfter=2,
    )
    style_period = ParagraphStyle(
        "ProgPeriod",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        alignment=1,
        spaceAfter=10,
    )
    style_date = ParagraphStyle(
        "EventDate",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        spaceBefore=6,
        spaceAfter=1,
    )
    style_event_title = ParagraphStyle(
        "EventTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        spaceAfter=1,
    )
    style_body = ParagraphStyle(
        "EventBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        spaceAfter=0,
    )
    style_loc = ParagraphStyle(
        "EventLoc",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        spaceAfter=4,
    )

    story = []
    story.append(Paragraph("PROGRAMM {0}".format(year), style_title))
    story.append(Paragraph(period_label, style_period))
    story.append(
        HRFlowable(width="100%", thickness=0.6, color="#1a1a1a", spaceAfter=4)
    )

    for event in events:
        begin_dt = parse_iso(event.get("begin"))
        end_dt = parse_iso(event.get("end"))
        title = pick_lang(event.get("title")) or "Ohne Titel"
        short = pick_lang(event.get("shortDescription"))
        long_plain = strip_html(pick_lang(event.get("descriptionAsHTML")))
        # Muster: kurze Zusatzzeilen unter dem Titel — Kurzbeschreibung, sonst gekürzte Langfassung
        detail = short or (long_plain[:220] + ("…" if long_plain and len(long_plain) > 220 else "") if long_plain else None)

        loc_label = ""
        loc_ids = event.get("locationIds") or []
        if loc_ids:
            loc_label = format_location(locations_by_id.get(loc_ids[0]))

        block = []
        block.append(Paragraph(escape_xml(format_date_line(begin_dt, end_dt)), style_date))
        block.append(Paragraph(escape_xml(title), style_event_title))
        if detail:
            block.append(Paragraph(escape_xml(detail), style_body))
        if loc_label:
            block.append(Paragraph(escape_xml(loc_label), style_loc))
        else:
            block.append(Spacer(1, 4))
        story.append(KeepTogether(block))

    return story


def draw_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillColorRGB(0.15, 0.15, 0.15)
    y = 12 * mm
    left = doc.leftMargin
    right = A5[0] - doc.rightMargin
    canvas.drawString(left, y + 8, "Historischer Verein Winterthur")
    canvas.drawRightString(right, y + 8, "info@hvwinterthur.ch")
    canvas.drawString(left, y, "Römerstrasse 8, 8400 Winterthur")
    canvas.drawRightString(right, y, "www.hvwinterthur.ch")
    canvas.restoreState()


def write_pdf(path, events, locations_by_id, year, period_label):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    doc = BaseDocTemplate(
        path,
        pagesize=A5,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=14 * mm,
        bottomMargin=22 * mm,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=frame, onPage=draw_footer)])
    story = build_story(events, locations_by_id, year, period_label)
    doc.build(story)


def period_label_from_events(events, fallback_label):
    """z.B. «AUGUST BIS DEZEMBER» anhand der enthaltenen Events."""
    months = []
    for event in events:
        begin_dt = parse_iso(event.get("begin"))
        if begin_dt:
            months.append(begin_dt.month)
    if not months:
        return fallback_label
    first = min(months)
    last = max(months)
    if first == last:
        return MONTHS_DE[first].upper()
    return "{0} BIS {1}".format(MONTHS_DE[first].upper(), MONTHS_DE[last].upper())


def select_half_year_events(events, start, end):
    selected = []
    for event in events:
        if event.get("cancelled"):
            continue
        begin_dt = parse_iso(event.get("begin"))
        if not begin_dt:
            continue
        d = begin_dt.date()
        if start <= d <= end:
            selected.append(event)
    selected.sort(key=lambda e: e.get("begin") or "")
    return selected


def main(argv=None):
    parser = argparse.ArgumentParser(description="Halbjahresprogramm-PDF aus Eventfrog")
    parser.add_argument(
        "-o",
        "--output",
        default=DEFAULT_OUTPUT,
        help="Ziel-PDF (Default: programm/HalbJahresprogramm.pdf)",
    )
    parser.add_argument(
        "--org-ids",
        default=",".join(DEFAULT_ORG_IDS),
        help="Kommagetrennte Eventfrog-Org-IDs",
    )
    args = parser.parse_args(argv)

    api_key = load_api_key()
    if not api_key:
        print(
            "Fehler: EVENTFROG_API_KEY fehlt (Env oder cronjobs/eventfrog_api_key).",
            file=sys.stderr,
        )
        return 1

    org_ids = [x.strip() for x in args.org_ids.split(",") if x.strip()]
    start, end, period_fallback, year, slug = half_year_bounds()
    print(
        "Halbjahr-Fenster {0} – {1}, Org-IDs: {2}".format(
            start.isoformat(), end.isoformat(), ", ".join(org_ids)
        )
    )

    events = get_all_events(org_ids, api_key, date_from=start.isoformat())
    events = select_half_year_events(events, start, end)
    period_label = period_label_from_events(events, period_fallback)
    print(
        "{0} Veranstaltung(en), Periode «{1}».".format(len(events), period_label)
    )

    loc_ids = set()
    for event in events:
        for lid in event.get("locationIds") or []:
            loc_ids.add(lid)
    locations_by_id = get_locations(api_key, list(loc_ids))

    out_path = os.path.abspath(args.output)
    write_pdf(out_path, events, locations_by_id, year, period_label)
    print("PDF geschrieben: {0} ({1} Bytes)".format(out_path, os.path.getsize(out_path)))
    meta_path = os.path.splitext(out_path)[0] + ".json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "year": year,
                "periodLabel": period_label,
                "slug": slug,
                "eventCount": len(events),
                "file": os.path.basename(out_path),
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
        f.write("\n")
    print("Meta: {0}".format(meta_path))
    return 0


if __name__ == "__main__":
    sys.exit(main())
