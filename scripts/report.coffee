OverviewTab = require './overviewTab.coffee'
EnvironmentTab = require './environmentTab.coffee'
EconomicTab = require './economicTab.coffee'
CultureTab = require './cultureTab.coffee'

window.app.registerReport (report) ->
  report.tabs [OverviewTab, EnvironmentTab, EconomicTab, CultureTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
