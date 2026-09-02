import "lumen:color"
import { Theme } from "chisel/theme"

// Ghost — the dark theme, and the default.
//
// Cyberpunk rather than grey: near-black grounds with a violet cast, a neon
// purple for anything selected, and cyan reserved for focus so the two never
// compete. Ghost in the Shell's palette is mostly darkness with a few lit
// signs in it, which is also what an editor wants — the artwork should be the
// brightest thing on screen, and chrome that glows fights it.
//
// The saturated trio comes from somewhere else entirely: Mario's red, Luigi's
// green and a coin's gold, which are the three most legible "stop / go /
// careful" colours ever chosen and cost nothing to borrow.
function ghostDark() {
  return new Theme('ghost.dark').set({
    'window.face':     color.hex('#14121c'),
    'panel.face':      color.hex('#1e1b2b'),
    'panel.well':      color.hex('#0c0a12'),
    'field.face':      color.hex('#100e18'),

    // The three lines every frame is built from.
    'outline':         color.hex('#07060b'),
    'bevel.light':     color.hex('#3a3450'),
    'bevel.dark':      color.hex('#15121e'),

    'button.face':     color.hex('#2c2740'),
    'button.hover':    color.hex('#332c4a'),
    'button.pressed':  color.hex('#1a1725'),
    'button.selected': color.hex('#7c5cff'),

    'text.normal':     color.hex('#e9e6f5'),
    'text.dim':        color.hex('#8b85a8'),
    'text.selected':   color.hex('#ffffff'),

    'accent':          color.hex('#b388ff'),
    'focus':           color.hex('#22d3ee'),

    'good':            color.hex('#43b047'),
    'warn':            color.hex('#fbd000'),
    'bad':             color.hex('#e52521'),

    // The checkerboard stays near-neutral on purpose: tint it violet and every
    // colour the artist picks reads wrong against it.
    'scrim':           color.rgb(8, 6, 14, 0.66),
    'checker.light':   color.hex('#5c5866'),
    'checker.dark':    color.hex('#494553')
  })
}
