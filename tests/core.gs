// Engine-independent tests. Everything here runs under plain Ghost - no window,
// no SDL - because none of it imports a `lumen:` module:
//
//   ghost tests/core.gs
//
// The widgets, the painter and the documents need a running engine and are
// exercised by hand in the app itself.

import { Rect } from "chisel/geometry/rect"
import { Widget } from "chisel/widget"
import { Dock } from "chisel/layout/dock"
import { Command } from "studio/command"
import { CommandRegistry } from "studio/command-registry"
import { Tool } from "studio/tool"
import { ToolRegistry } from "studio/tool-registry"
import { Signals } from "studio/signals"
import { History } from "studio/history"
import { Editable } from "studio/traits/editable"
import { linePixels } from "studio/support/line-pixels"
import { normalizeChord } from "chisel/support/normalize-chord"
import "tests/fixtures/toolkit" as toolkitModule

results = { passed: 0, failed: 0 }

function check(label, actual, expected) {
  if (`${actual}` == `${expected}`) {
    results.passed = results.passed + 1

    return true
  }

  results.failed = results.failed + 1

  console.log(`  FAIL ${label}: expected ${expected}, got ${actual}`)

  return false
}

// --- Rect --------------------------------------------------------------------

console.log('Rect')

check('snaps to whole pixels', new Rect(10.4, 20.6, 100, 50).toString(), '[10,21 100x50]')
check('clamps negative sizes', new Rect(0, 0, -10, 5).toString(), '[0,0 0x5]')
check('contains inside', new Rect(0, 0, 10, 10).contains(9, 9), true)
check('contains excludes the far edge', new Rect(0, 0, 10, 10).contains(10, 5), false)
check('inset', new Rect(0, 0, 20, 20).inset(4).toString(), '[4,4 12x12]')
check('offset', new Rect(0, 0, 5, 5).offset(3, 2).toString(), '[3,2 5x5]');

[taken, rest] = new Rect(0, 0, 100, 100).splitTop(20)
check('splitTop taken', taken.toString(), '[0,0 100x20]')
check('splitTop rest', rest.toString(), '[0,20 100x80]');

[taken, rest] = new Rect(0, 0, 100, 100).splitRight(30)
check('splitRight taken', taken.toString(), '[70,0 30x100]')
check('splitRight rest', rest.toString(), '[0,0 70x100]');

[taken, rest] = new Rect(0, 0, 100, 100).splitBottom(500)
check('a split larger than the rect takes all of it', taken.toString(), '[0,0 100x100]')

check('cell', new Rect(0, 0, 100, 100).cell(2, 1, 14, 1).toString(), '[30,15 14x14]')
check('equals', new Rect(1, 2, 3, 4).equals(new Rect(1, 2, 3, 4)), true)

// --- Widget ------------------------------------------------------------------

console.log('Widget')

root = new Widget('root')
first = new Widget('first')
second = new Widget('second')

root.add(first).add(second)
root.place(new Rect(0, 0, 200, 100))

check('children inherit bounds by default', first.bounds.toString(), '[0,0 200x100]')
check('pick prefers the last child', root.pick(10, 10).kind, 'second')

second.disable()
check('pick skips a disabled widget', root.pick(10, 10).kind, 'first')

second.enable().hide()
check('pick skips a hidden widget', root.pick(10, 10).kind, 'first')

counted = { calls: 0 }

first.on('click', function (payload, self) { counted.calls = counted.calls + 1 })
first.fire('click', null)
first.fire('click', null)

check('handlers fire in order', counted.calls, 2)
check('trait state is per instance', second.fire('click', null), false)

first.when(true, function (self) { self.named('marked') })
first.unless(true, function (self) { self.named('wrong') })

check('when runs, unless does not', first.id, 'marked')
check('tap answers the object', first.tap(function (self) { return null }).id, 'marked')

// --- Dock ---------------------------------------------------------------------

console.log('Dock')

dock = new Dock()

menu = new Widget('menu').named('menu')
tools = new Widget('tools').named('tools')
status = new Widget('status').named('status')
canvasArea = new Widget('canvas').named('canvas')

dock.top(menu, 20)
dock.right(tools, 30)
dock.bottom(status, 18)
dock.fill(canvasArea)

dock.place(new Rect(0, 0, 1280, 800))

check('menu spans the width', menu.bounds.toString(), '[0,0 1280x20]')
check('tools run below the menu', tools.bounds.toString(), '[1250,20 30x780]')
check('status stops short of the tools', status.bounds.toString(), '[0,782 1250x18]')
check('the canvas takes the remainder', canvasArea.bounds.toString(), '[0,20 1250x762]')

dock.place(new Rect(0, 0, 400, 300))
check('layout survives a resize', canvasArea.bounds.toString(), '[0,20 370x262]')

dock.resize('tools', 60)
check('a region can be resized by id', tools.bounds.toString(), '[340,20 60x280]')

