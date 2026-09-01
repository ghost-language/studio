import "lumen:color"
import { Theme } from "chisel/theme"

// Three greys, two bevel lines, one saturated selection. The artwork is the
// only thing on screen allowed to be loud; the chrome recedes on purpose.
function asepriteDark() {
  return new Theme('aseprite.dark').set({
    'window.face':     color.hex('#2c2c34'),
    'panel.face':      color.hex('#3a3a44'),
    'panel.well':      color.hex('#191a1e'),
    'bevel.light':     color.hex('#54545f'),
    'bevel.dark':      color.hex('#121216'),
    'button.face':     color.hex('#3a3a44'),
    'button.hover':    color.hex('#474751'),
    'button.pressed':  color.hex('#2a2a32'),
    'button.selected': color.hex('#4f7bb5'),
    'text.normal':     color.hex('#e9e6e1'),
    'text.dim':        color.hex('#948f9c'),
    'text.selected':   color.hex('#ffffff'),
    'accent':          color.hex('#f2a340'),
    'checker.light':   color.hex('#6b6b6b'),
    'checker.dark':    color.hex('#535353')
  })
}
