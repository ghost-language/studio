import { Command } from "studio/command"

// The commands and keys every editor shares. Registered once, by the Studio
// constructor, so an editor only has to add what is genuinely its own.
function registerCoreCommands(studio) {
  commands = studio.commands
  keys = studio.keymap

  commands.add(new Command('history.undo', 'Undo')
    .does(function (studio) { studio.document.history.undo() })
    .available(function (studio) { return studio.document != null and studio.document.history.canUndo() }))

  commands.add(new Command('history.redo', 'Redo')
    .does(function (studio) { studio.document.history.redo() })
    .available(function (studio) { return studio.document != null and studio.document.history.canRedo() }))

  commands.add(new Command('view.zoomIn', 'Zoom In')
    .does(function (studio) { studio.signals.emit('view.zoom', 1) }))

  commands.add(new Command('view.zoomOut', 'Zoom Out')
    .does(function (studio) { studio.signals.emit('view.zoom', -1) }))

  commands.add(new Command('view.zoomReset', 'Reset Zoom')
    .does(function (studio) { studio.signals.emit('view.reset', null) }))

  commands.add(new Command('view.scaleUp', 'Bigger Interface')
    .does(function (studio) {
      studio.theme.useScale(studio.theme.scale + 1).loadFonts(null)
      studio.preferences.set('ui.scale', studio.theme.scale)
      studio.ui.resized(studio.ui.root.bounds.w, studio.ui.root.bounds.h)
      studio.say(`UI scale ${studio.theme.scale}x`)
    }))

  commands.add(new Command('view.scaleDown', 'Smaller Interface')
    .does(function (studio) {
      studio.theme.useScale(studio.theme.scale - 1).loadFonts(null)
      studio.preferences.set('ui.scale', studio.theme.scale)
      studio.ui.resized(studio.ui.root.bounds.w, studio.ui.root.bounds.h)
      studio.say(`UI scale ${studio.theme.scale}x`)
    }))

  keys.guard('editing', function (studio) { return studio.document != null })

  keys.group(['editing'], function (keys) {
    keys.bind('ctrl+z', 'history.undo')
    keys.bind('ctrl+shift+z', 'history.redo')
    keys.bind('=', 'view.zoomIn')
    keys.bind('-', 'view.zoomOut')
    keys.bind('1', 'view.zoomReset')
  })

  keys.bind('ctrl+=', 'view.scaleUp')
  keys.bind('ctrl+-', 'view.scaleDown')

  return studio
}
