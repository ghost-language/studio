import { Rect } from "chisel/geometry/rect"
import { Conditionable } from "chisel/traits/conditionable"
import { Tappable } from "chisel/traits/tappable"
import { EmitsEvents } from "chisel/traits/emits-events"

// A rectangle that knows how to divide itself, draw itself, and say whether a
// point is inside it. Every control in the toolkit is this class plus overrides.
class Widget {
  use Conditionable, Tappable, EmitsEvents

  constructor(kind) {
    this.kind = kind
    this.id = ''
    this.bounds = new Rect(0, 0, 0, 0)
    this.children = []

    this.visible = true
    this.enabled = true
    this.focusable = false

    this.hint = ''
    this.accel = ''
  }

  // ---- declaration -------------------------------------------------------

  named(id)  { this.id = id;                return this }
  add(child) { this.children.push(child);   return this }
  hide()     { this.visible = false;        return this }
  show()     { this.visible = true;         return this }
  enable()   { this.enabled = true;         return this }
  disable()  { this.enabled = false;        return this }

  // `keys` is optional, so it carries a default: Ghost requires every
  // parameter that has none, and a bare second parameter silently breaks every
  // existing one-argument call at the moment it runs.
  tooltip(text, keys = null) {
    this.hint = text

    if (keys != null) {
      this.accel = keys
    }

    return this
  }

  // ---- layout --------------------------------------------------------------

  place(rect) {
    this.bounds = rect
    this.arrange()

    return this
  }

  arrange() {
    for (child in this.children) {
      child.place(this.bounds)
    }
  }

  // ---- frame ----------------------------------------------------------------

  tick(dt, ui) {
    for (child in this.children) {
      if (child.visible) {
        child.tick(dt, ui)
      }
    }
  }

  paint(ui) {
    for (child in this.children) {
      if (child.visible) {
        child.paint(ui)
      }
    }
  }

  // True for widgets that change on their own - a playhead, a meter, marching
  // ants. False for everything static, which is nearly everything. Nothing uses
  // it yet; it is what makes dirty-region painting possible later without
  // touching every widget.
  animates() {
    return false
  }

  // ---- hit testing -----------------------------------------------------------

  hits(x, y) {
    return this.visible and this.bounds.contains(x, y)
  }

  // The deepest visible, enabled widget under a point. Children are walked
  // last-first because later children are drawn on top, and the thing you can
  // see must be the thing you click.
  pick(x, y) {
    if (!this.visible or !this.hits(x, y)) {
      return null
    }

    for (index = this.children.length() - 1; index >= 0; index--) {
      found = this.children[index].pick(x, y)

      if (found != null) {
        return found
      }
    }

    if (this.enabled) {
      return this
    }

    return null
  }

  // ---- input hooks -------------------------------------------------------------
  //
  // Defined here so every widget answers them: Ghost cannot ask an object
  // whether it has a method, so the base class owns the vocabulary.

  pressed(ui)    { return false }
  released(ui)   { return false }
  dragged(ui)    { return false }
  moved(ui)      { return false }
  wheeled(ui)    { return false }
  keyed(ui, key) { return false }

  // Text typed while focused, already decoded - one call per character or
  // composed sequence, which is what makes non-Latin input work at all.
  typed(ui, text) { return false }

  // Called on an overlay when a press lands outside it.
  dismissed(ui)  { return false }

  // How a widget draws itself during the overlay pass. Defaulting to paint()
  // suits a popup that IS the overlay, like a menu; a widget that is only
  // partly an overlay - a dropdown, whose list floats but whose box does not -
  // overrides this to draw just the floating part. It must never re-register
  // the overlay, or the pass would append to the list it is walking.
  paintOverlay(ui) {
    return this.paint(ui)
  }
}
