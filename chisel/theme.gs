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

    // The size text is drawn at, at scale 1.
    //
    // 16 rather than 19 because ghost-language/lumen#21 landed: the built-in
    // font is no longer antialiased, so it is crisp at any size and the choice
    // is free. 19 was never a design decision - it was the smallest size that
    // survived blending.
    this.native = 16

    // Metrics at 1x, multiplied by the scale on read.
    this.metrics = {
      unit: 4,
      gutter: 3,
      pad: 6,

      // Rows are sized around the ink, not the em box. Silver at 16px has an
      // 18px line box around an 8px capital, so reserving the whole box wastes
      // ten pixels a row and pushes every label above its own centre.
      row: 16,
      bar: 18,
      tab: 20,
      tool: 20,
      icon: 8,
      swatch: 14,
      check: 11,
      scroll: 12,

      // The transparency checkerboard, in framebuffer pixels. Screen-space, so
      // it does not zoom with the artwork.
      checker: 16,

      // The corner radius, as a circular quadrant in whole pixels. 0 is square.
      // Five cuts three pixels at the very corner and straightens quickly,
      // which reads as properly rounded at this size; the painter caps it at
      // half the shorter side so a checkbox never gets a bite taken out of it.
      radius: 5,

      // Measured from a render of silver.ttf at 16px, as offsets from the y
      // that canvas.print() is given (which is the top of the line box):
      //   caps occupy +3..+10, x-height +6..+10, descenders reach +12.
      // Text is centred on the cap band, which is what makes a row of chrome
      // look optically centred rather than merely arithmetically centred.
      // These are per-size: changing `native` means measuring these again.
      capTop: 3,
      cap: 8,
      baseline: 10,
      descender: 12
    }
  }

  set(tokens) {
    this.tokens = this.tokens.merge(tokens)

    return this
  }

  // Metrics a theme overrides. Picotron's chrome is built on a 12px row where
  // this kit's default was 16, and half the widgets read a metric rather than a
  // constant, so a theme that cannot change these can only ever be a recolour.
  sized(metrics) {
    this.metrics = this.metrics.merge(metrics)

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
  // A PIXEL FONT IS ONLY CRISP AT WHOLE MULTIPLES OF ITS NATIVE SIZE *if the
  // engine antialiases it*. ghost-language/lumen#21 turned antialiasing off
  // for the built-in font, so on a current Lumen every size is crisp and the
  // size is a design choice again. On an older build, only multiples of 19
  // are sharp.
  //
  // A font you supply yourself still keeps its smoothing, so `native` has to
  // be that font's own design size or its text will blur.
  // silver.ttf has unitsPerEm 1900 and draws its glyphs on a 100-unit grid, so
  // one font pixel is exactly one screen pixel at 19px, 38px, 57px - and at
  // nothing in between. Blended, every other size lands glyph edges on a
  // fraction of a pixel and comes back as grey fringes; unblended, none of
  // that arises and the size is free.
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
  // `native` carries a default so this stays callable as loadFonts(path).
  // Ghost requires every parameter without one, so adding a bare second
  // parameter silently broke every existing one-argument call - at the moment
  // it ran, which for this method is app startup.
  loadFonts(path, native = null) {
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
