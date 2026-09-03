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
import { chamfer } from "chisel/support/chamfer"
import { logicalSize } from "chisel/support/logical-size"
import { fitZoom } from "chisel/support/fit-zoom"
import { hsvToRgb } from "chisel/support/hsv"
import { paletteRamps } from "chisel/support/palette-ramps"
import { paletteExtras } from "chisel/support/palette-extras"
import { rampStep } from "chisel/support/ramp-step"
import { cornerInsets } from "chisel/support/corner-insets"
import { registerCoreCommands } from "studio/commands"
import { Keymap } from "studio/keymap"
import { Modifiers } from "chisel/modifiers"
import "tests/fixtures/toolkit" as toolkitModule
import "ghost:os"

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

// registerCoreCommands() builds the real undo/redo commands this app ships.
// Their availability guards used to read `studio.document != null and
// studio.document.history.canUndo()` — broken the same way, since `and`
// still evaluates the second half and dereferences a null document.
//
// A minimal stand-in for Keymap exposing just the three methods
// registerCoreCommands calls on it, so this test stays about the commands. A
// plain map's own function values are callable through dot-call syntax, which
// is what makes this work with no class at all.
fakeKeymap = {}
fakeKeymap.guard = function (name, test) { return null }
fakeKeymap.bind = function (chord, command) { return null }
fakeKeymap.group = function (names, callback) { callback(fakeKeymap) }

fakeStudio = { commands: new CommandRegistry(), keymap: fakeKeymap, document: null }

registerCoreCommands(fakeStudio)

check(
  'undo is unavailable with no document open, rather than a crash',
  fakeStudio.commands.get('history.undo').isEnabled(fakeStudio),
  false
)

check(
  'redo is unavailable with no document open, rather than a crash',
  fakeStudio.commands.get('history.redo').isEnabled(fakeStudio),
  false
)

// --- normalizeChord ---------------------------------------------------------------

console.log('Chords')

check('sorts modifiers', normalizeChord('shift+ctrl+z'), 'ctrl+shift+z')
check('lowercases', normalizeChord('Ctrl+S'), 'ctrl+s')
check('passes a bare key through', normalizeChord('b'), 'b')
check('handles the plus key itself', normalizeChord('ctrl++'), 'ctrl++')

// --- Modifiers ---------------------------------------------------------------

console.log('Modifiers')

// Held state is tracked from the key names the platform actually sends, never
// by asking SDL to resolve a name we invented. Both spellings below are real:
// Windows and Linux send 'Left Alt', macOS sends 'Left Option', and asking
// keyboard.isDown('left alt') on a Mac raised rather than answering false -
// which is what crashed the app on the first Mac that ran it.
mods = new Modifiers(false)

check('an ordinary key has no modifier role', mods.roleOf('B'), '')
check('Left Alt is alt', mods.roleOf('Left Alt'), 'alt')
check('Left Option is also alt', mods.roleOf('Left Option'), 'alt')
check('Right Ctrl is ctrl', mods.roleOf('Right Ctrl'), 'ctrl')
check('Left Command is gui', mods.roleOf('Left Command'), 'gui')
check('Left Windows is gui', mods.roleOf('Left Windows'), 'gui')

mods.down('Left Ctrl')
check('a held modifier is down', mods.isDown('ctrl'), true)
check('a modifier alone is not a chord', mods.chordFor('Left Ctrl'), '')
check('a chord carries the held modifier', mods.chordFor('Z'), 'ctrl+z')

mods.down('Left Shift')
check('modifiers combine in a canonical order', mods.chordFor('Z'), 'ctrl+shift+z')

mods.up('Left Ctrl')
check('releasing drops it', mods.chordFor('Z'), 'shift+z')

mods.clear()
check('clear releases everything', mods.chordFor('Z'), 'z')

// Losing focus mid-chord must not leave a modifier stuck down forever.
mods.down('Left Ctrl')
mods.clear()
check('focus loss cannot strand a modifier', mods.chordFor('Z'), 'z')

