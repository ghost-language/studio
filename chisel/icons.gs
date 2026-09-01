import "lumen:canvas"
import { Spritesheet } from "lumen:image"

// A grid of square, one-bit icons cut from a single sheet.
//
// FORMAT, so the placeholder art can be replaced without touching code:
//   resources/icons.png - a PNG of NxN cells, 16x16 pixels each, 8 per row,
//   drawn in WHITE on TRANSPARENT. White matters: every icon is tinted at
//   draw time, so one sheet serves the normal, dimmed, hovered and selected
//   states, and a theme swap recolours all of them at once. Anything that is
//   not white will fight the tint.
//
// Frames are numbered left to right, top to bottom from zero, and named by
// define() in exactly that order.
class Icons {
  constructor(path, size) {
    this.size = size
    this.sheet = new Spritesheet(path, size)

    // Without this the sheet blurs the moment the UI scale is not 1.
    this.sheet.getImage().setFilter('nearest')

    this.names = {}
    this.next = 0
  }

  // Names in sheet order. Call it once per row for readability.
  define(names) {
    for (name in names) {
      this.names.set(name, this.next)
      this.next = this.next + 1
    }

    return this
  }

  has(name) {
    return this.names.has(name)
  }

  // A missing icon draws nothing rather than raising - a half-built toolbar
  // should still come up.
  draw(name, x, y, tint, scale = 1) {
    if (!this.names.has(name)) {
      return false
    }

    canvas.setColor(tint)
    this.sheet.draw(this.names.get(name), x, y, 0, scale, scale)

    return true
  }

  // Centred inside a rect, snapped to whole pixels so the art never lands on
  // a half-pixel and softens.
  drawIn(name, rect, tint, scale = 1) {
    drawn = this.size * scale

    return this.draw(
      name,
      rect.x + (rect.w - drawn) / 2,
      rect.y + (rect.h - drawn) / 2,
      tint,
      scale
    )
  }
}
