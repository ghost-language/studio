// tap() hands the object to a callback and answers it again, for the times a
// chain needs a side effect in the middle of itself.
trait Tappable {
  tap(callback) {
    callback(this)

    return this
  }
}
