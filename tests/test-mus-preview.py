#!/usr/bin/env python3
"""MuS-Kontrollseite analog zu /coucou/."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "mus/index.html").read_text(encoding="utf-8")
js = (ROOT / "js/coucou-preview.js").read_text(encoding="utf-8")
htaccess = (ROOT / ".htaccess").read_text(encoding="utf-8")
build = (ROOT / "scripts/build-hostpoint-soft-launch.sh").read_text(encoding="utf-8")

if 'data-export-json="/mus_export.json"' not in html:
    raise SystemExit("mus/index.html zeigt nicht auf mus_export.json")
if 'HVW_EXPORT_JSON = "/mus_export.json"' not in html:
    raise SystemExit("mus/index.html setzt HVW_EXPORT_JSON nicht")
if "coucou-preview.js?v=" not in html:
    raise SystemExit("mus/index.html cache-bustet das Preview-Skript nicht")
if 'id="coucou-rows"' not in html or 'id="coucou-overlay-info"' not in html:
    raise SystemExit("Tabelle oder Overlay fehlt in mus/index.html")
if "/js/coucou-preview.js" not in html:
    raise SystemExit("gemeinsames Preview-Skript fehlt")
if 'getAttribute("data-export-json")' not in js and "HVW_EXPORT_JSON" not in js:
    raise SystemExit("JS liest data-export-json nicht")
if not re.search(r"RewriteRule \^mus\$ /mus/", htaccess):
    raise SystemExit(".htaccess leitet /mus nicht um")
if "mus/index.html" not in build:
    raise SystemExit("Soft-Launch-Build kopiert /mus/ nicht")

print("mus preview ok")
