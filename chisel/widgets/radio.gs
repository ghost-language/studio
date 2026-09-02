import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// One of a set. The set is a plain map shared between the radios of a group -
// `{ value: 'pencil' }` - so a group needs no class of its own and any widget
// can read the current choice without knowing about radios at all.
class Radio extends Widget {
  constructor(label, value, group) {
    super.constructor('radio')

    this.label = label
    this.value = value
    this.group = group
    this.focusable = true
  }

  isChosen() {
    return this.group.get('value') == this.value
  }

  choose() {
    if (this.isChosen()) {
      return this
    }

    this.group.set('value', this.value)
    this.fire('change', this.value)

    return this
  }

  boxRect(ui) {
    size = ui.theme.metric('check')

    return new Rect(this.bounds.x, this.bounds.y + (this.bounds.h - size) / 2, size, size)
  }

  // Aseprite's radios are square wells with a filled centre rather than
  // circles - a circle at 11px is four awkward pixels, and a square reads
  // cleanly at every scale.
  paint(ui) {
    box = this.boxRect(ui)

    ui.painter.boxed(box, ui.theme.of('field.face'))

    if (this.isChosen()) {
      ink = ui.theme.of('text.normal')

      if (!this.enabled) {
        ink = ui.theme.of('text.dim')
      }

      ui.painter.fill(box.inset(3 * ui.theme.scale), ink)
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
      this.choose()
    }

    return true
  }

  keyed(ui, key) {
    if (key.toLowerCase() == 'space') {
      this.choose()

      return true
    }

    return false
  }
}
