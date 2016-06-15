ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class CultureTab extends ReportTab
  name: 'Governance'
  className: 'culture'
  template: templates.culture
  dependencies: [
    "ExistingMarineProtectedAreas"
    "FisheriesClosures"
    "OverlapWithExistingProvincialTenures"
    'TerrestrialProtectedAreas'
  ]

  # timeout: 60000

  render: () ->
    # setup context object with data and render the template from it
    zoneType = _.find @model.getAttributes(), (attr) -> 
      attr.exportid is "ZONE_TYPE"
    zoneType = zoneType?.value or 'smz'
    provincial = @recordSet("OverlapWithExistingProvincialTenures", "ProvincialTenures").toArray()
    existingMPAs = @recordSet('ExistingMarineProtectedAreas', 
        "ExistingMarineProtectedAreas").toArray()
    hasProvincialTenures = provincial?.length > 0
    hasOverlapWithExistingMPAs = existingMPAs?.length > 0
    closures = @recordSet("FisheriesClosures", "FisheriesClosures").toArray()
    hasClosures = closures?.length > 0
    adjAreas = @recordSet('TerrestrialProtectedAreas', 
        'TerrestrialProtectedAreas').toArray()
    if adjAreas?.length > 0
      adjacentProtectedArea = @recordSet('TerrestrialProtectedAreas', 
          'TerrestrialProtectedAreas').bool('Result')
      adjacentProtectedAreaName = @recordSet('TerrestrialProtectedAreas', 
          'TerrestrialProtectedAreas').raw('RES_NAME')
      adjacentProtectedAreaDist = @recordSet('TerrestrialProtectedAreas', 
          'TerrestrialProtectedAreas').float('RES_DIST')
      
    else
      adjacentProtectedArea = false
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      # overlap: @recordSet("ArchSiteOverlap", "ArchSiteOverlap").bool('Result')
      array: @children?.length > 0
      pmz: zoneType is 'pmz'
      smz:  zoneType is 'smz'

      closures: closures
      hasClosures: hasClosures
      provincial: provincial
      hasProvincialTenures: hasProvincialTenures
      existingMPAs: existingMPAs
      hasOverlapWithExistingMPAs: hasOverlapWithExistingMPAs
      adjacentProtectedArea: adjacentProtectedArea
      adjacentProtectedAreaName: adjacentProtectedAreaName
      adjacentProtectedAreaDist: adjacentProtectedAreaDist

      
    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()

module.exports = CultureTab