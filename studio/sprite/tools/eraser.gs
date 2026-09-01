import { Tool } from "studio/tool"
import { linePixels } from "studio/support/line-pixels"

function makeEraser(document) {
  return function (x, y) {
    document.put(x, y, null)
  }
}

class Eraser extends Tool {
  constructor() {
    super.constructor('eraser', 'E', 'E')

    this.last = null
  }

  begin(document, x, y, button) {
    this.last = [x, y]

    return document.put(x, y, null)
  }

  drag(document, x, y) {
    if (this.last != null) {
      linePixels(this.last[0], this.last[1], x, y, makeEraser(document))
    }

    this.last = [x, y]

    return true
  }

  finish(document) {
    this.last = null

    return true
  }
}
