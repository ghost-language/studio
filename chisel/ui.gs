import "lumen:window"
import "lumen:canvas"
import { Rect } from "chisel/geometry/rect"
import { Pointer } from "chisel/pointer"

// Owns the widget tree and the four pointers that make an interface feel alive:
//
//   hot       under the cursor right now
//   active    held down
//   focused   receives keys
//   captured  owns every move until the button comes up
//
// Capture is what separates a toolkit from a demo. Press inside the canvas and
// drag outside it and the stroke keeps drawing; press a button, slide off and
// release and it does not fire.
class Ui {
  constructor(theme, painter) {
    this.theme = theme
    this.painter = painter
    this.pointer = new Pointer()

    // Set by the shell. Chisel never reads it; widgets that belong to an
    // application do. The only line in the framework that admits an
    // application exists.
    this.studio = null

    this.root = null
    this.overlays = []

    this.hot = null
    this.active = null
    this.focused = null
    this.captured = null

    this.hoverAge = 0
  }

  // ---- tree ---------------------------------------------------------------

  mount(widget) {
    this.root = widget
    this.overlays = []
    this.hot = null
    this.active = null
    this.focused = null
    this.captured = null

    this.resized(window.width, window.height)

    return widget
  }

  resized(width, height) {
    if (this.root != null) {
      this.root.place(new Rect(0, 0, width, height))
    }
  }

  // An overlay is painted after the tree and picked before it: an open menu, a
  // drag ghost, a popup. Widgets register theirs every frame while they are
  // showing, which means closing one is simply not registering it.
  overlay(widget, owner) {
    this.overlays.push({ widget: widget, owner: owner })

    return widget
  }

  // ---- state questions widgets ask ------------------------------------------

  isHot(widget)     { return widget != null and this.hot == widget }
  isActive(widget)  { return widget != null and this.active == widget }
  isFocused(widget) { return widget != null and this.focused == widget }

  capture(widget) { this.captured = widget }
  release()       { this.captured = null }

  focus(widget) {
    // `and`/`or` evaluate both operands regardless of the first's result -
    // there is no short-circuit - so `widget != null and widget.focusable`
    // would still evaluate `widget.focusable` when widget is null and raise.
    // Every null guard in this file is its own `if`, for that reason.
    if (widget == null) {
      return null
    }

    if (widget.focusable) {
      this.focused = widget
    }
  }

  // ---- frame ------------------------------------------------------------------

  tick(dt) {
    this.hoverAge = this.hoverAge + dt

    if (this.root != null) {
      this.root.tick(dt, this)
    }
  }

  paint() {
    canvas.clear(this.theme.of('window.face'))

    this.overlays = []

    if (this.root != null) {
      this.root.paint(this)
    }

    for (entry in this.overlays) {
      entry.widget.paint(this)
    }

    this.paintTooltip()
  }

  // ---- input --------------------------------------------------------------------

  pickAt(x, y) {
    for (index = this.overlays.length() - 1; index >= 0; index--) {
      found = this.overlays[index].widget.pick(x, y)

      if (found != null) {
        return found
      }
    }

    if (this.root == null) {
      return null
    }

    return this.root.pick(x, y)
  }

  moved(x, y, dx, dy) {
    this.pointer.moveTo(x, y, dx, dy)

    if (this.captured != null) {
      return this.captured.dragged(this)
    }

    found = this.pickAt(x, y)

    if (this.hot != found) {
      this.hoverAge = 0
    }

    this.hot = found

    if (found == null) {
      return false
    }

    return found.moved(this)
  }

  pressed(x, y, button, clicks) {
    this.pointer.press(x, y, button, clicks)

    target = this.pickAt(x, y)

    // A press anywhere clears focus first; the target takes it back if it
    // wants it. That is what makes clicking empty space dismiss a field.
    this.focused = null

    if (target == null) {
      return false
    }

    this.active = target
    this.focus(target)

    answered = target.pressed(this)

    // A press outside an overlay closes it - unless it landed on the widget
    // that opened it, which is about to toggle it itself.
    for (entry in this.overlays) {
      if (target != entry.owner and !entry.widget.hits(x, y)) {
        entry.widget.dismissed(this)
      }
    }

    return answered
  }

  released(x, y, button) {
    this.pointer.release(x, y, button)

    target = this.captured

    if (target == null) {
      target = this.active
    }

    this.captured = null
    this.active = null

    if (target == null) {
      return false
    }

    return target.released(this)
  }

  wheeled(x, y) {
    this.pointer.wheel = y

    if (this.hot != null) {
      return this.hot.wheeled(this)
    }

    return false
  }

  keyed(key, isRepeat) {
    if (this.focused != null) {
      return this.focused.keyed(this, key)
    }

    return false
  }

  // ---- overlays -----------------------------------------------------------------

  paintTooltip() {
    target = this.hot

    // Split from the natural one-line guard because `or` does not
    // short-circuit: `target == null or ... or target.hint == ''` would
    // still evaluate `target.hint` when target is null.
    if (target == null) {
      return null
    }

    if (this.hoverAge < 0.6 or target.hint == '') {
      return null
    }

    label = target.hint

    if (target.accel != '') {
      label = `${label} (${target.accel})`
    }

    face = this.theme.font('small')
    width = face.getWidth(label) + 10
    height = face.getHeight() + 6

    box = new Rect(this.pointer.x + 12, this.pointer.y + 18, width, height)

    // Fold back over the cursor rather than running off the right edge.
    if (box.right() > window.width) {
      box = new Rect(window.width - width - 2, box.y, width, height)
    }

    this.painter.panel(box, this.theme.of('panel.face'))
    this.painter.textIn('small', label, box.inset(4), 'left', 'middle', this.theme.of('text.normal'))
  }
}
