import { Tool } from "studio/tool"
import { linePixels } from "studio/support/line-pixels"

function makeStroke(document, value) {
  return function (x, y) {
    document.put(x, y, value)
  }
}

// A straight line, previewed from the anchor while the button is held.
//
// The preview is drawn by restoring the snapshot taken at press and redrawing
// from it each time the pointer moves - a shape tool that committed every
// intermediate line would leave a fan behind it.
class Line extends Tool {
  constructor() {
    super.constructor('line', 'L', 'L')

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

    linePixels(this.anchor[0], this.anchor[1], x, y, makeStroke(document, this.value))

    return true
  }

  finish(document) {
    this.anchor = null
    this.before = null

    return true
  }
}
