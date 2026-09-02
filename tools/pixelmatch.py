#!/usr/bin/env python3
"""Pixel-exact comparison against Picotron reference screenshots.

Picotron renders a 480x270 framebuffer and scales the whole thing up, so a
screenshot of it is an exact integer multiple of the native image. Every UI
measurement worth having is in those native pixels, and "close enough" is not a
useful standard for a interface that is copying another one pixel for pixel.

Three commands:

  native  <shot.png> [out.png]
          Detect the integer scale and write the 1:1 image. The scale is found
          from the greatest common divisor of colour-run lengths across the
          image, which is exact for nearest-neighbour upscaling.

  palette <img.png>
          Every colour in the image with its pixel count, and the PICO-8 index
          where one matches. Picotron's UI is palette-indexed, so this is how a
          theme gets built from a reference rather than from guesswork.

  compare <reference.png> <render.png> [diff.png]
          Pixel-by-pixel. Reports the exact match percentage and, per mismatched
          pixel, what colour was expected against what was drawn. Writes a diff
          image with matches dimmed and mismatches in magenta.

Exit status is non-zero when a comparison is not a perfect match, so it can gate
a build the same way the tests do.
"""

import sys
from collections import Counter
from math import gcd

try:
    from PIL import Image
except ImportError:
    sys.exit("pixelmatch needs Pillow: pip install pillow")

# PICO-8's sixteen. Picotron's palette extends past these, and the entries it
# adds are recorded in docs/picotron.md as they are confirmed from a reference
# rather than guessed at.
PICO8 = [
    "#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
    "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa",
]


def hexof(rgb):
    return "#%02x%02x%02x" % rgb[:3]


def detect_scale(image):
    """The integer upscale factor, from the gcd of horizontal colour runs."""
    px = image.load()
    width, height = image.size
    factor = 0

    for y in range(0, height, max(1, height // 60)):
        start = 0
        for x in range(1, width):
            if px[x, y] != px[x - 1, y]:
                factor = gcd(factor, x - start)
                start = x

    return max(1, factor)


def to_native(path, out=None):
    image = Image.open(path).convert("RGB")
    scale = detect_scale(image)
    native = image.resize((image.width // scale, image.height // scale), Image.NEAREST)

    print(f"{path}: {image.width}x{image.height} at {scale}x -> {native.width}x{native.height}")

    if out:
        native.save(out)
        print(f"wrote {out}")

    return native


def show_palette(path):
    image = Image.open(path).convert("RGB")
    data = image.tobytes()
    counts = Counter(
        (data[i], data[i + 1], data[i + 2]) for i in range(0, len(data), 3)
    )

    print(f"{path}: {len(counts)} colours\n")
    print("   count  colour     pico-8")

    for rgb, n in counts.most_common():
        code = hexof(rgb)
        index = PICO8.index(code) if code in PICO8 else None
        label = f"{index:>2}" if index is not None else " -"
        print(f"  {n:>6}  {code}  {label}")


def compare(reference_path, render_path, diff_path=None):
    reference = Image.open(reference_path).convert("RGB")
    render = Image.open(render_path).convert("RGB")

    if reference.size != render.size:
        print(f"size mismatch: reference {reference.size} vs render {render.size}")
        return 1

    a, b = reference.load(), render.load()
    width, height = reference.size

    diff = Image.new("RGB", reference.size)
    d = diff.load()

    wrong = Counter()
    bad = 0

    for y in range(height):
        for x in range(width):
            if a[x, y] == b[x, y]:
                # Dim the matching pixels so mismatches stand out.
                r, g, bl = a[x, y]
                d[x, y] = (r // 4, g // 4, bl // 4)
            else:
                bad += 1
                d[x, y] = (255, 0, 255)
                wrong[(hexof(a[x, y]), hexof(b[x, y]))] += 1

    total = width * height
    matched = total - bad
    print(f"{matched}/{total} pixels match ({100.0 * matched / total:.3f}%)")

    if wrong:
        print("\n  count  expected -> drawn")
        for (want, got), n in wrong.most_common(12):
            print(f"  {n:>6}  {want} -> {got}")

    if diff_path:
        diff.save(diff_path)
        print(f"\nwrote {diff_path}")

    return 0 if bad == 0 else 1


def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)

    command = argv[1]

    if command == "native":
        to_native(argv[2], argv[3] if len(argv) > 3 else None)
        return 0

    if command == "palette":
        show_palette(argv[2])
        return 0

    if command == "compare":
        return compare(argv[2], argv[3], argv[4] if len(argv) > 4 else None)

    sys.exit(f"unknown command: {command}")


if __name__ == "__main__":
    sys.exit(main(sys.argv))