// --- Commands -------------------------------------------------------------------

console.log('Commands')

ran = { count: 0 }
allowed = { yes: true }

registry = new CommandRegistry()

registry.add(new Command('test.run', 'Run')
  .shortcut('ctrl+r')
  .does(function (studio) { ran.count = ran.count + 1 })
  .available(function (studio) { return allowed.yes }))

check('run invokes the command', registry.run('test.run', null), true)
check('the runner ran', ran.count, 1)

allowed.yes = false
check('a guard blocks the command', registry.run('test.run', null), false)
check('the runner did not run', ran.count, 1)

check('an unknown command answers false', registry.run('nope', null), false)
check('label and accel come from the command', registry.get('test.run').accel, 'ctrl+r')

// --- normalizeChord ---------------------------------------------------------------

console.log('Chords')

check('sorts modifiers', normalizeChord('shift+ctrl+z'), 'ctrl+shift+z')
check('lowercases', normalizeChord('Ctrl+S'), 'ctrl+s')
check('passes a bare key through', normalizeChord('b'), 'b')
check('handles the plus key itself', normalizeChord('ctrl++'), 'ctrl++')

// --- Tools ---------------------------------------------------------------------

console.log('Tools')

toolbox = new ToolRegistry()

toolbox.add(new Tool('pencil', 'P', 'B'))
toolbox.add(new Tool('eraser', 'E', 'E'))

check('the first tool added is selected', toolbox.current().name, 'pencil')

toolbox.select('eraser')
check('select changes the current tool', toolbox.current().name, 'eraser')

toolbox.select('nothing')
check('selecting an unknown tool is ignored', toolbox.current().name, 'eraser')

// --- Signals --------------------------------------------------------------------

console.log('Signals')

heard = { last: '' }
signals = new Signals()

token = signals.listen('news', function (payload) { heard.last = payload })

signals.emit('news', 'hello')
check('a listener hears an emit', heard.last, 'hello')

signals.forget(token)
signals.emit('news', 'ignored')
check('a forgotten listener stays quiet', heard.last, 'hello')

check('emitting into silence is fine', signals.emit('nobody', null), false)

// --- History ----------------------------------------------------------------------

console.log('History')

class Doc {
  use Editable

  constructor() {
    this.dirty = false
    this.revision = 0
    this.cells = [0, 0, 0]
  }

  width()  { return 3 }
  height() { return 1 }

  put(index, value) {
    this.cells[index] = value

    return this.markDirty()
  }

  snapshot() { return this.cells.slice(0) }

  restore(snapshot) {
    this.cells = snapshot

    return this.markDirty()
  }
}

document = new Doc()
history = new History(document)

history.begin()
document.put(0, 1)
document.put(1, 1)
history.commit()

check('a stroke is one undo step', history.past.length(), 1)
check('the document changed', document.cells.join(','), '1,1,0')

history.undo()
check('undo restores the snapshot', document.cells.join(','), '0,0,0')

history.redo()
check('redo replays it', document.cells.join(','), '1,1,0')

check('undo on an empty stack answers false', new History(new Doc()).undo(), false)
check('editing bumps the revision', document.revision > 0, true)

// --- linePixels ---------------------------------------------------------------------

console.log('linePixels')

visited = []

linePixels(0, 0, 3, 0, function (x, y) { visited.push(`${x},${y}`) })
check('a horizontal run has no gaps', visited.join(' '), '0,0 1,0 2,0 3,0')

visited = []
linePixels(0, 0, 2, 2, function (x, y) { visited.push(`${x},${y}`) })
check('a diagonal steps once per cell', visited.join(' '), '0,0 1,1 2,2')

visited = []
linePixels(2, 2, 0, 0, function (x, y) { visited.push(`${x},${y}`) })
check('it runs backwards too', visited.join(' '), '2,2 1,1 0,0')

// --- import aliasing -----------------------------------------------------------

console.log('Import aliasing')

// Regression test for a bug that shipped in chisel/theme.gs: Theme has a
// method named font(role), and the file also (bare) imported "lumen:font",
// which binds the name `font`. Inside another method, the bare identifier
// `font` resolved to the class's own method rather than the module -
// method lookup walks the class environment before it ever reaches the
// file's imports - so `font.system(...)` raised `no method \`system\`` the
// moment Studio actually ran under Lumen. The fix was importing the module
// under an alias distinct from the method name. This proves that pattern
// holds: a method may share a name with an import as long as the import
// itself is bound under a different name.
class Labeled {
  font(role) {
    return `role:${role}`
  }

  build(value) {
    return toolkitModule.system(value)
  }
}

labeled = new Labeled()

check('an aliased import is not shadowed by a same-named method', labeled.build('x'), 'built-x')
check('the method itself still resolves normally', labeled.font('small'), 'role:small')

// --- report ------------------------------------------------------------------------

console.log('')
console.log(`${results.passed} passed, ${results.failed} failed`)
