# Papercuts

A working list of what Ghost and Lumen made hard while building this toolkit, kept in the
repository because the architecture is shaped around it.

**Every Ghost behaviour below was executed against a build of the interpreter**, not
inferred from `SPEC.md` — three of them contradict the spec. Two were caught before they
shipped, by this repository's own tests failing; the rest reached a real run of `lumen .`
as a crash, every one of them in code the engine-independent test suite could not exercise
without Lumen itself. That pattern is the most useful thing in this document: **the bugs
that shipped are precisely the ones that lived in files importing a `lumen:` module**, and
the fix each time was as much about moving logic out of the engine's reach as it was about
the bug itself.

Severity is from the point of view of someone writing a GUI toolkit:

- **high** — silently produces wrong behaviour, or blocks a whole editor
- **mid** — costs real code to work around
- **low** — a surprise you learn once

---

## Ghost

### `and` / `or` do not short-circuit — *high, shipped a crash, looks exactly like the languages it's borrowing from*

```ghost
target = null

if (target == null or target.hint == '') {   // raises: cannot read property `hint` of null
  return null
}
```

Both operands of `and`/`or` are always evaluated — `SPEC.md` §8.4 says this outright ("no
built-in short-circuit special-casing beyond ordinary infix evaluation order: left is
evaluated, then right, then combined"), and the interpreter matches the spec here. The
danger is that Ghost borrows `and`/`or` from Python and Ruby, most of a reader's Ghost code
looks like JavaScript or PHP, and `&&`/`||` short-circuit in every one of those four
languages. A null guard written in the idiom every one of those languages teaches —
`x == null or x.field`, `x != null and x.method()` — passes review, reads correctly, and
crashes the moment the guarded side is actually null. A bare truthy guard has the identical
failure mode: `if (x and x.foo)` evaluates `x.foo` even when `x` is falsy.

This reached a real run of `lumen .` twice while building this toolkit: once as
`Ui.paintTooltip()`'s `target == null or ... or target.hint == ''`, and again — the more
dangerous one — as `Keymap.dispatch()`'s `route == null or !this.passes(route.middleware,
studio)`, which crashed on every keypress with no binding, meaning almost every keypress.
Six more instances were found by an audit of every `and`/`or` in the codebase once the
pattern was known (`Ui.focus`, `Keymap.bind`, `Keymap.passes`, two command availability
guards, `Signals.forget`) — none yet triggered by a real run, all real bugs. The fix
throughout is the same: replace the one-line guard with two `if` statements, so the null
check has already returned before the dereferencing side is ever reached.

**Would fix it:** short-circuit `and`/`or`, matching every language this one is presented
as similar to. If a non-short-circuiting form is wanted for some reason, it should not be
the operator spelled the same way `&&`/`||` are taught.

### A function cannot assign to a variable outside itself — *high, silent*

```ghost
scale = 1

function setScale(n) { scale = n }

setScale(2)
console.log(scale)   // 1
```

Assignment binds in the current environment and never walks outward. No warning. Mutating
an object works (`map.set`, `list.push`, `this.field =`), which is why every piece of state
in this toolkit lives on an instance.

**Would fix it:** assignment walks the scope chain when the name already exists, or an
explicit declaration keyword makes the shadowing intentional.

### Closures created in a loop cannot capture the loop variable — *high, silent until called*

```ghost
// BROKEN: every handler raises `name error: name is not defined` when it runs
for (name in ['pencil', 'eraser']) {
  bar.add(new Button(name).on('click', function () { tools.select(name) }))
}
```

The loop variable is set in the enclosing scope and deleted when the loop ends, so a
closure that outlives the loop finds nothing. Every list-driven widget here wraps the
closure in a `make…` factory. This is the most common shape in UI code.

**Would fix it:** a per-iteration binding, the way `let` behaves in JavaScript.

### Blocks do not introduce a scope — *high, and the spec says otherwise*

An assignment inside an `if`, `switch` or loop body writes to the enclosing function scope.
`Dock.arrange()` depends on this; it is also how a stray temporary leaks across a long
method. `SPEC.md` §8.3 states that blocks each introduce an enclosed environment. They do
not.

### Everything at the top level is exported — *high, design*

A file cannot have a private helper beside a public class, and importing a module drags
its own imports' names along. One-class-per-file makes this survivable rather than solving
it.

**Would fix it:** an explicit `export`, with today's behaviour as the fallback for files
that declare nothing.

### A method's own name shadows a same-named import, in every method of its class — *high, shipped a crash*

```ghost
import "lumen:font"        // binds `font` to the module

