class ToolRegistry {
  constructor() {
    this.tools = {}
    this.selected = null
  }

  add(tool) {
    this.tools.set(tool.name, tool)

    if (this.selected == null) {
      this.selected = tool.name
    }

    return tool
  }

  select(name) {
    if (this.tools.has(name)) {
      this.selected = name
    }

    return this
  }

  current() { return this.tools.get(this.selected) }
  get(name) { return this.tools.get(name) }
  all()     { return this.tools.values() }
}
