import { Command } from "studio/command"

// The commands and keys every editor shares. Registered once, by the Studio
// constructor, so an editor only has to add what is genuinely its own.
function registerCoreCommands(studio) {
  commands = studio.commands
  keys = studio.keymap

  commands.add(new Command('history.undo', 'Undo')
    .does(function (studio) { studio.document.history.undo() })
    .available(function (studio) {
      // Two statements, not `studio.document != null and studio.document
      // .history.canUndo()`: `and` evaluates both operands regardless of the
      // first's result, so that line would still dereference a null
      // document and crash the moment nothing is open.
      if (studio.document == null) {
        return false
      }

      return studio.document.history.canUndo()
    }))

  commands.add(new Command('history.redo', 'Redo')
    .does(function (studio) { studio.document.history.redo() })
    .available(function (studio) {
      if (studio.document == null) {
        return false
      }

      return studio.document.history.canRedo()
    }))

  commands.add(new Command('view.zoomIn', 'Zoom In')
    .does(function (studio) { studio.signals.emit('view.zoom', 1) }))

  commands.add(new Command('view.zoomOut', 'Zoom Out')
    .does(function (studio) { studio.signals.emit('view.zoom', -1) }))

  commands.add(new Command('view.zoomReset', 'Reset Zoom')
    .does(function (studio) { studio.signals.emit('view.reset', null) }))

  commands.add(new Command('view.toggleGrid', 'Toggle Grid')
    .does(function (studio) { studio.signals.emit('view.grid', null) }))

  // Re-applying preferences rather than calling loadFonts(null) directly keeps
  // a custom ui.font from being thrown away every time the scale changes.
  commands.add(new Command('view.scaleUp', 'Bigger Interface')
    .does(function (studio) {
      studio.theme.useScale(studio.theme.scale + 1)
      studio.preferences.set('ui.scale', studio.theme.scale)
      studio.applyPreferences()
      studio.ui.resized(studio.ui.root.bounds.w, studio.ui.root.bounds.h)
      studio.say(`UI scale ${studio.theme.scale}x`)
    }))

  commands.add(new Command('view.scaleDown', 'Smaller Interface')
    .does(function (studio) {
      studio.theme.useScale(studio.theme.scale - 1)
      studio.preferences.set('ui.scale', studio.theme.scale)
      studio.applyPreferences()
      studio.ui.resized(studio.ui.root.bounds.w, studio.ui.root.bounds.h)
      studio.say(`UI scale ${studio.theme.scale}x`)
    }))

  commands.add(new Command('app.preferences', 'Preferences...')
    .does(function (studio) { studio.openPreferences() }))

  keys.bind('ctrl+,', 'app.preferences')

  keys.guard('editing', function (studio) { return studio.document != null })

  keys.group(['editing'], function (keys) {
    keys.bind('ctrl+z', 'history.undo')
    keys.bind('ctrl+shift+z', 'history.redo')
    keys.bind('=', 'view.zoomIn')
    keys.bind('-', 'view.zoomOut')
    keys.bind('1', 'view.zoomReset')
    keys.bind("ctrl+'", 'view.toggleGrid')
  })

  keys.bind('ctrl+=', 'view.scaleUp')
  keys.bind('ctrl+-', 'view.scaleDown')

  return studio
}
