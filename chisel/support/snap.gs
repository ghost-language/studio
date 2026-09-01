import "ghost:math"

// snap rounds a coordinate to the nearest whole pixel.
//
// Ghost's `/` always promotes to float, so any layout arithmetic that divides
// produces fractions. A one-pixel line drawn at a fractional y is a two-pixel
// smear, which is the difference between "pixel tool" and "web page". Rounding
// to nearest rather than flooring keeps adjacent regions flush: flooring biases
// everything half a pixel up and left, and the gap shows.
function snap(value) {
  return math.floor(value + 0.5)
}
