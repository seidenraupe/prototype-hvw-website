#!/usr/bin/env python3
"""Sammlung-Objekte editierbar; Lightbox auf Sammlung und Agenda-Rückblick."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
sammlung = (ROOT / "sammlung.html").read_text(encoding="utf-8")
agenda = (ROOT / "agenda.html").read_text(encoding="utf-8")
schema = json.loads((ROOT / "data/content-schema.json").read_text(encoding="utf-8"))
live = json.loads((ROOT / "data/content-live.json").read_text(encoding="utf-8"))
css = (ROOT / "css/site.css").read_text(encoding="utf-8")
lightbox = (ROOT / "js/lightbox.js").read_text(encoding="utf-8")
api = (ROOT / "redaktion/api.php").read_text(encoding="utf-8")
lib = (ROOT / "redaktion/lib.php").read_text(encoding="utf-8")
merge = (ROOT / "scripts/merge-content-json.py").read_text(encoding="utf-8")

for n in range(1, 7):
    for part in ("image", "title", "body"):
        field = f"sammlung.objekt.{n}.{part}"
        if field not in schema["fields"]:
            raise SystemExit(f"Schema fehlt {field}")
        if field not in live["fields"]:
            raise SystemExit(f"Live fehlt {field}")
    if schema["fields"][f"sammlung.objekt.{n}.image"].get("type") != "image":
        raise SystemExit(f"sammlung.objekt.{n}.image ist kein image-Feld")
    if schema["fields"][f"sammlung.objekt.{n}.body"].get("max") != 400:
        raise SystemExit(f"sammlung.objekt.{n}.body muss 400 Zeichen erlauben")
    if f'data-content-image="sammlung.objekt.{n}.image"' not in sammlung:
        raise SystemExit(f"sammlung.html fehlt Bildfeld {n}")
    if f'data-content="sammlung.objekt.{n}.title"' not in sammlung:
        raise SystemExit(f"sammlung.html fehlt Titel {n}")
    if f'data-content="sammlung.objekt.{n}.body"' not in sammlung:
        raise SystemExit(f"sammlung.html fehlt Text {n}")

if sammlung.count("hvw-image-tools") < 6:
    raise SystemExit("Sammlung braucht Upload-Buttons auf allen 6 Objekten")
if sammlung.count("data-lightbox") < 6:
    raise SystemExit("Sammlung braucht Lightbox auf den Objektbildern")
if agenda.count("data-lightbox") < 6:
    raise SystemExit("Agenda-Rückblick braucht Lightbox")
if "lightbox.js" not in sammlung or "lightbox.js" not in agenda:
    raise SystemExit("lightbox.js muss auf Sammlung und Agenda geladen werden")
if "hvw-lightbox" not in css or "object-fit: contain" not in css:
    raise SystemExit("Lightbox-CSS fehlt")
if "hvw-editing" not in lightbox:
    raise SystemExit("Lightbox muss im Redaktionsmodus stumm bleiben")
if "hvw_image_info" not in lib or "sammlung-" not in lib:
    raise SystemExit("lib.php muss Sammlungs-Uploads erlauben")
if "hvw_image_filename($slotInfo)" not in api:
    raise SystemExit("Upload darf getimagesize nicht über den Slot-Namen schreiben")
if "hvw_image_filename" not in lib:
    raise SystemExit("lib.php muss den Upload-Dateinamen aus dem Slot bauen")
if schema["fields"]["sammlung.intro"].get("max") != 400:
    raise SystemExit("sammlung.intro muss 400 Zeichen erlauben")
if schema["fields"]["sammlung.katalog.lead"].get("max") != 400:
    raise SystemExit("sammlung.katalog.lead muss 400 Zeichen erlauben")
if "sammlung.objekt" not in merge:
    raise SystemExit("Merge muss neue Sammlungsfelder seeden")

print("sammlung editor lightbox ok")
