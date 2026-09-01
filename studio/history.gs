// Undo, by snapshot.
//
// begin() records the document before a stroke, commit() pushes that snapshot
// once the stroke is finished, so one drag is one undo step rather than four
// hundred. Snapshots are whole-document copies: simple, correct, and the first
// thing to revisit when documents get large.
class History {
  constructor(document) {
    this.document = document
    this.past = []
    this.future = []
    this.pending = null
    this.limit = 64
  }

  begin() {
    this.pending = this.document.snapshot()

    return this
  }

  commit() {
    if (this.pending == null) {
      return false
    }

    this.past.push(this.pending)
    this.pending = null
    this.future = []

    if (this.past.length() > this.limit) {
      this.past.shift()
    }

    return true
  }

  canUndo() { return !this.past.isEmpty() }
  canRedo() { return !this.future.isEmpty() }

  undo() {
    if (!this.canUndo()) {
      return false
    }

    this.future.push(this.document.snapshot())
    this.document.restore(this.past.pop())

    return true
  }

  redo() {
    if (!this.canRedo()) {
      return false
    }

    this.past.push(this.document.snapshot())
    this.document.restore(this.future.pop())

    return true
  }
}
