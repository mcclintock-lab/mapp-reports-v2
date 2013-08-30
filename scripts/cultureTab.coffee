ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class CultureTab extends ReportTab
  name: 'Culture'
  className: 'culture'
  template: templates.culture
  dependencies: [
    'ArchSiteOverlap'
  ]
  timeout: 60000

  render: () ->
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      overlap: @recordSet("ArchSiteOverlap", "ArchSiteOverlap").bool('Result')
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers()

module.exports = CultureTab