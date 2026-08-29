#!/usr/bin/env python3
"""Validate one JSON QA scorecard against the bundled rubric arithmetic."""

import argparse
import json
from pathlib import Path


MAXIMA = {
    "resolution": 30,
    "accuracy_policy": 25,
    "communication": 20,
    "ownership": 15,
    "process_records": 10,
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scorecard", required=True)
    args = parser.parse_args()
    payload = json.loads(Path(args.scorecard).read_text(encoding="utf-8"))
    errors: list[str] = []
    scores = payload.get("scores", {})

    for name, maximum in MAXIMA.items():
        value = scores.get(name)
        if not isinstance(value, (int, float)) or not 0 <= value <= maximum:
            errors.append(f"{name} must be between 0 and {maximum}")

    if not errors:
        computed = sum(scores[name] for name in MAXIMA)
        expected = min(computed, 49) if payload.get("commercial_claim_cap") else computed
        if payload.get("total") != expected:
            errors.append(f"total must be {expected}, got {payload.get('total')}")

    if not payload.get("evidence"):
        errors.append("at least one evidence item is required")

    if errors:
        print("INVALID")
        for error in errors:
            print(f"- {error}")
        return 1

    print("VALID: score ranges, cap, arithmetic, and evidence passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
