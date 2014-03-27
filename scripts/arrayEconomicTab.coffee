ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class ArrayEconomicTab extends ReportTab
  name: 'Human Well-Being'
  className: 'economic'
  template: templates.arrayEconomic
  dependencies: [
    'OverlapWithFisheriesValues',
    'InvestRecreationValue'
  ]
  timeout: 600000

  render: () ->
    fisheries = @recordSet("OverlapWithFisheriesValues", "FisheriesValues").toArray()
    try
      investAvgRecValue = @recordSet("InvestRecreationValue", "InvestRecreationValue").float('AVG_REC')
      hasInvestRecValues = true
    catch error
      hasInvestRecValues = false
      
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      array: true
      fisheries: fisheries
      hasInvestRecValues: hasInvestRecValues
      investAvgRecValue: investAvgRecValue
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @enableTablePaging()

module.exports = ArrayEconomicTab