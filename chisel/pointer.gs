// Where the mouse is, what it is doing, and how far it moved since the last
// event. Widgets read this instead of importing the mouse module, so a widget
// can be driven from a test with no real mouse in sight.
class Pointer {
  constructor() {
    this.x = 0
    this.y = 0
    this.dx = 0
    this.dy = 0
    this.button = ''
    this.clicks = 0
    this.wheel = 0
  }

  moveTo(x, y, dx, dy) {
    this.x = x
    this.y = y
    this.dx = dx
    this.dy = dy
  }

  press(x, y, button, clicks) {
    this.x = x
    this.y = y
    this.button = button
    this.clicks = clicks
  }

  release(x, y, button) {
    this.x = x
    this.y = y
    this.button = ''
  }
}
