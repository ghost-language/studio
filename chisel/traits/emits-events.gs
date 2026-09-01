// Per-object signalling: .on('click', fn) and .fire('click', payload).
//
// `handlers = {}` is a trait field, and a trait field is re-evaluated for every
// instance, so two buttons never share one handler map.
trait EmitsEvents {
  handlers = {}

  on(name, handler) {
    if (!this.handlers.has(name)) {
      this.handlers.set(name, [])
    }

    this.handlers.get(name).push(handler)

    return this
  }

  fire(name, payload) {
    if (!this.handlers.has(name)) {
      return false
    }

    for (handler in this.handlers.get(name)) {
      handler(payload, this)
    }

    return true
  }
}
