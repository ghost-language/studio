import { Theme } from "chisel/theme"
import "lumen:color"
import { Palette } from "chisel/palette"

// Picotron.
//
// Every colour here comes from palette.step() or palette.named(), so none of
// them can drift off the thirty-two. That is the point of the indirection: a
// hand-typed hex that is two off a real entry looks fine on its own and wrong
// beside everything else, and it is exactly the kind of mistake that
// accumulates into an interface that reads as messy without any single thing
// being identifiably broken.
//
// The metrics are measured, not chosen. docs/picotron.md records where each
// one came from - a 12px row, an 11px title bar over a 1px rule, a 9px
// checkbox, a 5px scrollbar, a 2px corner cut - and tools/verify.sh holds the
// result against Picotron's own screenshots.
function picotron() {
  palette = new Palette()

  theme = new Theme('picotron').set({
    // Neutral runs #452d32 - #5f574f - #a28879 - #c2c3c7 - #fff1e8, dark to
    // light. Paper is the top of it, toolbars one step down.
    'window.face':     palette.step('neutral', 4),
    'panel.face':      palette.step('neutral', 3),
    'panel.well':      palette.step('neutral', 4),
    'field.face':      palette.step('neutral', 4),

    // One line, not three. There is no bevel anywhere in Picotron: no
    // highlight-and-shadow pair, no second border colour. Adding one is the
    // single change that would most obviously mark this as an imitation.
    'outline':         palette.step('blue', 0),
    'bevel.light':     palette.step('blue', 0),
    'bevel.dark':      palette.step('blue', 0),

    // Lighter than the panel, not the same as it. A control is read by its
    // tone against its ground, and with no outline to fall back on a button
    // that matches the bar it sits on is simply not there - which is exactly
    // how the first render of this came out.
    //
    // Picotron's own button is the darker of its pair, #c2c3c7 on the #fff1e8
    // body; ours mostly sit on #c2c3c7 toolbars, so ours is the lighter one.
    // The rule is the step, not the direction.
    'button.face':     palette.step('neutral', 4),
    'button.hover':    palette.named('peach'),
    'button.pressed':  palette.named('purpleGrey'),
    'button.selected': palette.named('purpleGrey'),

    // Ink is the dark end of the blue ramp rather than black: Picotron's text
    // and its icon outlines are both #1d2b53, and true black is kept for the
    // window outline so the two never read as the same weight.
    'text.normal':     palette.step('blue', 1),
    'text.dim':        palette.named('purpleGrey'),
    'text.selected':   palette.step('neutral', 4),

    // The mid purple, not the light one. #bd9adf is the colour Picotron paints
    // a title bar - a large flat area - and it disappears entirely when used
    // for text on the #c2c3c7 toolbar grey, which is what a heading sits on.
    // Rendering the gallery is what showed that; it is invisible in a swatch.
    'accent':          palette.named('purple'),
    'focus':           palette.step('blue', 3),

    'good':            palette.step('green', 3),
    'warn':            palette.step('warm', 4),
    'bad':             palette.step('red', 2),

    // Title bars, which are the one place a Picotron window shows its colour.
    'title.face':      palette.named('purpleLight'),
    'title.text':      palette.step('blue', 1),

    // The one colour here that is not a palette entry, and cannot be: a scrim
    // is a compositing operation, not a colour. Solid black hides the workspace
    // completely, which defeats the point - a modal should read as out of reach
    // rather than as a different screen.
    'scrim':           color.rgb(0, 0, 0, 0.5),
    'checker.light':   palette.step('neutral', 3),
    'checker.dark':    palette.step('neutral', 2)
  }).sized({
    unit: 4,
    gutter: 2,
    pad: 3,

    // The measured numbers. A row is 12 and an icon is 7 in an 8px cell, which
    // is why the old 16px sheet could never sit in a row correctly.
    row: 12,
    bar: 12,
    tab: 12,
    tool: 12,
    icon: 8,
    swatch: 8,
    check: 9,
    scroll: 5,

    // Eight, not sixteen. The checker is measured in framebuffer pixels and
    // every one of those covers three or four screen pixels, so Aseprite's
    // 16px default lands as a 48px chessboard that reads as the subject of the
    // canvas rather than as its background.
    checker: 8,

    // A cut, not a curve: a straight 45-degree chamfer. Every window in every
    // reference measures [2, 1].
    radius: 2,

    // Controls are cut by one, not two, and are not outlined at all. Both were
    // measured off a real Picotron button: a flat #c2c3c7 fill on the #fff1e8
    // body, one pixel off each corner, and no border of any kind. A tab strip
    // measures the same way.
    //
    // This is the largest single difference between an interface that looks
    // like Picotron and one that merely uses its palette. Outlining every
    // button, cell and field - which is what this kit did - puts a black line
    // around forty things that Picotron leaves as flat tone against flat tone,
    // and the result reads as heavy and busy without any one control being
    // wrong.
    cut: 1,

    // Measured from a render of silver.ttf at 12px: caps occupy +2..+7,
    // descenders reach +9. Text is centred on the cap band rather than the em
    // box, which is what makes a row of chrome look optically centred instead
    // of merely arithmetically centred.
    capTop: 2,
    cap: 6,
    baseline: 7,
    descender: 9
  })

  // Twelve, because it is the smallest size silver.ttf is legible at.
  //
  // Picotron's own cap is 5px and its text ink 8px, which would want a 8-9px
  // face. Rendered, silver at 8, 9 and 10 is mangled - strokes drop out and
  // descenders vanish entirely - so those sizes are not a near miss, they are
  // unusable. 12 is the first size that comes back clean, and its 6px cap in a
  // 12px row is one pixel from the reference.
  //
  // This is the one measurement here that is a compromise rather than a match,
  // and it is a property of the font rather than of the design: a real 5px
  // pixel face would close the gap, and `ui.font` takes one.
  theme.native = 12

  return theme
}
