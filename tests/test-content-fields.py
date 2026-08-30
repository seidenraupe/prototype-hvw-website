#!/usr/bin/env python3
"""Schema, Live-JSON und data-content-Attribute müssen zusammenpassen."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
schema = json.loads((ROOT / "data/content-schema.json").read_text(encoding="utf-8"))
live = json.loads((ROOT / "data/content-live.json").read_text(encoding="utf-8"))
schema_ids = set(schema["fields"])
live_ids = set(live["fields"])

missing_live = sorted(schema_ids - live_ids)
extra_live = sorted(live_ids - schema_ids)
if missing_live:
    raise SystemExit("Live fehlt Schema-Felder: " + ", ".join(missing_live))
# extra live keys are allowed as leftovers, but warn
if extra_live:
    print("Hinweis: Live hat Extra-Felder:", ", ".join(extra_live))

html_ids = set()
for path in ROOT.glob("*.html"):
    text = path.read_text(encoding="utf-8")
    html_ids.update(re.findall(r'data-content="([^"]+)"', text))

missing_html = sorted(schema_ids - html_ids)
orphan_html = sorted(html_ids - schema_ids)
if missing_html:
    raise SystemExit("HTML fehlt Schema-Felder: " + ", ".join(missing_html))
if orphan_html:
    raise SystemExit("HTML hat unbekannte data-content: " + ", ".join(orphan_html))

for field_id, meta in schema["fields"].items():
    value = live["fields"][field_id]
    plain = re.sub(r"<[^>]+>", "", value)
    plain = re.sub(r"\s+", " ", plain).strip()
    max_len = int(meta["max"])
    if len(plain) < 1:
        raise SystemExit(f"{field_id} ist leer")
    if len(plain) > max_len:
        raise SystemExit(f"{field_id} zu lang: {len(plain)}/{max_len}")

print("content fields ok:", len(schema_ids))
