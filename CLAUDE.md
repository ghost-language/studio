# CLAUDE.md

Guidance for Claude Code, and for anyone else, working in this repository.

## What this is

A GUI framework (`chisel/`) and an editor shell (`studio/`) written in Ghost, running on
Lumen. A pixel editor and a map editor sit on top; a sound editor is planned. There is no
build step: `lumen .` runs the app, `ghost test.gs` runs the tests.

## Layering, and the one rule that matters

```
editors  →  studio  →  chisel  →  lumen
```

Dependencies point one way. `chisel/` must never import anything from `studio/`. The one
exception is `Ui.studio`, an opaque back-reference the shell sets and the framework never
calls into — widgets that belong to an application read it, the framework does not.

## File conventions

- **One class per file**, named after the class: `chisel/widgets/button.gs` holds
  `Button`. Multi-word file names are kebab-case (`command-registry.gs`).
- **One trait per file**, same rule.
- **One function per helper file**, in a `support/` folder.
- A file may also hold small closure factories used only by that file, prefixed `make`
  (`makeSelectHandler`). They exist because Ghost cannot capture a loop variable, and they
  are the exception rather than a licence to add loose functions.
- Free-standing functions otherwise appear only in `main.gs`, where Lumen's callbacks
  have to live.

## Ghost rules this codebase is shaped around

These were verified by running them, not read from the spec. See `docs/papercuts.md` for
the full list and what would fix each one upstream.

- **`and` / `or` do not short-circuit.** Both operands are always evaluated, so
  `x == null or x.field` still dereferences a null `x`. A null check that guards a
  dereference is its own `if`, never folded into the same expression. This has crashed
  this app in production; it is the single easiest mistake to make here.
- **A function cannot assign to a variable outside itself.** Module-level mutable state
  does not work; state lives on instances. Mutating an object (`map.set`, `list.push`,
  `this.field =`) is fine.
- **Closures cannot capture a loop variable.** Anything built per-item in a loop needs a
  `make…` factory around the closure.
- **Call sibling methods as `this.method()`.** A bare call loses the receiver.
- **A function held in a field cannot be called as `this.field(...)`** — that parses as a
  method call and method lookup does not see fields. Bind it to a local first.
- **End a statement with `;` when the next line opens with `[` or `(`.** Ghost has no
  newline rule, so the next line otherwise continues the previous expression. This bites
  every destructuring assignment.
- **Blocks do not introduce a scope.** An assignment inside an `if` or a loop writes to
  the enclosing function.
- **`/` always produces a float.** Layout arithmetic goes through `Rect` or `snap()`.
- **Circular imports are a hard fault.** Keep shared types in leaf modules.
- **Import by full path from the project root** (`import { Rect } from
  "chisel/geometry/rect"`). Search paths accumulate globally and first match wins.
- **A class method's name shadows a same-named import** in every method of that class.
  Import under an alias when they would collide (`import "lumen:font" as fontModule`).

## Engine rules

- **Never hand Lumen a key name you invented.** SDL's names are platform-specific
  (`'Left Alt'` is `'Left Option'` on macOS) and an unrecognised one *raises*. Modifier
  state is tracked from the key events themselves, in `chisel/modifiers.gs`; `main.gs` must
  keep forwarding `keyreleased` and `focus` or modifiers stick down.
- **Font sizes are quantised.** Lumen renders text antialiased with no aliased option, so a
  pixel font is crisp only at whole multiples of its native size — 19px for the bundled
  `silver.ttf`. Any other size is visibly blurry. See `Theme.loadFonts()`.
- **Anything that imports a `lumen:` module cannot be unit-tested here**, since
  `ghost test.gs` has no engine. Every bug that has reached a real run of this app lived in
  such a file. Keep logic out of engine-touching files where you can — that is why
  `Keymap` takes a chord rather than a key, and why `Modifiers` takes a flag rather than
  reading `system.os` itself.

## Look and feel

Aseprite's rules, encoded in `Theme` and `Painter`:

- Every coordinate is an integer; UI scale is a whole number; fonts load at whole
  multiples of their design size.
- Depth is two one-pixel lines, never a shadow. No rounded corners, no gradients, no
  transitions.
- Five control states and nothing between them: normal, hover, pressed, selected,
  disabled.
- Widgets ask the theme for roles (`theme.of('button.face')`), never for colours. A
  colour literal in a widget file is a bug.
- Every command carries its own accelerator, and menus and tooltips read it from there.

## Testing

`ghost test.gs` runs `tests/core.gs`, which covers everything that does not need a
window. Add cases there for anything with arithmetic or bookkeeping in it. Widgets and
painting are checked by running the app.
