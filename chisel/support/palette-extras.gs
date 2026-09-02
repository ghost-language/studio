// Confirmed colours whose ramp position no reference ever showed.
//
// Four of them are plainly a purple ramp, but its dark end has not been seen
// in any capture, so the ramp is not asserted and the colours are named
// individually instead.
//
// This is not the whole palette. An earlier version of this file said it was:
// twenty-five ramp entries plus seven here is thirty-two, which is a number
// Picotron documents, and that arithmetic looked like confirmation. It was a
// coincidence of the screenshots to hand - a later one used an orange and a
// magenta that neither list could explain. Picotron's system palette is 64, so
// this grows as references arrive, and nothing should assume it is finished.
function paletteExtras() {
  return {
    purpleDark:  '#654688',
    purple:      '#754e97',
    purpleGrey:  '#83769c',
    purpleLight: '#bd9adf',
    teal:        '#00a5a1',
    azure:       '#1c5eac',
    peach:       '#ffccaa',
    orange:      '#ff8353',
    magenta:     '#e409aa'
  }
}
