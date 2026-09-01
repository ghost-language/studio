import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// A closed box showing the current choice, and a list that opens over
// everything else. The list is an overlay rather than a child, for the same
// reason the menu's is: it has to paint above the panels it overlaps and be
// picked before them.
class Dropdown extends Widget {
  constructor(options) {
    super.constructor('dropdown')

    this.options = options
    this.index = 0
    this.open = false
    this.lastUi = null
    this.hovered = -1
    this.focusable = true
  }

  choose(index) {
    if (index < 0 or index >= this.options.length()) {
      return this
    }

    this.index = index
    this.fire('change', this.options[index])

    return this
  }

  selected() {
    if (this.options.isEmpty()) {
      return null
    }

    return this.options[this.index]
  }

  close() {
    this.open = false

    return this
  }

  rowHeight(ui) {
    return ui.theme.metric('row')
  }

  listRect(ui) {
    height = this.options.length() * this.rowHeight(ui) + ui.theme.metric('gutter') * 2

    return new Rect(this.bounds.x, this.bounds.bottom(), this.bounds.w, height)
  }

  rowRect(ui, index) {
    list = this.listRect(ui)

    return new Rect(
      list.x + 2,
      list.y + ui.theme.metric('gutter') + index * this.rowHeight(ui),
      list.w - 4,
      this.rowHeight(ui)
    )
  }

  indexAt(ui, x, y) {
    for (index = 0; index < this.options.length(); index++) {
      if (this.rowRect(ui, index).contains(x, y)) {
        return index
      }
    }

    return -1
  }

  // The arrow is drawn as a shrinking stack of rows rather than a glyph, so it
  // is the same shape at every scale and never picks up antialiasing.
  paintArrow(ui, box, ink) {
    unit = ui.theme.scale
    width = 5 * unit
    height = 3 * unit

    x = box.right() - width - ui.theme.metric('pad')
    y = box.y + (box.h - height) / 2

    for (step = 0; step < 3; step++) {
      ui.painter.fill(
        new Rect(x + step * unit, y + step * unit, width - step * unit * 2, unit),
        ink
      )
    }
  }

  paint(ui) {
    face = ui.theme.of('button.face')

    if (this.open)      { face = ui.theme.of('button.pressed') }
    if (ui.isHot(this)) { face = ui.theme.of('button.hover') }

    if (this.open) {
      ui.painter.sunk(this.bounds, face)
    } else {
      ui.painter.raised(this.bounds, face)
    }

    ink = ui.theme.of('text.normal')

    if (!this.enabled) {
      ink = ui.theme.of('text.dim')
    }

    label = this.selected()

    if (label == null) {
      label = ''
    }

    inner = this.bounds.inset(ui.theme.metric('pad'))

    ui.painter.textIn('body', label, inner, 'left', 'middle', ink)
    this.paintArrow(ui, this.bounds, ink)

    if (ui.isFocused(this)) {
      ui.painter.focusRing(this.bounds.inset(2))
    }

    if (this.open) {
      ui.overlay(this, this)
    }
  }

  // Painted as an overlay, after the tree - so this runs a second time in the
  // same frame, drawing only the list.
  paintOverlay(ui) {
    list = this.listRect(ui)

    ui.painter.panel(list, ui.theme.of('panel.face'))

    for (index = 0; index < this.options.length(); index++) {
      row = this.rowRect(ui, index)
      ink = ui.theme.of('text.normal')

      if (index == this.hovered) {
        ui.painter.fill(row, ui.theme.of('button.selected'))
        ink = ui.theme.of('text.selected')
      }

      ui.painter.textIn('body', this.options[index], row.inset(ui.theme.metric('pad')), 'left', 'middle', ink)
    }
  }

  // While open the widget answers for its whole list, so clicks land here
  // rather than on whatever happens to be underneath.
  //
  // Nested ifs, not `this.open and this.listRect(...)`: `and` evaluates both
  // sides, so the one-line version calls listRect(null) on every pick while
  // the list is closed.
  overlapsList(x, y) {
    if (!this.open) {
      return false
    }

    if (this.lastUi == null) {
      return false
    }

    return this.listRect(this.lastUi).contains(x, y)
  }

  pick(x, y) {
    if (this.overlapsList(x, y)) {
      return this
    }

    return super.pick(x, y)
  }

  hits(x, y) {
    if (this.overlapsList(x, y)) {
      return true
    }

    return super.hits(x, y)
  }

  moved(ui) {
    this.lastUi = ui

    if (this.open) {
      this.hovered = this.indexAt(ui, ui.pointer.x, ui.pointer.y)
    }

    return true
  }

  pressed(ui) {
    this.lastUi = ui

    if (!this.enabled) {
      return false
    }

    if (this.open) {
      found = this.indexAt(ui, ui.pointer.x, ui.pointer.y)

      if (found >= 0) {
        this.choose(found)
      }

      return this.close()
    }

    this.open = true
    this.hovered = this.index

    return true
  }

  dismissed(ui) {
    return this.close()
  }

  keyed(ui, key) {
    name = key.toLowerCase()

    if (name == 'down')   { this.choose(this.index + 1); return true }
    if (name == 'up')     { this.choose(this.index - 1); return true }
    if (name == 'escape') { this.close();                return true }

    return false
  }
}
