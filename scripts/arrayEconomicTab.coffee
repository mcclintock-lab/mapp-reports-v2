ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class ArrayEconomicTab extends ReportTab
  name: 'Human Well-Being'
  className: 'economic'
  template: templates.arrayEconomic
  dependencies: [

  ]
  timeout: 600000

  render: () ->
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      array: true
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()

module.exports = ArrayEconomicTab