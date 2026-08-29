#!/usr/bin/env python3
"""Validate the shape and monetary grounding of a policy-safe reply."""

import argparse
import re
from pathlib import Path


MONEY = re.compile(
    r"(?:USD\s*|\$)\d+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*%",
    re.IGNORECASE,
)
REQUIRED = ("## Customer reply", "## Grounding check")
DISCOURAGED = ("as per policy", "unfortunately")


def normalized_numbers(text: str) -> set[str]:
    return {re.sub(r"\s+", "", value.upper()) for value in MONEY.findall(text)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--policy", required=True)
    parser.add_argument("--reply", required=True)
    args = parser.parse_args()

    policy = Path(args.policy).read_text(encoding="utf-8")
    reply = Path(args.reply).read_text(encoding="utf-8")
    errors: list[str] = []

    for heading in REQUIRED:
        if heading not in reply:
            errors.append(f"missing required heading: {heading}")

    unsupported = normalized_numbers(reply) - normalized_numbers(policy)
    if unsupported:
        errors.append("unsupported numeric claims: " + ", ".join(sorted(unsupported)))

    for phrase in DISCOURAGED:
        if phrase in reply.lower():
            errors.append(f"tone violation: {phrase}")

    if errors:
        print("INVALID")
        for error in errors:
            print(f"- {error}")
        return 1

    print("VALID: reply shape, tone checks, and numeric grounding passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