// On macOS the accelerator is Command, so a binding written 'ctrl+z' has to
// answer to Cmd+Z. Literal Ctrl keeps working there too.
macMods = new Modifiers(true)

macMods.down('Left Command')
check('Command is the accelerator on macOS', macMods.chordFor('Z'), 'ctrl+z')

macMods.clear()
macMods.down('Left Ctrl')
check('literal Ctrl still works on macOS', macMods.chordFor('Z'), 'ctrl+z')

pcMods = new Modifiers(false)
pcMods.down('Left Windows')
check('the Super key is not an accelerator elsewhere', pcMods.chordFor('Z'), 'z')

// --- Keymap ------------------------------------------------------------------

console.log('Keymap')

// Keymap takes a chord rather than a raw key, which is what finally lets it be
// tested with no engine present - it used to reach lumen:keyboard through
// chord-of.gs, so none of the below could run and dispatch() shipped a crash
// on every unbound keypress.
fired = { count: 0 }
canEdit = { yes: true }

mapCommands = new CommandRegistry()

mapCommands.add(new Command('test.undo', 'Undo')
  .does(function (studio) { fired.count = fired.count + 1 }))

keymap = new Keymap(mapCommands)

keymap.guard('editing', function (studio) { return canEdit.yes })

keymap.group(['editing'], function (keys) {
  keys.bind('ctrl+z', 'test.undo')
})

check('a bound chord runs its command', keymap.dispatch('ctrl+z', null), true)
check('the command ran', fired.count, 1)

// The one that crashed: no binding at all for this chord.
check('an unbound chord is ignored, not a crash', keymap.dispatch('q', null), false)
check('an empty chord is ignored', keymap.dispatch('', null), false)

canEdit.yes = false
check('a guard blocks the binding', keymap.dispatch('ctrl+z', null), false)
check('the command did not run again', fired.count, 1)

canEdit.yes = true

// A middleware name with no guard registered behind it must skip, not call
// null as a function.
keymap.group(['nonexistent'], function (keys) {
  keys.bind('ctrl+y', 'test.undo')
})

check('an unregistered guard name does not block or crash', keymap.dispatch('ctrl+y', null), true)

// Binding a chord to a command that was never registered must not crash while
// trying to read its accelerator.
keymap.bind('ctrl+k', 'never.registered')
check('binding an unknown command is survivable', keymap.dispatch('ctrl+k', null), false)

// A binding teaches the command its own accelerator, so menus and tooltips
// never have to be told separately.
check('the command learned its shortcut', mapCommands.get('test.undo').accel, 'ctrl+z')

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

// forget(null) used to crash: `token == null or !this.listeners.has(token.name)`
// still evaluates `token.name` when token is null, because `or` does not
// short-circuit. See "Import aliasing" below for the general shape of this
// class of bug.
check('forgetting a null token is safe rather than a crash', signals.forget(null), false)

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

// --- corner insets -------------------------------------------------------------

console.log('Corner insets')

// The rounded-corner profile is a circular quadrant, not a diagonal: a 45
// degree stair reads as a chamfer, a circle reads as round. These are the
// exact profiles the painter draws, and getting one wrong bites a notch out
// of every control at once.
check('radius 0 has no profile', cornerInsets(0).length(), 0)
check('radius 2 cuts one pixel', cornerInsets(2).join(','), '1,0')
check('radius 5 curves', cornerInsets(5).join(','), '3,1,1,0,0')
check('radius 6 curves further', cornerInsets(6).join(','), '4,2,1,1,0,0')

// The profile must never increase down the corner, or the shape folds back on
// itself and the outline crosses its own fill.
monotonic = { ok: true }
profile = cornerInsets(8)

for (index = 1; index < profile.length(); index++) {
  if (profile[index] > profile[index - 1]) {
    monotonic.ok = false
  }
}

check('a profile never widens as it descends', monotonic.ok, true)
check('a profile ends flush with the edge', cornerInsets(8).last(), 0)

// --- logical framebuffer ------------------------------------------------------------

console.log('')
console.log('Logical size')

