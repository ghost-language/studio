import "ghost:math"
import "lumen:color"
import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"
import { Label } from "chisel/widgets/label"
import { Button } from "chisel/widgets/button"
import { Checkbox } from "chisel/widgets/checkbox"
import { Radio } from "chisel/widgets/radio"
import { Slider } from "chisel/widgets/slider"
import { Field } from "chisel/widgets/field"
import { Dropdown } from "chisel/widgets/dropdown"
import { Scrollbar } from "chisel/widgets/scrollbar"
import { Tabs } from "chisel/widgets/tabs"
import { Swatches } from "chisel/widgets/swatches"

// Closure factories: Ghost cannot capture a loop variable, and anything built
// per-item in a list needs one of these.
function makeSay(gallery, message) {
  return function () {
    gallery.report(message)
  }
}

// Every control in the kit, on one screen, driven by real input.
//
// This exists before the editor does, on purpose: a widget is easy to write and
// hard to get right, and the only way to know a bevel is wrong is to look at it
// beside twenty others. It is also the fastest way to see a theme change land
// everywhere at once.
//
// Cards are declared as data - a column, a row, and a list of controls - so
// arrange() and paint() can never disagree about where anything is.
class Gallery extends Widget {
  constructor(theme) {
    super.constructor('gallery')

    // arrange() runs on mount, before any paint, so the theme is handed over
    // rather than picked up from the first ui that happens along.
    this.theme = theme
    this.cards = []
    this.message = 'ready'
    this.build()
  }

  report(message) {
    this.message = message

    return this
  }

  card(title, column, row) {
    entry = { title: title, column: column, row: row, bounds: new Rect(0, 0, 0, 0), lines: [] }

    this.cards.push(entry)

    return entry
  }

  // A line is one horizontal band of a card holding one or more controls. A
  // line of several shares the width; a line of one takes all of it.
  // `widths` is optional and parallel to `widgets`: a positive number fixes
  // that widget's width, a zero lets it share what is left. Without it a
  // vertical scrollbar stretches across the whole card.
  line(card, widgets, height, widths = null) {
    card.lines.push({ widgets: widgets, height: height, widths: widths })

    for (widget in widgets) {
      this.add(widget)
    }

    return card
  }

  build() {
    row = this.theme.metric('row')

    // ---- buttons ----------------------------------------------------------
    buttons = this.card('Buttons', 0, 0)

    this.line(buttons, [
      new Button('Normal').on('click', makeSay(this, 'Normal clicked')),
      new Button('Selected').selects(true).on('click', makeSay(this, 'Selected')),
      new Button('Off').disable()
    ], row)

    this.line(buttons, [
      new Button('Tooltip').tooltip('Hover and wait', 'F1').on('click', makeSay(this, 'Tooltip clicked')),
      new Button('OK').on('click', makeSay(this, 'OK')),
      new Button('Cancel').on('click', makeSay(this, 'Cancel'))
    ], row)

    // ---- checkboxes and radios -------------------------------------------
    toggles = this.card('Checkboxes and radios', 1, 0)

    this.line(toggles, [
      new Checkbox('Pixel-perfect', true).on('change', makeSay(this, 'Pixel-perfect toggled')),
      new Checkbox('Snap', false).on('change', makeSay(this, 'Snap toggled'))
    ], row)

    this.line(toggles, [
      new Checkbox('Onion skin', false).on('change', makeSay(this, 'Onion skin toggled')),
      new Checkbox('Locked', false).disable()
    ], row)

    this.tool = { value: 'pencil' }

    this.line(toggles, [
      new Radio('Pencil', 'pencil', this.tool).on('change', makeSay(this, 'Tool: pencil')),
      new Radio('Eraser', 'eraser', this.tool).on('change', makeSay(this, 'Tool: eraser')),
      new Radio('Bucket', 'bucket', this.tool).on('change', makeSay(this, 'Tool: bucket'))
    ], row)

    // ---- sliders ----------------------------------------------------------
    sliders = this.card('Sliders', 2, 0)

    this.line(sliders, [new Slider('Opacity', 0, 255).set(255).on('change', makeSay(this, 'Opacity changed'))], row)
    this.line(sliders, [new Slider('Size', 1, 64).set(8).on('change', makeSay(this, 'Brush size changed'))], row)
    this.line(sliders, [new Slider('Zoom', 1, 32).set(8)], row)

    // ---- fields -----------------------------------------------------------
    fields = this.card('Fields and dropdowns', 0, 1)

    this.line(fields, [new Field('Sprite-0001').on('change', makeSay(this, 'Name edited'))], row)
    this.line(fields, [new Field('').hint('Search commands...')], row)
    this.line(fields, [new Dropdown(['Nearest', 'Bilinear', 'RotSprite']).on('change', makeSay(this, 'Algorithm changed'))], row)

    // ---- scrollbars -------------------------------------------------------
    bars = this.card('Scrollbars', 1, 1)

    this.line(bars, [new Scrollbar(false).measures(300, 90).on('scroll', makeSay(this, 'Scrolled'))], this.theme.metric('scroll'))
    this.line(bars, [new Scrollbar(false).measures(300, 200)], this.theme.metric('scroll'))
    // A vertical bar wants a narrow column, so it shares its line with a
    // label rather than stretching across the card.
    this.line(bars,
      [new Label('Vertical').dim(), new Scrollbar(true).measures(300, 60)],
      row * 3,
      [0, this.theme.metric('scroll')])

    // ---- tabs -------------------------------------------------------------
    strip = this.card('Tabs', 2, 1)

    this.line(strip, [new Tabs()
      .tab('Sprite-0001', 'a')
      .tab('overworld', 'b')
      .tab('title', 'c')
      .on('change', makeSay(this, 'Tab changed'))], this.theme.metric('tab'))

    // Icon buttons: the same Button, given a name from the sheet. The label
    // still shows if the sheet has no art by that name.
    icons = this.card('Icon buttons', 0, 2)

    this.line(icons, [
      new Button('P').icon('pencil').tooltip('Pencil', 'B').on('click', makeSay(this, 'Pencil')),
      new Button('E').icon('eraser').tooltip('Eraser', 'E').on('click', makeSay(this, 'Eraser')),
      new Button('B').icon('bucket').tooltip('Bucket', 'G').on('click', makeSay(this, 'Bucket')),
      new Button('I').icon('picker').tooltip('Picker', 'I').on('click', makeSay(this, 'Picker')),
      new Button('M').icon('select').tooltip('Select', 'M').on('click', makeSay(this, 'Select')),
      new Button('H').icon('move').tooltip('Move', 'V').on('click', makeSay(this, 'Move'))
    ], this.theme.metric('tool'))

    this.line(icons, [
      new Button('/').icon('line').tooltip('Line', 'L'),
      new Button('R').icon('rectangle').tooltip('Rectangle', 'U'),
      new Button('O').icon('ellipse').tooltip('Ellipse', 'U'),
      new Button('T').icon('text').tooltip('Text', 'T'),
      new Button('Z').icon('zoom').tooltip('Zoom', 'Z'),
      new Button('#').icon('grid').tooltip('Grid', "Ctrl+'")
    ], this.theme.metric('tool'))

    this.line(strip, [new Label('Palette').dim()], row)
    this.line(strip, [new Swatches(this.colours()).across(8).on('pick', makeSay(this, 'Colour picked'))], row * 2)
  }

