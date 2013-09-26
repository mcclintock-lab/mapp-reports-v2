ArrayOverviewTab = require './arrayOverviewTab.coffee'
ArrayEnvironmentTab = require './arrayEnvironmentTab.coffee'
EconomicTab = require './economicTab.coffee'
CultureTab = require './cultureTab.coffee'

window.app.registerReport (report) ->
  report.tabs [
    ArrayOverviewTab, 
    ArrayEnvironmentTab, 
    EconomicTab, 
    CultureTab
  ]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
