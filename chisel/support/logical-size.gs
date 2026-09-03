import "ghost:math"

// The logical framebuffer to draw into, given a real window.
//
// An interface built on a pixel grid only reads correctly if a drawn pixel
// covers several screen pixels: a 12px menu bar and a 16px icon are chunky at
// 2x and microscopic at 1x. So Studio draws into a small framebuffer and lets
// the engine magnify the whole frame.
//
// The magnification is picked rather than fixed. `target` is the logical height
// the design was drawn for, and this returns the integer magnification putting
// the window nearest it, then divides the window by that. A 1440x900 window at
// the Aseprite target becomes 720x450 at 2x rather than 960x540 letterboxed, so
// a wider monitor buys workspace instead of margins.
//
// 540 is Aseprite's, measured: its chrome at 1x fills 960x540 and the reference
// screenshots magnify that twice to 1920x1080. Picotron's was 270. Passing the
// target rather than hard-coding it is what lets one framebuffer serve both.
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
function logicalSize(width, height, preferred = null, target = 540) {
  scale = preferred

  if (scale == null) {
    scale = math.floor((height / (target * 1.0)) + 0.5)
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
