import { Widget } from "chisel/widget"

// Five appearances and nothing in between: normal, hover, pressed, selected,
// disabled. Hover lightens one step, pressed inverts the bevel, selected takes
// the accent, disabled dims the label. No transitions - the state is the
// feedback.
class Button extends Widget {
  constructor(label) {
    super.constructor('button')

    this.label = label
    this.glyph = null
    this.selected = false
    this.focusable = true
    this.command = null
  }

  // ---- fluent surface ----------------------------------------------------

  icon(glyph)     { this.glyph = glyph;    return this }
  selects(flag)   { this.selected = flag;  return this }
  does(command)   { this.command = command; return this }

  // ---- appearance ----------------------------------------------------------

  face(ui) {
    if (!this.enabled)     { return ui.theme.of('button.face') }
    if (this.selected)     { return ui.theme.of('button.selected') }
    if (ui.isActive(this)) { return ui.theme.of('button.pressed') }
    if (ui.isHot(this))    { return ui.theme.of('button.hover') }

    return ui.theme.of('button.face')
  }

  ink(ui) {
    if (!this.enabled) { return ui.theme.of('text.dim') }
    if (this.selected) { return ui.theme.of('text.selected') }

    return ui.theme.of('text.normal')
  }

  paint(ui) {
    raised = !ui.isActive(this)

    if (raised) {
      ui.painter.raised(this.bounds, this.face(ui))
    } else {
      ui.painter.sunk(this.bounds, this.face(ui))
    }

    body = this.bounds

    if (!raised) {
      body = body.offset(1, 1)
    }

    if (this.glyph != null) {
      this.glyph.draw(
        body.x + (body.w - this.glyph.getWidth()) / 2,
        body.y + (body.h - this.glyph.getHeight()) / 2
      )
    } else {
      ui.painter.textIn('body', this.label, body, 'center', 'middle', this.ink(ui))
    }

    if (ui.isFocused(this)) {
      ui.painter.focusRing(this.bounds.inset(2))
    }
  }

  // ---- input ------------------------------------------------------------------

  // Capturing on press implements the slide-off rule: the release comes back
  // here even if the pointer has left, so the click can be cancelled.
  pressed(ui) {
    if (ui.pointer.button != 'left' or !this.enabled) {
      return false
    }

    ui.capture(this)

    return true
  }

  released(ui) {
    if (!this.enabled or !this.hits(ui.pointer.x, ui.pointer.y)) {
      return true
    }

    this.fire('click', this)

    if (this.command != null and ui.studio != null) {
      ui.studio.run(this.command)
    }

    return true
  }
}
