import "ghost:math"
import { Widget } from "chisel/widget"

// A grid of colours with the selected one marked. The grid arithmetic lives in
// Rect.cell(), which is why paint() and indexAt() agree to the pixel.
class Swatches extends Widget {
  constructor(colors) {
    super.constructor('swatches')

    this.colors = colors
    this.columns = 4
    this.index = 0
  }

  across(count) { this.columns = count; return this }
  colours(list) { this.colors = list;   return this }

  gap(theme) {
    return 1 * theme.scale
  }

  // The width this panel needs to show every column it was asked for.
  //
  // The dock has to be told a size, and working it out anywhere but here
  // guarantees the two disagree: the first version of this widget was given a
  // hand-computed width that fitted two of its four columns, so the palette
  // silently lost half its colours off the right edge.
  widthFor(theme) {
    step = theme.metric('swatch') + this.gap(theme)

    return this.columns * step + theme.metric('gutter') * 2
  }

  indexAt(ui, x, y) {
    size = ui.theme.metric('swatch')
    step = size + this.gap(ui.theme)
    inner = this.bounds.inset(ui.theme.metric('gutter'))

    column = math.floor((x - inner.x) / step)
    row = math.floor((y - inner.y) / step)

    if (column < 0 or column >= this.columns) {
      return -1
    }

    found = row * this.columns + column

    if (found < 0 or found >= this.colors.length()) {
      return -1
    }

    return found
  }

  paint(ui) {
    ui.painter.panel(this.bounds, null)

    size = ui.theme.metric('swatch')
    inner = this.bounds.inset(ui.theme.metric('gutter'))

    for (index = 0; index < this.colors.length(); index++) {
      column = index % this.columns
      row = math.floor(index / this.columns)
      cell = inner.cell(column, row, size, this.gap(ui.theme))

      ui.painter.fill(cell, this.colors[index])

      if (index == this.index) {
        ui.painter.bevel(cell, false)
        ui.painter.hline(cell.x, cell.y - 1, cell.w, ui.theme.of('accent'))
      }
    }
  }

  pressed(ui) {
    found = this.indexAt(ui, ui.pointer.x, ui.pointer.y)

    if (found < 0) {
      return false
    }

    this.index = found
    this.fire('pick', found)

    return true
  }
}