class Theme {
  loadFonts(path) {
    this.fonts.set('small', font.system(base))   // resolves to the method below,
  }                                               // not the import — raises at runtime

  font(role) { return this.fonts.get(role) }
}
```

A class's own methods live in its class environment, and a method's function scope
resolves through that environment before it ever reaches the file's imports — the same
mechanism that lets one method call a sibling by bare name. So a method named `font`
shadows an unaliased `import "lumen:font"` for every method in the class, not just the one
declaring it. The failure is `property error: function has no method \`system\`` (or
whichever member is called), pointing at the *call site*, with nothing at either the
import or the method definition to suggest why.

This shipped in `chisel/theme.gs`: `Theme.font(role)` shadowed `import "lumen:font"`
inside `loadFonts()`, and it was never caught here because this repository has no engine
to run `main.gs` against — Ghost's own tests can't import a `lumen:` module, so a plain
`ghost test.gs` run stays green while the shape of the bug sits untested. It surfaced the
first time someone ran `lumen .` for real. Fixed by importing under an alias distinct
from the method name (`import "lumen:font" as fontModule`); `tests/core.gs` now has a
regression test for the *pattern* — a fixture module and a class with a colliding method
name, proving the alias keeps them apart — since it cannot exercise `Theme` itself without
Lumen.

**Would fix it:** the same explicit `export` that would fix everything-is-exported above
would not help here — this is member resolution order, not visibility. A class member
shadowing an import warrants at least a compile-time warning, since nothing else marks the
two as unrelated.

### A function held in a field cannot be called through the field — *mid, loud*

```ghost
this.guard = function (studio) { return true }

this.guard(studio)   // property error: class `Command` has no method `guard`
```

`x.field(...)` parses as a method call, and method lookup does not see fields. The fix is
to bind it to a local first:

```ghost
test = this.guard

test(studio)
```

Found by `tests/core.gs` failing on `Command.isEnabled()`. It makes callbacks-as-fields —
a normal shape for a command, a validator, a comparator — quietly awkward.

### No statics: no named constructors, no class constants — *mid*

`Rect.fromBounds(...)` and `Button.HEIGHT` are both impossible, so factories become
free functions (`asepriteDark()`) and constants move onto the theme. Workable, but it is
the single thing that most distorts library shape.

### Calling a sibling method by bare name loses the receiver — *mid, and the spec says otherwise*

`describe()` inside another method raises ``name error: `this` can only be used inside a
class`` the moment the callee touches `this`, though `SPEC.md` §8.8 says bare sibling calls
are supported. Always write `this.describe()`. The error also points at the callee rather
than the call.

### A field and a method may share one name — *mid*

With both defined, `x.thing` reads the field and `x.thing()` calls the method, silently.
Worth a diagnostic.

### Division always promotes to float — *mid*

Correct, and a tax on every line of pixel layout. `Rect` and `snap()` exist partly to pay
it once.

**Would fix it:** `math.floorDiv(a, b)` — `//` is taken by comments.

### Import ergonomics — *mid*

`import "path" as name` (whole module) and `import name from "path"` (a named export) look
nearly identical and mean different things. Search paths are global and accumulate as
modules load, so resolution is "first match across every directory seen so far", and two
files with the same basename in different folders are a hazard. This repository always
imports by full path from the project root.

Also: a file's imports resolve relative to the file the interpreter was *handed*, which is
why `tests/core.gs` is launched through a root-level `test.gs`.

### Small surprises, learned once — *low*

- Circular imports are a hard fault. Useful, but it dictates the file graph.
- `continue` is a keyword, so a tool's middle verb is `drag`.
- No `const`.
- No `%=`; `++` is postfix only.
- `length()` is a method — `list.length` hands back the function with no error.
- A line beginning with `[` or `(` continues the previous statement, so a destructuring
  assignment needs a `;` on the line above it. This bit two code samples in the tutorial
  before they were run.

---

## Lumen

### No pixel writing, and no image from data — *high, shapes the whole pixel editor*

`Image` has `getPixel` and `setFilter`, and that is all. A document has to be re-rendered
as thousands of `filledRectangle` calls into a `Target` rather than written into a buffer
and uploaded once. It shapes the document, undo and flood-fill design of every editor
here.

**Would fix it:** a mutable `Surface` — create at a size, `getPixel`/`setPixel`,
`upload()`, draw it like an image, encode to PNG.

### No file dialogs, no file drop, no path outside the save directory — *high*