  colours() {
    return [
      color.hex('#000000'), color.hex('#1d2b53'), color.hex('#7e2553'), color.hex('#008751'),
      color.hex('#ab5236'), color.hex('#5f574f'), color.hex('#c2c3c7'), color.hex('#fff1e8'),
      color.hex('#ff004d'), color.hex('#ffa300'), color.hex('#ffec27'), color.hex('#00e436'),
      color.hex('#29adff'), color.hex('#83769c'), color.hex('#ff77a8'), color.hex('#ffccaa')
    ]
  }

  // ---- layout -------------------------------------------------------------

  cardHeight(card) {
    pad = this.theme.metric('pad')
    gap = this.theme.metric('gutter')
    total = this.theme.metric('bar') + pad

    for (line in card.lines) {
      total = total + line.height + gap
    }

    return total
  }

  arrange() {
    pad = this.theme.metric('pad')
    gap = this.theme.metric('gutter')

    body = this.bounds.inset(pad)
    columnWidth = math.floor((body.w - pad * 2) / 3)

    for (card in this.cards) {
      top = body.y

      for (other in this.cards) {
        if (other.column == card.column) {
          if (other.row < card.row) {
            top = top + this.cardHeight(other) + pad
          }
        }
      }

      card.bounds = new Rect(
        body.x + card.column * (columnWidth + pad),
        top,
        columnWidth,
        this.cardHeight(card)
      )

      inner = card.bounds.inset(pad)
      at = card.bounds.y + this.theme.metric('bar')

      for (line in card.lines) {
        count = line.widgets.length()
        fixed = 0
        flexible = 0

        for (index = 0; index < count; index++) {
          width = 0

          if (line.widths != null) {
            width = line.widths[index]
          }

          if (width > 0) {
            fixed = fixed + width
          } else {
            flexible = flexible + 1
          }
        }

        spare = inner.w - fixed - gap * (count - 1)
        share = 0

        if (flexible > 0) {
          share = math.floor(spare / flexible)
        }

        left = inner.x

        for (index = 0; index < count; index++) {
          width = 0

          if (line.widths != null) {
            width = line.widths[index]
          }

          if (width == 0) {
            width = share
          }

          line.widgets[index].place(new Rect(left, at, width, line.height))

          left = left + width + gap
        }

        at = at + line.height + gap
      }
    }
  }

  // ---- paint --------------------------------------------------------------

  paint(ui) {
    for (card in this.cards) {
      ui.painter.panel(card.bounds, null)

      title = new Rect(
        card.bounds.x + ui.theme.metric('pad'),
        card.bounds.y,
        card.bounds.w,
        ui.theme.metric('bar')
      )

      ui.painter.textIn('body', card.title, title, 'left', 'middle', ui.theme.of('accent'))
      ui.painter.groove(card.bounds.x + 1, title.bottom() - 2, card.bounds.w - 2)
    }

    super.paint(ui)
  }
}
