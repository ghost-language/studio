import { Widget } from "chisel/widget"

// A labelled surface: raised by default, sunken with .well().
class Panel extends Widget {
  constructor(title) {
    super.constructor('panel')

    this.title = title
    this.sunken = false
  }

  well() {
    this.sunken = true

    return this
  }

  label(text) {
    this.title = text

    return this
  }

  paint(ui) {
    if (this.sunken) {
      ui.painter.well(this.bounds)
    } else {
      ui.painter.panel(this.bounds, null)
    }

    if (this.title != null) {
      ui.painter.textIn(
        'small',
        this.title,
        this.bounds.inset(ui.theme.metric('gutter')),
        'left',
        'middle',
        ui.theme.of('text.dim')
      )
    }

    super.paint(ui)
  }
}
