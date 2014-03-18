ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class ArrayEconomicTab extends ReportTab
  name: 'Human Well-Being'
  className: 'economic'
  template: templates.arrayEconomic
  dependencies: [
    'OverlapWithFisheriesValues'
  ]
  timeout: 600000

  render: () ->
    fisheries = @recordSet("OverlapWithFisheriesValues", "FisheriesValues").toArray()

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      array: true
      fisheries: fisheries
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()

module.exports = ArrayEconomicTab