// The magnification puts the logical height nearest the design's target, and
// the window is then divided by it - so a bigger monitor buys workspace rather
// than margins. 540 is Aseprite's, which is the default.
full = logicalSize(1920, 1080)

check('1080p magnifies twice', full.scale, 2)
check('and gives exactly Aseprite', `${full.w}x${full.h}`, '960x540')

laptop = logicalSize(1440, 900)

check('900 tall still magnifies twice', laptop.scale, 2)
check('and gives less room than 1080p', `${laptop.w}x${laptop.h}`, '720x450')

// The target is a parameter because two designs want different ones: Picotron
// was drawn for 270 and Aseprite for 540. Hard-coding either means the other
// renders at half or double the intended density.
picotron = logicalSize(1920, 1080, null, 270)

check('the Picotron target magnifies four times', picotron.scale, 4)
check('and gives exactly Picotron', `${picotron.w}x${picotron.h}`, '480x270')

// Whole numbers only. A fractional magnification resamples every drawn pixel
// to a different width, which is the one thing that cannot be allowed.
odd = logicalSize(1333, 777)

check('an awkward window still magnifies wholly', odd.scale, 1)
check('and divides down evenly', `${odd.w}x${odd.h}`, '1333x777')

check('a chosen magnification wins', logicalSize(1920, 1080, 4).scale, 4)
check('and is honoured', logicalSize(1920, 1080, 4).w, 480)

// A window smaller than one magnification would divide to nothing.
check('magnification never falls below one', logicalSize(100, 100).scale, 1)
check('a tiny window still has a framebuffer', logicalSize(4, 4, 8).w, 1)

// --- fitting a document to its viewport ---------------------------------------------

console.log('')
console.log('Fit zoom')

// The old default was a fixed 12x, which was fine at window resolution and
// badly wrong on a 480x270 framebuffer: a 32x32 sprite came out 384px tall in
// a region 170px tall, so the canvas showed a horizontal slice through the
// middle of the artwork rather than the artwork.
check('a small sprite fills its region', fitZoom(32, 32, 400, 170), 5)
check('and is square whichever side is tighter', fitZoom(32, 32, 170, 400), 5)
check('a wide region is limited by height', fitZoom(64, 16, 640, 64), 4)

// Whole numbers only: a fractional zoom draws some source pixels two screen
// pixels wide and their neighbours three, which is how pixel art gets uneven.
check('a zoom is never fractional', fitZoom(30, 30, 100, 100), 3)

// A document bigger than its region is shown at 1:1 and scrolled, not shrunk
// into mush.
check('an oversized document stays at 1:1', fitZoom(512, 512, 100, 100), 1)
check('a region of nothing still gives a zoom', fitZoom(32, 32, 0, 0), 1)
check('a document of nothing does not divide by it', fitZoom(0, 0, 100, 100), 1)

// --- hue, saturation, value -----------------------------------------------------------

console.log('')
console.log('HSV')

// The six primaries sit exactly on sector boundaries, which is where an
// off-by-one in the sector arithmetic shows up first.
red = hsvToRgb(0, 1, 1)
check('hue 0 is red', `${red.r},${red.g},${red.b}`, '255,0,0')
green = hsvToRgb(120, 1, 1)
check('hue 120 is green', `${green.r},${green.g},${green.b}`, '0,255,0')
blue = hsvToRgb(240, 1, 1)
check('hue 240 is blue', `${blue.r},${blue.g},${blue.b}`, '0,0,255')

yellow = hsvToRgb(60, 1, 1)
check('hue 60 is yellow', `${yellow.r},${yellow.g},${yellow.b}`, '255,255,0')
cyan = hsvToRgb(180, 1, 1)
check('hue 180 is cyan', `${cyan.r},${cyan.g},${cyan.b}`, '0,255,255')
magenta = hsvToRgb(300, 1, 1)
check('hue 300 is magenta', `${magenta.r},${magenta.g},${magenta.b}`, '255,0,255')

