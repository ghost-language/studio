import "lumen:window"
import "lumen:canvas"
import "lumen:lumen"
import { Palette } from "chisel/palette"
import { Painter } from "chisel/painter"
import { Rect } from "chisel/geometry/rect"

// Renders one measured piece of Picotron chrome and screenshots it, so that
// tools/pixelmatch.py can hold the result against the reference it was
// measured from.
//
//   xvfb-run -a lumen verify.gs
//   tools/pixelmatch.py compare docs/reference/window.png <shot> --palette
//
// The whole point of the exercise is that "looks right" is not a check. This
// is the only thing that turns a claim about a pixel into a fact about one.
app = {}

function load() {
  window.setTitle('verify')
  window.setMode(480, 270)

  // The fixed framebuffer is the architectural change Picotron forces. Drawing
  // at the window's own resolution and multiplying metrics by a UI scale can
  // never land on these numbers.
  window.setLogicalSize(480, 270)
  window.setPixelPerfect(true)

  app.frames = 0
  app.palette = new Palette()
  app.painter = new Painter(null)
}

function update(dt) {
  return dt
}

function draw() {
  palette = app.palette
  painter = app.painter

  body = palette.step('neutral', 4)
  edge = palette.step('red', 3)
  title = palette.step('red', 4)

  // The reference crop sits on the file browser's body, not the desktop.
  painter.fill(new Rect(0, 0, 480, 270), body)

  frame = new Rect(190, 88, 202, 138)

  painter.surface(frame, body, edge, 2)
  painter.chamfered(new Rect(191, 89, 200, 11), title, 1, [true, true, false, false])
  painter.fill(new Rect(191, 100, 200, 1), edge)

  app.frames = app.frames + 1

  // Frame one can land before the first present on some drivers, so the read
  // back is taken on the second.
  if (app.frames == 2) {
    console.log(`SHOT:${canvas.screenshot('verify.png')}`)
    lumen.quit()
  }
}
