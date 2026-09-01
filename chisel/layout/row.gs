import "ghost:math"
import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// Places its children left to right. A child with a declared width gets it;
// the rest share what is left.
class Row extends Widget {
  constructor(gap) {
    super.constructor('row')

    this.gap = gap
    this.widths = {}
  }

  wide(child, width) {
    this.widths.set(child.id, width)

    return this.add(child)
  }

  widthOf(child) {
    if (child.id != '' and this.widths.has(child.id)) {
      return this.widths.get(child.id)
    }

    return 0
  }

  arrange() {
    fixed = 0
    flexible = 0

    for (child in this.children) {
      width = this.widthOf(child)

      if (width > 0) {
        fixed = fixed + width
      } else {
        flexible = flexible + 1
      }
    }

    gaps = this.gap * math.max(0, this.children.length() - 1)
    spare = math.max(0, this.bounds.w - fixed - gaps)
    share = 0

    if (flexible > 0) {
      share = math.floor(spare / flexible)
    }

    left = this.bounds.x

    for (child in this.children) {
      width = this.widthOf(child)

      if (width == 0) {
        width = share
      }

      child.place(new Rect(left, this.bounds.y, width, this.bounds.h))

      left = left + width + this.gap
    }
  }
}
