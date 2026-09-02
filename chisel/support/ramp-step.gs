// A step on a ramp, clamped rather than raising.
//
// Clamping is the whole point. A ramp is how a surface gets its states - a
// face is a step, hovered is the step above, pressed is the step below - and
// that rule has to hold at both ends of the ramp too. Asking for one step
// lighter than the lightest colour should give the lightest colour, because
// that is what a hover on the brightest surface in the theme actually wants;
// raising there would mean every widget carrying its own edge cases.
function rampStep(steps, index) {
  if (steps == null) {
    return null
  }

  at = index

  if (at < 0) {
    at = 0
  }

  if (at > steps.length() - 1) {
    at = steps.length() - 1
  }

  return steps[at]
}
