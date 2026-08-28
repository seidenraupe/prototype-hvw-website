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
from eventfrog_to_coucou import copy_guidle_export  # noqa: E402


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

    print("guidle export copy ok")


if __name__ == "__main__":
    main()