`filesystem` is sandboxed to the app's own save folder and Ghost's `file` module resolves
next to the source, so opening `~/art/thing.png` has no clean path, and there is no
dropped-file callback. Open and save are day-one features for every editor.

### Audio cannot describe or seek a sound — *high, blocks the sound editor*

`audio` gives `play/stop/pause/resume/volume`; `Source` adds `isPlaying`, `setLooping`,
`fadeIn`/`fadeOut`, `setPanning`, `clone`, and a `setPosition(angle, distance)` that is
spatial placement rather than a playhead. A sound editor needs four things that do not
exist: sample access (to draw a waveform at all), a playback position, loop points, and —
if recording is ever in scope — capture.

### `Target` is write-only and unfiltered — *mid*

No `setFilter` (only `Image` has it), no readback, no save. Integer zoom plus a snapped
origin is what keeps pixels square, and "export PNG" has no route other than
`canvas.screenshot()` of the whole window.

### Key names are platform-specific, and an unknown one raises rather than answering false — *high, shipped a crash*

```ghost
keyboard.isDown('left alt', 'right alt')
// value error: `keyboard.isDown()` does not recognise the key `left alt`
```

Two things compound here, and together they make modifier detection by name
unusable:

1. **Names differ per platform.** Lumen resolves them through
   `SDL_GetScancodeFromName`, and what SDL calls a key depends on the keyboard the OS
   reports. `'Left Alt'` on Windows and Linux is `'Left Option'` on macOS. There is no
   list in the docs, and no way to ask for "the alt key" generically.
2. **A name SDL does not recognise is an error, not a false.** So the failure is not a
   shortcut that quietly does not fire — it is the app dying, at the moment a key is
   pressed, on someone else's operating system.

The result: code that works perfectly on the machine it was written on crashes on first
contact with another platform. That is exactly what happened here — `'left ctrl'` resolved
on macOS and `'left alt'` did not, so the crash landed on the *second* line of the
modifier check.

There is also **no way to query modifier state directly** — no `keyboard.modifiers()`, no
`isCtrlDown()` — so name lookups look like the only option.

The workaround, and what this toolkit now does: never hand SDL a name you invented. Track
modifiers from the `keypressed`/`keyreleased` callbacks, which hand you whatever name the
platform actually uses, and match it on substrings (`contains('alt')`,
`contains('option')`). That cannot fail to resolve, works on layouts nobody tested, and
has the side benefit of removing the engine dependency from the keymap entirely — see
`chisel/modifiers.gs`. It does require `keyreleased` and `focus` to be wired up, or a
modifier held while the window loses focus stays stuck down forever.

**Would fix it:** `isDown` answering false for an unrecognised name (a `keyboard.isKnown()`
could serve the typo-catching case), plus a platform-independent way to ask about
modifiers.

### Text is always antialiased, so pixel fonts cannot be drawn crisply — *high*

Lumen renders every string through SDL_ttf's `RenderUTF8Blended`. There is no aliased
path, no hinting control, and no nearest-neighbour option, so a pixel font drawn at
anything other than an exact multiple of its native size comes back as grey mush rather
than hard pixels. For a tool whose entire visual identity is "one pixel is one pixel",
that is the difference between looking like an editor and looking like a web page.

It is survivable only because the *native* size is crisp: Lumen's bundled `silver.ttf` has
`unitsPerEm` 1900 on a 100-unit glyph grid, so it is exact at 19px, 38px, 57px and blurry
at everything between. This toolkit had been loading it at 16px and 32px — both wrong,
which is why the first screenshots were illegible and inconsistent at once. Nothing in the
API hints that font sizes are quantised, and `font.system(16)` succeeds as readily as
`font.system(19)`.

**Would fix it:** a `Solid`/aliased render mode (or a per-font `setFilter('nearest')`),
and a way to ask a font what size it wants to be drawn at.

### No clipboard images, no cursor shapes, bare text input — *mid*

Copy-paste of a selection is table stakes in a sprite editor. Splitters want a resize
cursor. `startTextInput` gives events, while the caret, the selection and the IME rectangle
are yours to build.

### Two small ones, and one thing that is already right — *low*

There is no aligned-text primitive, so every project writes `textIn()` again — worth
promoting into `canvas`. The README undersells `Source`, which has several methods the
docs do not list. And credit where due: `canvas.push('all')` saves and restores the scissor
box along with the transform, so nested clipping — the thing most 2D APIs make you manage
by hand — already works properly.
