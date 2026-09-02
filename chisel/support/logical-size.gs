import "ghost:math"

// The logical framebuffer to draw into, given a real window.
//
// Picotron renders 480x270 and magnifies the whole frame, which is where its
// 12px rows and 7x7 icons come from - those numbers only mean anything if a
// drawn pixel is several screen pixels wide. Studio keeps that pixel density
// but not the cap: it picks the integer magnification that puts the logical
// height nearest 270, then divides the real window by it. A 1440x900 window
// becomes 480x300 at 3x rather than 480x270 letterboxed, so a wider monitor
// buys workspace instead of margins.
//
// That difference matters because Studio is an editor inside a window, not an
// operating system. At a hard 480x270 a 32x32 sprite plus a palette, timeline
// and two toolbars leaves almost nothing for the canvas; Picotron gets away
// with it by being the whole screen.
//
// The magnification is always a whole number. A fractional one resamples every
// drawn pixel to a different width and is exactly what makes pixel art look
// wrong - the one rule this cannot bend.
//
// `preferred` forces a magnification when the user has chosen one; null picks.
function logicalSize(width, height, preferred = null) {
  scale = preferred

  if (scale == null) {
    scale = math.floor((height / 270.0) + 0.5)
  }

  scale = math.floor(scale)

  if (scale < 1) {
    scale = 1
  }

  // A window smaller than the framebuffer would otherwise report zero and
  // divide by nothing later on.
  logicalWidth = math.floor(width / scale)
  logicalHeight = math.floor(height / scale)

  if (logicalWidth < 1) {
    logicalWidth = 1
  }

  if (logicalHeight < 1) {
    logicalHeight = 1
  }

  return { w: logicalWidth, h: logicalHeight, scale: scale }
}
