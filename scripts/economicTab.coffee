ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class EconomicTab extends ReportTab
  name: 'Human Well-Being'
  className: 'economic'
  template: templates.economic
  dependencies: [
    'DistanceToInfrastructure'
    'DistanceToTransmissionLines'
    'DistanceToMarineProtectedAreas'
    'OverlapWithFisheriesValues'
    'InvestRecreationValue'
  ]
  timeout: 600000

  render: () ->
    zoneType = _.find @model.getAttributes(), (attr) -> 
      attr.exportid is 'ZONE_TYPE'

    fisheries = @recordSet("OverlapWithFisheriesValues", "FisheriesValues").toArray()
    investAvgRecValue = @recordSet("InvestRecreationValue", "InvestRecreationValue").float('AVG_REC')
    zoneType = zoneType?.value or 'smz'
    dist_to_tl = 0.0
    dist_to_inf = []
    isRenewableEnergy = false
    isTourism = false

    if zoneType is 'smz'
      dist_to_tl = @recordSet("DistanceToTransmissionLines", 
          "DistanceToTransmissionLines").float('DistInKM', 2)
      dist_to_inf = @recordSet("DistanceToInfrastructure", 
          "DistanceToInfrastructure").toArray()
      distToMPAs = @recordSet("DistanceToMarineProtectedAreas", 
          "DistanceToMarineProtectedAreas").float('DistInKM', 1)
      nearestMPA = @recordSet("DistanceToMarineProtectedAreas", 
          "DistanceToMarineProtectedAreas").raw('NEAR_NAME')
      smzType = _.find @model.getAttributes(), (attr) -> 
        attr.exportid is 'SMZtype'

      if smzType.value[0] is 'Marine Renewable Energy'
        isRenewableEnergy = true 

      if smzType.value[0] is 'Recreation & Tourism'
        isTourism = true


    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user

      array: @children?.length > 0
      pmz: !(@children?.length > 0) and zoneType is 'pmz'
      smz: !(@children?.length > 0) and zoneType is 'smz'

      transmissionLines: dist_to_tl
      infrastructure: dist_to_inf
      distToMPAs: distToMPAs
      nearestMPA: nearestMPA
      isRenewableEnergy: isRenewableEnergy
      isTourism: isTourism
      fisheries: fisheries
      investAvgRecValue: investAvgRecValue

    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()

module.exports = EconomicTab