import "ghost:math"
import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// Aseprite's colour bar: the palette grid, and under it the foreground and
// background colours as two overlapping chips.
//
// The chips are the part people actually use - left-click paints foreground,
// right-click background - so they get real estate rather than a legend.
class Colorbar extends Widget {
  constructor(document) {
    super.constructor('colorbar')

    this.document = document
    this.columns = 4
  }

  across(count) {
    this.columns = count

    return this
  }

  gap(theme) {
    return 1 * theme.scale
  }

  swatchSize(theme) {
    return theme.metric('swatch')
  }

  widthFor(theme) {
    step = this.swatchSize(theme) + this.gap(theme)

    return this.columns * step + theme.metric('gutter') * 2
  }

  gridRect(ui) {
    inner = this.bounds.inset(ui.theme.metric('gutter'))
    rows = math.ceil(this.document.palette.length() / this.columns)
    step = this.swatchSize(ui.theme) + this.gap(ui.theme)

    return new Rect(inner.x, inner.y, inner.w, rows * step)
  }

  chipsRect(ui) {
    size = this.swatchSize(ui.theme) * 2
    inner = this.bounds.inset(ui.theme.metric('gutter'))

    return new Rect(inner.x, this.gridRect(ui).bottom() + ui.theme.metric('pad'), inner.w, size + 4)
  }

  indexAt(ui, x, y) {
    grid = this.gridRect(ui)
    step = this.swatchSize(ui.theme) + this.gap(ui.theme)

    column = math.floor((x - grid.x) / step)
    row = math.floor((y - grid.y) / step)

    if (column < 0 or column >= this.columns) {
      return -1
    }

    found = row * this.columns + column

    if (found < 0 or found >= this.document.palette.length()) {
      return -1
    }

    return found
  }

  paint(ui) {
    ui.painter.panel(this.bounds, null)

    grid = this.gridRect(ui)
    size = this.swatchSize(ui.theme)
    step = size + this.gap(ui.theme)

    for (index = 0; index < this.document.palette.length(); index++) {
      column = index % this.columns
      row = math.floor(index / this.columns)
      cell = new Rect(grid.x + column * step, grid.y + row * step, size, size)

      ui.painter.fill(cell, this.document.palette[index])
      ui.painter.outline(cell)

      // The current foreground gets an accent frame rather than a tick, so a
      // dark colour and a light one are both obviously selected.
      if (index == this.document.foreground) {
        ui.painter.bevel(cell, true)
        ui.painter.hline(cell.x, cell.y - 1, cell.w, ui.theme.of('accent'))
      }
    }

    this.paintChips(ui)
  }

  paintChips(ui) {
    chips = this.chipsRect(ui)
    size = this.swatchSize(ui.theme) * 2

    back = new Rect(chips.x + size / 2, chips.y + 4, size, size)
    front = new Rect(chips.x, chips.y, size, size)

    ui.painter.fill(back, this.document.palette[this.document.background])
    ui.painter.outline(back)
    ui.painter.bevel(back.inset(1), true)

    ui.painter.fill(front, this.document.palette[this.document.foreground])
    ui.painter.outline(front)
    ui.painter.bevel(front.inset(1), true)
  }

  pressed(ui) {
    found = this.indexAt(ui, ui.pointer.x, ui.pointer.y)

    if (found < 0) {
      return false
    }

    // Left sets the foreground, right the background - the reflex every pixel
    // editor shares.
    if (ui.pointer.button == 'right') {
      this.document.background = found
    } else {
      this.document.foreground = found
    }

    this.fire('pick', found)

    return true
  }
}
