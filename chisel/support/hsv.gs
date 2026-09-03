import "ghost:math"

// Hue, saturation and value to red, green and blue.
//
// A colour picker needs this and a palette does not, which is why it arrives
// only now: everything before this point chose from a fixed set of colours,
// and picking from a continuous field is the first thing that has to construct
// one.
//
// `hue` is degrees in [0, 360), `saturation` and `value` are [0, 1]. Returns
// three integers in [0, 255], because that is what a colour constructor wants
// and rounding once here beats rounding at every call site.
function hsvToRgb(hue, saturation, value) {
  if (saturation <= 0) {
    level = channel(value)

    return { r: level, g: level, b: level }
  }

  // Six sectors of sixty degrees. `slice` is how far through its own sector
  // the hue has travelled, which is what makes the ramp continuous across a
  // boundary rather than stepping at it.
  sector = math.floor(hue / 60.0) % 6
  slice = (hue / 60.0) - math.floor(hue / 60.0)

  dark = value * (1 - saturation)
  falling = value * (1 - (slice * saturation))
  rising = value * (1 - ((1 - slice) * saturation))

  if (sector == 0) { return { r: channel(value), g: channel(rising), b: channel(dark) } }
  if (sector == 1) { return { r: channel(falling), g: channel(value), b: channel(dark) } }
  if (sector == 2) { return { r: channel(dark), g: channel(value), b: channel(rising) } }
  if (sector == 3) { return { r: channel(dark), g: channel(falling), b: channel(value) } }
  if (sector == 4) { return { r: channel(rising), g: channel(dark), b: channel(value) } }

  return { r: channel(value), g: channel(dark), b: channel(falling) }
}

// One [0, 1] component as a byte, clamped rather than trusted: a saturation
// slightly over one from a drag that ran off the edge of the field would
// otherwise produce 256 and wrap to black.
function channel(level) {
  scaled = math.floor((level * 255) + 0.5)

  if (scaled < 0) {
    return 0
  }

  if (scaled > 255) {
    return 255
  }

  return scaled
}
