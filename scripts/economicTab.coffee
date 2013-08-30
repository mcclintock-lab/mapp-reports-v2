ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class EconomicTab extends ReportTab
  name: 'Economic'
  className: 'economic'
  template: templates.economic
  dependencies: [
    "Closures"
    "OverlapWithExistingProvincialTenures"
  ]
  timeout: 60000

  render: () ->
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      closures: @recordSet("Closures", "FisheriesClosures").toArray()
      provincial: @recordSet("OverlapWithExistingProvincialTenures", "ProvincialTenures").toArray()
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()

module.exports = EconomicTab