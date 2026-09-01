import "lumen:canvas"
import "lumen:mouse"
import { Spritesheet } from "lumen:image"

// The mouse pointer, drawn by us.
//
// Lumen exposes no cursor API beyond showing and hiding the system one, so a
// tool that wants a crosshair over the canvas and an arrow over the chrome has
// to hide the real pointer and draw its own. That is what Aseprite does too,
// and it means the cursor is pixel art like everything else.
//
// FORMAT, so the placeholders can be replaced:
//   resources/cursors.png - 16x16 cells, 8 per row, WHITE on TRANSPARENT,
//   drawn with a one-pixel dark outline baked in if you want it readable over
//   light artwork. Each cursor also needs a HOTSPOT - the pixel that is
//   actually "the point" - declared in define() below, because a crosshair
//   points from its centre and an arrow from its top-left corner.
class Cursors {
  constructor(path, size) {
    this.size = size
    this.sheet = new Spritesheet(path, size)
    this.sheet.getImage().setFilter('nearest')

    this.names = {}
    this.hotspots = {}
    this.next = 0

    this.current = 'arrow'
    this.visible = true
  }

  // define('arrow', 0, 0) - name, then the hotspot within the cell.
  define(name, hotX, hotY) {
    this.names.set(name, this.next)
    this.hotspots.set(name, [hotX, hotY])
    this.next = this.next + 1

    return this
  }

  // Takes over from the system pointer. Call once, after the sheet is built.
  claim() {
    mouse.hideCursor()
    this.visible = true

    return this
  }

  release() {
    mouse.showCursor()
    this.visible = false

    return this
  }

  // Named show() rather than use(): `use` is a Ghost keyword (it pulls traits
  // into a class), and the parser rejects it as a method name AND at every
  // call site, with `expected a name, found (`.
  show(name) {
    if (this.names.has(name)) {
      this.current = name
    }

    return this
  }

  paint(ui, scale = 1) {
    if (!this.visible) {
      return false
    }

    if (!this.names.has(this.current)) {
      return false
    }

    hot = this.hotspots.get(this.current)

    canvas.setColor(ui.theme.of('text.normal'))
    this.sheet.draw(
      this.names.get(this.current),
      ui.pointer.x - hot[0] * scale,
      ui.pointer.y - hot[1] * scale,
      0,
      scale,
      scale
    )

    return true
  }
}
