import "ghost:os"

// Whether the app was asked to render one frame, save it, and quit.
//
//   lumen . --shot
//
// Which is the only way to look at the interface on a machine with no display,
// and the only way a build can check that the thing still draws. Every bug in
// this project that survived to a real run lived in a file the test suite
// cannot execute, so being able to run the whole app headlessly is worth the
// six lines.
function wantsScreenshot() {
  for (argument in os.args()) {
    if (argument == '--shot') {
      return true
    }
  }

  return false
}
