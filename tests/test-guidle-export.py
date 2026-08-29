#!/usr/bin/env python3
"""coucou_export.json wird als guidle_export.json dupliziert; mus_export nicht."""
import json
import os
import sys
import tempfile
import types

fake_requests = types.ModuleType("requests")
fake_requests.exceptions = types.SimpleNamespace(RequestException=Exception)
sys.modules.setdefault("requests", fake_requests)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "cronjobs"))
from eventfrog_to_coucou import (  # noqa: E402
    copy_guidle_export,
    home_events_output_paths,
    pick_event_image,
)


def main():
    with tempfile.TemporaryDirectory() as tmp:
        coucou = os.path.join(tmp, "coucou_export.json")
        with open(coucou, "w", encoding="utf-8") as f:
            json.dump([{"id": 1}], f)

        dest = copy_guidle_export(coucou)
        expected = os.path.join(tmp, "guidle_export.json")
        if dest != expected:
            raise SystemExit("guidle path mismatch: {0}".format(dest))
        with open(dest, encoding="utf-8") as f:
            if json.load(f) != [{"id": 1}]:
                raise SystemExit("guidle copy content mismatch")

        mus = os.path.join(tmp, "mus_export.json")
        with open(mus, "w", encoding="utf-8") as f:
            json.dump([{"id": 2}], f)
        if copy_guidle_export(mus) is not None:
            raise SystemExit("mus_export must not be copied to guidle")
        if os.path.isfile(os.path.join(tmp, "guidle_export.json")):
            with open(os.path.join(tmp, "guidle_export.json"), encoding="utf-8") as f:
                if json.load(f) != [{"id": 1}]:
                    raise SystemExit("guidle file overwritten by mus export")

    paths = home_events_output_paths("/web")
    expected_paths = [
        "/web/data/home-events.json",
        "/web/vorschau/data/home-events.json",
        "/web/home-events.json",
    ]
    if paths != expected_paths:
        raise SystemExit("home-events paths mismatch: {0}".format(paths))

    image = pick_event_image(
        {"emblemToShow": {"url": "https://cdn.example/a.jpg?w=1"}, "image": "https://ignore.example/x.png"}
    )
    if image != "https://cdn.example/a.jpg":
        raise SystemExit("pick_event_image mismatch: {0}".format(image))

    print("guidle export copy ok")


if __name__ == "__main__":
    main()
