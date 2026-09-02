// The per-row inset of a chamfered corner, top row first.
//
// Picotron does not round its corners, it cuts them. A 2px chamfer takes two
// pixels off the first row and one off the second, which is the profile
// measured off every window in every reference: [2, 1].
//
// This is deliberately not cornerInsets(). That helper walks a circular
// quadrant and is right for a curve; a chamfer is a straight 45-degree cut and
// the two disagree from radius 3 upward. Keeping both means a theme can pick,
// and means neither is bent into approximating the other.
function chamfer(size) {
  insets = []

  for (row = 0; row < size; row++) {
    insets.push(size - row)
  }

  return insets
}
