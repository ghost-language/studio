import "lumen:canvas"
import "lumen:color"
import { Editable } from "studio/traits/editable"
import { History } from "studio/history"

// A pixel document: one flat list of palette indices, null for transparent.
//
// Flat beats nested - one bounds check, one multiply, and a snapshot is one
// copy. The palette is the PICO-8 sixteen, which is a decent default and easy
// to replace.
class Sprite {
  use Editable

  constructor(width, height) {
    this.w = width
    this.h = height
    this.dirty = false
    this.revision = 0
    this.title = 'Sprite'

    this.palette = [
      color.hex('#000000'), color.hex('#1d2b53'), color.hex('#7e2553'), color.hex('#008751'),
      color.hex('#ab5236'), color.hex('#5f574f'), color.hex('#c2c3c7'), color.hex('#fff1e8'),
      color.hex('#ff004d'), color.hex('#ffa300'), color.hex('#ffec27'), color.hex('#00e436'),
      color.hex('#29adff'), color.hex('#83769c'), color.hex('#ff77a8'), color.hex('#ffccaa')
    ]

    this.foreground = 8
    this.background = 7

    this.cells = []

    for (index = 0; index < width * height; index++) {
      this.cells.push(null)
    }

    this.history = new History(this)
  }

  width()    { return this.w }
  height()   { return this.h }
  cellSize() { return 1 }

  at(x, y) {
    if (!this.inside(x, y)) {
      return null
    }

    return this.cells[y * this.w + x]
  }

  put(x, y, value) {
    if (!this.inside(x, y)) {
      return false
    }

    if (this.cells[y * this.w + x] == value) {
      return false
    }

    this.cells[y * this.w + x] = value
    this.markDirty()

    return true
  }

  colorOf(value) {
    return this.palette[value]
  }

  // Called by the viewport, into its off-screen target, in document
  // coordinates: one cell is one pixel.
  paintCell(x, y, screenX, screenY) {
    value = this.at(x, y)

    if (value == null) {
      return false
    }

    canvas.setColor(this.colorOf(value))
    canvas.filledRectangle(screenX, screenY, 1, 1)

    return true
  }

  snapshot() {
    return this.cells.slice(0)
  }

  restore(snapshot) {
    this.cells = snapshot
    this.markDirty()

    return this
  }
}
