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
    'MappSize'
    'ShorelineLengthToolbox'
    'AverageDepthToolbox'
  ]
  timeout: 600000

  render: () ->
    zoneType = _.find @model.getAttributes(), (attr) -> 
      attr.exportid is 'ZONE_TYPE'
    zoneType = zoneType?.value or 'smz'

    coastlineLength = @recordSet('ShorelineLengthToolbox', 'ShorelineLength').toArray()
    console.log(">>>", coastlineLength)
    sketchclass_name = @recordSet('MappSize', 'ZoneSize').raw('SC_NAME')
    sketchclass_name = sketchclass_name.replace /Zone/, "marine plan area"
    if coastlineLength?.length > 0
      coastlineLength = Number(coastlineLength[0].COAST).toFixed(1)
    else
      coastlineLength = 0


    aveDepth = @recordSet('AverageDepthToolbox', 'AverageDepth').toArray()
    minDepth = 0
    maxDepth = 0
    if aveDepth?.length > 0
      avgDepth = Number(Math.abs(parseFloat(aveDepth[0].AVG_DEPTH))).toFixed(0)
      minDepth = aveDepth[0].MIN_DEPTH
      maxDepth = aveDepth[0].MAX_DEPTH
    else
      avgDepth = 0

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes()?.length > 0
      admin: @project.isAdmin window.user
      size: @recordSet('MappSize', 'ZoneSize').float('SIZE_SQ_KM', 2)
      percent: @recordSet('MappSize', 'ZoneSize').raw('SIZE_PERC')
      coastlineLength: coastlineLength
      sc_name: sketchclass_name

      avgDepth: avgDepth
      minDepth: minDepth
      maxDepth: maxDepth
      smz: zoneType is 'smz'
      pmz: zoneType is 'pmz'

    @$el.html @template.render(context, partials)
    @enableLayerTogglers()

module.exports = OverviewTab