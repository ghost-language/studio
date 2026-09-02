import "lumen:window"
import "lumen:canvas"
import "lumen:system"
import { Rect } from "chisel/geometry/rect"
import { Pointer } from "chisel/pointer"
import { Modifiers } from "chisel/modifiers"

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

    // On macOS the accelerator is Command; everywhere else it is Ctrl. The
    // decision is made here so Modifiers itself needs no `lumen:` import.
    this.modifiers = new Modifiers(system.os == 'darwin')

    // Set by the shell. Chisel never reads it; widgets that belong to an
    // application do. The only line in the framework that admits an
    // application exists.
    this.studio = null

    this.root = null
    this.overlays = []

    // Optional, and set by the application: chisel draws icons and a cursor
    // if it is given them, and looks the same minus the art if it is not.
    this.icons = null
    this.cursors = null
    this.cursorName = 'arrow'

    // A modal owns the screen while it is open: it paints over everything and
    // nothing behind it can be picked. One slot rather than a stack, because a
    // dialog that can open a dialog is a design problem, not a feature.
    this.modal = null

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

  openModal(widget) {
    this.modal = widget
    this.focused = null
    this.captured = null

    widget.centreIn(new Rect(0, 0, window.width, window.height))

    return widget
  }

  closeModal() {
    this.modal = null
    this.focused = null
    this.captured = null

    return null
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

  // A widget asks for a cursor during paint; the request lasts one frame, so
  // moving off a widget restores the arrow without anyone having to undo it.
  cursor(name) {
    this.cursorName = name

    return this
  }

  paint() {
    canvas.clear(this.theme.of('window.face'))

    this.overlays = []
    this.cursorName = 'arrow'

    if (this.root != null) {
      this.root.paint(this)
    }

    for (entry in this.overlays) {
      entry.widget.paintOverlay(this)
    }

    if (this.modal != null) {
      // A scrim, so the workspace reads as out of reach rather than merely
      // covered.
      this.painter.fill(new Rect(0, 0, window.width, window.height), this.theme.of('scrim'))
      this.modal.paint(this)
    }

    this.paintTooltip()

    if (this.cursors != null) {
      this.cursors.show(this.cursorName)
      this.cursors.paint(this, this.theme.scale)
    }
  }

  // ---- input --------------------------------------------------------------------

  pickAt(x, y) {
    // While a modal is open it is the only thing on screen that answers, which
    // is what makes it modal - a click on the workspace behind it hits nothing
    // rather than quietly editing the document.
    if (this.modal != null) {
      return this.modal.pick(x, y)
    }

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
    this.modifiers.down(key)

    if (this.modal != null) {
      if (key.toLowerCase() == 'escape') {
        this.modal.fire('close', this.modal)

        return true
      }
    }

    if (this.focused != null) {
      return this.focused.keyed(this, key)
    }

    return false
  }

  keyReleased(key) {
    return this.modifiers.up(key)
  }

  typed(text) {
    if (this.focused != null) {
      return this.focused.typed(this, text)
    }

    return false
  }

  // A modifier held while the window loses focus never sends its release here,
  // so it would stay stuck down until it was pressed and released again.
  focusChanged(hasFocus) {
    if (!hasFocus) {
      this.modifiers.clear()
    }

    return hasFocus
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
