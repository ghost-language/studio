import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// Stacks its children top to bottom at a fixed row height, with a gap between.
// Enough for a form, a palette of controls, a settings panel - and it is the
// layout the playground is built out of.
class Column extends Widget {
  constructor(rowHeight, gap) {
    super.constructor('column')

    this.rowHeight = rowHeight
    this.gap = gap
    this.heights = {}
  }

  // A child can ask for a height of its own; everything else gets rowHeight.
  tall(child, height) {
    this.heights.set(child.id, height)

    return this.add(child)
  }

  arrange() {
    top = this.bounds.y

    for (child in this.children) {
      height = this.rowHeight

      if (child.id != '' and this.heights.has(child.id)) {
        height = this.heights.get(child.id)
      }

      child.place(new Rect(this.bounds.x, top, this.bounds.w, height))

      top = top + height + this.gap
    }
  }
}
