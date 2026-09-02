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
    this.isBare = false
  }

  // ---- fluent surface ----------------------------------------------------

  // Either a name from the ui's icon set, or nothing. Named art beats a
  // handle so a button can be declared before the sheet is loaded.
  icon(glyph)     { this.glyph = glyph;    return this }
  selects(flag)   { this.selected = flag;  return this }
  does(command)   { this.command = command; return this }

  // ---- appearance ----------------------------------------------------------

  // A toolbar item rather than a button: no fill at all until it is hovered,
  // pressed or selected.
  //
  // This is not a style choice, it is what Picotron's toolbars are. Its file
  // browser draws its view and navigation controls as bare #83769c icons
  // directly on the #c2c3c7 bar, with no button shape behind them; a filled
  // button - #c2c3c7 on the #fff1e8 body - only ever appears on a light
  // ground. Modelling both is what lets one button.face serve the whole
  // interface: without it, a fill that reads on the toolbar disappears on the
  // body and vice versa, which is exactly what happened to the Preferences
  // dialog's - and + buttons.
  bare() {
    this.isBare = true

    return this
  }

  // Whether anything is drawn behind the label at all.
  filled(ui) {
    if (!this.isBare) {
      return true
    }

    if (this.selected) {
      return true
    }

    if (ui.isActive(this)) {
      return true
    }

    return ui.isHot(this)
  }

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

    if (this.filled(ui)) {
      if (raised) {
        ui.painter.raised(this.bounds, this.face(ui))
      } else {
        ui.painter.sunk(this.bounds, this.face(ui))
      }
    }

    body = this.bounds

    if (!raised) {
      body = body.offset(1, 1)
    }

    drawn = false

    if (this.glyph != null) {
      if (ui.icons != null) {
        drawn = ui.icons.drawIn(this.glyph, body, this.ink(ui), ui.theme.scale)
      }
    }

    if (!drawn) {
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
