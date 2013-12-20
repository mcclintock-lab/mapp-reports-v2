ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class ArrayEnvironmentTab extends ReportTab
  name: 'Ecological Integrity'
  className: 'environment'
  template: templates.arrayEnvironment
  dependencies: [
    'OverlapWithImportantAreas'
    'OverlapWithBiogenicAndCommunityFormingSpecies'
    'OverlapWithNonFishBreedingAreas'
    'OverlapWithMarineClassifications'
    'MarxanAnalysis'
  ]
  timeout: 600000

  render: () ->
    # setup context object with data and render the template from it
    importantAreas = @recordSet("OverlapWithImportantAreas", "OverlapWithImportantAreas").toArray()
    
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      nonFishBreedingAreas: @recordSet('OverlapWithNonFishBreedingAreas', 'OverlapWithNonFishBreedingAreas').toArray()
      habitats: @recordSet('OverlapWithBiogenicAndCommunityFormingSpecies', 'OverlapWithBiogenicAndCommunityFormingSpecies').toArray()
      importantAreas: importantAreas
      
      marineClassifications: @recordSet('OverlapWithMarineClassifications', 'OverlapWithMarineClassifications').toArray()

      marxanAnalyses: _.map(@recordSet("MarxanAnalysis", "MarxanAnalysis")
        .toArray(), (f) -> f.NAME)

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
    histo = data.HISTO.slice(1, data.HISTO.length - 1).split(/\s/)
    histo = _.filter histo, (s) -> s.length > 0
    histo = _.map histo, (val) ->
      parseInt(val)
    quantiles = _.filter(_.keys(data), (key) -> key.indexOf('Q') is 0)
    for q, i in quantiles
      if parseFloat(data[q]) > parseFloat(data.SCORE) or i is quantiles.length - 1
        max_q = quantiles[i]
        min_q = quantiles[i - 1] or "Q0" # quantiles[i]
        break
    @$('.scenarioResults').html """
      The average Marxan score for this zones within this proposal is <strong>#{data.SCORE}</strong>, placing it in 
      the <strong>#{min_q.replace('Q', '')}% - #{max_q.replace('Q', '')}% quantile 
      range</strong> for this sub-region.
    """

    @$('.scenarioDescription').html data.MARX_DESC.replace('this zone ', 'zones within this proposal ')

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
        range: "#{parseInt(key.replace('Q', '')) - 20}-#{key.replace('Q', '')}%"
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



      # Histogram

      margin = 
        top: 5
        right: 20
        bottom: 30
        left: 45
      width = 400 - margin.left - margin.right
      height = 300 - margin.top - margin.bottom
      
      x = d3.scale.linear()
        .domain([0, 100])
        .range([0, width])
      y = d3.scale.linear()
        .range([height, 0])
        .domain([0, d3.max(histo)])

      xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
      yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

      svg = d3.select(@$('.viz')[0]).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(#{margin.left}, #{margin.top})")

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0,#{height})")
        .call(xAxis)
      .append("text")
        .attr("x", width / 2)
        .attr("dy", "3em")
        .style("text-anchor", "middle")
        .text("Score")

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Number of Planning Units")

      svg.selectAll(".bar")
          .data(histo)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", (d, i) -> x(i))
          .attr("width", (width / 100))
          .attr("y", (d) -> y(d))
          .attr("height", (d) -> height - y(d))
          .style 'fill', (d, i) ->
            q = _.find quantiles, (q) ->
              i >= q.start and i <= q.end
            q?.bg or "steelblue"

      svg.selectAll(".score")
          .data([Math.round(data.SCORE)])
        .enter().append("text")
        .attr("class", "score")
        .attr("x", (d) -> (x(d) - 8 )+ 'px')
        .attr("y", (d) -> (y(histo[d]) - 10) + 'px')
        .text("▼")

      svg.selectAll(".scoreText")
          .data([Math.round(data.SCORE)])
        .enter().append("text")
        .attr("class", "scoreText")
        .attr("x", (d) -> (x(d) - 6 )+ 'px')
        .attr("y", (d) -> (y(histo[d]) - 30) + 'px')
        .text((d) -> d)

      @$('.viz').append '<div class="legends"></div>'
      for quantile in quantiles
        @$('.viz .legends').append """
          <div class="legend"><span style="background-color:#{quantile.bg};">&nbsp;</span>#{quantile.range}</div>
        """
      @$('.viz').append '<br style="clear:both;">'

      @$('')

module.exports = ArrayEnvironmentTab