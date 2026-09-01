import { Widget } from "chisel/widget"

// The application's narrator: where the cursor is, what the document is, and
// the last thing that happened. It listens on the shell's signals rather than
// being pushed to, so nothing else has to hold a reference to it.
class Statusbar extends Widget {
  constructor(studio) {
    super.constructor('statusbar')

    this.cursor = ''
    this.summary = ''
    this.message = ''
    this.messageAge = 0

    self = this

    studio.signals.listen('cursor.moved', function (cell) {
      if (cell == null) {
        self.cursor = ''

        return null
      }

      self.cursor = `${cell[0]}, ${cell[1]}`
    })

    studio.signals.listen('status.message', function (text) {
      self.message = text
      self.messageAge = 0
    })

    studio.signals.listen('document.activated', function (document) {
      self.summary = `${document.title} · ${document.width()} x ${document.height()}`
    })
  }

  tick(dt, ui) {
    this.messageAge = this.messageAge + dt

    super.tick(dt, ui)
  }

  paint(ui) {
    ui.painter.panel(this.bounds, null)

    box = this.bounds.inset(ui.theme.metric('gutter'))

    ui.painter.textIn('small', this.cursor, box, 'left', 'middle', ui.theme.of('text.normal'))
    ui.painter.textIn('small', this.summary, box, 'center', 'middle', ui.theme.of('text.dim'))

    if (this.message != '' and this.messageAge < 4) {
      ui.painter.textIn('small', this.message, box, 'right', 'middle', ui.theme.of('accent'))
    }
  }
}
