import "lumen:filesystem"
import "ghost:json"

// Dot-notation settings, persisted to the player's own data directory rather
// than next to the program: an app installed read-only cannot write to its own
// folder.
class Preferences {
  constructor(identity) {
    this.values = {}

    filesystem.setIdentity(identity)
  }

  set(path, value) {
    segments = path.split('.')
    node = this.values

    for (index = 0; index < segments.length() - 1; index++) {
      key = segments[index]

      if (!node.has(key)) {
        node.set(key, {})
      }

      node = node.get(key)
    }

    node.set(segments.last(), value)

    return this
  }

  get(path, fallback) {
    node = this.values

    for (key in path.split('.')) {
      if (node == null) {
        return fallback
      }

      node = node.get(key)
    }

    if (node == null) {
      return fallback
    }

    return node
  }

  // read() answers null when the file is absent, so "first launch" is an
  // ordinary branch rather than an error path.
  load() {
    saved = filesystem.read('preferences.json')

    if (saved != null) {
      this.values = this.values.merge(json.decode(saved))
    }

    return this
  }

  save() {
    filesystem.write('preferences.json', json.encode(this.values))

    return this
  }
}
