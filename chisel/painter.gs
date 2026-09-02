import "lumen:canvas"
import { Rect } from "chisel/geometry/rect"
import { snap } from "chisel/support/snap"

// The only object in the toolkit that talks to the canvas.
//
// Aseprite's chrome is six drawing operations repeated everywhere. Putting them
// here means the look is consistent by construction, pixel snapping happens in
// one place, and a widget can be rendered into an off-screen surface by handing
// it a different painter.
class Painter {
  constructor(theme) {
    this.theme = theme
  }

  // ---- surfaces ---------------------------------------------------------

  fill(rect, paint) {
    canvas.setColor(paint)
    canvas.filledRectangle(rect.x, rect.y, rect.w, rect.h)
  }

  // Lines are always one pixel. setLineWidth is set on every call, because a
  // slider that left it at 2 must not thicken the next panel's edge.
  hline(x, y, width, paint) {
    canvas.setColor(paint)
    canvas.setLineWidth(1)
    canvas.line(snap(x), snap(y), snap(x + width), snap(y))
  }

  vline(x, y, height, paint) {
    canvas.setColor(paint)
    canvas.setLineWidth(1)
    canvas.line(snap(x), snap(y), snap(x), snap(y + height))
  }

  // Light on the top and left, dark on the bottom and right. Swap them and the
  // same box reads as a hole. That is the entire 3D vocabulary of this
  // interface: no shadows, no gradients, no rounded corners.
  bevel(rect, raised) {
    light = this.theme.of('bevel.light')
    dark = this.theme.of('bevel.dark')

    if (!raised) {
      light = this.theme.of('bevel.dark')
      dark = this.theme.of('bevel.light')
    }

    this.hline(rect.x, rect.y, rect.w - 1, light)
    this.vline(rect.x, rect.y, rect.h - 1, light)
    this.hline(rect.x, rect.bottom() - 1, rect.w - 1, dark)
    this.vline(rect.right() - 1, rect.y, rect.h - 1, dark)
  }

  // An outline around the whole shape, then the bevel inside it, then the
  // face. Two pixels of border rather than one is what gives these controls
  // their weight - a single bevel line on a dark ground reads as a smudge,
  // and the near-black outline is what separates a raised thing from the
  // panel behind it.
  outline(rect) {
    ink = this.theme.of('outline')

    this.hline(rect.x, rect.y, rect.w - 1, ink)
    this.hline(rect.x, rect.bottom() - 1, rect.w - 1, ink)
    this.vline(rect.x, rect.y, rect.h - 1, ink)
    this.vline(rect.right() - 1, rect.y, rect.h - 1, ink)
  }

  // ---- rounded shapes ---------------------------------------------------
  //
  // Corners are cut in whole pixels, as a staircase, rather than drawn as an
  // arc: a radius of 2 removes two pixels from the first row and one from the
  // second, which is how a pixel-art interface softens a corner without ever
  // producing a grey one. Radius comes from the theme, so it scales with the
  // interface and a square-cornered theme is radius 0.

  radius() {
    return this.theme.metric('radius')
  }

  // The body as one rectangle plus a thin row per corner step - five draws for
  // a radius of 2, rather than one per scanline.
  fillRounded(rect, paint, radius) {
    if (radius < 1) {
      return this.fill(rect, paint)
    }

    this.fill(new Rect(rect.x, rect.y + radius, rect.w, rect.h - radius * 2), paint)

    for (step = 0; step < radius; step++) {
      inset = radius - step

      this.fill(new Rect(rect.x + inset, rect.y + step, rect.w - inset * 2, 1), paint)
      this.fill(new Rect(rect.x + inset, rect.bottom() - 1 - step, rect.w - inset * 2, 1), paint)
    }
  }

  outlineRounded(rect, radius) {
    if (radius < 1) {
      return this.outline(rect)
    }

    ink = this.theme.of('outline')

    this.hline(rect.x + radius, rect.y, rect.w - radius * 2, ink)
    this.hline(rect.x + radius, rect.bottom() - 1, rect.w - radius * 2, ink)
    this.vline(rect.x, rect.y + radius, rect.h - radius * 2, ink)
    this.vline(rect.right() - 1, rect.y + radius, rect.h - radius * 2, ink)

    // The staircase pixels that turn each corner.
    for (step = 1; step < radius; step++) {
      left = rect.x + radius - step
      right = rect.right() - 1 - radius + step
      top = rect.y + step
      bottom = rect.bottom() - 1 - step

      this.fill(new Rect(left, top, 1, 1), ink)
      this.fill(new Rect(right, top, 1, 1), ink)
      this.fill(new Rect(left, bottom, 1, 1), ink)
      this.fill(new Rect(right, bottom, 1, 1), ink)
    }
  }

