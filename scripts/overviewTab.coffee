ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies: [
    'ZoneSize'
    'TerrestrialProtectedAreas'
    'DistanceToTransmissionLines'
    'DistanceToInfrastructure'
  ]
  timeout: 30000

  render: () ->
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      size: @recordSet('ZoneSize', 'ZoneSize').float('SIZE_SQ_KM', 2)
      adjacentProtectedArea: @recordSet('TerrestrialProtectedAreas', 
        'TerrestrialProtectedAreas').bool('Result')
      transmissionLines: @recordSet("DistanceToTransmissionLines", 
        "DistanceToTransmissionLines").float('DistInKM', 2)
      infrastructure: @recordSet("DistanceToInfrastructure", 
        "DistanceToInfrastructure").toArray()

    @$el.html @template.render(context, templates)
    @enableLayerTogglers()

module.exports = OverviewTab