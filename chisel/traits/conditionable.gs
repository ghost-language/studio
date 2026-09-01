// when() and unless() keep if-statements out of a declaration block. The
// callback receives the object, so a fluent chain never has to break to branch.
trait Conditionable {
  when(condition, callback) {
    if (condition) {
      callback(this)
    }

    return this
  }

  unless(condition, callback) {
    if (!condition) {
      callback(this)
    }

    return this
  }
}
