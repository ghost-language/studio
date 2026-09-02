import "ghost:math"
import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// A sunken track with a raised thumb. Drives any view that can express itself
// as "I am showing `window` of `total`, starting at `offset`".
class Scrollbar extends Widget {
  constructor(vertical) {
    super.constructor('scrollbar')

    this.vertical = vertical
    this.total = 100
    this.window = 30
    this.offset = 0
    this.grabbed = 0
  }

  measures(total, window) {
    this.total = math.max(1, total)
    this.window = math.max(1, window)

    return this.scrollTo(this.offset)
  }

  maximum() {
    return math.max(0, this.total - this.window)
  }

  scrollTo(offset) {
    next = math.clamp(math.floor(offset), 0, this.maximum())

    if (next != this.offset) {
      this.offset = next
      this.fire('scroll', next)
    }

    return this
  }

  // The thumb is never allowed below a usable size, or a long document leaves
  // nothing to grab.
  thumbRect(ui) {
    // `length` rather than `span`: a local whose name matches a method of the
    // same class shadows that method for the whole call, so `this.span()` here
    // resolved to the local number and raised "is a number, which cannot be
    // called". Same family as a method name shadowing an import - Ghost's
    // lookup reaches the enclosing scope before it reaches the class.
    length = this.span()
    minimum = ui.theme.metric('scroll')
    size = math.max(minimum, math.floor(length * (this.window / this.total)))
    travel = length - size

    at = 0

    if (this.maximum() > 0) {
      at = math.floor(travel * (this.offset / this.maximum()))
    }

    if (this.vertical) {
      return new Rect(this.bounds.x, this.bounds.y + at, this.bounds.w, size)
    }

    return new Rect(this.bounds.x + at, this.bounds.y, size, this.bounds.h)
  }

  span() {
    if (this.vertical) {
      return this.bounds.h
    }

    return this.bounds.w
  }

  positionOf(ui) {
    if (this.vertical) {
      return ui.pointer.y - this.bounds.y
    }

    return ui.pointer.x - this.bounds.x
  }

  // Measured off Picotron's own: a 5px bar with a solid #83769c thumb on a
  // light track. The thumb is deliberately not button.face - a scrollbar has
  // to read at a glance against a track that is usually the lightest thing on
  // screen, and taking the button tone left it the same colour as its own
  // groove and therefore invisible.
  paint(ui) {
    ui.painter.chamfered(this.bounds, ui.theme.of('panel.well'), 0, null)

    thumb = this.thumbRect(ui)
    face = ui.theme.of('text.dim')

    if (ui.isHot(this))    { face = ui.theme.of('accent') }
    if (ui.isActive(this)) { face = ui.theme.of('accent') }

    ui.painter.chamfered(thumb, face, ui.painter.controlCut(), null)
  }

  pressed(ui) {
    thumb = this.thumbRect(ui)

    ui.capture(this)

    // Clicking the track jumps a page; grabbing the thumb drags it.
    if (thumb.contains(ui.pointer.x, ui.pointer.y)) {
      start = thumb.y

      if (!this.vertical) {
        start = thumb.x
      }

      this.grabbed = this.positionOf(ui) - (start - (this.vertical ? this.bounds.y : this.bounds.x))

      return true
    }

    before = this.positionOf(ui) < (this.vertical ? thumb.y - this.bounds.y : thumb.x - this.bounds.x)

    if (before) {
      this.scrollTo(this.offset - this.window)
    } else {
      this.scrollTo(this.offset + this.window)
    }

    this.grabbed = -1

    return true
  }

  dragged(ui) {
    if (this.grabbed < 0) {
      return false
    }

    thumb = this.thumbRect(ui)
    size = this.vertical ? thumb.h : thumb.w
    travel = math.max(1, this.span() - size)
    at = math.clamp(this.positionOf(ui) - this.grabbed, 0, travel)

    return this.scrollTo(math.floor(this.maximum() * (at / travel)))
  }

  wheeled(ui) {
    return this.scrollTo(this.offset - ui.pointer.wheel * math.max(1, math.floor(this.window / 4)))
  }
}