  // The highlight and shadow, shortened at the corners so they stop where the
  // staircase begins rather than poking out of it.
  bevelRounded(rect, raised, radius) {
    light = this.theme.of('bevel.light')
    dark = this.theme.of('bevel.dark')

    if (!raised) {
      light = this.theme.of('bevel.dark')
      dark = this.theme.of('bevel.light')
    }

    inset = radius

    this.hline(rect.x + inset, rect.y, rect.w - inset * 2, light)
    this.vline(rect.x, rect.y + inset, rect.h - inset * 2, light)
    this.hline(rect.x + inset, rect.bottom() - 1, rect.w - inset * 2, dark)
    this.vline(rect.right() - 1, rect.y + inset, rect.h - inset * 2, dark)
  }

  // A raised control: button, tab, dropdown, scrollbar thumb.
  raised(rect, face = null) {
    if (face == null) {
      face = this.theme.of('button.face')
    }

    radius = this.radius()

    this.fillRounded(rect, face, radius)
    this.outlineRounded(rect, radius)
    this.bevelRounded(rect.inset(1), true, radius)
  }

  // A pressed control - the same frame with the light and dark swapped, which
  // is the whole animation budget of this interface.
  sunk(rect, face = null) {
    if (face == null) {
      face = this.theme.of('button.pressed')
    }

    radius = this.radius()

    this.fillRounded(rect, face, radius)
    this.outlineRounded(rect, radius)
    this.bevelRounded(rect.inset(1), false, radius)
  }

  // A flat surface that holds other things: a docked bar, a card. One outline,
  // no bevel - panels are the ground, not objects sitting on it.
  panel(rect, face = null) {
    if (face == null) {
      face = this.theme.of('panel.face')
    }

    this.fill(rect, face)
    this.outline(rect)
  }

  // A hole: the canvas surround, a text field, a list, a scroll track.
  well(rect, face = null) {
    if (face == null) {
      face = this.theme.of('panel.well')
    }

    radius = this.radius()

    this.fillRounded(rect, face, radius)
    this.outlineRounded(rect, radius)
    this.bevelRounded(rect.inset(1), false, radius)
  }

  // One dark line with one light line under it. This separator does more for
  // the "real tool" feeling than any other single detail.
  groove(x, y, width) {
    this.hline(x, y, width, this.theme.of('bevel.dark'))
    this.hline(x, y + 1, width, this.theme.of('bevel.light'))
  }

  // ---- text --------------------------------------------------------------

  text(role, string, x, y, paint) {
    face = this.theme.font(role)

    canvas.setFont(face)
    canvas.setColor(paint)
    canvas.print(string, snap(x), snap(y))
  }

  // What widgets actually call: aligned inside a rect, in whole pixels, so a
  // row of labels never shears by one.
  //
  // Vertical alignment is measured against the CAP BAND, not the line box.
  // A pixel font's line box carries a lot of air - silver.ttf at 19px is 21px
  // tall for a 9px capital - so centring the box leaves every label sitting
  // visibly high in its row, and forces rows to be taller than they need to
  // be. Centring the caps is what makes a bar of chrome look right.
  textIn(role, string, rect, horizontal, vertical, paint) {
    face = this.theme.font(role)

    x = rect.x
    y = rect.y

    if (horizontal == 'center') { x = rect.x + (rect.w - face.getWidth(string)) / 2 }
    if (horizontal == 'right')  { x = rect.right() - face.getWidth(string) }

    capTop = this.theme.metric('capTop')
    cap = this.theme.metric('cap')

    if (vertical == 'middle') { y = rect.y + (rect.h - cap) / 2 - capTop }
    if (vertical == 'bottom') { y = rect.bottom() - cap - capTop - this.theme.metric('gutter') }

    this.text(role, string, x, y, paint)
  }

  measure(role, string) {
    return this.theme.font(role).getWidth(string)
  }

  // ---- misc ----------------------------------------------------------------

  // A dotted accent outline for the keyboard-focused widget, drawn as points
  // because Lumen has no dash pattern - and stepped points are the right look.
  focusRing(rect) {
    canvas.setColor(this.theme.of('accent'))
    canvas.setPointSize(1)

    for (x = rect.x; x < rect.right(); x = x + 2) {
      canvas.point(x, rect.y, x, rect.bottom() - 1)
    }

    for (y = rect.y; y < rect.bottom(); y = y + 2) {
      canvas.point(rect.x, y, rect.right() - 1, y)
    }
  }

  // Clipping is a stack, not a global: push('all') saves the scissor box along
  // with the transform, so nested panels each clip their own children and pop
  // back to exactly what their parent had.
  clip(rect) {
    canvas.push('all')
    canvas.setScissor(rect.x, rect.y, rect.w, rect.h)
  }

  unclip() {
    canvas.pop()
  }
}
