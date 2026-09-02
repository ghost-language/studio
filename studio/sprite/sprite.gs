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

    // The NES's Mario palette, because a sprite editor should open on colours
    // someone actually wants to draw with rather than a ramp of greys - and
    // because these sixteen are about as legible together as sixteen colours
    // get.
    this.palette = [
      color.hex('#000000'), color.hex('#ffffff'), color.hex('#7c7c7c'), color.hex('#bcbcbc'),
      color.hex('#e52521'), color.hex('#c84c0c'), color.hex('#f8b800'), color.hex('#fbd000'),
      color.hex('#43b047'), color.hex('#00a800'), color.hex('#049cd8'), color.hex('#5c94fc'),
      color.hex('#3cbcfc'), color.hex('#8b4513'), color.hex('#ac7c00'), color.hex('#fcd8a8')
    ]

    this.foreground = 4
    this.background = 1

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
