import "lumen:color"
import "lumen:font" as fontModule
import "ghost:math"
import { Font } from "lumen:font"

// Every colour and measurement in the interface, in one object.
//
// Widgets ask for roles, never shades: theme.of('button.face') survives a theme
// swap, color.hex('#3a3a44') sprayed through forty files does not. Metrics are
// stored at 1x and multiplied on read, so the UI scale is one integer rather
// than a hunt through the widgets.
class Theme {
  constructor(name) {
    this.name = name
    this.scale = 1
    this.tokens = {}
    this.fonts = {}

    this.metrics = {
      unit: 4,
      gutter: 4,
      pad: 6,
      row: 18,
      bar: 20,
      tab: 22,
      tool: 22,
      icon: 16,
      swatch: 14,
      scroll: 10
    }
  }

  set(tokens) {
    this.tokens = this.tokens.merge(tokens)

    return this
  }

  // A missing token paints magenta rather than raising: the oldest trick in
  // pixel art is making a mistake impossible to miss.
  of(token) {
    found = this.tokens.get(token)

    if (found == null) {
      return color.hex('#ff00ff')
    }

    return found
  }

  // Whole numbers only. Fractional UI scale is what gives pixel art uneven
  // edges, and it is why the fonts below load at exact multiples.
  useScale(factor) {
    this.scale = math.max(1, math.floor(factor))

    return this
  }

  metric(name) {
    return this.metrics.get(name) * this.scale
  }

  // Pass a path to a pixel TTF, or null for Lumen's built-in font.
  //
  // The module is imported as `fontModule` rather than the bare `font` its
  // scheme suggests, because this class also has a method named `font()`
  // (below). A method's own name shadows a same-named import for every
  // method in the class - method lookup walks the class environment before
  // it ever reaches the file's imports - so `font.system(...)` here would
  // silently resolve to the method object instead of the module, and raise
  // `no method \`system\`` the moment it was called.
  loadFonts(path) {
    base = 8 * this.scale

    if (path == null) {
      this.fonts.set('small', fontModule.system(base))
      this.fonts.set('body', fontModule.system(base * 2))

      return this
    }

    this.fonts.set('small', new Font(path, base))
    this.fonts.set('body', new Font(path, base * 2))

    return this
  }

  font(role) {
    return this.fonts.get(role)
  }
}
