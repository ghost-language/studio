#!/usr/bin/env python3
"""Draw the icon, glyph and cursor sheets from the art below.

    tools/make-icons.py

The art lives here as ASCII rather than in the PNGs, so that changing an icon
is a readable diff instead of a binary blob nobody can review. The PNGs are
build output; this file is the source.

Picotron uses two different icon languages, and the difference is not
decorative:

  Control icons - toolbar buttons, tools, arrows - are monochrome 7x7
  silhouettes in one colour, drawn on the toolbar's own ground with no outline.
  Because they are one colour they can be tinted at draw time, so a single
  sheet serves normal, dimmed, hovered and selected states and a theme swap
  recolours all of them at once. White on transparent, tinted on use.

  File icons - folder, document, cartridge - are full-colour 15x16 art with a
  1px #1d2b53 outline and two fill tones. These are pictures, not symbols;
  tinting one would destroy it. They ship at their real colours.

The size matters as much as the style. Picotron's control icons are 7x7 in an
8x8 cell, not 16x16. On a 480x270 framebuffer a 16x16 tool button is more than
twice the height of the row it sits in, which is most of why the old sheet
could never have looked right no matter how it was drawn.
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- control icons: 7x7 monochrome, tinted at draw time ----------------------
#
# `#` is ink, `.` is transparent. Eight per row, in the order Studio binds them.
ICON_CELL = 8
ICONS = {
    # Drawing tools.
    "pencil":    ["....##.", "...###.", "..###..", ".###...", "###....", "##.....", "#......"],
    "eraser":    ["..#####", ".##...#", "##...##", "#...##.", "#..##..", "####...", "......."],
    "bucket":    [".##....", "####...", "#####..", ".####.#", "..##..#", "......#", ".....##"],
    "picker":    ["...####", "...#..#", "..####.", ".##....", "##.....", "#......", "......."],
    "select":    ["##.##.#", "#.....#", "#.....#", ".......", "#.....#", "#.....#", "#.##.##"],
    "move":      ["...#...", "..###..", "...#...", "#.###.#", "...#...", "..###..", "...#..."],
    "line":      ["......#", ".....#.", "....#..", "...#...", "..#....", ".#.....", "#......"],
    "rectangle": ["#######", "#.....#", "#.....#", "#.....#", "#.....#", "#.....#", "#######"],

    # Shapes and view.
    "ellipse":   ["..###..", ".#...#.", "#.....#", "#.....#", "#.....#", ".#...#.", "..###.."],
    "text":      ["#######", "...#...", "...#...", "...#...", "...#...", "...#...", "...#..."],
    "zoom":      [".###...", "#...#..", "#...#..", "#...#..", ".###...", "....##.", ".....##"],
    # Measured off Picotron's own view toggle, pixel for pixel.
    "grid":      ["###.###", "###.###", "###.###", ".......", "###.###", "###.###", "###.###"],
    "layers":    [".#####.", ".#...#.", ".#####.", "#####.#", "#...#..", "#...#..", "#####.."],
    "frame":     ["##...##", "#.....#", ".......", ".......", ".......", "#.....#", "##...##"],
    "play":      ["#......", "##.....", "####...", "######.", "####...", "##.....", "#......"],
    "stop":      [".......", ".#####.", ".#####.", ".#####.", ".#####.", ".#####.", "......."],

    # History and files.
    "undo":      ["..#....", ".##....", "#####..", ".##..#.", "..#..#.", ".....#.", "..####."],
    "redo":      ["....#..", "....##.", "..#####", ".#..##.", ".#...#.", ".#.....", ".####.."],
    "save":      ["#######", "#.###.#", "#.###.#", "#.....#", "#.###.#", "#.###.#", "#######"],
    "open":      ["###....", "#..#...", "#######", "#.....#", "#.....#", "#.....#", "#######"],
    "plus":      ["...#...", "...#...", "...#...", "#######", "...#...", "...#...", "...#..."],
    "minus":     [".......", ".......", ".......", "#######", ".......", ".......", "......."],
    "check":     ["......#", ".....#.", "#...#..", ".#.#...", "..#....", ".......", "......."],
    "close":     ["#.....#", ".#...#.", "..#.#..", "...#...", "..#.#..", ".#...#.", "#.....#"],
}

# --- file icons: full colour, 15x16, as measured off Picotron -----------------
GLYPH_CELL = 16
PAINTS = {
    "K": (0x1d, 0x2b, 0x53),   # outline, on every one of them
    "p": (0xff, 0xac, 0xc5),   # folder face
    "r": (0xff, 0x00, 0x4d),   # accent: folder tab, document rules
    "u": (0x65, 0x46, 0x88),   # cartridge body
    "U": (0xbd, 0x9a, 0xdf),   # cartridge label
    "w": (0xff, 0xf1, 0xe8),   # paper
}
GLYPHS = {
    "folder": [
        ".....KKKKKKKKKK", "....KKrrKKppppK", "...KKrrKKpppppK", "KKKKKKKKppppppK",
        "ppppppppppppppK", "ppppppppppppppK", "ppppppppppppppK", "ppppppppppppppK",
        "ppppppppppppppK", "ppppppppppppppK", "ppppppppppppppK", "ppppppppppppppK",
        "ppppppppppppppK", "ppppppppppppppK", "ppppppppppppppK", "KKKKKKKKKKKKKKK",
    ],
    "document": [
        "KKKKKKKKKKKwwww", "KwwwwwwwKpKKwww", "KwwwwwwwKppKKww", "KwwwwwwwKpppKKw",
        "KwwwwwwwKppppKw", "KwwwwwwwKKKKKKw", "KwwwwwwwwwwwwKw", "KwwrrrwwwwwwwKw",
        "KwwwwwwwwwwwwKw", "KwwrrrrrwwwwwKw", "KwwwwwwwwwwwwKw", "KwwrrrrrwwwwwKw",
        "KwwwwwwwwwwwwKw", "KwwwwwwwwwwwwKw", "KwwwwwwwwwwwwKw", "KKKKKKKKKKKKKKw",
    ],
    "cartridge": [
        "KKKKKKKKKKKKKKK", "..............K", ".uuuuuuuuuuuu.K", ".uuuuuuuuuuuu.K",
        ".uuuuuuuuuuuu.K", ".uuuuuuuuuuuu.K", ".uuuuuuuuuuuu.K", ".uuuuuuuuuuu..K",
        ".........KKKKKK", "..UUUUUU.KUUUUK", "..UUUUUU.KUUUKK", ".........KUUKK.",
        "UUUUUUUUUKUKK..", "KKKKKKKKKKKK...", "...............", "...............",
    ],
}

# --- cursors: monochrome, tinted, with a hotspot -----------------------------
#
# Picotron's pointer is a hollow outline, not a filled arrow with a border:
# every interior pixel is whatever is behind it. Measured off the reference.
CURSOR_CELL = 8
CURSORS = {
    "arrow":     (1, 0, [".#....", "#.#...", "#..#..", "#...#.", "#....#", "#..##.", ".##.#."]),
    "crosshair": (3, 3, ["...#...", ".......", ".......", "#.....#", ".......", ".......", "...#..."]),
    "hand":      (3, 1, [".##....", "#..#...", "#..#.##", "#..#..#", "#.....#", ".#....#", "..####."]),
    "ibeam":     (2, 3, ["##.##", "..#..", "..#..", "..#..", "..#..", "..#..", "##.##"]),
    "resize-h":  (3, 3, [".......", "..#.#..", ".#...#.", "#######", ".#...#.", "..#.#..", "......."]),
    "resize-v":  (3, 3, ["...#...", "..###..", ".......", "#.....#", ".......", "..###..", "...#..."]),
}


def sheet(art, cell, columns, paint):
    """Lay art out left to right, top to bottom, one entry per cell."""
    rows = (len(art) + columns - 1) // columns
    image = Image.new("RGBA", (columns * cell, rows * cell), (0, 0, 0, 0))
    pixels = image.load()

    for index, (name, grid) in enumerate(art.items()):
        ox = (index % columns) * cell
        oy = (index // columns) * cell

        for y, line in enumerate(grid):
            for x, mark in enumerate(line):
                if mark == ".":
                    continue

                pixels[ox + x, oy + y] = paint(mark)

    return image


def main():
    resources = os.path.join(ROOT, "resources")

    # White, so that a tint at draw time is a straight multiply.
    icons = sheet(ICONS, ICON_CELL, 8, lambda mark: (255, 255, 255, 255))
    icons.save(os.path.join(resources, "icons.png"))

    glyphs = sheet(GLYPHS, GLYPH_CELL, 8, lambda mark: PAINTS[mark] + (255,))
    glyphs.save(os.path.join(resources, "glyphs.png"))

    cursors = sheet(
        {name: grid for name, (_, _, grid) in CURSORS.items()},
        CURSOR_CELL, 8, lambda mark: (255, 255, 255, 255),
    )
    cursors.save(os.path.join(resources, "cursors.png"))

    print(f"icons.png    {icons.size[0]}x{icons.size[1]}  {len(ICONS)} at {ICON_CELL}px, white on transparent")
    print(f"glyphs.png   {glyphs.size[0]}x{glyphs.size[1]}  {len(GLYPHS)} at {GLYPH_CELL}px, full colour")
    print(f"cursors.png  {cursors.size[0]}x{cursors.size[1]}  {len(CURSORS)} at {CURSOR_CELL}px, white on transparent")
    print()
    print("hotspots: " + ", ".join(f"{n} ({x},{y})" for n, (x, y, _) in CURSORS.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
