#!/usr/bin/env python3
"""Merge Git-Startwerte mit Server-Texten: bestehende Redaktion gewinnt."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def load_json(path: Path | None) -> dict[str, Any]:
    if path is None or not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, dict) else {}


def field_map(data: dict[str, Any]) -> dict[str, str]:
    fields = data.get("fields")
    if not isinstance(fields, dict):
        return {}
    return {str(k): "" if v is None else str(v) for k, v in fields.items()}


def schema_ids(schema: dict[str, Any]) -> list[str]:
    fields = schema.get("fields")
    if not isinstance(fields, dict):
        return []
    return [str(k) for k in fields.keys()]


def merge_live_fields(
    ids: list[str], seed: dict[str, str], remote: dict[str, str]
) -> tuple[dict[str, str], dict[str, int]]:
    """Remote gewinnt, sobald ein Feld dort existiert. Seed nur für neue IDs."""
    out = dict(remote)
    added = 0
    kept = 0
    for field_id in ids:
        if field_id in remote:
            out[field_id] = remote[field_id]
            kept += 1
        else:
            out[field_id] = seed.get(field_id, "")
            added += 1
    return out, {"kept": kept, "added": added, "extra": max(0, len(remote) - kept)}


def merge_draft_fields(
    ids: list[str], live: dict[str, str], remote_draft: dict[str, str]
) -> dict[str, str]:
    out = dict(remote_draft)
    for field_id in ids:
        if field_id in remote_draft:
            out[field_id] = remote_draft[field_id]
        else:
            out[field_id] = live.get(field_id, "")
    return out


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    path.write_text(text, encoding="utf-8")


def selftest() -> None:
    ids = ["a", "b", "c"]
    seed = {"a": "seed-a", "b": "seed-b", "c": "seed-c", "gone": "x"}
    remote = {"a": "redaktion-a", "gone": "keep-me"}
    live, stats = merge_live_fields(ids, seed, remote)
    assert live["a"] == "redaktion-a", live
    assert live["b"] == "seed-b", live
    assert live["c"] == "seed-c", live
    assert live["gone"] == "keep-me", live
    assert stats["kept"] == 1 and stats["added"] == 2, stats

    draft = merge_draft_fields(ids, live, {"a": "entwurf-a"})
    assert draft["a"] == "entwurf-a"
    assert draft["b"] == "seed-b"
    assert draft["c"] == "seed-c"
    print("selftest ok")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--selftest", action="store_true")
    parser.add_argument("--schema", type=Path)
    parser.add_argument("--seed", type=Path, help="content-live.json aus Git")
    parser.add_argument("--remote-live", type=Path)
    parser.add_argument("--remote-draft", type=Path)
    parser.add_argument("--out-live", type=Path)
    parser.add_argument("--out-draft", type=Path)
    args = parser.parse_args()

    if args.selftest:
        selftest()
        return 0

    if not args.schema or not args.seed or not args.out_live:
        parser.error("--schema, --seed und --out-live sind nötig")

    ids = schema_ids(load_json(args.schema))
    seed_doc = load_json(args.seed)
    remote_live_doc = load_json(args.remote_live)
    seed_fields = field_map(seed_doc)
    remote_live = field_map(remote_live_doc)
    live_fields, stats = merge_live_fields(ids, seed_fields, remote_live)

    live_out = dict(remote_live_doc) if remote_live_doc else dict(seed_doc)
    live_out["fields"] = live_fields
    if "updatedAt" not in live_out and seed_doc.get("updatedAt"):
        live_out["updatedAt"] = seed_doc["updatedAt"]
    write_json(args.out_live, live_out)

    if args.out_draft:
        remote_draft_doc = load_json(args.remote_draft)
        draft_fields = merge_draft_fields(ids, live_fields, field_map(remote_draft_doc))
        draft_out = dict(remote_draft_doc) if remote_draft_doc else {}
        draft_out.setdefault("status", "clean")
        draft_out["fields"] = draft_fields
        write_json(args.out_draft, draft_out)

    print(
        f"content-live merge: {stats['kept']} Felder von der Redaktion behalten, "
        f"{stats['added']} neue aus Git ergänzt, {stats['extra']} zusätzliche Server-Felder belassen."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
