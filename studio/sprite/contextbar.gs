import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"
import { Button } from "chisel/widgets/button"
import { Slider } from "chisel/widgets/slider"
import { Dropdown } from "chisel/widgets/dropdown"
import { Label } from "chisel/widgets/label"

function makeToggle(bar, name) {
  return function (button) {
    bar.toggle(name, button)
  }
}

function makeSignal(studio, name) {
  return function (value) {
    studio.signals.emit(name, value)
  }
}

// Aseprite's context bar: the row under the tabs that changes with the tool.
// It is the difference between a workspace that looks like an editor and one
// that looks like a canvas with a menu - most of what a pixel artist touches
// minute to minute lives on this strip.
//
// Laid out left to right at natural widths rather than shared, because these
// are unrelated controls sitting beside each other, not a form.
class Contextbar extends Widget {
  constructor(studio, document) {
    super.constructor('contextbar')

    this.studio = studio
    this.document = document
    this.flags = { 'pixel-perfect': true, 'grid': false }

    this.items = []

    this.add(new Button('P').icon('pencil').tooltip('Pixel-perfect').selects(true)
      .on('click', makeToggle(this, 'pixel-perfect')))

    this.add(new Button('#').icon('grid').tooltip('Grid', "Ctrl+'")
      .on('click', makeSignal(studio, 'view.grid')))

    this.size = new Slider('Size', 1, 32).set(1)
    this.add(this.size)

    this.mode = new Dropdown(['Normal', 'Multiply', 'Screen', 'Overlay'])
    this.add(this.mode)

    this.opacity = new Slider('Opacity', 0, 255).set(255)
    this.add(this.opacity)
  }

  toggle(name, button) {
    next = !this.flags.get(name)

    this.flags.set(name, next)
    button.selects(next)

    return this
  }

  // Fixed widths, left to right: a context bar is a shelf, not a form, so its
  // controls keep the size they need rather than sharing the row.
  arrange() {
    theme = this.studio.theme
    gap = theme.metric('gutter')
    height = this.bounds.h - gap * 2
    left = this.bounds.x + gap
    top = this.bounds.y + gap

    widths = [height, height, theme.metric('row') * 6, theme.metric('row') * 5, theme.metric('row') * 7]

    for (index = 0; index < this.children.length(); index++) {
      width = widths[index]

      this.children[index].place(new Rect(left, top, width, height))

      left = left + width + gap
    }
  }

  paint(ui) {
    ui.painter.panel(this.bounds, null)

    super.paint(ui)
  }
}
