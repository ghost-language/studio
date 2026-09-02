# Studio

A toolkit for making game assets, written in [Ghost](https://github.com/ghost-language/ghost)
and running on [Lumen](https://github.com/ghost-language/lumen). Nothing else — no
bindings, no build step, no dependencies.

Studio is two things stacked:

- **Chisel** — a GUI framework: rectangles, painting, widgets, layout, input. It
  knows nothing about editors.
- **Studio** — an editor shell: documents, commands, a keymap, tools, preferences.
  It knows nothing about sprites or maps.

On top of those sit the editors. A **pixel editor** and a **map editor** ship today;
a **sound editor** is designed for and blocked on engine work (see
[Papercuts](docs/papercuts.md)).

The look is Aseprite's construction — pixel bevels, integer UI scale, docked panels,
chrome that recedes so the artwork is the loudest thing on screen — with corners following a
circular quadrant in whole pixels rather than left square, and a palette that is closer to Ghost in the
Shell than to a grey toolbar: near-black grounds with a violet cast, neon purple for
anything selected, cyan held back for focus. The saturated trio for good/careful/stop is
Mario's green, a coin's gold and Mario red, which are as legible together as three colours
get — and the default sprite palette is the NES's Mario sixteen.

```
lumen .
```

## Running it

Download Lumen from [ghostlang.org/download](https://www.ghostlang.org/download), put it
on your `PATH`, and point it at this folder. `main.gs` opens a 32×32 sprite and a 24×16
map, with tabs to switch between them.

- Draw with the left button, background colour with the right.
- Scroll to zoom, middle-drag to pan.
- `B`/`E`/`G`/`L`/`U`/`I` pick pencil, eraser, bucket, line, rectangle and picker;
  `S`/`X` are the map's stamp and rubber.
- `Ctrl+Z` / `Ctrl+Shift+Z` undo and redo, `Ctrl+N` a new sprite, `Ctrl+M` a new map.
- `Ctrl+'` toggles the pixel grid, which is off by default.
- `Ctrl+=` and `Ctrl+-` change the UI scale, and it is remembered.
- `Ctrl+,` opens Preferences: theme, interface scale, pixel grid.

## Themes

Four ship, switchable live from Preferences and remembered between runs:

| name | |
| --- | --- |
| `ghost.dark` | the default — violet-cast near-black, neon purple selection |
| `ghost.light` | the same accent over a cool paper grey |
| `aseprite.dark` | neutral greys, amber accent |
| `aseprite.classic` | the grey-and-teal original |

A theme is one function returning a `Theme` of role tokens (`chisel/themes/`), so adding
one is a twenty-line file plus a line in `theme-named.gs`. Switching rebuilds the workspace,
because the dock's region sizes come from the theme's metrics — the colours alone would
land without it, the sizes would not.

On macOS every `Ctrl+` binding answers to `Cmd+` too — `ctrl` in a binding means "the
platform's accelerator", and literal Ctrl keeps working there as well.

## The playground

```
lumen playground.gs
```

Every control in the kit on one screen, driven by real input: buttons, checkboxes,
radios, sliders, scrollbars, text fields, dropdowns, tabs, labels, icon buttons and the
palette. It imports `chisel/` and nothing else — no Studio, no documents — which is the
point: the framework has to stand on its own before an application leans on it.

Build widgets here first. A bevel is only obviously wrong when you can see it beside
twenty others, and a theme change lands everywhere at once where you can watch it.

## Icons and cursors

Both are placeholder art in a fixed format, so replacing them is a matter of dropping in a
new PNG.

| | `resources/icons.png` | `resources/cursors.png` |
| --- | --- | --- |
| Cell | 16 × 16 px | 16 × 16 px |
| Columns | 8 per row | 8 per row |
| Colour | **white on transparent** | **white on transparent** |
| Order | left to right, top to bottom | left to right, top to bottom |

**White matters.** Every icon is tinted at draw time, so one sheet serves the normal,
dimmed, hovered and selected states and a theme swap recolours all of them at once.
Anything that is not white will fight the tint.

Names are bound to frames in sheet order, in `Studio.loadArt()` and `playground.gs`:

```ghost
new Icons('resources/icons.png', 16)
  .define(['pencil', 'eraser', 'bucket', 'picker', 'select', 'move', 'line', 'rectangle'])
  .define(['ellipse', 'text', 'zoom', 'grid', 'layers', 'frame', 'play', 'stop'])
  .define(['undo', 'redo', 'save', 'open', 'plus', 'minus', 'check', 'close'])
```

Cursors additionally need a **hotspot** — the pixel that is actually "the point", since an
arrow points from its corner and a crosshair from its centre:

```ghost
new Cursors('resources/cursors.png', 16)
  .define('arrow', 0, 0)
  .define('crosshair', 7, 7)
  .define('hand', 8, 8)
```

Lumen has no cursor API beyond showing and hiding the system pointer, so the cursor is
drawn by us, as pixel art, like everything else. A widget asks for one during paint
(`ui.cursor('crosshair')`); the request lasts one frame, so moving away restores the arrow
with nobody having to undo it.

To add art: draw into the next free cell, add its name to the matching `define()` list, and
it is available as `ui.icons.drawIn(name, rect, tint, scale)` or on any button via
`.icon('name')`.

## Changing the font

**A pixel font is only crisp at whole multiples of its native size — if the engine
antialiases it.** Blended text puts grey fringing wherever a glyph edge lands off the
pixel grid, which is the whole of "why does the text look blurry".

Lumen's bundled `silver.ttf` has `unitsPerEm` 1900 on a 100-unit glyph grid, so *blended*
it is exact at 19px, 38px and 57px and blurry at everything between.

**That was a property of the rasteriser, not of the font, and it is fixed.**
[ghost-language/lumen#21](https://github.com/ghost-language/lumen/pull/21) is merged: the
built-in font is drawn with hard edges rather than blended, so **every size is crisp** —
measured at zero mid-grey pixels from 8px to 38px. The theme draws at **16 × ui.scale**
accordingly, with metrics sized around the 8px cap height that produces.

On a Lumen older than that PR, only multiples of 19 are sharp; set `theme.native` back to
19 if you are pinned to one.

To use your own, set two preferences — or call `theme.loadFonts(path, native)` directly:

```
ui.font      path to a .ttf, resolved against the app directory
ui.fontSize  the size that font is drawn at natively
```

To find that number for a font you have: divide its `unitsPerEm` by the grid its glyph
coordinates are multiples of. A font built on an 8px design grid is crisp at 8, 16 and 24
and blurry at 12. Getting this wrong is the only way to make the interface blurry; getting
it right is the only way to make it sharp.

A font you supply yourself still keeps its smoothing, so `ui.fontSize` has to be that
font's own design size or its text will blur.

The cap metrics in `Theme` (`capTop`, `cap`, `baseline`, `descender`) are measured per
size from a real render — text is centred on the cap band, not the em box, which is what
makes a row of chrome look optically centred. Changing `native` means measuring them
again.

## Tests and checks

The engine-independent half — geometry, corner profiles, the widget tree, the dock,
commands, keymap, modifiers, tools, signals, history, line drawing — runs under plain Ghost
with no window, and **exits non-zero on a failed assertion** so it can gate a build:

```
ghost test.gs        # 88 assertions
python3 tools/lint.py
```

The linter covers what the tests structurally cannot. Anything importing a `lumen:` module
is invisible to `ghost test.gs`, and that is exactly where every bug that reached a real run
of this app has lived. It checks the three mistakes that actually shipped:

| check | the bug it catches |
| --- | --- |
| `arity` | a call passing fewer arguments than a callable requires — Ghost needs a default on every optional parameter (shipped 3×) |
| `guards` | `x == null or x.field` — `and`/`or` do not short-circuit, so the guarded side is dereferenced anyway (shipped 2×) |
| `shadow` | a method whose name matches one of its file's imports, which it shadows for the whole class (shipped 1×) |

Both run in CI on every push, along with a parse sweep over every `.gs` file.

Widgets, painting and documents need a running engine and are exercised in the app.

## Layout

```
main.gs                     the pixel editor: forwarding calls into the toolkit
playground.gs               the widget gallery — chisel only, no application
test.gs                     the test entry point

chisel/                     the GUI framework
  support/                  one function per file: snap, normalizeChord
  geometry/rect.gs          Rect — the unit of layout
  traits/                   one trait per file: Conditionable, Tappable, EmitsEvents
  theme.gs painter.gs       every colour and metric; every canvas call
  pointer.gs modifiers.gs   input state, portable modifier tracking
  ui.gs widget.gs           the frame, overlays, the base class
  icons.gs cursors.gs       sprite-sheet art and the software pointer
  themes/                   one function per theme
  layout/                   dock, row, column
  widgets/                  panel button label checkbox radio slider scrollbar
                            field dropdown tabs menu menubar toolbar swatches
                            statusbar ruler

studio/                     the editor shell
  studio.gs                 the context object handed to everything
  signals.gs preferences.gs commands.gs
  command.gs command-registry.gs keymap.gs
  tool.gs tool-registry.gs history.gs
  viewport.gs               the document, drawn — shared by both editors
  traits/editable.gs        the document contract
  sprite/                   the pixel editor: colour bar, timeline, tools
  map/                      the map editor

playground/gallery.gs       every control on one screen
resources/                  icons.png, cursors.png — placeholder art
docs/tutorial.html          how all of it was built, from first principles
docs/papercuts.md           what Ghost and Lumen made hard, and what would fix it
```

## Conventions

Written up in full in [CLAUDE.md](CLAUDE.md). The short version:

- **One class per file, one trait per file, one function per helper file**, named after
  what is inside it.
- **State lives on objects.** Not taste: a Ghost function cannot assign to a variable
  outside itself, so module-level mutable state silently does not work.
- **No service container.** A `Studio` context object is constructed in `load()` and
  passed down; things that really are looked up by name at runtime — commands, tools —
  get their own typed registry.
- **Dependencies point one way**: editors → studio → chisel → lumen. Chisel holds one
  opaque back-reference (`ui.studio`) and never calls into it.

## Status

Working: the dock and every widget listed above, the theme and painter, capture-based
input, tooltips, menus driven by commands, the keymap with guards, undo/redo, both
editors, preferences that persist.

Not yet: splitters and saved panel layout, a command palette, damage rectangles instead
of whole-document repaints, file open/save (blocked — Lumen has no file dialogs and its
filesystem module is sandboxed to the save directory), and the sound editor (blocked —
Lumen's audio API exposes no samples and no playhead).

## Reading

[docs/tutorial.html](docs/tutorial.html) builds this repository from an empty folder, in
order, explaining the reasoning as it goes. Open it in a browser.
