import { chordOf } from "chisel/support/chord-of"
import { normalizeChord } from "chisel/support/normalize-chord"

// Routes, with middleware. bind() maps a chord to a command name; group()
// applies shared guards to everything declared inside it. A desktop app's
// keymap is its routes file, and this is the file a user would read to learn
// the application.
class Keymap {
  constructor(commands) {
    this.commands = commands
    this.routes = {}
    this.guards = {}
    this.middleware = []
  }

  guard(name, test) {
    this.guards.set(name, test)

    return this
  }

  bind(chord, command) {
    this.routes.set(normalizeChord(chord), {
      command: command,
      middleware: this.middleware
    })

    // A binding is also the answer to "what is this command's shortcut?", so a
    // menu row and a tooltip never have to be told separately.
    known = this.commands.get(command)

    if (known != null and known.accel == '') {
      known.shortcut(chord)
    }

    return this
  }

  group(names, callback) {
    previous = this.middleware

    this.middleware = previous.concat(names)
    callback(this)
    this.middleware = previous

    return this
  }

  passes(names, studio) {
    for (name in names) {
      test = this.guards.get(name)

      if (test != null and !test(studio)) {
        return false
      }
    }

    return true
  }

  bindingFor(command) {
    for (chord, route in this.routes) {
      if (route.command == command) {
        return chord
      }
    }

    return ''
  }

  dispatch(key, studio) {
    chord = chordOf(key)

    if (chord == '') {
      return false
    }

    route = this.routes.get(chord)

    if (route == null or !this.passes(route.middleware, studio)) {
      return false
    }

    return this.commands.run(route.command, studio)
  }
}
