import { Widget } from "chisel/widget"
import { Button } from "chisel/widgets/button"
import { Rect } from "chisel/geometry/rect"

// The handler factory lives outside the class because a closure built inside a
// loop cannot capture the loop variable in Ghost. Every list-driven widget in
// this toolkit needs one of these.
function makeSelectHandler(bar, name) {
  return function () {
    bar.select(name)
  }
}

// A column of square buttons where exactly one is selected. Selection lives in
// the bar, so nothing ever has to "deselect the other seven".
class Toolbar extends Widget {
  constructor() {
    super.constructor('toolbar')

    this.value = null
  }

  // The label is the fallback for when the icon sheet has no art by that
  // name, so a toolbar is legible before a single icon is drawn.
  tool(name, label, key) {
    button = new Button(label)
      .named(name)
      .icon(name)
      .tooltip(name, key)
      .on('click', makeSelectHandler(this, name))

    return this.add(button)
  }

  select(name) {
    this.value = name

    for (child in this.children) {
      child.selects(child.id == name)
    }

    this.fire('change', name)

    return this
  }

  selected() {
    return this.value
  }

  arrange() {
    size = this.bounds.w - 8
    top = this.bounds.y + 4

    for (child in this.children) {
      child.place(new Rect(this.bounds.x + 4, top, size, size))

      top = top + size + 1
    }
  }

  paint(ui) {
    ui.painter.panel(this.bounds, null)

    super.paint(ui)
  }
}
