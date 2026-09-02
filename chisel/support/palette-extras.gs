// The seven confirmed colours whose ramp position no reference ever showed.
//
// Four of them are plainly a purple ramp, but its dark end has not been seen
// in any capture, so the ramp is not asserted and the colours are named
// individually instead. Twenty-five ramp entries plus these seven is
// thirty-two, which is the palette size Picotron documents - so the set is
// complete rather than merely as much as could be found.
function paletteExtras() {
  return {
    purpleDark:  '#654688',
    purple:      '#754e97',
    purpleGrey:  '#83769c',
    purpleLight: '#bd9adf',
    teal:        '#00a5a1',
    azure:       '#1c5eac',
    peach:       '#ffccaa'
  }
}
