import { Command } from "studio/command"
import { Dock } from "chisel/layout/dock"
import { Panel } from "chisel/widgets/panel"
import { Tabs } from "chisel/widgets/tabs"
import { Menubar } from "chisel/widgets/menubar"
import { Toolbar } from "chisel/widgets/toolbar"
import { Swatches } from "chisel/widgets/swatches"
import { Statusbar } from "chisel/widgets/statusbar"
import { Viewport } from "studio/viewport"
import { Stamp } from "studio/map/tools/stamp"
import { Rubber } from "studio/map/tools/rubber"
import { Tilemap } from "studio/map/tilemap"

function makeToolRunner(name) {
  return function (studio) {
    studio.tools.select(name)
    studio.say(name)
  }
}

function makeToolPicker(studio) {
  return function (name) {
    studio.tools.select(name)
  }
}

function makeBrushPicker(document) {
  return function (index) {
    document.brush = index
  }
}

function makeActivator(studio) {
  return function (entry) {
    studio.activate(entry)
  }
}

// The same shell, a different document. Everything the pixel editor and this
// one have in common lives one layer down and is not duplicated here: the dock,
// the viewport, undo, the keymap, the status bar.
class MapEditor {
  constructor(studio) {
    this.studio = studio
    this.tools = ['stamp', 'rubber']
  }

  boot() {
    this.studio.tools.add(new Stamp())
    this.studio.tools.add(new Rubber())

    for (name in this.tools) {
      this.studio.commands.add(
        new Command(`tool.${name}`, name).does(makeToolRunner(name))
      )
    }

    self = this

    this.studio.commands.add(new Command('map.new', 'New Map')
      .does(function (studio) {
        map = new Tilemap(24, 16, 16)
        map.title = `Map-${studio.documents.length() + 1}`

        studio.open(map, self)
        studio.say('New 24 x 16 map')
      }))

    this.studio.keymap.group(['editing'], function (keys) {
      keys.bind('s', 'tool.stamp')
      keys.bind('x', 'tool.rubber')
      keys.bind('ctrl+m', 'map.new')
    })

    return this
  }

  menus() {
    return new Menubar()
      .menu('File', function (menu) {
        menu.item('map.new')
      })
      .menu('Edit', function (menu) {
        menu.item('history.undo')
        menu.item('history.redo')
        menu.separator()
        menu.item('app.preferences')
      })
      .menu('View', function (menu) {
        menu.item('view.zoomIn')
        menu.item('view.zoomOut')
        menu.item('view.zoomReset')
        menu.separator()
        menu.item('view.toggleGrid')
      })
      .menu('Tools', function (menu) {
        menu.item('tool.stamp')
        menu.item('tool.rubber')
      })
  }

  tabs() {
    built = new Tabs()

    for (entry in this.studio.documents) {
      built.tab(entry.document.title, entry)
    }

    for (index = 0; index < this.studio.documents.length(); index++) {
      if (this.studio.documents[index].document == this.studio.document) {
        built.index = index
      }
    }

    return built.on('change', makeActivator(this.studio))
  }

  toolbar() {
    built = new Toolbar()

    for (name in this.tools) {
      tool = this.studio.tools.get(name)

      built.tool(tool.name, tool.label, tool.key)
    }

    return built
      .select(this.studio.tools.selected)
      .on('change', makeToolPicker(this.studio))
  }

  workspace(document) {
    studio = this.studio
    theme = studio.theme

    dock = new Dock()

    dock.top(this.menus().named('menubar'), theme.metric('bar'))
    dock.top(this.tabs().named('tabs'), theme.metric('tab'))
    dock.top(new Panel('Grid 16   Snap   Layer: ground').named('context'), theme.metric('bar'))

    tiles = new Swatches(document.palette)
      .named('tileset')
      .across(4)
      .on('pick', makeBrushPicker(document))

    dock.left(tiles, tiles.widthFor(theme))

    dock.right(this.toolbar().named('tools'), theme.metric('tool') + 8)

    dock.bottom(new Statusbar(studio).named('status'), theme.metric('row'))
    dock.bottom(new Panel('Layers: ground · objects · collision').named('layers'), theme.metric('row') * 3)

    dock.fill(new Viewport(studio, document).named('viewport'))

    return dock
  }
}
