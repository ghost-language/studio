import "lumen:window"
import { Studio } from "studio/studio"
import { asepriteDark } from "chisel/themes/aseprite-dark"
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
  window.setMode(1280, 800)
  window.setResizable(true)
  window.setVsync(true)

  // Scale 1 by default: the interface is already sized around a 19px font, and
  // 2x makes every bar twice the weight of the equivalent in Aseprite. Ctrl+=
  // raises it at runtime, and the choice is remembered.
  theme = asepriteDark()
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
}

function update(dt) { app.studio.ui.tick(dt) }
function draw()     { app.studio.ui.paint() }

function resize(width, height) { app.studio.ui.resized(width, height) }

function mousepressed(x, y, button, clicks) { app.studio.ui.pressed(x, y, button, clicks) }
function mousereleased(x, y, button)        { app.studio.ui.released(x, y, button) }
function mousemoved(x, y, dx, dy)           { app.studio.ui.moved(x, y, dx, dy) }
function wheelmoved(x, y)                   { app.studio.ui.wheeled(x, y) }
function keypressed(key, isRepeat)          { app.studio.keyed(key, isRepeat) }

// keyreleased and focus are not optional extras: modifier state is tracked
// from these events, so without them a held Ctrl would never come back up.
function keyreleased(key)                   { app.studio.keyReleased(key) }
function focus(hasFocus)                    { app.studio.focusChanged(hasFocus) }

function quit() {
  app.studio.preferences
    .set('ui.scale', app.studio.theme.scale)
    .set('ui.theme', app.studio.theme.name)
    .save()

  return false
}
