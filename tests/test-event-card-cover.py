#!/usr/bin/env python3
"""Event-Karten: Bilder formatfüllend und zentriert (object-fit: cover)."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
css = (ROOT / "css/site.css").read_text(encoding="utf-8")
index = (ROOT / "index.html").read_text(encoding="utf-8")
main_js = (ROOT / "js/main.js").read_text(encoding="utf-8")

media_img = re.search(
    r"\.event-card__media img\s*\{([^}]+)\}",
    css,
    re.S,
)
if not media_img:
    raise SystemExit("Regel .event-card__media img fehlt")
body = media_img.group(1)
for needle in (
    "position: absolute",
    "inset: 0",
    "object-fit: cover",
    "object-position: center",
    "max-width: none",
):
    if needle not in body:
        raise SystemExit("Cover-Crop fehlt in .event-card__media img: " + needle)

if "#home-events .event-card__media" not in css or "aspect-ratio: 4 / 3" not in css:
    raise SystemExit("Titelseite braucht festen 4:3-Rahmen")

if 'id="home-events"' not in index:
    raise SystemExit("index.html fehlt #home-events")
if "css/site.css?v=" not in index:
    raise SystemExit("index.html muss site.css cache-frei laden")

if "event-card__media aspect-[4/3]" not in main_js:
    raise SystemExit("Home-Event-Karten brauchen 4:3-Medienrahmen")

print("event card cover crop ok")
