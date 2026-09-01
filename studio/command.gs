// One action, named once. A menu row, a tool-bar button and a keyboard shortcut
// are three front doors onto the same Command, which is what keeps them from
// drifting apart.
//
// The field is `accel` and the setter is `shortcut()` on purpose: Ghost lets a
// field and a method share a name (x.thing reads the field, x.thing() calls the
// method), and one name meaning two things is a bug waiting for a tired
// afternoon.
class Command {
  constructor(name, label) {
    this.name = name
    this.label = label
    this.accel = ''
    this.runner = null
    this.guard = null
  }

  shortcut(chord) { this.accel = chord;   return this }
  does(runner)    { this.runner = runner; return this }
  available(test) { this.guard = test;    return this }

  isEnabled(studio) {
    if (this.guard == null) {
      return true
    }

    // A function held in a field cannot be called as this.guard(...): Ghost
    // reads that as a method call, and method lookup does not see fields. Bind
    // it to a local and call the local.
    test = this.guard

    return test(studio)
  }

  run(studio) {
    if (this.runner == null or !this.isEnabled(studio)) {
      return false
    }

    runner = this.runner

    runner(studio)

    return true
  }
}
