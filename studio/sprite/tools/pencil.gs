import { Tool } from "studio/tool"
import { linePixels } from "studio/support/line-pixels"

// A closure over the document and the value being painted. It is built by a
// call rather than inside a loop, which is what makes the capture work.
function makeStroke(document, value) {
  return function (x, y) {
    document.put(x, y, value)
  }
}

class Pencil extends Tool {
  constructor() {
    super.constructor('pencil', 'P', 'B')

    this.last = null
    this.value = null
  }

  // Right-click paints the background colour, the way every pixel editor since
  // Deluxe Paint has behaved.
  valueFor(document, button) {
    if (button == 'right') {
      return document.background
    }

    return document.foreground
  }

  begin(document, x, y, button) {
    this.value = this.valueFor(document, button)
    this.last = [x, y]

    return document.put(x, y, this.value)
  }

  drag(document, x, y) {
    if (this.last != null) {
      linePixels(this.last[0], this.last[1], x, y, makeStroke(document, this.value))
    }

    this.last = [x, y]

    return true
  }

  finish(document) {
    this.last = null

    return true
  }
}
