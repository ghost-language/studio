import { ghostDark } from "chisel/themes/ghost-dark"
import { ghostLight } from "chisel/themes/ghost-light"
import { asepriteDark } from "chisel/themes/aseprite-dark"
import { asepriteClassic } from "chisel/themes/aseprite-classic"

// Every theme by name, so a preference can name one and a menu can list them.
//
// A function rather than a map because Ghost has no statics and a module-level
// map would be built once and shared - and a Theme is mutable (it carries the
// UI scale and the loaded fonts), so every caller needs its own.
function themeNamed(name) {
  if (name == 'ghost.light')       { return ghostLight() }
  if (name == 'aseprite.dark')     { return asepriteDark() }
  if (name == 'aseprite.classic')  { return asepriteClassic() }

  return ghostDark()
}
