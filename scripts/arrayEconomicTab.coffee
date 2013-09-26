ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class ArrayEconomicTab extends ReportTab
  name: 'Economy'
  className: 'economic'
  template: templates.economic
  dependencies: [
    "Closures"
    "OverlapWithExistingProvincialTenures"
  ]
  timeout: 600000

  render: () ->
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      closures: @recordSet("Closures", "FisheriesClosures").toArray()
      provincial: @recordSet("OverlapWithExistingProvincialTenures", "ProvincialTenures").toArray()
      array: true
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()

module.exports = ArrayEconomicTab