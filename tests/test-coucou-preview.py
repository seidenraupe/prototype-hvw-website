#!/usr/bin/env python3
"""Coucou-Kontrollseite: Footer-Link, Overlay und Format-Erkennung."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "coucou/index.html").read_text(encoding="utf-8")
js = (ROOT / "js/coucou-preview.js").read_text(encoding="utf-8")
htaccess = (ROOT / ".htaccess").read_text(encoding="utf-8")
build = (ROOT / "scripts/build-hostpoint-soft-launch.sh").read_text(encoding="utf-8")

if 'id="coucou-rows"' not in html:
    raise SystemExit("Tabelle fehlt in coucou/index.html")
if 'id="coucou-overlay"' not in html:
    raise SystemExit("Overlay fehlt in coucou/index.html")
if 'id="coucou-overlay-info"' not in html:
    raise SystemExit("Overlay-Info fehlt")
if "/js/coucou-preview.js" not in html:
    raise SystemExit("coucou-preview.js nicht eingebunden")
if "coucou_export.json" not in js:
    raise SystemExit("JS lädt coucou_export.json nicht")
if "naturalWidth" not in js:
    raise SystemExit("Pixelgrösse wird nicht aus dem Bild gelesen")
if not re.search(r"RewriteRule \^coucou\$ /coucou/", htaccess):
    raise SystemExit(".htaccess leitet /coucou nicht um")
if "coucou/index.html" not in build:
    raise SystemExit("Soft-Launch-Build kopiert /coucou/ nicht")
if "js/coucou-preview.js" not in build:
    raise SystemExit("Soft-Launch-Build kopiert coucou-preview.js nicht")

print("coucou preview ok")
