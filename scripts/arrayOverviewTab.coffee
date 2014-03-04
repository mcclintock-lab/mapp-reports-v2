ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class ArrayOverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.arrayOverview
  dependencies: [
    'ZoneSize'
  ]
  timeout: 600000

  render: () ->

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      size: @recordSet('ZoneSize', 'ZoneSize').float('SIZE_SQ_KM', 2)
      percent: @recordSet('ZoneSize', 'ZoneSize').float('SIZE_PERC', 1)
      sc_name: @recordSet('ZoneSize', 'ZoneSize').raw('SC_NAME')
      numChildren: @children.length

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()
    nodes = [@model]
    @model.set 'open', true
    nodes = nodes.concat @children
    for node in nodes
      node.set 'selected', false
    TableOfContents = window.require('views/tableOfContents')
    @toc = new TableOfContents(nodes)
    @$('.tocContainer').append @toc.el
    @toc.render()

  remove: () ->
    @toc?.remove()
    super()


module.exports = ArrayOverviewTab