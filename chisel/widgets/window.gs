import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"
import { Button } from "chisel/widgets/button"

function makeCloser(dialog) {
  return function () {
    dialog.fire('close', dialog)
  }
}

// A floating window: title bar, close button, body. Draggable by its bar.
//
// It is not part of the docked tree - the shell hands it to ui.openModal(),
// which paints it over everything and routes every pick to it. That is the
// whole of "modal": not a flag on a panel, but the one thing on screen that
// answers.
class Window extends Widget {
  constructor(title, width, height) {
    super.constructor('window')

    this.title = title
    this.wanted = { w: width, h: height }
    this.dragging = false

    // Both are read before they are set otherwise, and an unset field is not
    // something to find out about at paint time.
    this.theme = null
    this.body = null

    this.closer = new Button('x').icon('close').tooltip('Close', 'Esc')
    this.closer.on('click', makeCloser(this))

    this.add(this.closer)
  }

  // The body is where a caller puts its content; it is placed under the bar.
  holds(widget) {
    this.body = widget

    return this.add(widget)
  }

  barHeight(theme) {
    return theme.metric('tab')
  }

  centreIn(area) {
    return this.place(new Rect(
      area.x + (area.w - this.wanted.w) / 2,
      area.y + (area.h - this.wanted.h) / 2,
      this.wanted.w,
      this.wanted.h
    ))
  }

  arrange() {
    if (this.theme == null) {
      return null
    }

    bar = this.barHeight(this.theme)
    size = bar - this.theme.metric('gutter') * 2

    this.closer.place(new Rect(
      this.bounds.right() - size - this.theme.metric('gutter'),
      this.bounds.y + this.theme.metric('gutter'),
      size,
      size
    ))

    if (this.body != null) {
      this.body.place(new Rect(
        this.bounds.x + this.theme.metric('pad'),
        this.bounds.y + bar + this.theme.metric('pad'),
        this.bounds.w - this.theme.metric('pad') * 2,
        this.bounds.h - bar - this.theme.metric('pad') * 2
      ))
    }
  }

  paint(ui) {
    // Arrange lazily: the window is built before it is shown, so the theme is
    // not available until the first paint hands one over.
    if (this.theme == null) {
      this.theme = ui.theme
      this.arrange()
    }

    ui.painter.raised(this.bounds, ui.theme.of('panel.face'))

    bar = new Rect(this.bounds.x, this.bounds.y, this.bounds.w, this.barHeight(ui.theme))

    ui.painter.fillRounded(bar, ui.theme.of('button.selected'), ui.painter.radius())
    ui.painter.outlineRounded(bar, ui.painter.radius())

    ui.painter.textIn(
      'body',
      this.title,
      bar.inset(ui.theme.metric('pad')),
      'left',
      'middle',
      ui.theme.of('text.selected')
    )

    super.paint(ui)
  }

  // ---- dragging by the title bar ------------------------------------------

  barRect() {
    return new Rect(this.bounds.x, this.bounds.y, this.bounds.w, this.barHeight(this.theme))
  }

  pressed(ui) {
    if (this.theme == null) {
      return false
    }

    if (!this.barRect().contains(ui.pointer.x, ui.pointer.y)) {
      return false
    }

    this.dragging = true
    ui.capture(this)

    return true
  }

  dragged(ui) {
    if (!this.dragging) {
      return false
    }

    this.place(this.bounds.offset(ui.pointer.dx, ui.pointer.dy))

    return true
  }

  released(ui) {
    this.dragging = false

    return true
  }

  moved(ui) {
    return true
  }
}
