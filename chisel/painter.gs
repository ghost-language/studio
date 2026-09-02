import "lumen:canvas"
import "ghost:math"
import { Rect } from "chisel/geometry/rect"
import { snap } from "chisel/support/snap"
import { cornerInsets } from "chisel/support/corner-insets"
import { chamfer } from "chisel/support/chamfer"

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

  // ---- picotron surfaces ------------------------------------------------

  // A rectangle with its corners cut, filled flat.
  //
  // Drawn as one horizontal span per row rather than a rectangle plus corner
  // patches, because a span is exactly what a scanline is: there is no seam to
  // get wrong, and a chamfer of nought degenerates to a plain rectangle
  // without a special case.
  //
  // `corners` is [topLeft, topRight, bottomRight, bottomLeft]; null cuts all
  // four. Per-corner control is not a refinement, it is the difference between
  // right and wrong: a title bar is cut at the top and square at the bottom
  // where it meets its rule, and cutting all four leaves a one-pixel notch on
  // its last row. That notch is what the first render of this got wrong, and
  // the only reason it was caught is that a reference said 88.8% instead of
  // 100%.
  chamfered(rect, paint, cut, corners = null) {
    insets = chamfer(cut)

    topLeft = true
    topRight = true
    bottomRight = true
    bottomLeft = true

    if (corners != null) {
      topLeft = corners[0]
      topRight = corners[1]
      bottomRight = corners[2]
      bottomLeft = corners[3]
    }

    canvas.setColor(paint)

    for (row = 0; row < rect.h; row++) {
      fromBottom = rect.h - 1 - row

      fromTop = 0
      atBottom = 0

      if (row < insets.length()) {
        fromTop = insets[row]
      }

      // The same profile runs back up from the bottom edge. Taking the larger
      // of the two per side is what keeps a shape shorter than twice the cut
      // from growing a waist in the middle.
      if (fromBottom < insets.length()) {
        atBottom = insets[fromBottom]
      }

      left = 0
      right = 0

      if (topLeft) {
        if (fromTop > left) {
          left = fromTop
        }
      }

      if (bottomLeft) {
        if (atBottom > left) {
          left = atBottom
        }
      }

      if (topRight) {
        if (fromTop > right) {
          right = fromTop
        }
      }

      if (bottomRight) {
        if (atBottom > right) {
          right = atBottom
        }
      }

      width = rect.w - left - right

      if (width > 0) {
        canvas.filledRectangle(rect.x + left, rect.y + row, width, 1)
      }
    }
  }

  // Picotron's one surface: a flat fill inside a one-pixel outline, corners
  // cut rather than curved.
  //
  // There is no bevel. Not a simplification - there is no highlight-and-shadow
  // pair anywhere in any reference, and adding one is the single change that
  // would most obviously mark this as an imitation rather than the thing.
  //
  // The inner shape is the outer deflated by one and cut one less deeply,
  // which is what makes the outline follow the diagonal at an even thickness
  // instead of pooling at the corner. That was measured off a real window, not
  // reasoned about: at a 2px cut the fill starts one pixel in on the first row
  // and flush on the second.
  surface(rect, fill, edge, cut, corners = null) {
    this.chamfered(rect, edge, cut, corners)
    this.chamfered(rect.inset(1), fill, cut - 1, corners)
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
  // Corners follow a circular quadrant in whole pixels (see cornerInsets), so
  // they read as round rather than as a filed-flat chamfer. Every rounded
  // shape is drawn as layers - outline, then face, each with the same profile
  // one pixel smaller - which keeps the curve identical on both and means the
  // outline never has to be traced pixel by pixel.
  //
  // `corners` is [topLeft, topRight, bottomRight, bottomLeft]; null rounds all
  // four. A tab passes [true, true, false, false] so it merges into the bar
  // below it.

  radius() {
    return this.theme.metric('radius')
  }

  allCorners() {
    return [true, true, true, true]
  }

  // Rounding is capped at half the shorter side: a radius larger than the
  // widget would fold the profile back on itself, which is how a checkbox ends
  // up with a bite out of it.
  fittedRadius(rect, radius) {
    limit = math.floor(math.min(rect.w, rect.h) / 2)

    return math.max(0, math.min(radius, limit))
  }

  fillRounded(rect, paint, radius, corners = null) {
    // `fitted`, not `radius`. Reassigning the parameter would permanently
    // destroy this.radius() on the painter - Ghost does not scope a method's
    // locals to that method - and two widgets call it for their corner.
    fitted = this.fittedRadius(rect, radius)

    if (fitted < 1) {
      return this.fill(rect, paint)
    }

    if (corners == null) {
      corners = this.allCorners()
    }

    insets = cornerInsets(fitted)

    // The straight middle in one draw, then one thin row per corner step. Every
    // use below is `fitted` rather than `radius`: a corner larger than half the
    // rectangle would otherwise draw rows that overlap in the middle and leave
    // the shape with a bite out of it, which is the whole reason fittedRadius
    // exists.
    this.fill(new Rect(rect.x, rect.y + fitted, rect.w, rect.h - fitted * 2), paint)

    for (step = 0; step < fitted; step++) {
      cut = insets[step]

      topLeft = 0
      topRight = 0
      bottomLeft = 0
      bottomRight = 0

      if (corners[0]) { topLeft = cut }
      if (corners[1]) { topRight = cut }
      if (corners[2]) { bottomRight = cut }
      if (corners[3]) { bottomLeft = cut }

      this.fill(
        new Rect(rect.x + topLeft, rect.y + step, rect.w - topLeft - topRight, 1),
        paint
      )

      this.fill(
        new Rect(rect.x + bottomLeft, rect.bottom() - 1 - step, rect.w - bottomLeft - bottomRight, 1),
        paint
      )
    }
  }

  // The highlight and shadow, stopped short of the curves so they never poke
  // out of a corner.
  bevelRounded(rect, raised, radius, corners = null) {
    light = this.theme.of('bevel.light')
    dark = this.theme.of('bevel.dark')

    if (!raised) {
      light = this.theme.of('bevel.dark')
      dark = this.theme.of('bevel.light')
    }

    inset = this.fittedRadius(rect, radius)

    this.hline(rect.x + inset, rect.y, rect.w - inset * 2, light)
    this.vline(rect.x, rect.y + inset, rect.h - inset * 2, light)
    this.hline(rect.x + inset, rect.bottom() - 1, rect.w - inset * 2, dark)
    this.vline(rect.right() - 1, rect.y + inset, rect.h - inset * 2, dark)
  }

  // A raised control: button, tab, dropdown, scrollbar thumb.
  // The corner cut on a control, which is not the one a window uses: measured
  // at one pixel against a window's two.
  controlCut() {
    return this.theme.metric('cut')
  }

  // A control sitting on the ground: a button, a tab, a toolbar item.
  //
  // A flat fill with its corners cut and NO OUTLINE. That last part is
  // measured, not a simplification: a real Picotron button is #c2c3c7 against
  // the #fff1e8 body with no border of any kind, and a tab strip is the same.
  // Only windows are outlined.
  //
  // It is the largest single difference between looking like Picotron and
  // merely using its palette. A black line around forty controls that Picotron
  // leaves as flat tone against flat tone reads as heavy and busy without any
  // one of them being identifiably wrong - which is why it survived so long.
  //
  // There is no bevel either, so raised and sunk differ by fill alone rather
  // than by which edge catches the light. With a ramp behind them, pressed is
  // one step darker and hovered one step lighter, which reads better at 12px
  // than a one-pixel highlight ever did.
  raised(rect, face = null, corners = null) {
    if (face == null) {
      face = this.theme.of('button.face')
    }

    this.chamfered(rect, face, this.controlCut(), corners)
  }

  // A pressed control. Same shape, darker fill.
  sunk(rect, face = null, corners = null) {
    if (face == null) {
      face = this.theme.of('button.pressed')
    }

    this.chamfered(rect, face, this.controlCut(), corners)
  }

  // A flat surface that holds other things: a docked bar, a card. Panels are
  // the ground rather than objects on it, so they are square and unoutlined -
  // a bar that meets the window edge has nothing to be outlined against.
  panel(rect, face = null) {
    if (face == null) {
      face = this.theme.of('panel.face')
    }

    this.fill(rect, face)
  }

  // A small square control that is outlined: a checkbox, a radio, a colour
  // swatch.
  //
  // The exception to "controls are not outlined", and a measured one: a
  // checkbox is 9x9 with a 1px border and a 1px inset gap. It earns the border
  // by being small - a 9px flat fill one tone from its ground is a smudge,
  // where a 40px button is plainly a button.
  boxed(rect, fill, edge = null) {
    if (edge == null) {
      edge = this.theme.of('outline')
    }

    this.surface(rect, fill, edge, 0)
  }

  // A hole: the canvas surround, a text field, a list, a scroll track.
  //
  // Same construction as a control, which is the point - in Picotron a well is
  // not an inverted button, it is a flat fill in a different tone. The path
  // field in its file browser is a plain dark rectangle on the toolbar with no
  // border, which is the whole of it.
  well(rect, face = null, corners = null) {
    if (face == null) {
      face = this.theme.of('panel.well')
    }

    this.chamfered(rect, face, this.controlCut(), corners)
  }

  // One dark line with one light line under it. This separator does more for
  // the "real tool" feeling than any other single detail.
  // One line. The old two-line groove - a dark rule with a light one under it -
  // was the single detail that did most for the "real tool" feel of a bevelled
  // interface, and it is exactly wrong here: at a 12px row it reads as a thick
  // black bar rather than a separator, and Picotron has no such thing anywhere.
  groove(x, y, width) {
    this.hline(x, y, width, this.theme.of('outline'))
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
