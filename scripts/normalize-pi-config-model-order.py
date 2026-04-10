#!/usr/bin/env python3
"""Rewrite pi.config.json models: Ollama first, then OpenRouter :free (stable order), then other OpenRouter, then rest."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def is_or_free(model_id: str | None) -> bool:
    if not model_id:
        return False
    return model_id.endswith(":free") or ":free" in model_id


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    path = root / "pi.config.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    flat = data.get("models") or []
    ollama = [m for m in flat if m.get("provider") == "ollama"]
    or_all = [m for m in flat if m.get("provider") == "openrouter"]
    or_free = [m for m in or_all if is_or_free(m.get("id"))]
    or_paid = [m for m in or_all if not is_or_free(m.get("id"))]
    rest = [m for m in flat if m.get("provider") not in ("ollama", "openrouter")]
    data["models"] = ollama + or_free + or_paid + rest
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(
        "pi.config.json:",
        f"ollama={len(ollama)}",
        f"openrouter:free={len(or_free)}",
        f"openrouter:other={len(or_paid)}",
        f"other={len(rest)}",
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
