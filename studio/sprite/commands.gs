import { Command } from "studio/command"
import { Sprite } from "studio/sprite/sprite"

// The pixel editor's own commands. Everything shared - undo, zoom, UI scale -
// is registered by studio/commands.gs before this runs.
function registerSpriteCommands(studio, editor) {
  commands = studio.commands
  keys = studio.keymap

  commands.add(new Command('sprite.new', 'New Sprite')
    .does(function (studio) {
      sprite = new Sprite(32, 32)
      sprite.title = `Sprite-${studio.documents.length() + 1}`

      studio.open(sprite, editor)
      studio.say('New 32 x 32 sprite')
    }))

  commands.add(new Command('sprite.clear', 'Clear')
    .does(function (studio) {
      document = studio.document

      document.history.begin()

      for (y = 0; y < document.height(); y++) {
        for (x = 0; x < document.width(); x++) {
          document.put(x, y, null)
        }
      }

      document.history.commit()
      studio.say('Cleared')
    })
    .available(function (studio) { return studio.document != null }))

  keys.group(['editing'], function (keys) {
    keys.bind('ctrl+n', 'sprite.new')
    keys.bind('delete', 'sprite.clear')
  })

  return studio
}
