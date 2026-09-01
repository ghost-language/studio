import "ghost:math"
import { snap } from "chisel/support/snap"

// A rectangle in window pixels, and the unit of all layout.
//
// Every Rect is integral: the constructor snaps, so nothing downstream has to
// remember to. Nothing here mutates - a split answers new rectangles - which is
// what makes re-running a layout on a resized window free of drift.
class Rect {
  constructor(x, y, width, height) {
    this.x = snap(x)
    this.y = snap(y)
    this.w = snap(math.max(0, width))
    this.h = snap(math.max(0, height))
  }

  right()   { return this.x + this.w }
  bottom()  { return this.y + this.h }
  isEmpty() { return this.w == 0 or this.h == 0 }

  contains(x, y) {
    return x >= this.x and y >= this.y and x < this.right() and y < this.bottom()
  }

  inset(amount) {
    return new Rect(this.x + amount, this.y + amount, this.w - amount * 2, this.h - amount * 2)
  }

  offset(dx, dy) {
    return new Rect(this.x + dx, this.y + dy, this.w, this.h)
  }

  sized(width, height) {
    return new Rect(this.x, this.y, width, height)
  }

  // The split family is the whole of layout. Each answers [taken, rest]:
  //
  //   [bar, rest] = area.splitTop(20)
  //
  // Remember the semicolon on the statement before a destructuring line: a
  // line opening with `[` continues the previous expression otherwise.
  splitTop(size) {
    size = math.min(size, this.h)

    return [
      new Rect(this.x, this.y, this.w, size),
      new Rect(this.x, this.y + size, this.w, this.h - size)
    ]
  }

  splitBottom(size) {
    size = math.min(size, this.h)

    return [
      new Rect(this.x, this.bottom() - size, this.w, size),
      new Rect(this.x, this.y, this.w, this.h - size)
    ]
  }

  splitLeft(size) {
    size = math.min(size, this.w)

    return [
      new Rect(this.x, this.y, size, this.h),
      new Rect(this.x + size, this.y, this.w - size, this.h)
    ]
  }

  splitRight(size) {
    size = math.min(size, this.w)

    return [
      new Rect(this.right() - size, this.y, size, this.h),
      new Rect(this.x, this.y, this.w - size, this.h)
    ]
  }

  // A grid cell on exact pixel steps, so no row drifts a pixel wider than
  // another. Used by the palette, the tile picker and the timeline.
  cell(column, row, size, gap) {
    step = size + gap

    return new Rect(this.x + column * step, this.y + row * step, size, size)
  }

  equals(other) {
    return this.x == other.x and this.y == other.y and this.w == other.w and this.h == other.h
  }

  toString() {
    return `[${this.x},${this.y} ${this.w}x${this.h}]`
  }
}
