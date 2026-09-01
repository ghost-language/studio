import { Widget } from "chisel/widget"

// The workspace layout: regions are carved off the edges of the available
// rectangle in insertion order, and whatever survives becomes the centre.
// No hard-coded positions, so the layout holds at any window size.
class Dock extends Widget {
  constructor() {
    super.constructor('dock')

    this.regions = []
    this.center = null
  }

  top(widget, size)    { return this.edge('top', widget, size) }
  bottom(widget, size) { return this.edge('bottom', widget, size) }
  left(widget, size)   { return this.edge('left', widget, size) }
  right(widget, size)  { return this.edge('right', widget, size) }

  edge(side, widget, size) {
    this.regions.push({ side: side, widget: widget, size: size })

    return this.add(widget)
  }

  fill(widget) {
    this.center = widget

    return this.add(widget)
  }

  // Sizes are stored per region rather than read from a constant, which is
  // what will let a splitter write to one later.
  resize(id, size) {
    for (region in this.regions) {
      if (region.widget.id == id) {
        region.size = size
      }
    }

    this.arrange()

    return this
  }

  arrange() {
    area = this.bounds

    for (region in this.regions) {
      taken = null

      switch (region.side) {
        case 'top'    { [taken, area] = area.splitTop(region.size) }
        case 'bottom' { [taken, area] = area.splitBottom(region.size) }
        case 'left'   { [taken, area] = area.splitLeft(region.size) }
        case 'right'  { [taken, area] = area.splitRight(region.size) }
      }

      region.widget.place(taken)
    }

    if (this.center != null) {
      this.center.place(area)
    }
  }
}
