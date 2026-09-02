import { Painter } from "chisel/painter"
import { Ui } from "chisel/ui"
import { Icons } from "chisel/icons"
import { Cursors } from "chisel/cursors"
import { Signals } from "studio/signals"
import { Preferences } from "studio/preferences"
import { CommandRegistry } from "studio/command-registry"
import { Keymap } from "studio/keymap"
import { ToolRegistry } from "studio/tool-registry"
import { themeNamed } from "chisel/themes/theme-named"
import { Window } from "chisel/widgets/window"
import { PreferencesWindow } from "studio/preferences-window"
import { registerCoreCommands } from "studio/commands"

// One object, constructed in load() and handed to everything that needs
// anything. It is a context, not a service container: every field is a real
// object of a known type, built here, in an order you can read.
//
// There is deliberately no bind()/make(): in a language with no reflection a
// container is a global hashmap with string keys, and it trades startup import
// faults for null-at-runtime and greppable dependencies for none.
class Studio {
  constructor(theme) {
    this.theme = theme
    this.painter = new Painter(theme)
    this.ui = new Ui(theme, this.painter)

    this.signals = new Signals()
    this.preferences = new Preferences('studio').load()
    this.commands = new CommandRegistry()
    this.keymap = new Keymap(this.commands)
    this.tools = new ToolRegistry()

    this.editors = []
    this.documents = []
    this.document = null
    this.editor = null

    // The one back-reference chisel knows about, and it is opaque: the
    // framework never calls into it, it only hands it to widgets that ask.
    this.ui.studio = this

    this.loadArt()

    // A remembered theme is applied before anything is built, so the first
    // frame is already the one the user chose rather than a flash of the
    // default.
    remembered = this.preferences.get('ui.theme', null)

    if (remembered != null) {
      this.theme = themeNamed(remembered)
      this.painter = new Painter(this.theme)
      this.ui.theme = this.theme
      this.ui.painter = this.painter
    }

    this.applyPreferences()

    registerCoreCommands(this)
  }

  // The icon and cursor sheets, drawn by tools/make-icons.py from ASCII art
  // kept in that file - so changing an icon is a readable diff rather than a
  // binary blob nobody can review.
  //
  // Eight pixel cells, not sixteen. Picotron's control icons are 7x7 silhouettes
  // and its rows are 12px tall; a 16px icon is taller than the row it sits in.
  // That mismatch is most of why the old sheet could not have looked right no
  // matter how well it was drawn.
  loadArt() {
    this.ui.icons = new Icons('resources/icons.png', 8)
      .define(['pencil', 'eraser', 'bucket', 'picker', 'select', 'move', 'line', 'rectangle'])
      .define(['ellipse', 'text', 'zoom', 'grid', 'layers', 'frame', 'play', 'stop'])
      .define(['undo', 'redo', 'save', 'open', 'plus', 'minus', 'check', 'close'])

    // Picotron's pointer is a hollow outline rather than a filled arrow with a
    // border, so every interior pixel is whatever is behind it. Hotspots come
    // from tools/make-icons.py, which is where the art is.
    this.ui.cursors = new Cursors('resources/cursors.png', 8)
      .define('arrow', 1, 0)
      .define('crosshair', 3, 3)
      .define('hand', 3, 1)
      .define('ibeam', 2, 3)
      .define('resize-h', 3, 3)
      .define('resize-v', 3, 3)

    this.ui.cursors.claim()

    return this
  }

  // ui.font is a path to a pixel TTF; ui.fontSize is the size that font is
  // drawn at natively, which has to be right or the text renders blurry - see
  // Theme.loadFonts().
  applyPreferences() {
    this.theme
      .useScale(this.preferences.get('ui.scale', this.theme.scale))
      .loadFonts(
        this.preferences.get('ui.font', null),
        this.preferences.get('ui.fontSize', null)
      )

    return this
  }

  // Swapping the theme swaps the object every widget reads through, so the
  // colours land immediately - but the dock's region sizes were computed from
  // the old metrics when the workspace was built, so the workspace is rebuilt
  // too. The open dialog is carried across rather than dismissed: changing a
  // theme from a preferences window that then vanishes is a poor trade.
  useTheme(name) {
    theme = themeNamed(name)

    theme.useScale(this.theme.scale)

    this.theme = theme
    this.painter = new Painter(theme)

    this.ui.theme = theme
    this.ui.painter = this.painter

    this.preferences.set('ui.theme', name)
    this.applyPreferences()
    this.reload()

    return theme
  }

  // Rebuild the current workspace against the current theme and metrics.
  reload() {
    entry = this.entryFor(this.document)

    if (entry == null) {
      return false
    }

    held = this.ui.modal

    this.ui.mount(entry.editor.workspace(entry.document))

    if (held != null) {
      held.theme = null
      this.ui.openModal(held)
    }

    return true
  }

  // An editor is a plugin: it contributes tools, commands and panels, and it
  // knows how to build a workspace for its own document type. Nothing is
  // auto-discovered - you list them, in order, in load().
  register(editor) {
    this.editors.push(editor)
    editor.boot()

    return editor
  }

  open(document, editor) {
    entry = { document: document, editor: editor }

    this.documents.push(entry)
    this.activate(entry)

    return document
  }

  activate(entry) {
    this.document = entry.document
    this.editor = entry.editor

    this.ui.mount(entry.editor.workspace(entry.document))
    this.signals.emit('document.activated', entry.document)

    return entry.document
  }

  entryFor(document) {
    for (entry in this.documents) {
      if (entry.document == document) {
        return entry
      }
    }

    return null
  }

  run(name) {
    return this.commands.run(name, this)
  }

  openPreferences() {
    dialog = new Window('Preferences', 320 * this.theme.scale, 200 * this.theme.scale)

    dialog.holds(new PreferencesWindow(this))

    self = this

    dialog.on('close', function () {
      self.ui.closeModal()
      self.preferences.save()
    })

    return this.ui.openModal(dialog)
  }

  say(message) {
    return this.signals.emit('status.message', message)
  }

  // Keys go to the focused widget first - a text field has to be able to eat
  // its own letters - and to the keymap only if nothing took them.
  keyed(key, isRepeat) {
    // ui.keyed() records the modifier state first, so the chord below sees it.
    if (this.ui.keyed(key, isRepeat)) {
      return true
    }

    return this.keymap.dispatch(this.ui.modifiers.chordFor(key), this)
  }

  keyReleased(key) {
    return this.ui.keyReleased(key)
  }

  typed(text) {
    return this.ui.typed(text)
  }

  focusChanged(hasFocus) {
    return this.ui.focusChanged(hasFocus)
  }
}
