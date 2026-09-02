"""Catppuccin Mocha and Latte, and a way to clean a lossy screenshot with them.

The Aseprite references arrived as lossy WebP: 32,000 colours in a screenshot
of an interface that uses about thirty. Recovering exact values out of that is
impossible in the way the Picotron shift-map was possible, because the damage
is not a function - the same true colour comes back differently depending on
what surrounds it.

It does not need to be recovered, only identified. The theme in those
screenshots is Catppuccin, whose values are published and exact, and five of
its colours survive the compression at distance nought (#1e1e2e, #eff1f5,
#dce0e8, #fe640b, #a6e3a1). Snapping to the published palette is therefore not
a guess dressed up as a measurement - it is reading a known answer off a
damaged copy.

The one rule: snap only within a tolerance. A pixel far from every entry is an
antialiased edge or artwork, and pretending otherwise is how the Picotron
nearest-entry bug would have crept back in.
"""

import math

MOCHA = {
    "rosewater": "#f5e0dc", "flamingo": "#f2cdcd", "pink": "#f5c2e7",
    "mauve": "#cba6f7", "red": "#f38ba8", "maroon": "#eba0ac",
    "peach": "#fab387", "yellow": "#f9e2af", "green": "#a6e3a1",
    "teal": "#94e2d5", "sky": "#89dceb", "sapphire": "#74c7ec",
    "blue": "#89b4fa", "lavender": "#b4befe", "text": "#cdd6f4",
    "subtext1": "#bac2de", "subtext0": "#a6adc8", "overlay2": "#9399b2",
    "overlay1": "#7f849c", "overlay0": "#6c7086", "surface2": "#585b70",
    "surface1": "#45475a", "surface0": "#313244", "base": "#1e1e2e",
    "mantle": "#181825", "crust": "#11111b",
}

LATTE = {
    "rosewater": "#dc8a78", "flamingo": "#dd7878", "pink": "#ea76cb",
    "mauve": "#8839ef", "red": "#d20f39", "maroon": "#e64553",
    "peach": "#fe640b", "yellow": "#df8e1d", "green": "#40a02b",
    "teal": "#179299", "sky": "#04a5e5", "sapphire": "#209fb5",
    "blue": "#1e66f5", "lavender": "#7287fd", "text": "#4c4f69",
    "subtext1": "#5c5f77", "subtext0": "#6c6f85", "overlay2": "#7c7f93",
    "overlay1": "#8c8fa1", "overlay0": "#9ca0b0", "surface2": "#acb0be",
    "surface1": "#bcc0cc", "surface0": "#ccd0da", "base": "#eff1f5",
    "mantle": "#e6e9ef", "crust": "#dce0e8",
}

# Aseprite paints the transparency checkerboard in these regardless of theme.
CHECKER = {"checker.light": "#c0c0c0", "checker.dark": "#808080"}


def rgb(value):
    return tuple(int(value[i:i + 2], 16) for i in (1, 3, 5))


def nearest(colour, palette):
    """The closest entry and its distance. Distance is the caller's business."""
    best, best_distance = None, float("inf")

    for name, value in palette.items():
        distance = math.dist(colour, rgb(value))

        if distance < best_distance:
            best, best_distance = name, distance

    return best, best_distance


def clean(image, palette, tolerance=6.0):
    """Snap every pixel within `tolerance` of a palette entry onto it.

    Anything further away is left alone: it is an antialiased edge, artwork, or
    a colour the palette does not contain, and snapping it would invent a
    measurement rather than recover one.
    """
    full = dict(palette)
    full.update(CHECKER)

    out = image.copy()
    pixels = out.load()
    cache = {}

    for y in range(out.height):
        for x in range(out.width):
            colour = pixels[x, y][:3]

            if colour not in cache:
                name, distance = nearest(colour, full)
                cache[colour] = rgb(full[name]) if distance <= tolerance else colour

            pixels[x, y] = cache[colour]

    return out
