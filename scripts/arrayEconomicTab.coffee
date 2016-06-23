ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class ArrayEconomicTab extends ReportTab
  name: 'Human Well-Being'
  className: 'economic'
  template: templates.arrayEconomic
  dependencies: [
    'OverlapWithFisheriesValues'
    'InvestRecreationValue'
    'FisheriesEffort'
  ]
  timeout: 600000

  render: () ->
    fisheries = @recordSet("OverlapWithFisheriesValues", "FisheriesValues").toArray()
    try
      investAvgRecValue = @recordSet("InvestRecreationValue", "InvestRecreationValue").float('AVG_REC')
      hasInvestRecValues = true
    catch error
      hasInvestRecValues = false
      
    fe_catch = @recordSet("FisheriesEffort", "Catch").toArray()
    console.log("fe catch::: ", fe_catch)
    @roundEffortData fe_catch
    fe_effort =  @recordSet("FisheriesEffort", "Effort").toArray()
    @roundEffortData fe_effort

    showFisheriesEffort = true
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      array: true
      fisheries: fisheries
      hasInvestRecValues: hasInvestRecValues
      investAvgRecValue: investAvgRecValue
      fe_catch:fe_catch
      fe_effort:fe_effort
      showFisheriesEffort:showFisheriesEffort

    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()

  roundEffortData: (rec_set) =>
    low_total = 0.0
    high_total = 0.0
    for rs in rec_set
      rs.TOT = Number(rs.TOT).toFixed(1)
      rs.SUB_TOT = Number(rs.SUB_TOT).toFixed(1)
      rs.REG_TOT = Number(rs.REG_TOT).toFixed(1)
      rs.CST_TOT = Number(rs.CST_TOT).toFixed(1)

module.exports = ArrayEconomicTab