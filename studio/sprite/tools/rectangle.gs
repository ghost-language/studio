import "ghost:math"
import { Tool } from "studio/tool"

// A rectangle outline, previewed from the anchor. Same restore-and-redraw
// approach as the line tool.
class Rectangle extends Tool {
  constructor() {
    super.constructor('rectangle', 'R', 'U')

    this.anchor = null
    this.before = null
    this.value = null
  }

  begin(document, x, y, button) {
    this.anchor = [x, y]
    this.before = document.snapshot()
    this.value = document.foreground

    if (button == 'right') {
      this.value = document.background
    }

    return document.put(x, y, this.value)
  }

  drag(document, x, y) {
    if (this.anchor == null) {
      return false
    }

    document.restore(this.before.slice(0))

    left = math.min(this.anchor[0], x)
    right = math.max(this.anchor[0], x)
    top = math.min(this.anchor[1], y)
    bottom = math.max(this.anchor[1], y)

    for (column = left; column <= right; column++) {
      document.put(column, top, this.value)
      document.put(column, bottom, this.value)
    }

    for (row = top; row <= bottom; row++) {
      document.put(left, row, this.value)
      document.put(right, row, this.value)
    }

    return true
  }

  finish(document) {
    this.anchor = null
    this.before = null

    return true
  }
}
