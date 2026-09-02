// Picotron's thirty-two colours, and the structure behind them.
//
// The interesting discovery is not the list, it is the shape: the palette is
// five ramps of five, each running dark to light, with PICO-8's original
// sixteen scattered through them. That was read off a palette-file thumbnail
// in a reference screenshot; docs/picotron.md records how, and which eight
// entries were recovered from a colour-shifted capture rather than an exact
// one.
//
// This is data and nothing else, in its own file with no `lumen:` import, so
// the tests can actually reach it. Every bug in this project that survived to
// a real run lived in a file the test runner could not execute.
function paletteRamps() {
  return {
    red:     ['#7e2553', '#bd003e', '#ff004d', '#ff77a8', '#ffacc5'],
    warm:    ['#762a2a', '#ab5236', '#e46e00', '#ffa300', '#ffec27'],
    neutral: ['#452d32', '#5f574f', '#a28879', '#c2c3c7', '#fff1e8'],
    green:   ['#12535e', '#008751', '#00b453', '#00e436', '#97f145'],
    blue:    ['#000000', '#1d2b53', '#2766b4', '#29adff', '#66dff1']
  }
}
