import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// A sunken box with a tick in it, and a label that is part of the hit area -
// clicking the word toggles it, which people expect and toy toolkits forget.
class Checkbox extends Widget {
  constructor(label, checked) {
    super.constructor('checkbox')

    this.label = label
    this.checked = checked
    this.focusable = true
  }

  set(value) {
    if (this.checked == value) {
      return this
    }

    this.checked = value
    this.fire('change', value)

    return this
  }

  toggle() {
    return this.set(!this.checked)
  }

  boxRect(ui) {
    size = ui.theme.metric('check')

    return new Rect(this.bounds.x, this.bounds.y + (this.bounds.h - size) / 2, size, size)
  }

  // The tick is drawn rather than typed: a font glyph would be the wrong size
  // at every scale but one, and would not be a pixel shape.
  paintTick(ui, box) {
    ink = ui.theme.of('text.normal')

    if (!this.enabled) {
      ink = ui.theme.of('text.dim')
    }

    unit = ui.theme.scale
    inner = box.inset(3 * unit)

    // A two-stroke tick: down-right from the left, then up-right to the top.
    for (step = 0; step < inner.h; step++) {
      ui.painter.fill(new Rect(inner.x + step, inner.y + inner.h - 1 - step, unit, unit), ink)
    }

    for (step = 0; step < inner.h; step++) {
      ui.painter.fill(new Rect(inner.x + inner.h - 1 + step, inner.y + inner.h - 1 - step, unit, unit), ink)
    }
  }

  paint(ui) {
    box = this.boxRect(ui)

    ui.painter.boxed(box, ui.theme.of('field.face'))

    if (this.checked) {
      this.paintTick(ui, box)
    }

    if (ui.isHot(this)) {
      if (this.enabled) {
        ui.painter.bevel(box.inset(1), true)
      }
    }

    ink = ui.theme.of('text.normal')

    if (!this.enabled) {
      ink = ui.theme.of('text.dim')
    }

    text = new Rect(box.right() + ui.theme.metric('pad'), this.bounds.y, this.bounds.w, this.bounds.h)

    ui.painter.textIn('body', this.label, text, 'left', 'middle', ink)

    if (ui.isFocused(this)) {
      ui.painter.focusRing(this.bounds)
    }
  }

  pressed(ui) {
    if (!this.enabled) {
      return false
    }

    ui.capture(this)

    return true
  }

  released(ui) {
    if (this.enabled and this.hits(ui.pointer.x, ui.pointer.y)) {
      this.toggle()
    }

    return true
  }

  keyed(ui, key) {
    if (key.toLowerCase() == 'space') {
      this.toggle()

      return true
    }

    return false
  }
}
