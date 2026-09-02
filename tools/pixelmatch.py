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

  compare <reference.png> <render.png> [diff.png] [--palette]
          Pixel-by-pixel. Reports the exact match percentage and, per mismatched
          pixel, what colour was expected against what was drawn. Writes a diff
          image with matches dimmed and mismatches in magenta.

          --palette quantises both images to the Picotron palette before
          comparing, which is what to use against a screenshot whose colours
          have been shifted by a capture pipeline.

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

# PICO-8's sixteen, which Picotron's palette begins with.
PICO8 = [
    "#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
    "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa",
]

# Picotron entries past the first sixteen, confirmed from colour-accurate
# references rather than guessed. See docs/picotron.md.
# Entries past PICO-8's sixteen, each confirmed from a reference: read straight
# off a colour-accurate capture, or recovered from a shifted one by inverting
# the measured capture map (marked ~ in docs/picotron.md, good to about +/-3 a
# channel).
#
# This is not a complete palette and must not be treated as one. An earlier
# version of this list stopped at sixteen because sixteen plus PICO-8's sixteen
# is thirty-two, which is a number Picotron documents - and that arithmetic was
# a coincidence of the sample read as confirmation. A later screenshot used two
# colours the set could not explain. Picotron's system palette is 64 entries,
# so more will turn up; the honest description of this list is "every entry
# seen so far", and detect_profile() reporting a poor fit is how a missing one
# announces itself.
EXTENDED = [
    "#00a5a1", "#a28879", "#654688", "#452d32", "#bd9adf", "#754e97", "#1c5eac",
    "#ffacc5", "#bd003e", "#762a2a", "#e46e00", "#12535e", "#00b453", "#97f145",
    "#2766b4", "#66dff1", "#ff8353", "#e409aa",
]

PALETTE = PICO8 + EXTENDED


def hexof(rgb):
    return "#%02x%02x%02x" % rgb[:3]


def as_rgb(code):
    return tuple(int(code[i:i + 2], 16) for i in (1, 3, 5))


PALETTE_RGB = [as_rgb(c) for c in PALETTE]


# Screenshots are not always colour-accurate. Several references here come
# through a pipeline that darkens every channel by up to 9, so #fff1e8 arrives
# as #f6eee6. Comparing raw RGB against one of those reports a nought per cent
# match for a pixel-perfect reproduction, which is worse than useless.
#
# The obvious fix - snap every colour to its nearest palette entry - is wrong,
# and quietly so. Measured against real capture pairs it misreads #6f478e as
# #654688 when it is really a shifted #754e97: those two purples sit 23 apart
# and the shift moves colours by up to 16, so the nearest entry is the wrong
# entry. Both are Picotron window chrome, so the failure lands exactly where
# the matching matters.
#
# So the transform is not guessed at, it is applied. This is the measured
# true -> captured channel map, from seventeen colours that appear in both a
# colour-accurate and a shifted capture of the same interface. It is a
# function and it is monotonic, so it inverts cleanly.
SHIFT = {
    0: 0, 28: 23, 29: 23, 39: 31, 41: 39, 43: 39, 54: 47, 77: 71, 78: 71,
    83: 79, 94: 87, 117: 111, 118: 111, 119: 111, 121: 119, 131: 126,
    136: 134, 151: 142, 154: 150, 156: 150, 161: 158, 162: 158, 163: 158,
    165: 158, 168: 166, 170: 166, 172: 166, 173: 166, 189: 182, 194: 190,
    195: 190, 197: 190, 199: 190, 204: 198, 223: 214, 228: 222, 232: 230,
    236: 230, 241: 238, 255: 246,
}


def shifted_channel(value):
    """The measured map, linearly interpolated between sampled points."""
    if value in SHIFT:
        return SHIFT[value]

    keys = sorted(SHIFT)
    below = max([k for k in keys if k < value], default=keys[0])
    above = min([k for k in keys if k > value], default=keys[-1])

    if above == below:
        return SHIFT[below]

    across = (value - below) / (above - below)

    return int(round(SHIFT[below] + across * (SHIFT[above] - SHIFT[below])))


# Two ways the same palette reaches a PNG. Matching happens within whichever
# profile explains an image better, so indices stay comparable across both.
PROFILES = {
    "canonical": PALETTE_RGB,
    "shifted": [tuple(shifted_channel(c) for c in entry) for entry in PALETTE_RGB],
}


def nearest_index(rgb, profile="canonical"):
    """The palette entry closest to a colour, by squared distance."""
    best, best_distance = 0, None

    for index, entry in enumerate(PROFILES[profile]):
        distance = sum((a - b) ** 2 for a, b in zip(rgb, entry))

        if best_distance is None or distance < best_distance:
            best, best_distance = index, distance

    return best, best_distance ** 0.5


def detect_profile(image):
    """Which capture profile an image's colours fit best.

    Scored over distinct colours weighted by area, so a stray antialiased pixel
    cannot outvote the flat fills that make up the interface.
    """
    colours = Counter(image.getdata())
    scores = {}

    for name in PROFILES:
        scores[name] = sum(
            nearest_index(c[:3], name)[1] * n for c, n in colours.items()
        ) / max(1, sum(colours.values()))

    return min(scores, key=scores.get), scores


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


def compare(reference_path, render_path, diff_path=None, in_palette=False):
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
    far = 0

    # Each side is matched within the capture profile that explains it, so a
    # colour-accurate render and a shifted screenshot still compare by index.
    profiles = {}

    if in_palette:
        for label, image in (("a", reference), ("b", render)):
            name, scores = detect_profile(image)
            profiles[label] = name
            print(f"  {label}: {name} profile (fit {scores[name]:.2f})")

    def key(rgb, side="a"):
        if not in_palette:
            return rgb

        index, distance = nearest_index(rgb, profiles[side])

        # A colour that is nowhere near any palette entry is worth knowing
        # about: it means the palette is incomplete, not that the pixel is
        # wrong.
        if distance > 24:
            nonlocal far
            far += 1

        return index

    for y in range(height):
        for x in range(width):
            if key(a[x, y], "a") == key(b[x, y], "b"):
                # Dim the matching pixels so mismatches stand out.
                r, g, bl = a[x, y]
                d[x, y] = (r // 4, g // 4, bl // 4)
            else:
                bad += 1
                d[x, y] = (255, 0, 255)
                wrong[(hexof(a[x, y]), hexof(b[x, y]))] += 1

    total = width * height
    matched = total - bad
    mode = "palette" if in_palette else "exact rgb"
    print(f"{matched}/{total} pixels match ({100.0 * matched / total:.3f}%)  [{mode}]")

    if far:
        print(f"warning: {far} pixel reads were >24 from any known palette entry")

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
        rest = [a for a in argv[2:] if a != "--palette"]
        return compare(
            rest[0],
            rest[1],
            rest[2] if len(rest) > 2 else None,
            in_palette="--palette" in argv,
        )

    sys.exit(f"unknown command: {command}")


if __name__ == "__main__":
    sys.exit(main(sys.argv))
