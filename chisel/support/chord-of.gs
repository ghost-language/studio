import "lumen:keyboard"
import { normalizeChord } from "chisel/support/normalize-chord"

// modifiers are the SDL scancode names for the keys that never form a chord on
// their own. Lumen matches SDL's own spelling ('Left Ctrl', not 'lctrl') and
// raises on a name it cannot resolve, so these are written out rather than
// guessed at.
modifierNames = [
  'left ctrl', 'right ctrl',
  'left shift', 'right shift',
  'left alt', 'right alt',
  'left gui', 'right gui'
]

// chordOf builds the chord for a key that has just been pressed, by asking
// which modifiers are held right now. Answers '' for a modifier pressed alone.
function chordOf(key) {
  lowered = key.toLowerCase()

  if (modifierNames.contains(lowered)) {
    return ''
  }

  parts = []

  if (keyboard.isDown('left ctrl', 'right ctrl'))   { parts.push('ctrl') }
  if (keyboard.isDown('left alt', 'right alt'))     { parts.push('alt') }
  if (keyboard.isDown('left shift', 'right shift')) { parts.push('shift') }

  parts.push(lowered)

  return normalizeChord(parts.join('+'))
}
