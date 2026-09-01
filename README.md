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
- `Ctrl+=` and `Ctrl+-` change the UI scale, and it is remembered.

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
