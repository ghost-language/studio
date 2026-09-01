import { Tool } from "studio/tool"

// Flood fill. Four-way, iterative rather than recursive - Ghost bounds
// recursion at 4096 frames and a 128x128 fill would blow through that long
// before it finished.
class Bucket extends Tool {
  constructor() {
    super.constructor('bucket', 'G', 'G')
  }

  valueFor(document, button) {
    if (button == 'right') {
      return document.background
    }

    return document.foreground
  }

  begin(document, x, y, button) {
    target = document.at(x, y)
    value = this.valueFor(document, button)

    if (target == value) {
      return false
    }

    // A stack of cells still to visit. Comparing against `target` rather than
    // re-reading a neighbour twice is what keeps this from revisiting cells.
    pending = [[x, y]]

    while (!pending.isEmpty()) {
      cell = pending.pop()
      cx = cell[0]
      cy = cell[1]

      if (!document.inside(cx, cy)) {
        continue
      }

      if (document.at(cx, cy) != target) {
        continue
      }

      document.put(cx, cy, value)

      pending.push([cx + 1, cy])
      pending.push([cx - 1, cy])
      pending.push([cx, cy + 1])
      pending.push([cx, cy - 1])
    }

    return true
  }
}
