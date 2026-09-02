# Picotron, measured

Everything here was measured from a reference screenshot rather than eyeballed,
using `tools/pixelmatch.py`. It is the spec the interface is being rebuilt
against.

Reference tiles live in `docs/reference/`, cropped at 1:1 native resolution.
They are the comparison targets: a widget is correct when
`tools/pixelmatch.py compare` reports 100%.

## The one fact everything else follows from

**Picotron renders a 480×270 framebuffer and scales the whole thing up.**

The reference screenshot is 1920×1057, and the greatest common divisor of every
colour run in it is exactly **4** — so it is a 4× nearest-neighbour upscale of a
480×264 crop of a 480×270 display.

This is the opposite of what Studio does today. Studio draws at the window's
real resolution and multiplies its metrics by a UI scale, so a 1280×800 window
gets 1280×800 pixels of chrome. Picotron draws 480×270 pixels of chrome and
magnifies them. That difference is why the two cannot be reconciled by tuning
numbers: matching Picotron means adopting a fixed logical framebuffer, which
Lumen supports directly:

```ghost
window.setLogicalSize(480, 270)
window.setPixelPerfect(true)
```

Every measurement below is in those native pixels.

## Palette

The whole window uses **nine colours**, five of which are exact PICO-8 palette
entries:

| colour | PICO-8 | used for |
| --- | --- | --- |
| `#fff1e8` | 7 | window body, active tab |
| `#1d2b53` | 1 | list background, checkbox and icon ink |
| `#c2c3c7` | 6 | scrollbar thumb, selected list row |
| `#83769c` | 13 | labels, inactive tab, scrollbar track |
| `#000000` | 0 | window outline |
| `#00a5a1` | — | title bar |
| `#a28879` | — | desktop ground |
| `#654688` | — | title text |
| `#452d32` | — | desktop line art |

So the UI is **palette-indexed**, not free colour. A theme should be a mapping
from role to palette index, and the palette itself fixed.

The four non-PICO-8 entries are Picotron extensions. Only those confirmed from a
reference are recorded — the rest of the 32 are unknown here and should not be
invented.

## Geometry

| element | measurement |
| --- | --- |
| window outline | 1px, `#000000` |
| window corner | 2px cut, profile **[2, 1]** — a chamfer, not a curve |
| title bar | 12px tall including its 1px bottom rule |
| tab row | 12px tall |
| row pitch | **12px** (checkbox tops 12px apart) |
| checkbox | **9×9**, 1px border, 1px inset gap, 5×5 filled when on |
| title text ink | 8px including descenders (cap ≈5px) |

## What this changes about the current build

| | Studio today | Picotron |
| --- | --- | --- |
| rendering | window-resolution, metrics × scale | fixed 480×270, framebuffer scaled |
| colour | free hex per theme | fixed 32-colour palette, indexed |
| surfaces | outline + bevel highlight + shadow | **flat fill + 1px outline, no bevel** |
| corners | radius 5 circular quadrant | 2px chamfer, profile [2,1] |
| font | 16px, 8px cap | ≈5px cap |
| row height | 16px | 12px |
| checkbox | 11px | 9px |

The bevel is the biggest stylistic difference: Picotron's surfaces are flat.
There is no highlight-and-shadow pair anywhere in the reference.

## Verifying

```
tools/pixelmatch.py native  shot.png out.png   # detect scale, write 1:1
tools/pixelmatch.py palette img.png            # colours, with PICO-8 indices
tools/pixelmatch.py compare ref.png render.png diff.png
```

`compare` exits non-zero on any mismatch, names every expected→drawn colour
pair, and writes a diff with matches dimmed and mismatches in magenta.
