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

# Lifted pixel for pixel out of Picotron's own icon browser, which shows the
# file-type set at 1:1 on a 480x270 screen. Every colour below resolved to a
# palette entry at distance nought, which is the check that the transcription
# is exact rather than close.
#
# Transparency is flood-filled from each cell's border rather than matched on
# colour. The paper inside a document is #fff1e8, the same as the browser's own
# page, so matching on colour hollows out every icon - which it duly did on the
# first attempt.
PAINTS = {
    "a": (0x1d, 0x2b, 0x53),   # #1d2b53
    "b": (0xff, 0xf1, 0xe8),   # #fff1e8
    "c": (0xff, 0x77, 0xa8),   # #ff77a8
    "d": (0xff, 0xcc, 0xaa),   # #ffccaa
    "e": (0xff, 0x83, 0x53),   # #ff8353
    "f": (0x97, 0xf1, 0x45),   # #97f145
    "g": (0x00, 0xb4, 0x53),   # #00b453
    "h": (0xff, 0xac, 0xc5),   # #ffacc5
    "i": (0xff, 0x00, 0x4d),   # #ff004d
    "j": (0xa2, 0x88, 0x79),   # #a28879
    "k": (0xc2, 0xc3, 0xc7),   # #c2c3c7
    "l": (0x7e, 0x25, 0x53),   # #7e2553
    "m": (0x00, 0xe4, 0x36),   # #00e436
    "n": (0xff, 0xa3, 0x00),   # #ffa300
    "o": (0xe4, 0x09, 0xaa),   # #e409aa
    "p": (0x00, 0x87, 0x51),   # #008751
    "q": (0x29, 0xad, 0xff),   # #29adff
    "r": (0x65, 0x46, 0x88),   # #654688
    "s": (0xbd, 0x9a, 0xdf),   # #bd9adf
    "t": (0xe4, 0x6e, 0x00),   # #e46e00
    "u": (0x76, 0x2a, 0x2a),   # #762a2a
}

GLYPHS = {
    "document": [
        ".aaaaaaaaaaa....", ".abbbbbbbacaa...", ".abbbbbbbaccaa..", ".abbbbbbbacccaa.",
        ".abbbbbbbacccca.", ".abbbbbbbaaaaaa.", ".abbbbbbbbbbbba.", ".abbccbccbbbbba.",
        ".abbbbbbbbbbbba.", ".abbcccbccbbbba.", ".abbbbbbbbbbbba.", ".abbccbcccbbbba.",
        ".abbbbbbbbbbbba.", ".abbbbbbbbbbbba.", ".abbbbbbbbbbbba.", ".aaaaaaaaaaaaaa.",
    ],
    "sprite": [
        ".aaaaaaaaaaa....", ".abbbbbbbadaa...", ".abbbbbbbaddaa..", ".abbbbbbbadddaa.",
        ".abbbbbbbadddda.", ".abbbbbbbaaaaaa.", ".abbbbbbbbbbbba.", ".abbebbbbebbbba.",
        ".abbeebbeebbbba.", ".abbeeeeeebbbba.", ".abbebeebebbbba.", ".abbebeebebbbba.",
        ".abbbeeeebbbbba.", ".abbbbbbbbbbbba.", ".abbbbbbbbbbbba.", ".aaaaaaaaaaaaaa.",
    ],
    "map": [
        ".aaaaaaaaaaa....", ".abbbbbbbafaa...", ".abbbbbbbaffaa..", ".abbbbbbbafffaa.",
        ".abbbbbbbaffffa.", ".abbbbbbbaaaaaa.", ".abbbbbbbbbbbba.", ".abbgggbggbbbba.",
        ".abbgggbggbbbba.", ".abbgggbbbbbbba.", ".abbbbbgggbbbba.", ".abbggbgggbbbba.",
        ".abbggbgggbbbba.", ".abbbbbbbbbbbba.", ".abbbbbbbbbbbba.", ".aaaaaaaaaaaaaa.",
    ],
    "sound": [
        ".aaaaaaaaaaa....", ".abbbbbbbahaa...", ".abbbbbbbahhaa..", ".abbbbbbbahhhaa.",
        ".abbbbbbbahhhha.", ".abbbbbbbaaaaaa.", ".abbbbiiiiibbba.", ".abbbbibbbibbba.",
        ".abbbbiiiiibbba.", ".abbbbibbbibbba.", ".abbbbibiiibbba.", ".abbiiibiiibbba.",
        ".abbiiibbbbbbba.", ".abbbbbbbbbbbba.", ".abbbbbbbbbbbba.", ".aaaaaaaaaaaaaa.",
    ],
    "palette": [
        ".aaaaaaaaaaa....", ".abbbbbbbajaa...", ".abbbbbbbajjaa..", ".abbbbbbbajjjaa.",
        ".abbbbbbbajjjja.", ".abbbbbbbaaaaaa.", ".abkkkkkkkkkkba.", ".abkllmmbbcckba.",
        ".abkllmmbbcckba.", ".abknnooppbbkba.", ".abknnooppbbkba.", ".abkbbqqbbaakba.",
        ".abkbbqqbbaakba.", ".abkkkkkkkkkkba.", ".abbbbbbbbbbbba.", ".aaaaaaaaaaaaaa.",
    ],
    "cartridge": [
        "................", "aaaaaaaaaaaaaaaa", "abbbbbbbbbbbbbba", "abrrrrrrrrrrrrba",
        "abrrrrrrrrrrrrba", "abrrrrrrrrrrrrba", "abrrrrrrrrrrrrba", "abrrrrrrrrrrrrba",
        "abrrrrrrrrrrrbba", "abbbbbbbbbaaaaaa", "abbssssssbassssa", "abbssssssbasssaa",
        "abbbbbbbbbassaa.", "asssssssssasaa..", "aaaaaaaaaaaaa...", "................",
    ],
    "font": [
        ".ttttttttttt....", ".tbbbbbbbtntt...", ".tbbbbbbbtnntt..", ".tbbbbbbbtnnntt.",
        ".tbbbbbbbtnnnnt.", ".tbbbbbbbtttttt.", ".tbuuuuuuuubbbt.", ".tbubbuubbubbbt.",
        ".tbbbbuubbbbbbt.", ".tbbbbuubbbbbbt.", ".tbbbbuubbbbbbt.", ".tbbbbuubbbbbbt.",
        ".tbbbbuubbbbbbt.", ".tbbbuuuubbbbbt.", ".tbbbbbbbbbbbbt.", ".tttttttttttttt.",
    ],
    "folder": [
        "bbbbbb..........", "bbbbb..oo..hhhh.", "bbbb..oo..hhhhh.", ".........hhhhhh.",
        ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.",
        ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.",
        ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", ".hhhhhhhhhhhhhh.", "................",
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
