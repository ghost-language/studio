import "ghost:math"

// The largest whole zoom at which a document fits inside a region.
//
// Whole numbers only: a fractional zoom draws some source pixels two screen
// pixels wide and their neighbours three, which is exactly how pixel art comes
// out looking uneven. Every artwork zoom in this program is an integer for the
// same reason the framebuffer magnification is.
//
// Never below 1 - a document larger than its region is shown at 1:1 and
// scrolled, not shrunk into mush.
function fitZoom(width, height, regionWidth, regionHeight) {
  if (width < 1 or height < 1) {
    return 1
  }

  across = math.floor(regionWidth / width)
  down = math.floor(regionHeight / height)

  zoom = across

  if (down < zoom) {
    zoom = down
  }

  if (zoom < 1) {
    return 1
  }

  return zoom
}
