import "lumen:color"
import { Theme } from "chisel/theme"

// Aseprite's chrome is NEUTRAL grey - no blue in it - with a hard near-black
// outline around every raised thing and a single light line inside it. The
// artwork is the only saturated thing on screen; everything else recedes.
function asepriteDark() {
  return new Theme('aseprite.dark').set({
    'window.face':     color.hex('#2e2e2e'),
    'panel.face':      color.hex('#3f3f3f'),
    'panel.well':      color.hex('#232323'),
    'field.face':      color.hex('#262626'),

    // The three lines every frame is built from.
    'outline':         color.hex('#1b1b1b'),
    'bevel.light':     color.hex('#616161'),
    'bevel.dark':      color.hex('#2a2a2a'),

    'button.face':     color.hex('#4a4a4a'),
    'button.hover':    color.hex('#575757'),
    'button.pressed':  color.hex('#383838'),
    'button.selected': color.hex('#3c6ea5'),

    'text.normal':     color.hex('#f0f0f0'),
    'text.dim':        color.hex('#9a9a9a'),
    'text.selected':   color.hex('#ffffff'),

    'accent':          color.hex('#f2a340'),
    'focus':           color.hex('#f2a340'),
    'scrim':           color.rgb(0, 0, 0, 0.6),
    'checker.light':   color.hex('#6b6b6b'),
    'checker.dark':    color.hex('#535353')
  })
}
