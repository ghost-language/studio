import "lumen:window"
import "lumen:canvas"
import "lumen:lumen"
import { Studio } from "studio/studio"
import { picotron } from "chisel/themes/picotron"
import { logicalSize } from "chisel/support/logical-size"
import { wantsScreenshot } from "chisel/support/wants-screenshot"
import { requestedCommands } from "chisel/support/requested-commands"
import { SpriteEditor } from "studio/sprite/editor"
import { MapEditor } from "studio/map/editor"
import { Sprite } from "studio/sprite/sprite"
import { Tilemap } from "studio/map/tilemap"

// The one map of module-level state in the program. It is only ever mutated
// through property assignment, which works - unlike rebinding a plain module
// variable from inside a function, which silently does not.
app = {}

function load() {
  window.setTitle('Studio')
  window.setMode(1440, 810)
  window.setResizable(true)
  window.setVsync(true)

  // Draw into a magnified low-resolution framebuffer, the way Picotron does.
  // Its 12px rows and 7x7 icons only mean anything if one drawn pixel covers
  // several screen pixels; the magnification is picked from the window so a
  // larger monitor buys workspace rather than bigger chrome.
  frame = logicalSize(1440, 810)

  window.setLogicalSize(frame.w, frame.h)
  window.setPixelPerfect(true)

  // Scale 1: the framebuffer does the magnifying now, so every metric is used
  // at the size it was measured at. Ctrl+= changes the magnification instead,
  // which is the same control with an honest name.
  theme = picotron()
    .useScale(1)
    .loadFonts(null)

  app.studio = new Studio(theme)

  sprites = app.studio.register(new SpriteEditor(app.studio))
  maps = app.studio.register(new MapEditor(app.studio))

  map = new Tilemap(24, 16, 16)
  map.title = 'overworld'

  sprite = new Sprite(32, 32)
  sprite.title = 'Sprite-0001'

  app.studio.open(map, maps)
  app.studio.open(sprite, sprites)

  app.studio.say('Welcome to Studio')

  app.shooting = wantsScreenshot()
  app.frames = 0

  // `lumen . --shot run:app.preferences` renders a screen that is otherwise
  // only reachable by clicking, which is exactly the kind least likely to have
  // been looked at.
  for (name in requestedCommands()) {
    app.studio.run(name)
  }
}

function update(dt) { app.studio.ui.tick(dt) }

function draw() {
  app.studio.ui.paint()

  if (!app.shooting) {
    return false
  }

  app.frames = app.frames + 1

  // Frame one can land before the first present on some drivers, so the read
  // back is taken on the second.
  if (app.frames == 2) {
    console.log(`SHOT:${canvas.screenshot('studio.png')}`)
    lumen.quit()
  }

  return true
}

// Lumen reports the resize in real window pixels; everything above works in
// framebuffer pixels. Recomputing the magnification here is what makes a wider
// window buy workspace rather than bigger chrome.
function resize(width, height) {
  frame = logicalSize(width, height)

  window.setLogicalSize(frame.w, frame.h)

  return app.studio.ui.resized(frame.w, frame.h)
}

function mousepressed(x, y, button, clicks) { app.studio.ui.pressed(x, y, button, clicks) }
function mousereleased(x, y, button)        { app.studio.ui.released(x, y, button) }
function mousemoved(x, y, dx, dy)           { app.studio.ui.moved(x, y, dx, dy) }
function wheelmoved(x, y)                   { app.studio.ui.wheeled(x, y) }
function keypressed(key, isRepeat)          { app.studio.keyed(key, isRepeat) }

// keyreleased and focus are not optional extras: modifier state is tracked
// from these events, so without them a held Ctrl would never come back up.
function keyreleased(key)                   { app.studio.keyReleased(key) }
function textinput(text)                    { app.studio.typed(text) }
function focus(hasFocus)                    { app.studio.focusChanged(hasFocus) }

function quit() {
  app.studio.preferences
    .set('ui.scale', app.studio.theme.scale)
    .set('ui.theme', app.studio.theme.name)
    .save()

  return false
}
