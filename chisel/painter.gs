import "lumen:canvas"
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

  panel(rect, face) {
    if (face == null) {
      face = this.theme.of('panel.face')
    }

    this.fill(rect, face)
    this.bevel(rect, true)
  }

  well(rect) {
    this.fill(rect, this.theme.of('panel.well'))
    this.bevel(rect, false)
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
  textIn(role, string, rect, horizontal, vertical, paint) {
    face = this.theme.font(role)

    x = rect.x
    y = rect.y

    if (horizontal == 'center') { x = rect.x + (rect.w - face.getWidth(string)) / 2 }
    if (horizontal == 'right')  { x = rect.right() - face.getWidth(string) }
    if (vertical == 'middle')   { y = rect.y + (rect.h - face.getHeight()) / 2 }
    if (vertical == 'bottom')   { y = rect.bottom() - face.getHeight() }

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
