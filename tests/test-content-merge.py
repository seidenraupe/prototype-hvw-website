#!/usr/bin/env python3
"""Deploy-Merge: Redaktion behalten, Vorstand aus Git, Entwurf rettet leere Live-Felder."""
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "merge_content", ROOT / "scripts/merge-content-json.py"
)
merge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(merge)

ids = [
    "ueber-uns.vorstand.person1",
    "sammlung.objekt.1.image",
    "sammlung.objekt.1.title",
    "agenda.rueckblick.1.image",
]
seed = {
    "ueber-uns.vorstand.person1": "<strong>Git</strong> — Vorstand",
    "sammlung.objekt.1.image": "",
    "sammlung.objekt.1.title": "Seed-Titel",
    "agenda.rueckblick.1.image": "",
}
remote = {
    "ueber-uns.vorstand.person1": "Christian — ohne strong",
    "sammlung.objekt.1.image": "",
    "sammlung.objekt.1.title": "Redaktions-Titel",
    "agenda.rueckblick.1.image": "",
}
draft = {
    "sammlung.objekt.1.image": "data/uploads/sammlung-1-deadbeef.jpg",
    "agenda.rueckblick.1.image": "data/uploads/rueckblick-1-deadbeef.jpg",
}

live, stats = merge.merge_live_fields(ids, seed, remote, draft)
if live["ueber-uns.vorstand.person1"] != seed["ueber-uns.vorstand.person1"]:
    raise SystemExit("Vorstand muss aus Git kommen")
if live["sammlung.objekt.1.title"] != "Redaktions-Titel":
    raise SystemExit("Sammlungstitel muss vom Server bleiben")
if live["sammlung.objekt.1.image"] != draft["sammlung.objekt.1.image"]:
    raise SystemExit("Leeres Live-Bild muss aus Entwurf übernommen werden")
if live["agenda.rueckblick.1.image"] != draft["agenda.rueckblick.1.image"]:
    raise SystemExit("Agenda-Bild muss aus Entwurf übernommen werden")
if stats.get("promoted_from_draft", 0) < 2:
    raise SystemExit("promote_from_draft Zähler fehlt")

draft_out = merge.merge_draft_fields(
    ids,
    live,
    {
        "sammlung.objekt.1.title": "Entwurf-Titel",
        "sammlung.objekt.1.image": draft["sammlung.objekt.1.image"],
    },
    seed,
)
if draft_out["sammlung.objekt.1.title"] != "Entwurf-Titel":
    raise SystemExit("Redaktions-Entwurf darf nicht auf Seed zurückgesetzt werden")

src = (ROOT / "scripts/merge-content-json.py").read_text(encoding="utf-8")
if "sammlung.objekt.1.image" in merge.INITIAL_SEED_FIELD_IDS:
    raise SystemExit("Sammlung darf nicht in INITIAL_SEED_FIELD_IDS stehen")

print("content merge ok")
