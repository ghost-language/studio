import "ghost:math"
import { Widget } from "chisel/widget"

// A horizontal value, dragged. The capture pattern in full: press captures,
// every move while captured comes back here, release commits.
class Slider extends Widget {
  constructor(label, low, high) {
    super.constructor('slider')

    this.label = label
    this.low = low
    this.high = high
    this.value = low
    this.focusable = true
  }

  set(value) {
    clamped = math.clamp(value, this.low, this.high)

    if (clamped != this.value) {
      this.value = clamped
      this.fire('change', clamped)
    }

    return this
  }

  // Whole steps: an opacity slider lands on 137, never 137.4.
  valueAt(x) {
    span = math.max(1, this.bounds.w - 2)
    fraction = math.clamp((x - this.bounds.x - 1) / span, 0, 1)

    return math.floor(this.low + fraction * (this.high - this.low))
  }

  paint(ui) {
    ui.painter.well(this.bounds)

    span = this.bounds.w - 2
    range = math.max(1, this.high - this.low)
    filled = math.floor(span * ((this.value - this.low) / range))

    if (filled > 0) {
      ui.painter.fill(
        this.bounds.inset(1).sized(filled, this.bounds.h - 2),
        ui.theme.of('button.selected')
      )
    }

    ui.painter.textIn(
      'small',
      `${this.label}: ${this.value}`,
      this.bounds,
      'center',
      'middle',
      ui.theme.of('text.normal')
    )
  }

  pressed(ui) {
    if (ui.pointer.button != 'left') {
      return false
    }

    ui.capture(this)
    this.set(this.valueAt(ui.pointer.x))

    return true
  }

  dragged(ui) {
    this.set(this.valueAt(ui.pointer.x))

    return true
  }

  released(ui) {
    this.fire('commit', this.value)

    return true
  }
}
