import "ghost:math"

// Bresenham. A fast drag skips cells - the mouse reports where it is, not where
// it went - so every painting tool walks the line between the last cell and this
// one. Without it, drawing quickly leaves a dotted stroke.
function linePixels(x0, y0, x1, y1, visit) {
  dx = math.abs(x1 - x0)
  dy = math.abs(y1 - y0)

  sx = 1
  sy = 1

  if (x0 >= x1) { sx = -1 }
  if (y0 >= y1) { sy = -1 }

  error = dx - dy

  while (true) {
    visit(x0, y0)

    if (x0 == x1 and y0 == y1) {
      break
    }

    doubled = error * 2

    if (doubled > -dy) {
      error = error - dy
      x0 = x0 + sx
    }

    if (doubled < dx) {
      error = error + dx
      y0 = y0 + sy
    }
  }
}
