import { Command } from "studio/command"
import { Dock } from "chisel/layout/dock"
import { Panel } from "chisel/widgets/panel"
import { Tabs } from "chisel/widgets/tabs"
import { Menubar } from "chisel/widgets/menubar"
import { Toolbar } from "chisel/widgets/toolbar"
import { Colorbar } from "studio/sprite/colorbar"
import { Contextbar } from "studio/sprite/contextbar"
import { Timeline } from "studio/sprite/timeline"
import { Statusbar } from "chisel/widgets/statusbar"
import { Viewport } from "studio/viewport"
import { Pencil } from "studio/sprite/tools/pencil"
import { Eraser } from "studio/sprite/tools/eraser"
import { Picker } from "studio/sprite/tools/picker"
import { Bucket } from "studio/sprite/tools/bucket"
import { Line } from "studio/sprite/tools/line"
import { Rectangle } from "studio/sprite/tools/rectangle"
import { registerSpriteCommands } from "studio/sprite/commands"

// Closure factories. Ghost cannot capture a loop variable, so anything built
// per-item in a list gets one of these.
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

function makeColourPicker(document) {
  return function (index) {
    document.foreground = index
  }
}

function makeActivator(studio) {
  return function (entry) {
    studio.activate(entry)
  }
}

// An editor is a plugin: boot() contributes to the shell, workspace() builds
// the dock for one document.
class SpriteEditor {
  constructor(studio) {
    this.studio = studio
    this.tools = ['pencil', 'eraser', 'bucket', 'line', 'rectangle', 'picker']
  }

  boot() {
    this.studio.tools.add(new Pencil())
    this.studio.tools.add(new Eraser())
    this.studio.tools.add(new Bucket())
    this.studio.tools.add(new Line())
    this.studio.tools.add(new Rectangle())
    this.studio.tools.add(new Picker())

    // One command per tool, so a menu row, a shortcut and the tool bar are all
    // the same action.
    for (name in this.tools) {
      this.studio.commands.add(
        new Command(`tool.${name}`, name).does(makeToolRunner(name))
      )
    }

    this.studio.keymap.group(['editing'], function (keys) {
      keys.bind('b', 'tool.pencil')
      keys.bind('e', 'tool.eraser')
      keys.bind('g', 'tool.bucket')
      keys.bind('l', 'tool.line')
      keys.bind('u', 'tool.rectangle')
      keys.bind('i', 'tool.picker')
    })

    registerSpriteCommands(this.studio, this)

    return this
  }

  menus() {
    return new Menubar()
      .menu('File', function (menu) {
        menu.item('sprite.new')
      })
      .menu('Edit', function (menu) {
        menu.item('history.undo')
        menu.item('history.redo')
        menu.separator()
        menu.item('app.preferences')
        menu.separator()
        menu.item('sprite.clear')
      })
      .menu('View', function (menu) {
        menu.item('view.zoomIn')
        menu.item('view.zoomOut')
        menu.item('view.zoomReset')
        menu.separator()
        menu.item('view.toggleGrid')
        menu.separator()
        menu.item('view.scaleUp')
        menu.item('view.scaleDown')
      })
      .menu('Tools', function (menu) {
        menu.item('tool.pencil')
        menu.item('tool.eraser')
        menu.item('tool.bucket')
        menu.item('tool.line')
        menu.item('tool.rectangle')
        menu.item('tool.picker')
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
    dock.top(new Contextbar(studio, document).named('context'), theme.metric('tab') + theme.metric('gutter') * 2)

    // The colour bar asks for its own width rather than being handed a guess -
    // the guess used to fit two of its four columns.
    colours = new Colorbar(document).named('colorbar').across(4)

    // Order matters: the dock carves regions in the order they are declared,
    // so the status bar is taken first to span the full width, then the
    // columns, then the timeline from what is left between them. Declaring the
    // colour bar first instead ran it to the bottom of the window, underneath
    // the timeline, and left the status bar spanning only the middle.
    dock.bottom(new Statusbar(studio).named('status'), theme.metric('row'))

    dock.left(colours, colours.widthFor(theme))
    dock.right(this.toolbar().named('tools'), theme.metric('icon') + 6)

    dock.bottom(new Timeline(document).named('timeline'), theme.metric('row') * 6)

    dock.fill(new Viewport(studio, document).named('viewport'))

    return dock
  }
}
