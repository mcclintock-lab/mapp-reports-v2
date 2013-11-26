ArrayOverviewTab = require './arrayOverviewTab.coffee'
ArrayEnvironmentTab = require './arrayEnvironmentTab.coffee'
ArrayEconomicTab = require './arrayEconomicTab.coffee'
ArrayCultureTab = require './arrayCultureTab.coffee'

window.app.registerReport (report) ->
  report.tabs [
    ArrayOverviewTab, 
    ArrayEnvironmentTab, 
    ArrayEconomicTab, 
    ArrayCultureTab
  ]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
