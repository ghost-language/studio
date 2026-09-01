import { normalizeChord } from "chisel/support/normalize-chord"

// Which modifier keys are held, tracked from the key events themselves.
//
// The obvious implementation - ask the keyboard, `keyboard.isDown('left alt')`
// - cannot be made portable. Lumen resolves a key name through SDL, and a name
// SDL does not recognise *raises* rather than answering false, so a single
// wrong spelling is a crash rather than a missed shortcut. The spellings are
// not the same everywhere: 'Left Alt' on Windows and Linux is 'Left Option' on
// macOS, and that difference crashed this app on the first Mac that ran it.
//
// Watching the names the platform actually sends sidesteps the whole problem:
// we never hand SDL a name we invented, so nothing can fail to resolve, and
// the same code works on a keyboard layout nobody here has seen.
class Modifiers {
  // acceleratorIsGui: on macOS the accelerator is Command, everywhere else it
  // is Ctrl. The caller decides, so this class stays free of `lumen:` imports
  // and can be tested without an engine.
  constructor(acceleratorIsGui) {
    this.held = {}
    this.acceleratorIsGui = acceleratorIsGui
  }

  // roleOf answers which modifier a key name is, or '' for an ordinary key.
  //
  // Matched on substrings precisely because the spelling varies: 'Left Ctrl',
  // 'Left Option', 'Right GUI', 'Left Command', 'Left Windows'. A substring
  // match costs nothing and absorbs every spelling seen so far.
  roleOf(key) {
    name = key.toLowerCase()

    if (name.contains('ctrl'))    { return 'ctrl' }
    if (name.contains('control')) { return 'ctrl' }
    if (name.contains('shift'))   { return 'shift' }
    if (name.contains('alt'))     { return 'alt' }
    if (name.contains('option'))  { return 'alt' }
    if (name.contains('gui'))     { return 'gui' }
    if (name.contains('command')) { return 'gui' }
    if (name.contains('meta'))    { return 'gui' }
    if (name.contains('windows')) { return 'gui' }

    return ''
  }

  isModifier(key) {
    return this.roleOf(key) != ''
  }

  down(key) {
    role = this.roleOf(key)

    if (role == '') {
      return false
    }

    this.held.set(role, true)

    return true
  }

  up(key) {
    role = this.roleOf(key)

    if (role == '') {
      return false
    }

    this.held.remove(role)

    return true
  }

  // Losing window focus while a modifier is held would otherwise leave it
  // stuck down forever - the release event goes to whichever window has focus,
  // not to this one.
  clear() {
    this.held = {}

    return this
  }

  isDown(role) {
    return this.held.has(role)
  }

  // A binding written 'ctrl+z' means "the platform's accelerator", so a Mac
  // user gets Cmd+Z. Literal Ctrl keeps working there too: accepting both
  // costs nothing and surprises nobody.
  accelerator() {
    if (this.isDown('ctrl')) {
      return true
    }

    if (this.acceleratorIsGui) {
      return this.isDown('gui')
    }

    return false
  }

  // The chord a keypress amounts to, in the same spelling bind() stores.
  // A modifier pressed on its own is not a chord.
  chordFor(key) {
    if (this.isModifier(key)) {
      return ''
    }

    parts = []

    if (this.accelerator())   { parts.push('ctrl') }
    if (this.isDown('alt'))   { parts.push('alt') }
    if (this.isDown('shift')) { parts.push('shift') }

    parts.push(key.toLowerCase())

    return normalizeChord(parts.join('+'))
  }
}
