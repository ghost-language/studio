import "ghost:os"

// Command names asked for on the command line, as `run:some.command`.
//
//   lumen . --shot run:app.preferences
//
// Which exists so that a screen reachable only by clicking - a dialog, a menu -
// can still be rendered and looked at on a machine with no display. Without it
// the only things a screenshot can show are whatever the app opens with, and
// those are exactly the screens least likely to be wrong.
function requestedCommands() {
  names = []

  for (argument in os.args()) {
    if (argument.startsWith('run:')) {
      names.push(argument.replace('run:', ''))
    }
  }

  return names
}