// No saturation is a grey whatever the hue claims, and no value is black
// whatever else it claims.
grey = hsvToRgb(200, 0, 0.5)
check('no saturation is grey', `${grey.r},${grey.g},${grey.b}`, '128,128,128')
black = hsvToRgb(200, 1, 0)
check('no value is black', `${black.r},${black.g},${black.b}`, '0,0,0')
white = hsvToRgb(0, 0, 1)
check('no saturation at full value is white', `${white.r},${white.g},${white.b}`, '255,255,255')

// A drag that runs off the edge of the field hands back a component slightly
// out of range; unclamped that becomes 256 and wraps to black, which reads as
// the picker breaking exactly when the pointer leaves it.
over = hsvToRgb(0, 1, 1.2)
check('an overshot value clamps rather than wraps', over.r, 255)
under = hsvToRgb(0, 1, -0.2)
check('an undershot value clamps too', under.r, 0)

// --- chamfer ------------------------------------------------------------------------

console.log('')
console.log('Chamfer')

// [2, 1] is not a preference, it is what every window in every Picotron
// reference measures: two pixels off the first row, one off the second.
check('a 2px cut is the measured profile', chamfer(2).toString(), [2, 1].toString())
check('no cut leaves no profile', chamfer(0).length(), 0)
check('a cut is as deep as it is wide', chamfer(4).length(), 4)
check('a cut starts at its full depth', chamfer(4)[0], 4)
check('a cut ends flush with the edge', chamfer(4).last(), 1)

// A chamfer is a straight 45-degree cut, so each row gives back exactly one
// pixel. A curve does not, which is why cornerInsets() is a separate helper
// rather than this one with a flag.
even = { ok: true }
profile = chamfer(6)

for (index = 1; index < profile.length(); index++) {
  if (profile[index - 1] - profile[index] != 1) {
    even.ok = false
  }
}

check('a chamfer loses exactly one pixel a row', even.ok, true)

// --- palette ------------------------------------------------------------------------

console.log('')
console.log('Palette')

ramps = paletteRamps()
extras = paletteExtras()

// The ramp grid was measured off a real palette thumbnail, so its shape is
// fixed: five ramps of five. The extras are not - Picotron's system palette is
// 64 entries and this list grows as references arrive - so nothing here
// asserts a total. An earlier version did, on the grounds that 25 + 7 came to
// a number Picotron documents; that arithmetic was a coincidence of the
// screenshots to hand rather than a fact about the palette, and a later one
// used two colours neither list could explain.
counted = { total: 0 }

for (name in ramps.keys()) {
  counted.total = counted.total + ramps.get(name).length()
}

check('five ramps', ramps.keys().length(), 5)
check('five steps each', counted.total, 25)
check('the extras are open-ended, not a fixed count', extras.keys().length() > 6, true)

// Every entry has to be a real hex triplet, because these strings are handed
// straight to color.hex() at startup - a typo here is a crash on frame one,
// in a file the tests cannot otherwise reach.
malformed = { count: 0 }

for (name in ramps.keys()) {
  for (entry in ramps.get(name)) {
    if (entry.length() != 7) {
      malformed.count = malformed.count + 1
    }
  }
}

for (name in extras.keys()) {
  if (extras.get(name).length() != 7) {
    malformed.count = malformed.count + 1
  }
}

check('every entry is a #rrggbb string', malformed.count, 0)

// The clamp is what lets 'one step lighter' be a rule the whole interface
// shares instead of an edge case in every widget.
neutral = ramps.get('neutral')

check('a step is the colour at that index', rampStep(neutral, 2), '#a28879')
check('below the ramp clamps to the darkest', rampStep(neutral, -3), '#452d32')
check('above the ramp clamps to the lightest', rampStep(neutral, 99), '#fff1e8')
check('an unknown ramp gives nothing back', rampStep(null, 0), null)

// --- report ------------------------------------------------------------------------

console.log('')
console.log(`${results.passed} passed, ${results.failed} failed`)

// A suite that cannot fail the build is decoration. Exiting non-zero is what
// makes CI mean anything.
if (results.failed > 0) {
  os.exit(1)
}
