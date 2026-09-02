import "ghost:math"
import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"
import { ColorPicker } from "studio/sprite/colorpicker"

// The handler is built outside the class because a closure made inside one
// cannot capture `this` in Ghost.
function makePickHandler(bar) {
  return function (chosen) {
    bar.document.palette[bar.document.foreground] = chosen
  }
}

// Aseprite's colour bar, top to bottom: the palette grid, the saturation-value
// picker with its hue strip, then the foreground and background chips.
//
// That order is Aseprite's and it is the right way round. The palette is what
// you use constantly and belongs where the eye lands first; the picker is what
// you use when the palette does not already have the colour, so it takes the
// space left over; the chips show what the last two decisions were.
class Colorbar extends Widget {
  constructor(document) {
    super.constructor('colorbar')

    this.document = document
    this.columns = 4

    this.picker = new ColorPicker(document)
    this.picker.on('change', makePickHandler(this))

    this.add(this.picker)
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

    return new Rect(inner.x, inner.bottom() - size, inner.w, size)
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

  // The picker is placed here rather than in arrange(), which has no theme to
  // measure with. Placing is cheap - it sets a rectangle - and the picker's own
  // cache is keyed on size rather than on being placed, so this costs nothing
  // per frame.
  placePicker(ui) {
    grid = this.gridRect(ui)
    chips = this.chipsRect(ui)
    inner = this.bounds.inset(ui.theme.metric('gutter'))

    // `spacing`, not `gap`: a local named `gap` would destroy this.gap(), which
    // gridRect() above calls to size the palette.
    spacing = ui.theme.metric('pad')

    top = grid.bottom() + spacing

    // Whatever room is left, but no taller than the picker asks for. Filling a
    // full-height dock made the saturation-value field a tall ribbon, where
    // Aseprite's is roughly square and reads as a field of colour rather than
    // as a gradient strip.
    available = chips.y - spacing - top
    wanted = this.picker.heightFor(ui.theme)

    height = math.max(ui.theme.metric('row'), math.min(available, wanted))

    this.picker.place(new Rect(inner.x, top, inner.w, height))

    return this
  }

  paint(ui) {
    this.placePicker(ui)

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

    // Children last, so the picker sits over the panel rather than under it.
    // This bar painted itself and stopped for as long as it had no children;
    // adding one made the omission a bug rather than a redundancy.
    super.paint(ui)
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
