import "lumen:keyboard"
import "ghost:math"
import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// A single-line text field: sunken well, blinking caret, and enough editing to
// be usable - characters, backspace, delete, home, end, arrows.
//
// Lumen gives you the raw events and nothing else: no caret, no selection, no
// clipboard. All of that is ours to build, which is why this is the largest
// widget in the kit for what looks like the simplest control.
class Field extends Widget {
  constructor(text) {
    super.constructor('field')

    this.text = text
    this.caret = text.length()
    this.blink = 0
    this.focusable = true
    this.placeholder = ''
  }

  hint(text) {
    this.placeholder = text

    return this
  }

  says(text) {
    this.text = text
    this.caret = math.clamp(this.caret, 0, text.length())

    return this
  }

  // A caret that never rests is distracting; one that never blinks is hard to
  // find. Half a second each way is the convention everywhere.
  animates() {
    return true
  }

  tick(dt, ui) {
    if (ui.isFocused(this)) {
      this.blink = this.blink + dt
    } else {
      this.blink = 0
    }

    super.tick(dt, ui)
  }

  insert(text) {
    before = this.text.slice(0, this.caret)
    after = this.text.slice(this.caret, this.text.length())

    this.text = `${before}${text}${after}`
    this.caret = this.caret + text.length()
    this.blink = 0

    this.fire('change', this.text)

    return this
  }

  backspace() {
    if (this.caret == 0) {
      return this
    }

    before = this.text.slice(0, this.caret - 1)
    after = this.text.slice(this.caret, this.text.length())

    this.text = `${before}${after}`
    this.caret = this.caret - 1
    this.blink = 0

    this.fire('change', this.text)

    return this
  }

  deleteForward() {
    if (this.caret >= this.text.length()) {
      return this
    }

    before = this.text.slice(0, this.caret)
    after = this.text.slice(this.caret + 1, this.text.length())

    this.text = `${before}${after}`
    this.blink = 0

    this.fire('change', this.text)

    return this
  }

  moveCaret(to) {
    this.caret = math.clamp(to, 0, this.text.length())
    this.blink = 0

    return this
  }

  // Which character the pointer landed between, by measuring prefixes. Fine
  // for a field; a text editor would cache the widths.
  caretAt(ui, x) {
    inner = this.bounds.inset(ui.theme.metric('pad'))
    best = 0

    for (index = 0; index <= this.text.length(); index++) {
      width = ui.painter.measure('body', this.text.slice(0, index))

      if (inner.x + width <= x) {
        best = index
      }
    }

    return best
  }

  paint(ui) {
    ui.painter.well(this.bounds, ui.theme.of('field.face'))

    inner = this.bounds.inset(ui.theme.metric('pad'))

    if (this.text == '' and this.placeholder != '') {
      ui.painter.textIn('body', this.placeholder, inner, 'left', 'middle', ui.theme.of('text.dim'))
    } else {
      ui.painter.textIn('body', this.text, inner, 'left', 'middle', ui.theme.of('text.normal'))
    }

    if (ui.isFocused(this) and this.blink % 1 < 0.5) {
      offset = ui.painter.measure('body', this.text.slice(0, this.caret))
      cap = ui.theme.metric('cap')
      top = this.bounds.y + (this.bounds.h - cap) / 2

      ui.painter.fill(
        new Rect(inner.x + offset, top - ui.theme.scale, ui.theme.scale, cap + ui.theme.scale * 2),
        ui.theme.of('text.normal')
      )
    }

    if (ui.isFocused(this)) {
      ui.painter.hline(this.bounds.x + 1, this.bounds.y + 1, this.bounds.w - 3, ui.theme.of('accent'))
    }
  }

  pressed(ui) {
    if (!this.enabled) {
      return false
    }

    this.moveCaret(this.caretAt(ui, ui.pointer.x))

    // Without this SDL sends no textinput events at all, and the field looks
    // focused while silently ignoring the keyboard.
    keyboard.startTextInput()

    return true
  }

  typed(ui, text) {
    this.insert(text)

    return true
  }

  keyed(ui, key) {
    name = key.toLowerCase()

    if (name == 'backspace') { this.backspace();                  return true }
    if (name == 'delete')    { this.deleteForward();              return true }
    if (name == 'left')      { this.moveCaret(this.caret - 1);    return true }
    if (name == 'right')     { this.moveCaret(this.caret + 1);    return true }
    if (name == 'home')      { this.moveCaret(0);                 return true }
    if (name == 'end')       { this.moveCaret(this.text.length()); return true }

    if (name == 'return') {
      this.fire('submit', this.text)

      return true
    }

    return false
  }
}
