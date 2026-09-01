import "ghost:math"
import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// A drop-down list of commands. Rows name commands rather than carrying
// closures, so the label, the accelerator and whether the row is available all
// come from the one place that already knows: the command itself.
class Menu extends Widget {
  constructor(title) {
    super.constructor('menu')

    this.title = title
    this.rows = []
    this.hovered = -1
    this.owner = null
  }

  item(command)   { this.rows.push({ kind: 'item', command: command }); return this }
  separator()     { this.rows.push({ kind: 'separator' });              return this }

  rowHeight(ui) {
    return ui.theme.metric('row')
  }

  // Wide enough for the longest label plus its accelerator, with a gap between
  // the two columns that never closes.
  widthFor(ui) {
    widest = 80 * ui.theme.scale

    for (row in this.rows) {
      if (row.kind == 'item') {
        command = ui.studio.commands.get(row.command)

        if (command != null) {
          width = ui.painter.measure('body', command.label) + ui.painter.measure('body', command.accel) + 40 * ui.theme.scale
          widest = math.max(widest, width)
        }
      }
    }

    return widest
  }

  heightFor(ui) {
    total = ui.theme.metric('gutter') * 2

    for (row in this.rows) {
      if (row.kind == 'separator') {
        total = total + 5 * ui.theme.scale
      } else {
        total = total + this.rowHeight(ui)
      }
    }

    return total
  }

  openAt(ui, x, y) {
    this.hovered = -1

    return this.place(new Rect(x, y, this.widthFor(ui), this.heightFor(ui)))
  }

  rowRect(ui, index) {
    top = this.bounds.y + ui.theme.metric('gutter')

    for (position = 0; position < this.rows.length(); position++) {
      height = this.rowHeight(ui)

      if (this.rows[position].kind == 'separator') {
        height = 5 * ui.theme.scale
      }

      if (position == index) {
        return new Rect(this.bounds.x + 2, top, this.bounds.w - 4, height)
      }

      top = top + height
    }

    return new Rect(0, 0, 0, 0)
  }

  indexAt(ui, x, y) {
    for (index = 0; index < this.rows.length(); index++) {
      if (this.rows[index].kind == 'item' and this.rowRect(ui, index).contains(x, y)) {
        return index
      }
    }

    return -1
  }

  paint(ui) {
    ui.painter.panel(this.bounds, null)

    for (index = 0; index < this.rows.length(); index++) {
      this.paintRow(ui, index)
    }
  }

  paintRow(ui, index) {
    row = this.rows[index]
    box = this.rowRect(ui, index)

    if (row.kind == 'separator') {
      ui.painter.groove(box.x + 2, box.y + 2, box.w - 4)

      return null
    }

    command = ui.studio.commands.get(row.command)

    if (command == null) {
      return null
    }

    ink = ui.theme.of('text.normal')

    if (!command.isEnabled(ui.studio)) {
      ink = ui.theme.of('text.dim')
    }

    if (index == this.hovered) {
      ui.painter.fill(box, ui.theme.of('button.selected'))
      ink = ui.theme.of('text.selected')
    }

    inner = box.inset(6 * ui.theme.scale)

    ui.painter.textIn('body', command.label, inner, 'left', 'middle', ink)

    if (command.accel != '') {
      ui.painter.textIn('body', command.accel, inner, 'right', 'middle', ui.theme.of('text.dim'))
    }
  }

  moved(ui) {
    this.hovered = this.indexAt(ui, ui.pointer.x, ui.pointer.y)

    return true
  }

  pressed(ui) {
    return true
  }

  released(ui) {
    found = this.indexAt(ui, ui.pointer.x, ui.pointer.y)

    if (found >= 0) {
      ui.studio.run(this.rows[found].command)
    }

    this.dismissed(ui)

    return true
  }

  keyed(ui, key) {
    if (key.toLowerCase() == 'escape') {
      this.dismissed(ui)

      return true
    }

    return false
  }

  dismissed(ui) {
    if (this.owner != null) {
      this.owner.close()
    }

    return true
  }
}
