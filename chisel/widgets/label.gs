import { Widget } from "chisel/widget"

// Text. The simplest widget there is, and the one that proves the alignment
// helpers work - everything else borrows its text handling from here.
class Label extends Widget {
  constructor(text) {
    super.constructor('label')

    this.text = text
    this.align = 'left'
    this.role = 'body'
    this.tone = 'text.normal'
  }

  aligned(where) { this.align = where; return this }
  dim()          { this.tone = 'text.dim'; return this }
  accent()       { this.tone = 'accent'; return this }

  says(text) {
    this.text = text

    return this
  }

  paint(ui) {
    ui.painter.textIn(this.role, this.text, this.bounds, this.align, 'middle', ui.theme.of(this.tone))
  }
}
