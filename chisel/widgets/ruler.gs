import "ghost:math"
import { Widget } from "chisel/widget"

// A horizontal axis in units - frames for a sprite, seconds for a sound. The
// widget knows about neither: it maps units to pixels, draws ticks at a step
// that keeps labels from colliding, and marks a playhead.
//
// The sprite timeline and (once the engine can hand us samples) the waveform
// editor are both this widget with a different row renderer underneath.
class Ruler extends Widget {
  constructor(units, perUnit) {
    super.constructor('ruler')

    this.units = units
    this.perUnit = perUnit
    this.offset = 0
    this.playhead = 0
    this.step = 5
  }

  unitAt(x)      { return this.offset + (x - this.bounds.x) / this.perUnit }
  screenOf(unit) { return this.bounds.x + (unit - this.offset) * this.perUnit }

  zoom(perUnit) {
    this.perUnit = math.max(1, perUnit)

    return this
  }

  seek(unit) {
    this.playhead = math.clamp(unit, 0, this.units)
    this.fire('seek', this.playhead)

    return this
  }

  animates() {
    return true
  }

  paint(ui) {
    ui.painter.panel(this.bounds, null)

    for (unit = 0; unit <= this.units; unit++) {
      x = this.screenOf(unit)

      if (x < this.bounds.x or x > this.bounds.right()) {
        continue
      }

      long = unit % this.step == 0
      height = 4 * ui.theme.scale

      if (long) {
        height = 8 * ui.theme.scale
      }

      ui.painter.vline(x, this.bounds.bottom() - height, height, ui.theme.of('text.dim'))

      if (long) {
        ui.painter.text('small', `${unit}`, x + 2, this.bounds.y + 2, ui.theme.of('text.dim'))
      }
    }

    ui.painter.vline(this.screenOf(this.playhead), this.bounds.y, this.bounds.h, ui.theme.of('accent'))
  }

  pressed(ui) {
    ui.capture(this)
    this.seek(math.floor(this.unitAt(ui.pointer.x)))

    return true
  }

  dragged(ui) {
    this.seek(math.floor(this.unitAt(ui.pointer.x)))

    return true
  }
}
