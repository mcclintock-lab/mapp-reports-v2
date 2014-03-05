ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class CultureTab extends ReportTab
  name: 'Governance'
  className: 'culture'
  template: templates.culture
  dependencies: [
    "ExistingMarineProtectedAreas"
    "Closures"
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
    closures = @recordSet("Closures", "FisheriesClosures").toArray()
    hasClosures = closures?.length > 0
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      # overlap: @recordSet("ArchSiteOverlap", "ArchSiteOverlap").bool('Result')
      array: @children?.length > 0
      pmz: !(@children?.length > 0) and zoneType is 'pmz'
      smz: !(@children?.length > 0) and zoneType is 'smz'

      closures: closures
      hasClosures: hasClosures
      provincial: provincial
      hasProvincialTenures: hasProvincialTenures
      existingMPAs: existingMPAs
      hasOverlapWithExistingMPAs: hasOverlapWithExistingMPAs
      
      adjacentProtectedArea: @recordSet('TerrestrialProtectedAreas', 
        'TerrestrialProtectedAreas').bool('Result')
      
    @$el.html @template.render(context, templates)
    @enableLayerTogglers()

module.exports = CultureTab