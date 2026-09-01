import { Painter } from "chisel/painter"
import { Ui } from "chisel/ui"
import { Icons } from "chisel/icons"
import { Cursors } from "chisel/cursors"
import { Signals } from "studio/signals"
import { Preferences } from "studio/preferences"
import { CommandRegistry } from "studio/command-registry"
import { Keymap } from "studio/keymap"
import { ToolRegistry } from "studio/tool-registry"
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
    this.applyPreferences()

    registerCoreCommands(this)
  }

  // The icon and cursor sheets. Both are placeholder art in a documented
  // format - 16x16 cells, 8 per row, white on transparent - so replacing them
  // is a matter of dropping in a new PNG, not touching code.
  loadArt() {
    this.ui.icons = new Icons('resources/icons.png', 16)
      .define(['pencil', 'eraser', 'bucket', 'picker', 'select', 'move', 'line', 'rectangle'])
      .define(['ellipse', 'text', 'zoom', 'grid', 'layers', 'frame', 'play', 'stop'])
      .define(['undo', 'redo', 'save', 'open', 'plus', 'minus', 'check', 'close'])

    this.ui.cursors = new Cursors('resources/cursors.png', 16)
      .define('arrow', 0, 0)
      .define('crosshair', 7, 7)
      .define('hand', 8, 8)
      .define('ibeam', 6, 8)
      .define('resize-h', 8, 6)
      .define('resize-v', 7, 8)

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
