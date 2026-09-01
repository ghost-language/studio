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

The look is Aseprite's: one-pixel bevels, integer UI scale, docked panels, desaturated
chrome so the artwork is the only loud thing on screen.

```
lumen .
```

## Running it

Download Lumen from [ghostlang.org/download](https://www.ghostlang.org/download), put it
on your `PATH`, and point it at this folder. `main.gs` opens a 32×32 sprite and a 24×16
map, with tabs to switch between them.

- Draw with the left button, background colour with the right.
- Scroll to zoom, middle-drag to pan.
- `B`/`E`/`I` pick pencil, eraser and picker; `S`/`X` are the map's stamp and rubber.
- `Ctrl+Z` / `Ctrl+Shift+Z` undo and redo, `Ctrl+N` a new sprite, `Ctrl+M` a new map.
- `Ctrl+'` toggles the pixel grid, which is off by default.
- `Ctrl+=` and `Ctrl+-` change the UI scale, and it is remembered.

On macOS every `Ctrl+` binding answers to `Cmd+` too — `ctrl` in a binding means "the
platform's accelerator", and literal Ctrl keeps working there as well.

## Changing the font

**A pixel font is only crisp at whole multiples of its native size.** Lumen draws all text
through SDL_ttf's blended path, so a size even one pixel off the font's own grid comes
back as grey fringing rather than hard edges. That is the whole of "why does the text look
blurry".

Lumen's bundled `silver.ttf` has `unitsPerEm` 1900 on a 100-unit glyph grid, so it is
exact at **19px, 38px, 57px** and blurry at everything in between. The theme draws at
`19 × ui.scale`, and the interface metrics are sized around the 21px line height that
produces.

To use your own, set two preferences — or call `theme.loadFonts(path, native)` directly:

```
ui.font      path to a .ttf, resolved against the app directory
ui.fontSize  the size that font is drawn at natively
```

To find that number for a font you have: divide its `unitsPerEm` by the grid its glyph
coordinates are multiples of. A font built on an 8px design grid is crisp at 8, 16 and 24
and blurry at 12. Getting this wrong is the only way to make the interface blurry; getting
it right is the only way to make it sharp.

If you want chrome as tight as Aseprite's, you want a *smaller* face — silver at 19px is a
fairly large pixel font, and the row heights here are sized to fit it.

## Tests

The engine-independent half — geometry, the widget tree, the dock, commands, tools,
signals, history, line drawing — runs under plain Ghost with no window:

```
ghost test.gs
```

Widgets, painting and documents need a running engine and are exercised in the app.

## Layout

```
main.gs                     the entry file: nine forwarding calls into the toolkit
test.gs                     the test entry point

chisel/                     the GUI framework
  support/                  one function per file: snap, chordOf, normalizeChord
  geometry/rect.gs          Rect — the unit of layout
  traits/                   one trait per file: Conditionable, Tappable, EmitsEvents
  theme.gs painter.gs       every colour; every canvas call
  pointer.gs ui.gs          input state, the frame, overlays
  widget.gs                 the base class
  themes/                   one function per theme
  layout/dock.gs            the workspace
  widgets/                  panel, button, toolbar, swatches, tabs, menu, menubar,
                            statusbar, slider, ruler

studio/                     the editor shell
  studio.gs                 the context object handed to everything
  signals.gs preferences.gs commands.gs
  command.gs command-registry.gs keymap.gs
  tool.gs tool-registry.gs history.gs
  viewport.gs               the document, drawn — shared by both editors
  traits/editable.gs        the document contract
  support/line-pixels.gs
  sprite/                   the pixel editor
  map/                      the map editor

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
