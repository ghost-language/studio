import "ghost:math"
import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"

// A frame strip over a layer list, which is the shape Aseprite's timeline
// takes: frames run left to right along the top, layers stack downward, and
// the cell where they meet is one drawing.
//
// It is presentational for now - a sprite here has one frame and one layer -
// but the geometry is the part worth having early, because the ruler and the
// cell grid are what the sound editor's waveform view will reuse.
class Timeline extends Widget {
  constructor(document) {
    super.constructor('timeline')

    this.document = document
    this.frames = 6
    this.layers = ['Layer 1', 'Background']
    this.frame = 0
    this.layer = 0
  }

  cellWidth(ui) {
    return this.rowHeight(ui)
  }

  // A timeline row carries icons, so it is at least as tall as one.
  //
  // The default 12px row against a 16px icon is precisely the fault that made
  // the old Picotron sheet unusable - an icon taller than the row containing
  // it - and it reappeared here the moment the layer toggles went in: the eye
  // and the lock were drawn four pixels wider than their slots and overlapped
  // into each other.
  rowHeight(ui) {
    return math.max(ui.theme.metric('row'), ui.theme.metric('icon'))
  }

  headerWidth(ui) {
    return this.rowHeight(ui) * 6
  }

  frameRect(ui, index) {
    size = this.cellWidth(ui)

    return new Rect(
      this.bounds.x + this.headerWidth(ui) + index * size,
      this.bounds.y + ui.theme.metric('gutter'),
      size - 1,
      size - 1
    )
  }

  // The two toggles live at the left of the header, the name to their right -
  // Aseprite's order, and the useful one: the eye is what gets clicked most and
  // sits where the pointer already is, rather than after a name of unknown
  // length.
  toggleRect(ui, index, slot) {
    size = this.rowHeight(ui)

    return new Rect(
      this.bounds.x + ui.theme.metric('gutter') + slot * size,
      this.bounds.y + size + ui.theme.metric('gutter') + index * size,
      size,
      size
    )
  }

  togglesWidth(ui) {
    return this.rowHeight(ui) * 2 + ui.theme.metric('gutter')
  }

  layerRect(ui, index) {
    size = this.rowHeight(ui)
    left = this.togglesWidth(ui)

    return new Rect(
      this.bounds.x + ui.theme.metric('gutter') + left,
      this.bounds.y + size + ui.theme.metric('gutter') + index * size,
      this.headerWidth(ui) - ui.theme.metric('gutter') - left,
      size - 1
    )
  }

  cellRect(ui, layer, frame) {
    size = this.cellWidth(ui)

    return new Rect(
      this.bounds.x + this.headerWidth(ui) + frame * size,
      this.bounds.y + size + ui.theme.metric('gutter') + layer * size,
      size - 1,
      size - 1
    )
  }

  paint(ui) {
    ui.painter.panel(this.bounds, null)

    // Frame numbers along the top.
    for (index = 0; index < this.frames; index++) {
      box = this.frameRect(ui, index)

      if (index == this.frame) {
        ui.painter.raised(box, ui.theme.of('button.selected'))
      } else {
        ui.painter.raised(box, null)
      }

      ink = ui.theme.of('text.dim')

      if (index == this.frame) {
        ink = ui.theme.of('text.selected')
      }

      ui.painter.textIn('body', `${index + 1}`, box, 'center', 'middle', ink)
    }

    // Layer names down the side, and a cell per frame.
    for (index = 0; index < this.layers.length(); index++) {
      name = this.layerRect(ui, index)
      ink = ui.theme.of('text.normal')

      if (index != this.layer) {
        ink = ui.theme.of('text.dim')
      }

      if (index == this.layer) {
        ui.painter.fill(name, ui.theme.of('button.selected'))
        ink = ui.theme.of('text.selected')
      }

      ui.painter.textIn('body', this.layers[index], name.inset(ui.theme.metric('gutter')), 'left', 'middle', ink)

      // Visible and locked, per layer. Drawn dim rather than hidden when off,
      // because a control that disappears when inactive cannot be turned back
      // on by anyone who has not already learnt it is there.
      if (ui.icons != null) {
        ui.icons.drawIn('eye', this.toggleRect(ui, index, 0), ui.theme.of('text.normal'), 1)
        ui.icons.drawIn('lock', this.toggleRect(ui, index, 1), ui.theme.of('text.dim'), 1)
      }

      for (frame = 0; frame < this.frames; frame++) {
        cell = this.cellRect(ui, index, frame)

        ui.painter.well(cell, ui.theme.of('field.face'))

        // A filled dot marks a frame that has a drawing in it.
        if (frame == 0) {
          dot = cell.inset(math.floor(cell.w / 3))

          ui.painter.fill(dot, ui.theme.of('text.dim'))
        }
      }
    }
  }

  pressed(ui) {
    for (index = 0; index < this.frames; index++) {
      if (this.frameRect(ui, index).contains(ui.pointer.x, ui.pointer.y)) {
        this.frame = index
        this.fire('frame', index)

        return true
      }
    }

    for (index = 0; index < this.layers.length(); index++) {
      if (this.layerRect(ui, index).contains(ui.pointer.x, ui.pointer.y)) {
        this.layer = index
        this.fire('layer', index)

        return true
      }
    }

    return false
  }
}
