import "lumen:color"
import { Theme } from "chisel/theme"

// The classic grey-and-teal theme. If switching to this one takes more than
// reading this file, a colour literal escaped into a widget somewhere.
function asepriteClassic() {
  return new Theme('aseprite.classic').set({
    'window.face':     color.hex('#c8c8c0'),
    'panel.face':      color.hex('#d4d0c8'),
    'panel.well':      color.hex('#a8a49c'),
    'field.face':      color.hex('#f4f2ec'),

    'outline':         color.hex('#4a4842'),
    'bevel.light':     color.hex('#ffffff'),
    'bevel.dark':      color.hex('#88857e'),

    'button.face':     color.hex('#d4d0c8'),
    'button.hover':    color.hex('#e2ded6'),
    'button.pressed':  color.hex('#bab6ae'),
    'button.selected': color.hex('#3c6ea5'),

    'text.normal':     color.hex('#1d1b17'),
    'text.dim':        color.hex('#6a665b'),
    'text.selected':   color.hex('#ffffff'),

    'accent':          color.hex('#a8560a'),
    'focus':           color.hex('#a8560a'),
    'scrim':           color.rgb(40, 40, 40, 0.45),
    'checker.light':   color.hex('#c8c8c8'),
    'checker.dark':    color.hex('#a0a0a0')
  })
}
