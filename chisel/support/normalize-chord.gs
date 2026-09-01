// normalizeChord sorts modifiers into one canonical order, so 'shift+ctrl+z'
// and 'ctrl+shift+z' are the same binding rather than two.
//
// A chord can also name the '+' key itself ('ctrl++'), so a trailing '+' is
// peeled off before the split rather than being eaten by it.
function normalizeChord(text) {
  lowered = text.toLowerCase()
  key = ''
  head = lowered

  if (lowered.endsWith('+') and lowered.length() > 1) {
    key = '+'
    head = lowered.slice(0, lowered.length() - 1)
  }

  parts = head.split('+')

  if (key == '') {
    key = parts.last()
  }

  chord = []

  for (name in ['ctrl', 'alt', 'shift']) {
    if (parts.contains(name)) {
      chord.push(name)
    }
  }

  chord.push(key)

  return chord.join('+')
}
