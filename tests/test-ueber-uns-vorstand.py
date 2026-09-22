#!/usr/bin/env python3
"""Vorstand ohne Gruppenfoto; Namen fett; kein Platzhalter-Hinweis."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "ueber-uns.html").read_text(encoding="utf-8")
live = json.loads((ROOT / "data/content-live.json").read_text(encoding="utf-8"))

if "placeholder-vorstand" in html:
    raise SystemExit("Vorstand-Platzhalterbild muss fehlen")
if "ueber-uns.vorstand.note" in html:
    raise SystemExit("Hinweis unter dem Vorstand muss entfernt sein")
if "ueber-uns.vorstand.caption" in html:
    raise SystemExit("Bildlegende ohne Foto nicht im HTML")
if "<strong>Rita Borner</strong>" not in html:
    raise SystemExit("Rita Borner muss fett im HTML stehen")
if live["fields"]["ueber-uns.vorstand.person9"] != "<strong>Tobias Wanzenried</strong> — Veranstaltungen":
    raise SystemExit("person9 ohne Leerzeile in live.json")
if live["fields"]["ueber-uns.vorstand.note"] != "":
    raise SystemExit("note muss leer sein")
for n in range(1, 10):
    key = f"ueber-uns.vorstand.person{n}"
    val = live["fields"].get(key, "")
    if "<strong>" not in val or "</strong>" not in val:
        raise SystemExit(f"{key} braucht fetten Namen in live.json")
    if val.strip().startswith("<br"):
        raise SystemExit(f"{key} darf nicht mit br beginnen")

merge = (ROOT / "scripts/merge-content-json.py").read_text(encoding="utf-8")
if "GIT_WINS_FIELD_IDS" not in merge:
    raise SystemExit("Deploy-Merge muss Vorstand aus Git erzwingen können")

print("ueber uns vorstand ok")
