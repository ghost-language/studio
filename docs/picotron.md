# Picotron, measured

Everything here was measured from reference screenshots with
`tools/pixelmatch.py`, not eyeballed. It is the spec the interface is being
rebuilt against.

Reference tiles live in `docs/reference/`, cropped at 1:1. They are the
comparison targets: a widget is correct when `pixelmatch.py compare` reports
100%.

## The one fact everything else follows from

**Picotron renders a 480×270 framebuffer and scales the whole thing up.**

Three of the five references are *exactly* 480×270 with no scaling at all, and
a fourth is 1920×1080 — exactly 4×. The greatest common divisor of every colour
run in it is 4, which is what a nearest-neighbour upscale leaves behind and
what a resize never does.

This is the opposite of what Studio does today. Studio draws at the window's
real resolution and multiplies its metrics by a UI scale, so a 1280×800 window
gets 1280×800 pixels of chrome. Picotron draws 480×270 pixels of chrome and
magnifies them. The two cannot be reconciled by tuning numbers: matching
Picotron means adopting a fixed logical framebuffer, which Lumen supports:

```ghost
window.setLogicalSize(480, 270)
window.setPixelPerfect(true)
```

Every measurement below is in those native pixels.

## The palette is five ramps of five

The find that makes the palette usable. One reference contains a palette-file
thumbnail — a 5×5 grid of single pixels at (349,111) — and it is not an
arbitrary set of colours. It is **five ramps, each running dark to light**,
with PICO-8's original sixteen scattered through them:

| ramp | dark → light |
| --- | --- |
| red/pink | `#7e2553` **2** · `#bd003e`~ · `#ff004d` **8** · `#ff77a8` **14** · `#ffacc5` |
| warm | `#762a2a`~ · `#ab5236` **4** · `#e46e00`~ · `#ffa300` **9** · `#ffec27` **10** |
| neutral | `#452d32` · `#5f574f` **5** · `#a28879` · `#c2c3c7` **6** · `#fff1e8` **7** |
| green | `#12535e`~ · `#008751` **3** · `#00b453`~ · `#00e436` **11** · `#97f145`~ |
| blue | `#000000` **0** · `#1d2b53` **1** · `#2766b4`~ · `#29adff` **12** · `#66dff1`~ |

Bold numbers are PICO-8 indices. `~` marks the eight recovered from a
colour-shifted capture (see below), good to about ±3 a channel.

Seven further entries are confirmed colours whose ramp position no reference
showed. Four are plainly a purple ramp; its dark end has not been seen, so it
is not guessed at:

`#654688` · `#754e97` · `#83769c` **13** · `#bd9adf` · `#00a5a1` · `#1c5eac` · `#ffccaa` **15**

25 + 7 = **32**, which is the palette size Picotron documents. The set is
complete, not merely as much as could be found.

**Why the ramps matter more than the list.** A ramp is how a surface gets its
states: a face is a step, hovered is the step above, pressed is the step below.
Because each ramp is a real gradient, that rule holds for all of them — so
"one step lighter" is a single rule the whole interface shares, instead of
forty hand-picked colours that only nearly agree. `chisel/palette.gs` exposes
exactly that: `palette.step('neutral', 3)`.

So the UI is **palette-indexed**, not free colour. A theme is a mapping from
role to ramp-and-step; the palette itself is fixed.

## Screenshots lie about colour, and quietly

Two of the five references carry exact palette values. The other three come
through a pipeline that **darkens every channel by up to 9** — `#fff1e8`
arrives as `#f6eee6`. Visually identical, numerically wrong everywhere.

This matters because it defeats the obvious version of the tool the whole
exercise depends on. A pixel-perfect reproduction compared against one of those
screenshots scores **48.8%**, and the failure looks exactly like a broken
renderer.

The obvious fix — snap every colour to its nearest palette entry — is *also*
wrong, and much more dangerously, because it fails silently on a handful of
pixels rather than loudly on all of them. Measured against real capture pairs
it reads `#6f478e` as `#654688` when it is really a shifted `#754e97`: those
two purples sit 23.3 apart and the shift moves colours up to 15.6, so the
nearest entry is the wrong entry. Both are window chrome, so the corruption
lands precisely where the matching matters.

What works is not guessing at the transform but applying it. Seventeen colours
appear in both an accurate and a shifted capture of the same interface, giving
a measured `true → captured` channel map. It is a function, and it is
monotonic, so it inverts cleanly. `pixelmatch.py` carries it as `SHIFT`,
derives a shifted twin of the palette from it, detects per image which of the
two profiles fits, and matches within that profile. All seventeen pairs then
recover correctly, and a shifted reference against its own canonical twin
scores **100%**.

That inverse map is also what recovered the eight `~` palette entries above.

| reference | size | scale | profile |
| --- | --- | --- | --- |
| file browser | 480×270 | 1× | shifted |
| desktop crop | 1755×733 | resampled | canonical |
| PicoShop | 480×270 | 1× | shifted |
| desktop | 480×270 | 1× | shifted |
| purple desktop | 1920×1080 | 4× | canonical |

The resampled crop is useful for reading icon *shapes* only — it has 256
colours and no integer scale, so nothing may be measured from it.

## Geometry

Measured across three windows in three different references. The geometry is
identical in all of them; only the colours differ, which is what makes it safe
to build on.

| element | measurement |
| --- | --- |
| window outline | 1px — **colour is a theme role, not a rule** |
| window corner | 2px cut, profile **[2, 1]** — a chamfer, not a curve |
| title bar | 11px of fill plus a 1px rule = 12px (all three windows) |
| tab row | 12px tall |
| row pitch | **12px** (checkbox tops 12px apart) |
| checkbox | **9×9**, 1px border, 1px inset gap, 5×5 filled when on |
| title text ink | 8px including descenders (cap ≈5px) |

## What this changes about the current build

| | Studio today | Picotron |
| --- | --- | --- |
| rendering | window-resolution, metrics × scale | fixed 480×270, framebuffer scaled |
| colour | free hex per theme | fixed 32-colour palette, indexed by ramp and step |
| surfaces | outline + bevel highlight + shadow | **flat fill + 1px outline, no bevel** |
| corners | radius 5 circular quadrant | 2px chamfer, profile [2,1] |
| font | 16px, 8px cap | ≈5px cap |
| row height | 16px | 12px |
| checkbox | 11px | 9px |

The bevel is the biggest stylistic difference: Picotron's surfaces are flat.
There is no highlight-and-shadow pair anywhere in any reference.

### The outline colour is a role

Worth stating plainly, because it looked briefly like a law. One window draws a
`#ff77a8` edge against a `#ffacc5` title — exactly one step apart on the red
ramp, which is a tidy rule and would have been a pleasing thing to derive. Two
others draw a black edge, one of them against that same `#ffacc5` title fill.

Same fill, different edge. So the ramp relationship is offered to themes rather
than imposed on them: `surface(rect, fill, edge, cut)` takes both colours, and a
theme that wants edge = fill - 1 step can say so.

## Verifying

```
tools/pixelmatch.py native  shot.png out.png            # detect scale, write 1:1
tools/pixelmatch.py palette img.png                     # colours, with indices
tools/pixelmatch.py compare ref.png render.png d.png    # exact rgb
tools/pixelmatch.py compare ref.png render.png --palette # profile-aware
```

`compare` exits non-zero on any mismatch, names every expected→drawn pair, and
writes a diff with matches dimmed and mismatches in magenta. Use `--palette`
against any screenshot that is not known to be colour-accurate — which, on this
evidence, is most of them.
