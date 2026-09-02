#!/usr/bin/env python3
"""Hold a rendered frame against every measured Picotron reference tile.

    tools/compare-tiles.py <shot.png> [--write-refs <reference.png>]

Each tile names a region of a real Picotron screenshot. The scene in verify.gs
draws the same chrome at the same coordinates on a 480x270 framebuffer, so a
tile is compared where it sits and no alignment step is needed.

Comparison runs in palette space, because most Picotron screenshots are not
colour-accurate - see docs/picotron.md. Exits non-zero if any tile is short of
a perfect match.
"""
import json
import os
import sys

from PIL import Image

import pixelmatch

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REFERENCE = os.path.join(ROOT, "docs", "reference")


def load_manifest():
    with open(os.path.join(REFERENCE, "tiles.json")) as handle:
        return json.load(handle)["tiles"]


def write_refs(source_path, tiles):
    """Re-cut every reference tile from a full Picotron screenshot."""
    source = Image.open(source_path).convert("RGB")

    for name, (x, y, w, h) in tiles.items():
        source.crop((x, y, x + w, y + h)).save(os.path.join(REFERENCE, name + ".png"))

    print(f"wrote {len(tiles)} tiles from {source_path}")


def compare(shot_path, tiles):
    shot = Image.open(shot_path).convert("RGB")
    failed = []

    for name, (x, y, w, h) in sorted(tiles.items()):
        reference = Image.open(os.path.join(REFERENCE, name + ".png")).convert("RGB")
        drawn = shot.crop((x, y, x + w, y + h))

        # Each side is matched in the capture profile that explains it, so a
        # colour-shifted reference still compares against a canonical render.
        left = pixelmatch.detect_profile(reference)[0]
        right = pixelmatch.detect_profile(drawn)[0]

        a, b = reference.load(), drawn.load()
        bad = 0

        for row in range(h):
            for column in range(w):
                if pixelmatch.nearest_index(a[column, row], left)[0] != \
                   pixelmatch.nearest_index(b[column, row], right)[0]:
                    bad += 1

        total = w * h
        share = 100.0 * (total - bad) / total
        mark = "ok  " if bad == 0 else "FAIL"

        print(f"  {mark} {name:22s} {total - bad:5d}/{total:<5d} {share:7.3f}%")

        if bad:
            failed.append(name)

    print()

    if failed:
        print(f"{len(failed)} of {len(tiles)} tiles differ: {', '.join(failed)}")
        return 1

    print(f"all {len(tiles)} tiles match exactly")
    return 0


def main(argv):
    tiles = load_manifest()

    if "--write-refs" in argv:
        return write_refs(argv[argv.index("--write-refs") + 1], tiles) or 0

    if len(argv) < 2:
        print(__doc__)
        return 2

    return compare(argv[1], tiles)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
