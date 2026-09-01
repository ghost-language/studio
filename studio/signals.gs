// Application-level notifications, for things panels need to hear about but
// should not hold references to each other for: the document changed, the tool
// changed, the cursor moved.
//
// Widget-to-widget signalling stays on the widget (the EmitsEvents trait). This
// is only for across-the-app news, which is why it is one small class.
class Signals {
  constructor() {
    this.listeners = {}
  }

  listen(name, handler) {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, [])
    }

    bucket = this.listeners.get(name)
    bucket.push(handler)

    return { name: name, index: bucket.length() - 1 }
  }

  emit(name, payload) {
    if (!this.listeners.has(name)) {
      return false
    }

    for (handler in this.listeners.get(name)) {
      if (handler != null) {
        handler(payload)
      }
    }

    return true
  }

  // Blanking the slot keeps every token handed out earlier pointing at the
  // right handler.
  forget(token) {
    if (token == null or !this.listeners.has(token.name)) {
      return false
    }

    this.listeners.get(token.name)[token.index] = null

    return true
  }
}
