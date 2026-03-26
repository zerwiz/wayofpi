#!/usr/bin/env python3
"""Expand one pi-e menu token into one or more 1-based indices (handles concatenated digits)."""
from __future__ import annotations

import sys


def _greedy_split(digits: str, nmax: int) -> list[int]:
    i = 0
    n = len(digits)
    out: list[int] = []
    while i < n:
        chosen: tuple[int, int] | None = None
        if i + 1 < n:
            v2 = int(digits[i : i + 2])
            if 10 <= v2 <= nmax:
                chosen = (v2, 2)
        if chosen is None:
            v1 = int(digits[i])
            if 1 <= v1 <= min(9, nmax):
                chosen = (v1, 1)
            else:
                print(f"pi-e-expand-selection: cannot parse {digits!r} at offset {i}", file=sys.stderr)
                sys.exit(1)
        out.append(chosen[0])
        i += chosen[1]
    return out


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: pi-e-expand-selection.py <n_options> <token>", file=sys.stderr)
        sys.exit(2)
    nmax = int(sys.argv[1])
    token = sys.argv[2].strip()
    if not token.isdigit():
        print("non-numeric", file=sys.stderr)
        sys.exit(3)
    v = int(token)
    if 1 <= v <= nmax:
        print(v)
        return
    for x in _greedy_split(token, nmax):
        print(x)


if __name__ == "__main__":
    main()
