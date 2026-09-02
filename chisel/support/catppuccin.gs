// Catppuccin, exactly as published.
//
// The Aseprite references are themed with it - the file in them is even called
// catppuccin.ase - and they arrived as lossy WebP: thirty thousand colours in a
// screenshot of an interface that uses about thirty. Nothing can be measured
// out of that the way Picotron's palette was measured, because the damage is
// not a function: the same true colour comes back differently depending on what
// surrounds it.
//
// It does not have to be measured. Catppuccin's values are published, and five
// of them survive the compression at distance nought - #1e1e2e, #eff1f5,
// #dce0e8, #fe640b, #a6e3a1 - with the rest landing within 1 to 3. That is not
// a guess that happens to fit; it is a known answer read off a damaged copy,
// and the identification is what was uncertain rather than the values.
//
// Both flavours carry the same twenty-six names, which is the point of them: a
// theme written against the names swaps light for dark by swapping the map.
function catppuccinMocha() {
  return {
    rosewater: '#f5e0dc', flamingo: '#f2cdcd', pink:     '#f5c2e7',
    mauve:     '#cba6f7', red:      '#f38ba8', maroon:   '#eba0ac',
    peach:     '#fab387', yellow:   '#f9e2af', green:    '#a6e3a1',
    teal:      '#94e2d5', sky:      '#89dceb', sapphire: '#74c7ec',
    blue:      '#89b4fa', lavender: '#b4befe',

    // Six greys from the text down to the darkest ground. Every surface in the
    // interface is one of these, which is why the whole thing holds together.
    text:      '#cdd6f4', subtext1: '#bac2de', subtext0: '#a6adc8',
    overlay2:  '#9399b2', overlay1: '#7f849c', overlay0: '#6c7086',
    surface2:  '#585b70', surface1: '#45475a', surface0: '#313244',
    base:      '#1e1e2e', mantle:   '#181825', crust:    '#11111b'
  }
}

function catppuccinLatte() {
  return {
    rosewater: '#dc8a78', flamingo: '#dd7878', pink:     '#ea76cb',
    mauve:     '#8839ef', red:      '#d20f39', maroon:   '#e64553',
    peach:     '#fe640b', yellow:   '#df8e1d', green:    '#40a02b',
    teal:      '#179299', sky:      '#04a5e5', sapphire: '#209fb5',
    blue:      '#1e66f5', lavender: '#7287fd',

    // Latte runs the greys the other way: `text` is the darkest and `crust` the
    // lightest, so a theme written against the names inverts correctly without
    // knowing which flavour it has.
    text:      '#4c4f69', subtext1: '#5c5f77', subtext0: '#6c6f85',
    overlay2:  '#7c7f93', overlay1: '#8c8fa1', overlay0: '#9ca0b0',
    surface2:  '#acb0be', surface1: '#bcc0cc', surface0: '#ccd0da',
    base:      '#eff1f5', mantle:   '#e6e9ef', crust:    '#dce0e8'
  }
}
