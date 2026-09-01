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

    // The size the text is drawn at, at scale 1. See loadFonts() for why this
    // is 19 and not a rounder number.
    this.native = 19

    // Metrics at 1x, multiplied by the scale on read.
    //
    // These are sized around the font rather than chosen freely: silver.ttf at
    // 19px reports a line height of 21px, so a row shorter than that clips its
    // own text. Every row-like metric below clears 21 with a little air.
    this.metrics = {
      unit: 4,
      gutter: 4,
      pad: 6,
      row: 24,
      bar: 26,
      tab: 28,
      tool: 28,
      icon: 16,
      swatch: 16,
      scroll: 12
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

  // Loads the interface font. Pass a path to a pixel TTF and the size that
  // font is drawn at natively, or null for Lumen's built-in face.
  //
  // A PIXEL FONT IS ONLY CRISP AT WHOLE MULTIPLES OF ITS NATIVE SIZE, and
  // getting this wrong is the whole of "why does the text look blurry".
  // Lumen's built-in silver.ttf has unitsPerEm 1900 and draws its glyphs on a
  // 100-unit grid, so one font pixel is exactly one screen pixel at 19px, 38px,
  // 57px - and at nothing in between. At 16px or 32px every glyph edge lands
  // on a fraction of a pixel, and since Lumen renders text through SDL_ttf's
  // *blended* path (there is no aliased option), those fractions come back as
  // grey fringes rather than hard edges.
  //
  // To find the native size of another font: unitsPerEm divided by the grid
  // its coordinates are multiples of. For silver that is 1900 / 100.
  //
  // The module is imported as `fontModule` rather than the bare `font` its
  // scheme suggests, because this class also has a method named `font()`
  // (below). A method's own name shadows a same-named import for every
  // method in the class - method lookup walks the class environment before
  // it ever reaches the file's imports - so `font.system(...)` here would
  // silently resolve to the method object instead of the module, and raise
  // `no method \`system\`` the moment it was called.
  loadFonts(path, native) {
    if (native != null) {
      this.native = native
    }

    size = this.native * this.scale

    // Both roles are the same size, because with silver.ttf there is only one
    // crisp size per UI scale - the next one down the 19px grid is nothing,
    // and the next one up is double. A font on a finer grid can give these two
    // genuinely different sizes; the roles exist so that call sites do not
    // have to change when one does.
    if (path == null) {
      this.fonts.set('small', fontModule.system(size))
      this.fonts.set('body', fontModule.system(size))

      return this
    }

    this.fonts.set('small', new Font(path, size))
    this.fonts.set('body', new Font(path, size))

    return this
  }

  font(role) {
    return this.fonts.get(role)
  }
}
