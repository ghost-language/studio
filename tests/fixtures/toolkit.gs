// A stand-in for a `lumen:` module, used only by tests/core.gs to check a
// language behaviour: whether a class method can share a bare import's name
// without the method shadowing it.
function system(value) {
  return `built-${value}`
}
