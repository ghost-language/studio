// A registry, not a container: it holds one kind of thing, its keys are
// user-facing, and everything in it can be listed - which is all a command
// palette ever needed.
class CommandRegistry {
  constructor() {
    this.commands = {}
  }

  add(command) {
    this.commands.set(command.name, command)

    return command
  }

  get(name) {
    return this.commands.get(name)
  }

  has(name) {
    return this.commands.has(name)
  }

  run(name, studio) {
    command = this.get(name)

    if (command == null) {
      console.log(`studio: no command named ${name}`)

      return false
    }

    return command.run(studio)
  }

  all() {
    return this.commands.values()
  }
}
