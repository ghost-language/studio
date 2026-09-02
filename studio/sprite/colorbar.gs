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

  // Anchored to the bottom of the column, the way Aseprite's are: the palette
  // grows downward from the top, the chips stay put, and the space between
  // them is deliberate rather than left over.
  // Directly under the palette, not at the foot of the bar.
  //
  // The bar is docked down the full height of the window, so anchoring the
  // chips to its bottom edge put the current colours several hundred pixels
  // from the swatches they are chosen from, with a rule floating above them
  // marking a boundary between nothing and nothing.
  chipsRect(ui) {
    size = this.swatchSize(ui.theme) * 2 + 4
    inner = this.bounds.inset(ui.theme.metric('gutter'))
    grid = this.gridRect(ui)

    return new Rect(inner.x, grid.bottom() + ui.theme.metric('pad'), inner.w, size)
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

      // The selected swatch is marked by the colour of its own border, not by
      // anything drawn beside it. A tick is unreadable at 8px and would have
      // to be light on dark swatches and dark on light ones; a mark in the gap
      // reads as a smudge, which is exactly what the previous accent rule
      // above the cell turned out to look like once it was rendered.
      edge = ui.theme.of('outline')

      if (index == this.document.foreground) {
        edge = ui.theme.of('accent')
      }

      // surface() rather than fill() plus outline(): the outline is drawn with
      // line primitives and pixel snapping while the fill is a rectangle, and
      // the two disagree by a pixel, which showed up as a fringe of the
      // swatch's own colour leaking past its border on the right and bottom.
      // A surface is spans only, so it cannot drift.
      ui.painter.surface(cell, this.document.palette[index], edge, 1)
    }

    chips = this.chipsRect(ui)

    // A groove marks where the palette ends and the current colours begin, so
    // the gap between them reads as structure rather than as a mistake.
    ui.painter.groove(
      this.bounds.x + 2,
      chips.y - ui.theme.metric('pad'),
      this.bounds.w - 4
    )

    this.paintChips(ui)
  }

  paintChips(ui) {
    chips = this.chipsRect(ui)
    size = this.swatchSize(ui.theme) * 2

    back = new Rect(chips.x + size / 2, chips.y + 4, size, size)
    front = new Rect(chips.x, chips.y, size, size)

    // Flat fill in a one-pixel outline, like every other surface here. The
    // pair used to be drawn with a bevel, which is the one thing Picotron has
    // nowhere.
    cut = ui.painter.radius()
    edge = ui.theme.of('outline')

    ui.painter.surface(back, this.document.palette[this.document.background], edge, cut)
    ui.painter.surface(front, this.document.palette[this.document.foreground], edge, cut)
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
