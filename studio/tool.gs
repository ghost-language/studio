// A tool is three verbs over a document.
//
// The middle one is `drag` rather than `continue` because `continue` is a Ghost
// keyword and cannot name a method.
class Tool {
  constructor(name, label, key) {
    this.name = name
    this.label = label
    this.key = key
  }

  begin(document, x, y, button) { return false }
  drag(document, x, y)          { return false }
  finish(document)              { return false }
}
