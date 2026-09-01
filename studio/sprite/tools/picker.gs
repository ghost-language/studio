import { Tool } from "studio/tool"

// Takes the colour under the cursor as the foreground. Alt-clicking with any
// other tool should do this too - one line in each tool, or one shared guard
// once there are more of them.
class Picker extends Tool {
  constructor() {
    super.constructor('picker', 'I', 'I')
  }

  begin(document, x, y, button) {
    value = document.at(x, y)

    if (value == null) {
      return false
    }

    document.foreground = value

    return true
  }

  drag(document, x, y) {
    return this.begin(document, x, y, 'left')
  }
}
