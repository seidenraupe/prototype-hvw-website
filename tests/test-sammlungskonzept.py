#!/usr/bin/env python3
"""Sammlung: Button öffnet das Sammlungskonzept, PDF trägt das HVW-Logo."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "sammlung.html").read_text(encoding="utf-8")
if 'href="Sammlungskonzept.pdf"' not in html:
    raise SystemExit("Button-Link auf Sammlungskonzept.pdf fehlt")
if html.find("Sammlungskonzept") < html.find('id="katalog-heading"'):
    raise SystemExit("Button steht nicht unten bei den Katalog-Links")

pdf = (ROOT / "Sammlungskonzept.pdf").read_bytes()
if b"/Subtype/Image" not in pdf and b"/Subtype /Image" not in pdf:
    raise SystemExit("PDF enthält kein Logo-Bild")

build = (ROOT / "scripts/build-hostpoint-vorschau.sh").read_text(encoding="utf-8")
if "Sammlungskonzept.pdf" not in build:
    raise SystemExit("Vorschau-Build kopiert Sammlungskonzept.pdf nicht")
print("sammlungskonzept ok")
