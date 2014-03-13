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
  ]
  timeout: 600000

  render: () ->
    zoneType = _.find @model.getAttributes(), (attr) -> 
      attr.exportid is 'ZONE_TYPE'
    zoneType = zoneType?.value or 'smz'

    sketchclass_name = @recordSet('ZoneSize', 'ZoneSize').raw('SC_NAME')
    sketchclass_name = sketchclass_name.replace /Zone/, "marine plan area"

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes()?.length > 0
      admin: @project.isAdmin window.user
      size: @recordSet('ZoneSize', 'ZoneSize').float('SIZE_SQ_KM', 2)
      percent: @recordSet('ZoneSize', 'ZoneSize').raw('SIZE_PERC')
      sc_name: sketchclass_name


      smz: zoneType is 'smz'
      pmz: zoneType is 'pmz'

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

module.exports = OverviewTab