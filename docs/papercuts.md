# Papercuts

A working list of what Ghost and Lumen made hard while building this toolkit, kept in the
repository because the architecture is shaped around it.

**Every Ghost behaviour below was executed against a build of the interpreter**, not
inferred from `SPEC.md` — three of them contradict the spec, and two were found by tests
in this repository failing.

Severity is from the point of view of someone writing a GUI toolkit:

- **high** — silently produces wrong behaviour, or blocks a whole editor
- **mid** — costs real code to work around
- **low** — a surprise you learn once

---

## Ghost

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

### An unknown key name raises rather than answering false — *mid*

Good for a typo in a game's `isDown` call; harsh for a keymap, where a mistyped binding in
a data file crashes the app the moment someone presses that key. Names are SDL scancode
names (`'Left Ctrl'`, not `'lctrl'`), which is worth documenting louder.

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
