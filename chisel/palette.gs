import "lumen:color"
import { paletteRamps } from "chisel/support/palette-ramps"
import { paletteExtras } from "chisel/support/palette-extras"
import { rampStep } from "chisel/support/ramp-step"

// Picotron's palette, as colours the painter can use.
//
// The data and the clamping live in support/ where the tests can reach them;
// what is left here is the one thing that genuinely needs the engine, which is
// turning a hex string into a colour. Keeping that boundary is why this file
// is nine lines of logic instead of ninety.
class Palette {
  constructor() {
    this.ramps = paletteRamps()
    this.extra = paletteExtras()
    this.cache = {}
  }

  // A missing ramp paints magenta rather than raising: the oldest trick in
  // pixel art is making a mistake impossible to miss.
  step(ramp, index) {
    found = rampStep(this.ramps.get(ramp), index)

    if (found == null) {
      return color.hex('#ff00ff')
    }

    return this.hex(found)
  }

  named(name) {
    found = this.extra.get(name)

    if (found == null) {
      return color.hex('#ff00ff')
    }

    return this.hex(found)
  }

  // color.hex() allocates, and a repaint asks for the same dozen colours every
  // frame, so each is made once.
  hex(code) {
    found = this.cache.get(code)

    if (found == null) {
      found = color.hex(code)
      this.cache.set(code, found)
    }

    return found
  }
}
