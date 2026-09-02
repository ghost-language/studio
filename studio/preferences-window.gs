import "ghost:math"
import { Widget } from "chisel/widget"
import { Rect } from "chisel/geometry/rect"
import { Window } from "chisel/widgets/window"
import { Label } from "chisel/widgets/label"
import { Radio } from "chisel/widgets/radio"
import { Checkbox } from "chisel/widgets/checkbox"
import { Button } from "chisel/widgets/button"

// Closure factories: Ghost cannot capture a loop variable, so anything built
// per-item in a list needs one of these.
function makeThemePick(studio) {
  return function (name) {
    studio.useTheme(name)
  }
}

function makeScale(studio, delta) {
  return function () {
    studio.theme.useScale(studio.theme.scale + delta)
    studio.preferences.set('ui.scale', studio.theme.scale)
    studio.applyPreferences()
    studio.reload()
  }
}

function makeGridToggle(studio) {
  return function (on) {
    studio.signals.emit('view.grid', on)
  }
}

// The preferences dialog: appearance first, because it is the only thing in
// here anyone opens it for.
//
// Rows are laid out by the window rather than a form layout, since a settings
// panel is a list of unrelated controls and a shared column would make the
// short ones as wide as the long ones.
class PreferencesWindow extends Widget {
  constructor(studio) {
    super.constructor('preferences-body')

    this.studio = studio
    this.rows = []

    this.themeChoice = { value: studio.theme.name }

    this.line([new Label('Theme').accent()])

    picker = makeThemePick(studio)

    this.line([
      new Radio('Ghost Dark', 'ghost.dark', this.themeChoice).on('change', picker),
      new Radio('Ghost Light', 'ghost.light', this.themeChoice).on('change', picker)
    ])

    this.line([
      new Radio('Aseprite Dark', 'aseprite.dark', this.themeChoice).on('change', picker),
      new Radio('Aseprite Classic', 'aseprite.classic', this.themeChoice).on('change', picker)
    ])

    this.line([new Label('Interface').accent()])

    this.line([
      new Label(`Scale ${studio.theme.scale}x`).dim(),
      new Button('-').on('click', makeScale(studio, -1)),
      new Button('+').on('click', makeScale(studio, 1))
    ])

    this.line([new Checkbox('Show pixel grid', false).on('change', makeGridToggle(studio))])
  }

  line(widgets) {
    this.rows.push(widgets)

    for (widget in widgets) {
      this.add(widget)
    }

    return this
  }

  // The radio group is a plain map, so a theme changed by any other route -
  // a menu, a keybinding, a restored preference - would leave the dialog
  // showing the old choice. Syncing on paint keeps it honest.
  paint(ui) {
    this.themeChoice.set('value', this.studio.theme.name)

    super.paint(ui)
  }

  arrange() {
    theme = this.studio.theme
    row = theme.metric('row')
    gap = theme.metric('gutter')
    top = this.bounds.y

    for (widgets in this.rows) {
      count = widgets.length()
      share = math.floor((this.bounds.w - gap * (count - 1)) / count)
      left = this.bounds.x

      for (widget in widgets) {
        widget.place(new Rect(left, top, share, row))

        left = left + share + gap
      }

      top = top + row + gap
    }
  }
}
