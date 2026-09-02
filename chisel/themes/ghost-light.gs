import "lumen:color"
import { Theme } from "chisel/theme"

// Ghost — the light theme.
//
// The same violet accent over a cool paper grey, rather than a naive inversion
// of the dark one: inverting a cyberpunk palette gives you lilac soup. The
// greys keep a trace of the violet so the accent still belongs to them, and
// the outline stays dark enough that a raised control reads as raised.
function ghostLight() {
  return new Theme('ghost.light').set({
    // Three clearly separated values, not three shades of the same one: the
    // ground is darkest, panels sit on it, and the well is darker than both so
    // the artwork reads as sitting in a hole rather than floating on a wash.
    'window.face':     color.hex('#c6c4ce'),
    'panel.face':      color.hex('#e0dee8'),
    // Low chroma on purpose: the well is the largest field on screen, and a
    // saturated one competes with the artwork sitting in it.
    'panel.well':      color.hex('#918e9c'),
    'field.face':      color.hex('#f8f7fc'),

    'outline':         color.hex('#3b3650'),
    'bevel.light':     color.hex('#ffffff'),
    'bevel.dark':      color.hex('#a9a4bd'),

    'button.face':     color.hex('#eceaf4'),
    'button.hover':    color.hex('#f6f5fa'),
    'button.pressed':  color.hex('#c4c0d4'),
    'button.selected': color.hex('#6d3fe8'),

    'text.normal':     color.hex('#1b1926'),
    'text.dim':        color.hex('#68637f'),
    'text.selected':   color.hex('#ffffff'),

    'accent':          color.hex('#6d28d9'),
    'focus':           color.hex('#0e7490'),

    'good':            color.hex('#2f7d32'),
    'warn':            color.hex('#a97400'),
    'bad':             color.hex('#c0201c'),

    'scrim':           color.rgb(40, 36, 60, 0.45),
    'checker.light':   color.hex('#b6b4be'),
    'checker.dark':    color.hex('#a3a1ac')
  })
}
