import "ghost:math"
import "lumen:canvas"
import "lumen:color"
import { Target } from "lumen:canvas"
import { Rect } from "chisel/geometry/rect"
import { Widget } from "chisel/widget"
import { hsvToRgb } from "chisel/support/hsv"

// Aseprite's colour picker: a saturation-value field with a hue strip under it.
//
// This is the first thing in Studio that constructs a colour rather than
// choosing one from a fixed set, which is why it needs HSV at all. The palette
// beside it still picks from sixteen; this picks from the whole space and
// writes the result into the foreground slot.
//
// The field is drawn into an off-screen Target and blitted, not drawn per
// pixel per frame. At the sizes involved that is some six thousand rectangles
// a frame, sixty times a second, to produce an image that only changes when
// the hue does - which is once per drag on the strip and never otherwise.
class ColorPicker extends Widget {
  constructor(document) {
    super.constructor('colorpicker')

    this.document = document
    this.hue = 0
    this.saturation = 1
    this.value = 1

    this.field = null
    this.stale = true
    this.dragging = 'none'
    this.focusable = true
  }

  // Tall enough for a square-ish field plus the strip. The panel gives it what
  // width it has, so height is the only thing this gets to ask for.
  heightFor(theme) {
    return theme.metric('row') * 6 + theme.metric('gutter')
  }

  stripHeight(theme) {
    return theme.metric('row')
  }

  fieldRect(ui) {
    inner = this.bounds.inset(1)
    strip = this.stripHeight(ui.theme) + ui.theme.metric('gutter')

    return new Rect(inner.x, inner.y, inner.w, math.max(1, inner.h - strip))
  }

  hueRect(ui) {
    inner = this.bounds.inset(1)
    strip = this.stripHeight(ui.theme)

    return new Rect(inner.x, inner.bottom() - strip, inner.w, strip)
  }

  // ---- the cached field ------------------------------------------------------

  // Rebuilt only when the hue moves or the widget is resized. One column per
  // pixel of width, one row per pixel of height, which is exactly the
  // resolution the blit will show.
  refresh(rect) {
    width = math.max(1, math.floor(rect.w))
    height = math.max(1, math.floor(rect.h))

    resized = this.field == null or this.width != width or this.height != height

    // Size is checked here rather than invalidated in arrange(), because the
    // owning panel places this widget every frame - so an arrange() that set
    // the flag would rebuild six thousand pixels sixty times a second to
    // produce the identical image.
    if (!this.stale and !resized) {
      return false
    }

    if (resized) {
      this.field = new Target(width, height)
      this.width = width
      this.height = height
    }

    canvas.setTarget(this.field)

    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        tone = hsvToRgb(this.hue, x / (width * 1.0), 1 - (y / (height * 1.0)))

        canvas.setColor(color.rgb(tone.r, tone.g, tone.b))
        canvas.filledRectangle(x, y, 1, 1)
      }
    }

    canvas.setTarget()

    this.stale = false

    return true
  }

  // ---- painting --------------------------------------------------------------

  paint(ui) {
    field = this.fieldRect(ui)
    strip = this.hueRect(ui)

    this.refresh(field)

    ui.painter.fill(this.bounds, ui.theme.of('panel.well'))

    // White first. A Target blit is multiplied by the current draw colour, and
    // the last thing set was the well's own near-black - which multiplied the
    // whole gradient down to a barely-visible smear. Nothing about the picker
    // looked wrong in the code; it just came out dark.
    canvas.setColor(color.rgb(255, 255, 255))

    this.field.draw(field.x, field.y, 0, 1, 1)

    // The hue strip is drawn straight, not cached: it is one row of columns
    // and never changes, so a Target would cost more than it saves.
    for (x = 0; x < strip.w; x++) {
      tone = hsvToRgb((x / (strip.w * 1.0)) * 360, 1, 1)

      ui.painter.fill(
        new Rect(strip.x + x, strip.y, 1, strip.h),
        color.rgb(tone.r, tone.g, tone.b)
      )
    }

    this.paintMarkers(ui, field, strip)
  }

  // A ring on the field and a bar on the strip, both drawn in two colours so
  // they stay visible over any part of the gradient underneath - a white ring
  // vanishes on white, and a black one vanishes in the corner below it.
  paintMarkers(ui, field, strip) {
    // Clamped inside the field. At full saturation and value the marker's
    // centre is the top-right pixel, so an unclamped ring hangs two pixels
    // outside the gradient and reads as floating above it - which is exactly
    // where it sat on the first render, since full-and-full is the default.
    size = 5
    left = field.x + math.floor(this.saturation * (field.w - 1)) - 2
    top = field.y + math.floor((1 - this.value) * (field.h - 1)) - 2

    at = new Rect(
      math.clamp(left, field.x, field.right() - size),
      math.clamp(top, field.y, field.bottom() - size),
      size,
      size
    )

    ui.painter.outline(at.inset(-1))
    ui.painter.outline(at)

    mark = strip.x + math.floor((this.hue / 360.0) * (strip.w - 1))

    ui.painter.fill(new Rect(mark - 1, strip.y, 3, strip.h), ui.theme.of('outline'))
    ui.painter.fill(new Rect(mark, strip.y, 1, strip.h), ui.theme.of('text.normal'))
  }

  // ---- picking ---------------------------------------------------------------

  commit() {
    tone = hsvToRgb(this.hue, this.saturation, this.value)

    this.fire('change', color.rgb(tone.r, tone.g, tone.b))

    return this
  }

  takeField(ui, x, y) {
    field = this.fieldRect(ui)

    this.saturation = math.clamp((x - field.x) / math.max(1, field.w - 1), 0, 1)
    this.value = 1 - math.clamp((y - field.y) / math.max(1, field.h - 1), 0, 1)

    return this.commit()
  }

  takeHue(ui, x) {
    strip = this.hueRect(ui)

    this.hue = math.clamp((x - strip.x) / math.max(1, strip.w - 1), 0, 1) * 360
    this.stale = true

    return this.commit()
  }

  pressed(ui) {
    if (ui.pointer.button != 'left') {
      return false
    }

    ui.capture(this)

    if (this.hueRect(ui).contains(ui.pointer.x, ui.pointer.y)) {
      this.dragging = 'hue'

      return this.takeHue(ui, ui.pointer.x) != null
    }

    this.dragging = 'field'

    return this.takeField(ui, ui.pointer.x, ui.pointer.y) != null
  }

  // The drag continues in whichever control it started in, however far the
  // pointer wanders: sliding off the field onto the strip must not start
  // changing the hue halfway through choosing a shade.
  dragged(ui) {
    if (this.dragging == 'hue') {
      return this.takeHue(ui, ui.pointer.x) != null
    }

    return this.takeField(ui, ui.pointer.x, ui.pointer.y) != null
  }

  released(ui) {
    this.dragging = 'none'

    return true
  }
}
