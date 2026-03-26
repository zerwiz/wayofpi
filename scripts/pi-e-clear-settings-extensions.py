#!/usr/bin/env python3
"""Set .pi/settings.json \"extensions\" to [] (pi-e CLI stack only)."""
from __future__ import annotations

import json
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    data = json.load(f)
if not isinstance(data, dict):
    sys.exit(1)
data["extensions"] = []
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
