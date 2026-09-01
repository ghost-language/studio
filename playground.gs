import "lumen:window"
import "lumen:canvas"
import { Ui } from "chisel/ui"
import { Painter } from "chisel/painter"
import { Rect } from "chisel/geometry/rect"
import { Label } from "chisel/widgets/label"
import { Icons } from "chisel/icons"
import { Cursors } from "chisel/cursors"
import { asepriteDark } from "chisel/themes/aseprite-dark"
import { Gallery } from "playground/gallery"

// The widget playground. Run it with:
//
//   lumen playground.gs
//
// It uses chisel and nothing else - no Studio, no documents, no editors -
// which is the point: the framework has to stand up on its own before an
// application leans on it.
app = {}

function load() {
  window.setTitle('Chisel - widget playground')
  window.setMode(1180, 720)
  window.setResizable(true)
  window.setVsync(true)

  theme = asepriteDark().useScale(1).loadFonts(null)

  app.ui = new Ui(theme, new Painter(theme))

  // 16x16 cells, 8 to a row, named in sheet order.
  app.ui.icons = new Icons('resources/icons.png', 16)
    .define(['pencil', 'eraser', 'bucket', 'picker', 'select', 'move', 'line', 'rectangle'])
    .define(['ellipse', 'text', 'zoom', 'grid', 'layers', 'frame', 'play', 'stop'])
    .define(['undo', 'redo', 'save', 'open', 'plus', 'minus', 'check', 'close'])

  app.ui.cursors = new Cursors('resources/cursors.png', 16)
    .define('arrow', 0, 0)
    .define('crosshair', 7, 7)
    .define('hand', 8, 8)
    .define('ibeam', 6, 8)
    .define('resize-h', 8, 6)
    .define('resize-v', 7, 8)

  app.ui.cursors.claim()

  app.gallery = new Gallery(theme)

  app.ui.mount(app.gallery)
}

function update(dt) { app.ui.tick(dt) }

function draw() {
  app.ui.paint()

  // The status line is painted by the entry rather than a widget, so the
  // gallery stays a pure list of controls.
  theme = app.ui.theme
  bar = new Rect(0, window.height - theme.metric('row'), window.width, theme.metric('row'))

  app.ui.painter.panel(bar, null)
  app.ui.painter.textIn('body', app.gallery.message, bar.inset(theme.metric('pad')), 'left', 'middle', theme.of('text.dim'))
  app.ui.painter.textIn('body', 'chisel playground', bar.inset(theme.metric('pad')), 'right', 'middle', theme.of('text.dim'))
}

function resize(width, height) { app.ui.resized(width, height) }

function mousepressed(x, y, button, clicks) { app.ui.pressed(x, y, button, clicks) }
function mousereleased(x, y, button)        { app.ui.released(x, y, button) }
function mousemoved(x, y, dx, dy)           { app.ui.moved(x, y, dx, dy) }
function wheelmoved(x, y)                   { app.ui.wheeled(x, y) }
function keypressed(key, isRepeat)          { app.ui.keyed(key, isRepeat) }
function keyreleased(key)                   { app.ui.keyReleased(key) }
function textinput(text)                    { app.ui.typed(text) }
function focus(hasFocus)                    { app.ui.focusChanged(hasFocus) }
