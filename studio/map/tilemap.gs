import "lumen:canvas"
import "lumen:color"
import { Editable } from "studio/traits/editable"
import { History } from "studio/history"

// A tile document. Cells hold tile indices instead of palette indices, and one
// cell is `tile` pixels rather than one - which is the only thing the viewport
// needs to know to draw either kind of document.
//
// With no tileset given it paints flat colours, so the map editor runs with no
// assets at all. Hand it a Spritesheet and paintCell draws real tiles.
class Tilemap {
  use Editable

  constructor(width, height, tile) {
    this.w = width
    this.h = height
    this.tile = tile
    this.dirty = false
    this.revision = 0
    this.title = 'Map'

    this.tiles = null
    this.brush = 1

    this.palette = [
      color.hex('#3b3b45'), color.hex('#4f7bb5'), color.hex('#3f7a2e'), color.hex('#7e5c3a'),
      color.hex('#948f9c'), color.hex('#c2c3c7'), color.hex('#f2a340'), color.hex('#a33131')
    ]

    this.cells = []

    for (index = 0; index < width * height; index++) {
      this.cells.push(null)
    }

    this.history = new History(this)
  }

  // Swap in a Spritesheet - new Spritesheet('resources/tiles.png', 16) - and
  // paintCell draws from it instead.
  tileset(sheet) {
    this.tiles = sheet

    return this.markDirty()
  }

  width()    { return this.w }
  height()   { return this.h }
  cellSize() { return this.tile }

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
    return this.palette[value % this.palette.length()]
  }

  paintCell(x, y, screenX, screenY) {
    value = this.at(x, y)

    if (value == null) {
      return false
    }

    if (this.tiles != null) {
      this.tiles.draw(value, screenX, screenY)

      return true
    }

    canvas.setColor(this.colorOf(value))
    canvas.filledRectangle(screenX, screenY, this.tile, this.tile)

    canvas.setColor(color.rgb(0, 0, 0, 0.25))
    canvas.rectangle(screenX, screenY, this.tile, this.tile)

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
