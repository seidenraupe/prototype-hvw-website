#!/usr/bin/env python3
"""Kartenbilder füllen den Medien-Rahmen formatfüllend und zentriert."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
css = (ROOT / "css/site.css").read_text(encoding="utf-8")

required = [
    ".event-card__media img",
    "position: absolute",
    "inset: 0",
    "object-fit: cover",
    "object-position: center",
    "max-width: none",
]
for needle in required:
    if needle not in css:
        raise SystemExit(f"site.css fehlt: {needle}")

if "object-position: center top" in css:
    raise SystemExit("Stimmen-Porträts sollen center, nicht center top nutzen")

print("event card cover ok")
