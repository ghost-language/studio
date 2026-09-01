import "lumen:canvas"
import "lumen:color"
import "ghost:math"
import { Target } from "lumen:canvas"
import { Widget } from "chisel/widget"
import { snap } from "chisel/support/snap"

// The document, drawn.
//
// This is the one place performance is a design question rather than an
// afterthought: a 128x128 sprite is 16,384 rectangles, and drawing them every
// frame is how an editor ends up at 20 FPS. So the document is rendered into an
// off-screen Target only when its revision changes, and the frame blits that
// target at an integer zoom.
//
// It is document-agnostic: a sprite's cell is one pixel, a tilemap's is its
// tile size, and each knows how to paint one of its own cells.
class Viewport extends Widget {
  constructor(studio, document) {
    super.constructor('viewport')

    this.studio = studio
    this.document = document
    this.cell = document.cellSize()

    this.zoom = math.max(1, math.floor(12 / this.cell))
    this.home = this.zoom
    this.panX = 0
    this.panY = 0

    this.stale = true
    this.seen = -1
    this.focusable = true
    this.panning = false

    // Off by default, like Aseprite. A dark line on every cell boundary reads
    // as noise over the transparency checker rather than as information, and
    // leaving it on is the single thing that made this canvas look least like
    // the tool it is imitating.
    this.showGrid = false

    this.surface = new Target(document.width() * this.cell, document.height() * this.cell)

    self = this

    studio.signals.listen('view.zoom', function (delta) {
      self.setZoom(self.zoom + delta)
    })

    studio.signals.listen('view.reset', function (payload) {
      self.setZoom(self.home)
      self.panX = 0
      self.panY = 0
    })

    studio.signals.listen('view.grid', function (payload) {
      self.showGrid = !self.showGrid
    })
  }

  // Explicit invalidation, for a change the revision counter cannot see.
  // Ordinary edits do not need it: paint() notices document.revision moving.
  invalidate() {
    this.stale = true

    return this
  }

  // ---- view maths --------------------------------------------------------

  scale() {
    return this.zoom * this.cell
  }

  origin() {
    width = this.document.width() * this.scale()
    height = this.document.height() * this.scale()

    return {
      x: snap(this.bounds.x + (this.bounds.w - width) / 2 + this.panX),
      y: snap(this.bounds.y + (this.bounds.h - height) / 2 + this.panY)
    }
  }

  toCell(x, y) {
    at = this.origin()
    step = this.scale()

    column = math.floor((x - at.x) / step)
    row = math.floor((y - at.y) / step)

    if (!this.document.inside(column, row)) {
      return null
    }

    return [column, row]
  }

  // Whole numbers only. Fractional zoom is exactly how pixel art gets uneven
  // edges, and Aseprite refuses it for the same reason.
  setZoom(level) {
    this.zoom = math.clamp(math.floor(level), 1, 64)

    return this
  }

  // ---- painting -------------------------------------------------------------

  refresh() {
    if (!this.stale) {
      return null
    }

    // Drawing into a target resets the transform - a target is its own screen,
    // so (0, 0) is its corner. That is why this loop needs no offset.
    canvas.setTarget(this.surface)
    canvas.clear(color.transparent)

    for (y = 0; y < this.document.height(); y++) {
      for (x = 0; x < this.document.width(); x++) {
        this.document.paintCell(x, y, x * this.cell, y * this.cell)
      }
    }

    canvas.setTarget()

    this.stale = false
  }

  paint(ui) {
    if (this.document.revision != this.seen) {
      this.seen = this.document.revision
      this.stale = true
    }

    this.refresh()

    ui.painter.well(this.bounds)
    ui.painter.clip(this.bounds.inset(1))

    at = this.origin()

    this.paintChecker(ui, at)

    canvas.setColor(color.white)
    this.surface.draw(at.x, at.y, 0, this.zoom, this.zoom)

    this.paintGrid(ui, at)
    this.paintEdge(ui, at)

    ui.painter.unclip()
  }

  // A one-pixel border around the document. Without it a sprite with
  // transparent edges has no visible extent at all - it just fades into the
  // checkerboard, which is why the canvas read as a grey field rather than as
  // an object sitting on one.
  paintEdge(ui, at) {
    width = this.document.width() * this.scale()
    height = this.document.height() * this.scale()

    edge = ui.theme.of('bevel.dark')

    ui.painter.hline(at.x - 1, at.y - 1, width + 1, edge)
    ui.painter.hline(at.x - 1, at.y + height, width + 1, edge)
    ui.painter.vline(at.x - 1, at.y - 1, height + 1, edge)
    ui.painter.vline(at.x + width, at.y - 1, height + 1, edge)
  }

  // A screen-space checkerboard at a fixed cell, the way Aseprite does it, so
  // it does not zoom with the artwork. 16px is Aseprite's own default; 8 was
  // small enough to read as texture rather than as "nothing is here".
  paintChecker(ui, at) {
    size = 16 * ui.theme.scale
    width = this.document.width() * this.scale()
    height = this.document.height() * this.scale()

    columns = math.ceil(width / size)
    rows = math.ceil(height / size)

    for (row = 0; row < rows; row++) {
      for (column = 0; column < columns; column++) {
        shade = ui.theme.of('checker.dark')

        if ((row + column) % 2 == 0) {
          shade = ui.theme.of('checker.light')
        }

        canvas.setColor(shade)
        canvas.filledRectangle(
          at.x + column * size,
          at.y + row * size,
          math.min(size, width - column * size),
          math.min(size, height - row * size)
        )
      }
    }
  }

  // The grid is opt-in (View > Toggle Grid), and even then appears only once a
  // cell is big enough to carry a line - the rule Aseprite uses too.
  paintGrid(ui, at) {
    if (!this.showGrid) {
      return null
    }

    step = this.scale()

    if (step < 6) {
      return null
    }

    // The panel well, not the bevel shadow: a near-black line on every cell
    // boundary is far louder than the artwork it is meant to sit under.
    grid = ui.theme.of('panel.well')
    width = this.document.width() * step
    height = this.document.height() * step

    for (x = 0; x <= this.document.width(); x++) {
      ui.painter.vline(at.x + x * step, at.y, height, grid)
    }

    for (y = 0; y <= this.document.height(); y++) {
      ui.painter.hline(at.x, at.y + y * step, width, grid)
    }
  }

  // ---- input ------------------------------------------------------------------

  pressed(ui) {
    ui.capture(this)

    if (ui.pointer.button == 'middle') {
      this.panning = true

      return true
    }

    cell = this.toCell(ui.pointer.x, ui.pointer.y)

    if (cell == null) {
      return false
    }

    this.document.history.begin()
    this.studio.tools.current().begin(this.document, cell[0], cell[1], ui.pointer.button)

    return true
  }

  dragged(ui) {
    if (this.panning) {
      this.panX = this.panX + ui.pointer.dx
      this.panY = this.panY + ui.pointer.dy

      return true
    }

    cell = this.toCell(ui.pointer.x, ui.pointer.y)

    this.studio.signals.emit('cursor.moved', cell)

    if (cell == null) {
      return false
    }

    this.studio.tools.current().drag(this.document, cell[0], cell[1])

    return true
  }

  released(ui) {
    if (this.panning) {
      this.panning = false

      return true
    }

    this.studio.tools.current().finish(this.document)
    this.document.history.commit()

    return true
  }

  moved(ui) {
    this.studio.signals.emit('cursor.moved', this.toCell(ui.pointer.x, ui.pointer.y))

    return true
  }

  wheeled(ui) {
    this.setZoom(this.zoom + ui.pointer.wheel)

    return true
  }
}
