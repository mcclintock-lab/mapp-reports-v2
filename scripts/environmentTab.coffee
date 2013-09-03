ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class EnvironmentTab extends ReportTab
  name: 'Environment'
  className: 'environment'
  template: templates.environment
  dependencies: [
    'Habitat'
    'ExistingMarineProtectedAreas'
    'OverlapWithImpAreas'
    'MarxanAnalysis'
  ]
  timeout: 60000

  render: () ->
    zoneType = _.find @model.getAttributes(), (attr) -> 
      attr.exportid is 'ZONE_TYPE'
    zoneType = zoneType?.value or 'smz'
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      result: JSON.stringify(@results.get('data'), null, '  ')
      habitats: @recordSet('Habitat', 'ImportantAreas').toArray()
      existingMPAs: @recordSet('ExistingMarineProtectedAreas', 
        "ExistingMarineProtectedAreas").toArray()
      importantAreas: @recordSet("OverlapWithImpAreas", 
        "ProvincialTenures").toArray()
      marxanAnalyses: _.map(@recordSet("MarxanAnalysis", "MarxanAnalysis")
        .toArray(), (f) -> f.NAME)
      smz: zoneType is 'smz'
      pmz: zoneType is 'pmz'

    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @enableLayerTogglers()
    @$('.chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.chosen').change () =>
      _.defer @renderMarxanAnalysis
    @renderMarxanAnalysis()

  renderMarxanAnalysis: () =>
    name = @$('.chosen').val()
    records = @recordSet("MarxanAnalysis", "MarxanAnalysis").toArray()
    data = _.find records, (record) -> record.NAME is name
    quantiles = _.filter(_.keys(data), (key) -> key.indexOf('Q') is 0)
    for q, i in quantiles
      if parseFloat(data[q]) > parseFloat(data.SCORE) or i is quantiles.length - 1
        max_q = quantiles[i]
        min_q = quantiles[i - 1] or "Q0" # quantiles[i]
        break
    @$('.scenarioResults').html """
      The average Marxan score for this zone is #{data.SCORE}, placing it in 
      the #{min_q.replace('Q', '')}% - #{max_q.replace('Q', '')}% quantile 
      range for this sub-region.
    """

    @$('.scenarioDescription').html data.MARX_DESC

    domain = _.map quantiles, (q) -> data[q]
    domain.push 100
    domain.unshift 0
    color = d3.scale.linear()
      .domain(domain)
      .range(["#47ae43", "#6c0", "#ee0", "#eb4", "#ecbb89", "#eeaba0"].reverse())
    quantiles = _.map quantiles, (key) ->
      max = parseFloat(data[key])
      min  = parseFloat(data[quantiles[_.indexOf(quantiles, key) - 1]] or 0)
      {
        name: key
        start: min
        end: max
        bg: color((max + min) / 2)
      }
    if window.d3
      @$('.viz').html('')
      el = @$('.viz')[0]
      x = d3.scale.linear()
        .domain([0, 100])
        .range([0, 400])      
      chart = d3.select(el)
      chart.selectAll("div.quantile")
        .data(quantiles)
      .enter().append("div")
        .style("width", (d) -> x(d.end - d.start) + 'px')
        .style('background-color', (d) -> d.bg)
        .style('height', '10px')
        .style('float', 'left')
        .attr("class", (d) -> "quantile")
        .append("span")
          .style('position', 'relative')
          .style('top', '10px')
          .text((d) -> d.start)
      chart.selectAll("div.score")
        .data([data.SCORE])
      .enter().append("div")
        .attr("class", "score")
        .style("left", (d) -> x(d) + 'px')
        .text((d) -> "")
      @$('.viz').append """
      <p>Sub-Region Quantile Values</p>
      """

module.exports = EnvironmentTab