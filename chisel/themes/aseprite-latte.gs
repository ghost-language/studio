import "lumen:color"
import { Theme } from "chisel/theme"
import { catppuccinLatte } from "chisel/support/catppuccin"

// The same interface in Catppuccin Latte.
//
// Every token below is identical to the Mocha theme's - the same names in the
// same order - because Catppuccin's two flavours share their vocabulary and
// run their greys in opposite directions. `text` is the darkest grey here and
// the lightest there, so "text on base" is legible in both without a single
// conditional.
//
// That is the whole argument for naming colours by role rather than by
// appearance, and it is why this file is a palette swap rather than a rewrite.
function asepriteLatte() {
  palette = catppuccinLatte()

  theme = new Theme('aseprite.latte').set({
    // The workspace is `base`; every bar that sits on it is `surface0`. That
    // one step is what separates chrome from canvas in this design, and it is
    // the whole of the separation - Aseprite does not outline its bars either.
    'window.face':     color.hex(palette.base),
    'panel.face':      color.hex(palette.surface0),
    'panel.well':      color.hex(palette.mantle),
    'field.face':      color.hex(palette.mantle),

    'outline':         color.hex(palette.mantle),
    'bevel.light':     color.hex(palette.surface1),
    'bevel.dark':      color.hex(palette.crust),

    // A tool button has no fill until something happens to it, then it climbs
    // the surface ramp. Measured: the selected pencil sits on surface2 while
    // its unselected neighbours sit on the bar itself.
    'button.face':     color.hex(palette.surface0),
    'button.hover':    color.hex(palette.surface1),
    'button.pressed':  color.hex(palette.surface2),
    'button.selected': color.hex(palette.surface2),

    'text.normal':     color.hex(palette.text),
    'text.dim':        color.hex(palette.overlay1),
    'text.selected':   color.hex(palette.text),

    'accent':          color.hex(palette.blue),
    'focus':           color.hex(palette.sapphire),

    'good':            color.hex(palette.green),
    'warn':            color.hex(palette.yellow),
    'bad':             color.hex(palette.red),

    'title.face':      color.hex(palette.surface1),
    'title.text':      color.hex(palette.text),

    'scrim':           color.rgb(76, 79, 105, 0.4),

    // Aseprite's own, not Catppuccin's. Both references show the same two
    // greys under two completely different themes, which is how you can tell
    // the checker is painted by the application rather than the theme.
    'checker.light':   color.hex('#c0c0c0'),
    'checker.dark':    color.hex('#808080')
  }).sized({
    unit: 4,
    gutter: 2,
    pad: 4,

    row: 12,
    bar: 12,
    tab: 11,
    tool: 15,
    icon: 16,
    swatch: 10,
    check: 10,
    scroll: 8,
    checker: 16,

    // Aseprite rounds a corner by a single pixel where it rounds one at all.
    radius: 2,
    cut: 1,

    capTop: 2,
    cap: 6,
    baseline: 7,
    descender: 9
  })

  theme.native = 12

  return theme
}
