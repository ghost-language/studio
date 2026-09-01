import "lumen:window"
import "lumen:canvas"
import { Ui } from "chisel/ui"
import { Painter } from "chisel/painter"
import { Rect } from "chisel/geometry/rect"
import { Label } from "chisel/widgets/label"
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
