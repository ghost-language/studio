import "lumen:window"
import "lumen:canvas"
import "lumen:lumen"
import { Ui } from "chisel/ui"
import { Painter } from "chisel/painter"
import { Rect } from "chisel/geometry/rect"
import { Icons } from "chisel/icons"
import { Cursors } from "chisel/cursors"
import { asepriteMocha } from "chisel/themes/aseprite-mocha"
import { logicalSize } from "chisel/support/logical-size"
import { Gallery } from "playground/gallery"

// The playground, rendered once and screenshotted, so the whole widget set can
// be looked at without a display:
//
//   xvfb-run -a lumen shot.gs
//
// Same scene as playground.gs and the same theme; it just does not wait for
// anyone to click on it. A gallery is the only way to see that a bevel, or the
// lack of one, is consistent - a control looks fine alone and wrong beside
// twenty others.
app = {}

function load() {
  window.setTitle('chisel - gallery')
  window.setMode(1440, 900)

  frame = logicalSize(1440, 900)

  window.setLogicalSize(frame.w, frame.h)
  window.setPixelPerfect(true)

  theme = asepriteMocha().useScale(1).loadFonts(null)

  app.ui = new Ui(theme, new Painter(theme))
  app.frames = 0

  app.ui.icons = new Icons('resources/icons.png', 16)
    .define(['pencil', 'eraser', 'bucket', 'picker', 'select', 'move', 'line', 'rectangle'])
    .define(['ellipse', 'text', 'zoom', 'grid', 'layers', 'frame', 'play', 'stop'])
    .define(['undo', 'redo', 'save', 'open', 'plus', 'minus', 'check', 'close'])
    .define(['eye', 'lock'])

  app.ui.cursors = new Cursors('resources/cursors.png', 8)
    .define('arrow', 1, 0)
    .define('crosshair', 3, 3)
    .define('hand', 3, 1)
    .define('ibeam', 2, 3)
    .define('resize-h', 3, 3)
    .define('resize-v', 3, 3)

  app.gallery = new Gallery(theme)

  app.ui.mount(app.gallery)
  app.ui.resized(frame.w, frame.h)
}

function update(dt) {
  return app.ui.tick(dt)
}

function draw() {
  app.ui.paint()

  theme = app.ui.theme
  bar = new Rect(0, window.height - theme.metric('row'), window.width, theme.metric('row'))

  app.ui.painter.panel(bar, null)
  app.ui.painter.textIn('body', app.gallery.message, bar.inset(theme.metric('pad')), 'left', 'middle', theme.of('text.dim'))

  app.frames = app.frames + 1

  if (app.frames == 2) {
    console.log(`SHOT:${canvas.screenshot('gallery.png')}`)
    lumen.quit()
  }
}
