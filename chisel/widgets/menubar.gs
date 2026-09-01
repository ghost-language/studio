import { Widget } from "chisel/widget"
import { Menu } from "chisel/widgets/menu"
import { Rect } from "chisel/geometry/rect"

// The row of menu titles. The open menu is not a child: it is registered as an
// overlay every frame it is showing, so it paints above every docked panel and
// is picked before them.
class Menubar extends Widget {
  constructor() {
    super.constructor('menubar')

    this.menus = []
    this.openIndex = -1
  }

  // menu('File', function (menu) { menu.item('sprite.new') })
  menu(title, callback) {
    built = new Menu(title)
    built.owner = this

    callback(built)

    this.menus.push(built)

    return this
  }

  titleRect(ui, index) {
    x = this.bounds.x + 4
    width = 0

    for (position = 0; position <= index; position++) {
      width = ui.painter.measure('body', this.menus[position].title) + 16 * ui.theme.scale

      if (position < index) {
        x = x + width
      }
    }

    return new Rect(x, this.bounds.y, width, this.bounds.h)
  }

  indexAt(ui, x, y) {
    for (index = 0; index < this.menus.length(); index++) {
      if (this.titleRect(ui, index).contains(x, y)) {
        return index
      }
    }

    return -1
  }

  isOpen() {
    return this.openIndex >= 0
  }

  open(ui, index) {
    this.openIndex = index

    box = this.titleRect(ui, index)

    this.menus[index].openAt(ui, box.x, this.bounds.bottom())

    return this
  }

  close() {
    this.openIndex = -1

    return this
  }

  paint(ui) {
    ui.painter.panel(this.bounds, null)

    for (index = 0; index < this.menus.length(); index++) {
      box = this.titleRect(ui, index)
      ink = ui.theme.of('text.normal')

      if (index == this.openIndex) {
        ui.painter.fill(box, ui.theme.of('button.selected'))
        ink = ui.theme.of('text.selected')
      }

      ui.painter.textIn('body', this.menus[index].title, box, 'center', 'middle', ink)
    }

    if (this.isOpen()) {
      ui.overlay(this.menus[this.openIndex], this)
    }
  }

  pressed(ui) {
    found = this.indexAt(ui, ui.pointer.x, ui.pointer.y)

    if (found < 0) {
      return false
    }

    if (this.openIndex == found) {
      return this.close()
    }

    this.open(ui, found)

    return true
  }

  // Sliding along the bar with a menu open switches which one is showing, the
  // way every desktop menu bar behaves.
  moved(ui) {
    if (!this.isOpen()) {
      return false
    }

    found = this.indexAt(ui, ui.pointer.x, ui.pointer.y)

    if (found >= 0 and found != this.openIndex) {
      this.open(ui, found)
    }

    return true
  }
}
