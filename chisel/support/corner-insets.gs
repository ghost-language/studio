import "ghost:math"

// How far each row of a corner is inset, for a rounded rectangle of the given
// radius. Row 0 is the outermost row of the corner; the list is `radius` long.
//
// This is a real circular quadrant rather than a diagonal: a 45-degree stair
// reads as a chamfer - a corner someone filed flat - while a circle reads as
// round. For radius 5 it answers [3, 1, 1, 0, 0], which cuts three pixels at
// the very corner and straightens out quickly, exactly the profile a pixel
// artist would draw by hand.
//
// It lives in its own file, away from the canvas, so it can be tested without
// an engine - the geometry is the part worth being sure about.
function cornerInsets(radius) {
  insets = []

  for (row = 0; row < radius; row++) {
    // The centre of this row, measured from the circle's centre.
    dy = radius - row - 0.5

    // The circle's half-width at that row, rounded to whole pixels.
    half = math.floor(math.sqrt(radius * radius - dy * dy) + 0.5)

    insets.push(math.max(0, radius - half))
  }

  return insets
}
