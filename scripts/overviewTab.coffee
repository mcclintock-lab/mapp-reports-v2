ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies: [
    'ZoneSize'
    'TerrestrialProtectedAreas'
    'DistanceToInfrastructure'
    'DistanceToTransmissionLines'
  ]
  timeout: 120000

  render: () ->
    zoneType = _.find @model.getAttributes(), (attr) -> 
      attr.exportid is 'ZONE_TYPE'
    zoneType = zoneType?.value or 'smz'
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes()?.length > 0
      admin: @project.isAdmin window.user
      size: @recordSet('ZoneSize', 'ZoneSize').float('SIZE_SQ_KM', 2)
      adjacentProtectedArea: @recordSet('TerrestrialProtectedAreas', 
        'TerrestrialProtectedAreas').bool('Result')
      transmissionLines: @recordSet("DistanceToTransmissionLines", 
        "DistanceToTransmissionLines").float('DistInKM', 2)
      infrastructure: @recordSet("DistanceToInfrastructure", 
        "DistanceToInfrastructure").toArray()
      smz: zoneType is 'smz'
      pmz: zoneType is 'pmz'

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

module.exports = OverviewTab