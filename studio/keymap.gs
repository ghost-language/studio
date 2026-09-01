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

    // Two ifs, not one `and`: `and`/`or` evaluate both operands regardless of
    // the first's result, so `known != null and known.accel == ''` would
    // still evaluate `known.accel` - and raise - when a chord is bound to a
    // command name that was never registered.
    if (known == null) {
      return this
    }

    if (known.accel == '') {
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

      // A group can name a guard before guard() registers it, or misspell
      // one - `test != null and !test(studio)` would still call `test(studio)`
      // and crash, since `and` does not short-circuit on the first operand.
      if (test == null) {
        continue
      }

      if (!test(studio)) {
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

    // The most important guard in this file to get right: every keypress
    // with no binding reaches here with route == null. `or` does not
    // short-circuit, so folding this into one line - `route == null or
    // !this.passes(route.middleware, studio)` - would evaluate
    // `route.middleware` and crash on the very first unbound key.
    if (route == null) {
      return false
    }

    if (!this.passes(route.middleware, studio)) {
      return false
    }

    return this.commands.run(route.command, studio)
  }
}
