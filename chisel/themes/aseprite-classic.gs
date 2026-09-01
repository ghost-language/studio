import "lumen:color"
import { Theme } from "chisel/theme"

// The classic grey-and-teal theme. If switching to this one takes more than
// reading this file, a colour literal escaped into a widget somewhere.
function asepriteClassic() {
  return new Theme('aseprite.classic').set({
    'window.face':     color.hex('#ded9cc'),
    'panel.face':      color.hex('#cfcabb'),
    'panel.well':      color.hex('#a9a496'),
    'bevel.light':     color.hex('#f6f3ec'),
    'bevel.dark':      color.hex('#8d897c'),
    'button.face':     color.hex('#cfcabb'),
    'button.hover':    color.hex('#ded9cc'),
    'button.pressed':  color.hex('#bdb8a9'),
    'button.selected': color.hex('#3d6ea8'),
    'text.normal':     color.hex('#1d1b17'),
    'text.dim':        color.hex('#6a665b'),
    'text.selected':   color.hex('#ffffff'),
    'accent':          color.hex('#a8560a'),
    'checker.light':   color.hex('#c8c8c8'),
    'checker.dark':    color.hex('#a0a0a0')
  })
}
