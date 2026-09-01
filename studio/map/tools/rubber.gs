import { Tool } from "studio/tool"

class Rubber extends Tool {
  constructor() {
    super.constructor('rubber', 'X', 'X')
  }

  begin(document, x, y, button) {
    return document.put(x, y, null)
  }

  drag(document, x, y) {
    return document.put(x, y, null)
  }
}
