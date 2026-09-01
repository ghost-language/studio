// Everything the workspace can open uses this trait and answers these methods:
//
//   title             a string field, shown in the tab and the status bar
//   width()           cells across
//   height()          cells down
//   cellSize()        how many pixels one cell is at 1:1
//   at(x, y)          the value in a cell, or null
//   put(x, y, value)  write a cell
//   paintCell(x, y, screenX, screenY)
//   snapshot()        a value History can hold
//   restore(snapshot)
//
// Ghost has no interface keyword, so a contract is a trait plus this list,
// checked by the program running rather than by a compiler.
trait Editable {
  markDirty() {
    this.dirty = true
    this.revision = this.revision + 1

    return this
  }

  isDirty() {
    return this.dirty
  }

  clean() {
    this.dirty = false

    return this
  }

  inside(x, y) {
    return x >= 0 and y >= 0 and x < this.width() and y < this.height()
  }
}
