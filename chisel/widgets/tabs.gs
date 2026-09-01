import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// Document tabs. The active tab is drawn without its bottom edge so it merges
// into the bar below it - that single omission is what makes a tab read as a
// tab rather than as a button.
class Tabs extends Widget {
  constructor() {
    super.constructor('tabs')

    this.entries = []
    this.index = 0
  }

  tab(title, value) {
    this.entries.push({ title: title, value: value })

    return this
  }

  select(index) {
    if (index < 0 or index >= this.entries.length()) {
      return this
    }

    this.index = index
    this.fire('change', this.entries[index].value)

    return this
  }

  current() {
    if (this.entries.isEmpty()) {
      return null
    }

    return this.entries[this.index].value
  }

  tabRect(ui, index) {
    x = this.bounds.x + 2
    width = 0

    for (position = 0; position <= index; position++) {
      width = ui.painter.measure('small', this.entries[position].title) + 20

      if (position < index) {
        x = x + width
      }
    }

    return new Rect(x, this.bounds.y + 2, width, this.bounds.h - 2)
  }

  indexAt(ui, x, y) {
    for (index = 0; index < this.entries.length(); index++) {
      if (this.tabRect(ui, index).contains(x, y)) {
        return index
      }
    }

    return -1
  }

  paint(ui) {
    ui.painter.fill(this.bounds, ui.theme.of('window.face'))
    ui.painter.hline(this.bounds.x, this.bounds.bottom() - 1, this.bounds.w, ui.theme.of('bevel.dark'))

    for (index = 0; index < this.entries.length(); index++) {
      box = this.tabRect(ui, index)
      active = index == this.index

      face = ui.theme.of('panel.face')
      ink = ui.theme.of('text.dim')

      if (active) {
        face = ui.theme.of('button.selected')
        ink = ui.theme.of('text.selected')
      }

      ui.painter.fill(box, face)

      // Top and both sides only: the bottom is where the tab joins the
      // workspace, so it is left open.
      ui.painter.hline(box.x, box.y, box.w - 1, ui.theme.of('bevel.light'))
      ui.painter.vline(box.x, box.y, box.h, ui.theme.of('bevel.light'))
      ui.painter.vline(box.right() - 1, box.y, box.h, ui.theme.of('bevel.dark'))

      ui.painter.textIn('small', this.entries[index].title, box, 'center', 'middle', ink)
    }
  }

  pressed(ui) {
    found = this.indexAt(ui, ui.pointer.x, ui.pointer.y)

    if (found < 0) {
      return false
    }

    this.select(found)

    return true
  }
}
