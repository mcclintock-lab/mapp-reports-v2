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
    'FisheriesEffort'
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

    fe_catch = @recordSet("FisheriesEffort", "Catch").toArray()
    @roundEffortData fe_catch
    fe_effort =  @recordSet("FisheriesEffort", "Effort").toArray()
    @roundEffortData fe_effort


    showFisheriesEffort = @canShowFisheries()
    console.log("can show fisheries: ", showFisheriesEffort)

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
      fe_catch:fe_catch
      fe_effort:fe_effort
      showFisheriesEffort:showFisheriesEffort

    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()

  canShowFisheries: () =>
    group_ids = window.app.state.get('user').getGroups(window.app.state.get('project'))
    groups = _.map group_ids,  (id) -> return window.app.groups.get(id).get('name')
    privileged = ["SeaSketch Staff", "MaPP Portal Admin"]
    for group in groups
      name = group.trim()
      if name in privileged
        return true
    return false
        
  roundEffortData: (rec_set) =>
    low_total = 0.0
    high_total = 0.0
    for rs in rec_set
      rs.TOT = Number(rs.TOT).toFixed(1)
      rs.SUB_TOT = @getNum(rs.SUB_TOT)
      rs.REG_TOT = @getNum(rs.REG_TOT)
      rs.CST_TOT = @getNum(rs.CST_TOT)

  getNum: (val) =>
    try
      if val < 0.1
        return "< 0.1"
      else
        return Number(val).toFixed(1)
    catch e
      return 0.0
    
    
module.exports = EconomicTab