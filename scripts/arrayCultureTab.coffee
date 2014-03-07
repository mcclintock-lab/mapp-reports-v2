ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class ArrayCultureTab extends ReportTab
  name: 'Governance'
  className: 'culture'
  template: templates.arrayCulture
  dependencies: [
    "ExistingMarineProtectedAreas"
    "Closures"
    "OverlapWithExistingProvincialTenures"
  ]
  timeout: 600000
  render: () ->
    # setup context object with data and render the template from it
    hasPMZs = false
    hasSMZs = false
    for child in @children
      for attr in child.getAttributes()
        if attr.exportid is 'ZONE_TYPE'
          if attr.value is 'pmz'
            hasPMZs = true
          else if attr.value is 'smz'
            hasSMZs = true

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
      pmz: hasPMZs
      smz: hasSMZs
      
      closures: closures
      hasClosures: hasClosures
      provincial: provincial
      hasProvincialTenures: hasProvincialTenures
      existingMPAs: existingMPAs
      hasOverlapWithExistingMPAs: hasOverlapWithExistingMPAs

    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()


module.exports = ArrayCultureTab