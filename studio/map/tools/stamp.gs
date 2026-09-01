import { Tool } from "studio/tool"

// The pencil with a different payload, and the same right-click-picks reflex
// every tile editor shares with every pixel editor.
class Stamp extends Tool {
  constructor() {
    super.constructor('stamp', 'S', 'S')
  }

  begin(document, x, y, button) {
    if (button == 'right') {
      picked = document.at(x, y)

      if (picked == null) {
        return false
      }

      document.brush = picked

      return true
    }

    return document.put(x, y, document.brush)
  }

  drag(document, x, y) {
    return document.put(x, y, document.brush)
  }
}
