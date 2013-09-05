require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(el) {
  var $el, $toggler, app, e, node, nodeid, toc, toggler, togglers, view, _i, _len, _ref;
  $el = $(el);
  app = window.app;
  toc = app.getToc();
  if (!toc) {
    console.log('No table of contents found');
    return;
  }
  togglers = $el.find('a[data-toggle-node]');
  _ref = togglers.toArray();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    nodeid = $toggler.data('toggle-node');
    try {
      view = toc.getChildViewById(nodeid);
      node = view.model;
      $toggler.attr('data-visible', !!node.get('visible'));
      $toggler.data('tocItem', view);
    } catch (_error) {
      e = _error;
      $toggler.attr('data-not-found', 'true');
    }
  }
  return togglers.on('click', function(e) {
    e.preventDefault();
    $el = $(e.target);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $el.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],"/+NBkR":[function(require,module,exports){
var RecordSet, ReportTab, enableLayerTogglers, round, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

RecordSet = (function() {
  function RecordSet(data) {
    this.data = data;
  }

  RecordSet.prototype.toArray = function() {
    return _.map(this.data.value[0].features, function(feature) {
      return feature.attributes;
    });
  };

  RecordSet.prototype.raw = function(attr) {
    var attrs;
    attrs = _.map(this.toArray(), function(row) {
      return row[attr];
    });
    attrs = _.filter(attrs, function(attr) {
      return attr !== void 0;
    });
    if (attrs.length === 0) {
      throw "Could not get attribute " + attr;
    } else if (attrs.length === 1) {
      return attrs[0];
    } else {
      return attrs;
    }
  };

  RecordSet.prototype.int = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, parseInt);
    } else {
      return parseInt(raw);
    }
  };

  RecordSet.prototype.float = function(attr, decimalPlaces) {
    var raw;
    if (decimalPlaces == null) {
      decimalPlaces = 2;
    }
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return round(val, decimalPlaces);
      });
    } else {
      return round(raw, decimalPlaces);
    }
  };

  RecordSet.prototype.bool = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return val.toString().toLowerCase() === 'true';
      });
    } else {
      return raw.toString().toLowerCase() === 'true';
    }
  };

  return RecordSet;

})();

ReportTab = (function(_super) {
  __extends(ReportTab, _super);

  function ReportTab() {
    this.remove = __bind(this.remove, this);
    _ref = ReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ReportTab.prototype.name = 'Information';

  ReportTab.prototype.dependencies = [];

  ReportTab.prototype.initialize = function(model, options) {
    this.model = model;
    this.options = options;
    this.app = window.app;
    return _.extend(this, this.options);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    this.$el.show();
    return this.visible = true;
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.onLoading = function() {};

  ReportTab.prototype.getResult = function(id) {
    var result, results;
    results = this.getResults();
    result = _.find(results, function(r) {
      return r.paramName === id;
    });
    if (result == null) {
      throw new Error('No result with id ' + id);
    }
    return result.value;
  };

  ReportTab.prototype.getFirstResult = function(param, id) {
    var e, result;
    result = this.getResult(param);
    try {
      return result[0].features[0].attributes[id];
    } catch (_error) {
      e = _error;
      throw "Error finding " + param + ":" + id + " in gp results";
    }
  };

  ReportTab.prototype.getResults = function() {
    var results, _ref1, _ref2;
    if (!(results = (_ref1 = this.results) != null ? (_ref2 = _ref1.get('data')) != null ? _ref2.results : void 0 : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref3;
      return (_ref3 = result.paramName) !== 'ResultCode' && _ref3 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName) {
    var dep, param;
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = _.find(this.allResults, function(result) {
      return result.get('name') === dependency;
    });
    if (!dep) {
      console.log(this.allResults);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('data').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param);
  };

  ReportTab.prototype.enableTablePaging = function() {
    return this.$('[data-paging]').each(function() {
      var $table, i, noRowsMessage, pageSize, pages, parent, rows, ul, _i, _len, _ref1;
      $table = $(this);
      pageSize = $table.data('paging');
      rows = $table.find('tbody tr').length;
      pages = Math.ceil(rows / pageSize);
      if (pages > 1) {
        $table.append("<tfoot>\n  <tr>\n    <td colspan=\"" + ($table.find('thead th').length) + "\">\n      <div class=\"pagination\">\n        <ul>\n          <li><a href=\"#\">Prev</a></li>\n        </ul>\n      </div>\n    </td>\n  </tr>\n</tfoot>");
        ul = $table.find('tfoot ul');
        _ref1 = _.range(1, pages + 1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          ul.append("<li><a href=\"#\">" + i + "</a></li>");
        }
        ul.append("<li><a href=\"#\">Next</a></li>");
        $table.find('li a').click(function(e) {
          var $a, a, n, offset, text;
          e.preventDefault();
          $a = $(this);
          text = $a.text();
          if (text === 'Next') {
            a = $a.parent().parent().find('.active').next().find('a');
            if (a.text() !== 'Next') {
              return a.click();
            }
          } else if (text === 'Prev') {
            a = $a.parent().parent().find('.active').prev().find('a');
            if (a.text() !== 'Prev') {
              return a.click();
            }
          } else {
            $a.parent().parent().find('.active').removeClass('active');
            $a.parent().addClass('active');
            n = parseInt(text);
            $table.find('tbody tr').hide();
            offset = pageSize * (n - 1);
            return $table.find("tbody tr").slice(offset, n * pageSize).show();
          }
        });
        $($table.find('li a')[1]).click();
      }
      if (noRowsMessage = $table.data('no-rows')) {
        if (rows === 0) {
          parent = $table.parent();
          $table.remove();
          parent.removeClass('tableContainer');
          return parent.append("<p>" + noRowsMessage + "</p>");
        }
      }
    });
  };

  ReportTab.prototype.enableLayerTogglers = function() {
    return enableLayerTogglers(this.$el);
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"./enableLayerTogglers.coffee":1,"./utils.coffee":3}],3:[function(require,module,exports){
module.exports = {
  round: function(number, decimalPlaces) {
    var multiplier;
    if (!_.isNumber(number)) {
      number = parseFloat(number);
    }
    multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }
};


},{}],4:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,81,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.rp("attributes/attributeItem",c,p,"    "));});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}],5:[function(require,module,exports){
var CultureTab, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

CultureTab = (function(_super) {
  __extends(CultureTab, _super);

  function CultureTab() {
    _ref = CultureTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  CultureTab.prototype.name = 'Culture';

  CultureTab.prototype.className = 'culture';

  CultureTab.prototype.template = templates.culture;

  CultureTab.prototype.dependencies = ['ArchSiteOverlap'];

  CultureTab.prototype.timeout = 60000;

  CultureTab.prototype.render = function() {
    var context;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      overlap: this.recordSet("ArchSiteOverlap", "ArchSiteOverlap").bool('Result')
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers();
  };

  return CultureTab;

})(ReportTab);

module.exports = CultureTab;


},{"../templates/templates.js":10,"reportTab":"/+NBkR"}],6:[function(require,module,exports){
var EconomicTab, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

EconomicTab = (function(_super) {
  __extends(EconomicTab, _super);

  function EconomicTab() {
    _ref = EconomicTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EconomicTab.prototype.name = 'Economy';

  EconomicTab.prototype.className = 'economic';

  EconomicTab.prototype.template = templates.economic;

  EconomicTab.prototype.dependencies = ["Closures", "OverlapWithExistingProvincialTenures"];

  EconomicTab.prototype.timeout = 60000;

  EconomicTab.prototype.render = function() {
    var context, zoneType;
    zoneType = _.find(this.model.getAttributes(), function(attr) {
      return attr.exportid === 'ZONE_TYPE';
    });
    zoneType = (zoneType != null ? zoneType.value : void 0) || 'smz';
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      closures: this.recordSet("Closures", "FisheriesClosures").toArray(),
      provincial: this.recordSet("OverlapWithExistingProvincialTenures", "ProvincialTenures").toArray(),
      smz: zoneType === 'smz',
      pmz: zoneType === 'pmz'
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    return this.enableTablePaging();
  };

  return EconomicTab;

})(ReportTab);

module.exports = EconomicTab;


},{"../templates/templates.js":10,"reportTab":"/+NBkR"}],7:[function(require,module,exports){
var EnvironmentTab, ReportTab, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

EnvironmentTab = (function(_super) {
  __extends(EnvironmentTab, _super);

  function EnvironmentTab() {
    this.renderMarxanAnalysis = __bind(this.renderMarxanAnalysis, this);
    _ref = EnvironmentTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EnvironmentTab.prototype.name = 'Environment';

  EnvironmentTab.prototype.className = 'environment';

  EnvironmentTab.prototype.template = templates.environment;

  EnvironmentTab.prototype.dependencies = ['Habitat', 'ExistingMarineProtectedAreas', 'OverlapWithImpAreas', 'MarxanAnalysis'];

  EnvironmentTab.prototype.timeout = 60000;

  EnvironmentTab.prototype.render = function() {
    var context, zoneType,
      _this = this;
    zoneType = _.find(this.model.getAttributes(), function(attr) {
      return attr.exportid === 'ZONE_TYPE';
    });
    zoneType = (zoneType != null ? zoneType.value : void 0) || 'smz';
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      result: JSON.stringify(this.results.get('data'), null, '  '),
      habitats: this.recordSet('Habitat', 'ImportantAreas').toArray(),
      existingMPAs: this.recordSet('ExistingMarineProtectedAreas', "ExistingMarineProtectedAreas").toArray(),
      importantAreas: this.recordSet("OverlapWithImpAreas", "ProvincialTenures").toArray(),
      marxanAnalyses: _.map(this.recordSet("MarxanAnalysis", "MarxanAnalysis").toArray(), function(f) {
        return f.NAME;
      }),
      smz: zoneType === 'smz',
      pmz: zoneType === 'pmz'
    };
    this.$el.html(this.template.render(context, templates));
    this.enableTablePaging();
    this.enableLayerTogglers();
    this.$('.chosen').chosen({
      disable_search_threshold: 10,
      width: '400px'
    });
    this.$('.chosen').change(function() {
      return _.defer(_this.renderMarxanAnalysis);
    });
    return this.renderMarxanAnalysis();
  };

  EnvironmentTab.prototype.renderMarxanAnalysis = function() {
    var color, data, domain, el, height, histo, i, margin, max_q, min_q, name, q, quantile, quantiles, records, svg, width, x, xAxis, y, yAxis, _i, _j, _len, _len1;
    name = this.$('.chosen').val();
    records = this.recordSet("MarxanAnalysis", "MarxanAnalysis").toArray();
    data = _.find(records, function(record) {
      return record.NAME === name;
    });
    histo = data.HISTO.slice(1, data.HISTO.length - 1).split(/\s/);
    histo = _.filter(histo, function(s) {
      return s.length > 0;
    });
    histo = _.map(histo, function(val) {
      return parseInt(val);
    });
    quantiles = _.filter(_.keys(data), function(key) {
      return key.indexOf('Q') === 0;
    });
    for (i = _i = 0, _len = quantiles.length; _i < _len; i = ++_i) {
      q = quantiles[i];
      if (parseFloat(data[q]) > parseFloat(data.SCORE) || i === quantiles.length - 1) {
        max_q = quantiles[i];
        min_q = quantiles[i - 1] || "Q0";
        break;
      }
    }
    this.$('.scenarioResults').html("The average Marxan score for this zone is <strong>" + data.SCORE + "</strong>, placing it in \nthe <strong>" + (min_q.replace('Q', '')) + "% - " + (max_q.replace('Q', '')) + "% quantile \nrange</strong> for this sub-region.");
    this.$('.scenarioDescription').html(data.MARX_DESC);
    domain = _.map(quantiles, function(q) {
      return data[q];
    });
    domain.push(100);
    domain.unshift(0);
    color = d3.scale.linear().domain(domain).range(["#47ae43", "#6c0", "#ee0", "#eb4", "#ecbb89", "#eeaba0"].reverse());
    quantiles = _.map(quantiles, function(key) {
      var max, min;
      max = parseFloat(data[key]);
      min = parseFloat(data[quantiles[_.indexOf(quantiles, key) - 1]] || 0);
      return {
        range: "" + (parseInt(key.replace('Q', '')) - 20) + "-" + (key.replace('Q', '')) + "%",
        name: key,
        start: min,
        end: max,
        bg: color((max + min) / 2)
      };
    });
    if (window.d3) {
      this.$('.viz').html('');
      el = this.$('.viz')[0];
      x = d3.scale.linear().domain([0, 100]).range([0, 400]);
      margin = {
        top: 5,
        right: 20,
        bottom: 30,
        left: 45
      };
      width = 400 - margin.left - margin.right;
      height = 300 - margin.top - margin.bottom;
      x = d3.scale.linear().domain([0, 100]).range([0, width]);
      y = d3.scale.linear().range([height, 0]).domain([0, d3.max(histo)]);
      xAxis = d3.svg.axis().scale(x).orient("bottom");
      yAxis = d3.svg.axis().scale(y).orient("left");
      svg = d3.select(this.$('.viz')[0]).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("x", width / 2).attr("dy", "3em").style("text-anchor", "middle").text("Score");
      svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("Number of Planning Units");
      svg.selectAll(".bar").data(histo).enter().append("rect").attr("class", "bar").attr("x", function(d, i) {
        return x(i);
      }).attr("width", width / 100).attr("y", function(d) {
        return y(d);
      }).attr("height", function(d) {
        return height - y(d);
      }).style('fill', function(d, i) {
        q = _.find(quantiles, function(q) {
          return i >= q.start && i <= q.end;
        });
        return (q != null ? q.bg : void 0) || "steelblue";
      });
      svg.selectAll(".score").data([Math.round(data.SCORE)]).enter().append("text").attr("class", "score").attr("x", function(d) {
        return (x(d) - 8) + 'px';
      }).attr("y", function(d) {
        return (y(histo[d]) - 10) + 'px';
      }).text("▼");
      svg.selectAll(".scoreText").data([Math.round(data.SCORE)]).enter().append("text").attr("class", "scoreText").attr("x", function(d) {
        return (x(d) - 6) + 'px';
      }).attr("y", function(d) {
        return (y(histo[d]) - 30) + 'px';
      }).text(function(d) {
        return d;
      });
      this.$('.viz').append('<div class="legends"></div>');
      for (_j = 0, _len1 = quantiles.length; _j < _len1; _j++) {
        quantile = quantiles[_j];
        this.$('.viz .legends').append("<div class=\"legend\"><span style=\"background-color:" + quantile.bg + ";\">&nbsp;</span>" + quantile.range + "</div>");
      }
      return this.$('.viz').append('<br style="clear:both;">');
    }
  };

  return EnvironmentTab;

})(ReportTab);

module.exports = EnvironmentTab;


},{"../templates/templates.js":10,"reportTab":"/+NBkR"}],8:[function(require,module,exports){
var OverviewTab, ReportTab, key, partials, templates, val, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Overview';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.dependencies = ['ZoneSize', 'TerrestrialProtectedAreas', 'DistanceToTransmissionLines', 'DistanceToInfrastructure'];

  OverviewTab.prototype.timeout = 30000;

  OverviewTab.prototype.render = function() {
    var context, zoneType;
    zoneType = _.find(this.model.getAttributes(), function(attr) {
      return attr.exportid === 'ZONE_TYPE';
    });
    zoneType = (zoneType != null ? zoneType.value : void 0) || 'smz';
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      size: this.recordSet('ZoneSize', 'ZoneSize').float('SIZE_SQ_KM', 2),
      adjacentProtectedArea: this.recordSet('TerrestrialProtectedAreas', 'TerrestrialProtectedAreas').bool('Result'),
      transmissionLines: this.recordSet("DistanceToTransmissionLines", "DistanceToTransmissionLines").float('DistInKM', 2),
      infrastructure: this.recordSet("DistanceToInfrastructure", "DistanceToInfrastructure").toArray(),
      smz: zoneType === 'smz',
      pmz: zoneType === 'pmz'
    };
    this.$el.html(this.template.render(context, partials));
    return this.enableLayerTogglers();
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":4,"../templates/templates.js":10,"reportTab":"/+NBkR"}],9:[function(require,module,exports){
var CultureTab, EconomicTab, EnvironmentTab, OverviewTab;

OverviewTab = require('./overviewTab.coffee');

EnvironmentTab = require('./environmentTab.coffee');

EconomicTab = require('./economicTab.coffee');

CultureTab = require('./cultureTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, EnvironmentTab, EconomicTab, CultureTab]);
  return report.stylesheets(['./report.css']);
});


},{"./cultureTab.coffee":5,"./economicTab.coffee":6,"./environmentTab.coffee":7,"./overviewTab.coffee":8}],10:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["culture"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection ");if(_.s(_.f("overlap",c,p,1),c,p,0,38,46,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("emphasis");});c.pop();}_.b("\">");_.b("\n" + i);_.b("  <h4>Overlap with Historical or Archeological Sites</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);if(_.s(_.f("overlap",c,p,1),c,p,0,141,219,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This zone overlaps with sensitive historical or archeological areas.");_.b("\n");});c.pop();}if(!_.s(_.f("overlap",c,p,1),c,p,1,0,0,"")){_.b("    This zone </strong>does not</strong> overlap with any sensitive historical or archeological areas.");_.b("\n");};_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Output</h4>");_.b("\n" + i);_.b("  <pre>");_.b(_.v(_.f("result",c,p,0)));_.b("</pre>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["economic"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("pmz",c,p,1),c,p,0,8,614,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Fisheries Closures</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Fisheries Closures\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("closures",c,p,1),c,p,0,339,457,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Provincial Tenures <a href=\"#\" data-toggle-node=\"51f2f5cba72ec0681606208e\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Provincial Tenures\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("provincial",c,p,1),c,p,0,1048,1166,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("pmz",c,p,1),c,p,0,8,467,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation <!-- <a href=\"#\" data-toggle-node=\"51f302d508dc4f5f2d00996a\" data-visible=\"false\">show layer</a> --></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Protected Area (km²)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,356,422,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Existing Protected Areas <a href=\"#\" data-toggle-node=\"520d4c2a674659cb7b35d575\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Existing Protected Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Protected Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("existingMPAs",c,p,1),c,p,0,922,1040,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Important Marine Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Important Marine Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Important Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("importantAreas",c,p,1),c,p,0,1554,1672,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,1955,2001,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("adjacentProtectedArea",c,p,1),c,p,0,167,342,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Nearby Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    This zone is adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(!_.s(_.f("pmz",c,p,1),c,p,1,0,0,"")){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Transmission Lines <a href=\"#\" data-toggle-node=\"51f6ad677bbb9b2457020f52\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is ");_.b(_.v(_.f("transmissionLines",c,p,0)));_.b(" km from the nearest transmission lines.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Distance to Infrastructure</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Infrastructure</th>");_.b("\n" + i);_.b("        <th>Distance (km)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("infrastructure",c,p,1),c,p,0,882,968,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("DistInKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n");};_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,1157,1283,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}],"reportTab":[function(require,module,exports){
module.exports=require('/+NBkR');
},{}]},{},[9])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2J1cnQvV29ya2luZy9tYXBwLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9tYXBwLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy91dGlscy5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9tYXBwLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9tYXBwLXJlcG9ydHMvc2NyaXB0cy9jdWx0dXJlVGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9zY3JpcHRzL2Vjb25vbWljVGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9zY3JpcHRzL2Vudmlyb25tZW50VGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9zY3JpcHRzL292ZXJ2aWV3VGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9zY3JpcHRzL3JlcG9ydC5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9tYXBwLXJlcG9ydHMvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFB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UTs7Q0FYUjs7Q0FEd0I7O0FBa0MxQixDQXpDQSxFQXlDaUIsR0FBWCxDQUFOLElBekNBOzs7O0FDQUEsSUFBQSxnREFBQTs7QUFBQSxDQUFBLEVBQWMsSUFBQSxJQUFkLFdBQWM7O0FBQ2QsQ0FEQSxFQUNpQixJQUFBLE9BQWpCLFdBQWlCOztBQUNqQixDQUZBLEVBRWMsSUFBQSxJQUFkLFdBQWM7O0FBQ2QsQ0FIQSxFQUdhLElBQUEsR0FBYixXQUFhOztBQUViLENBTEEsRUFLVSxHQUFKLEdBQXFCLEtBQTNCO0NBQ0UsQ0FBQSxFQUFBLEVBQU0sSUFBTSxDQUFBLEdBQUE7Q0FFTCxLQUFELEdBQU4sRUFBQSxHQUFtQjtDQUhLOzs7O0FDTDFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBfLm1hcCBAZGF0YS52YWx1ZVswXS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3IFxuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHN1cGVyKClcbiAgXG4gIG9uTG9hZGluZzogKCkgLT4gIyBleHRlbnNpb24gcG9pbnQgZm9yIHN1YmNsYXNzZXNcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICB1bmxlc3MgcmVzdWx0cyA9IEByZXN1bHRzPy5nZXQoJ2RhdGEnKT8ucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBfLmZpbmQgQGFsbFJlc3VsdHMsIChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ25hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQGFsbFJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdkYXRhJykucmVzdWx0cywgKHBhcmFtKSAtPiBcbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHBhcmFtICN7cGFyYW1OYW1lfSBpbiAje2RlcGVuZGVuY3l9XCJcbiAgICBuZXcgUmVjb3JkU2V0KHBhcmFtKVxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuICAgICAgXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KCkgICAgXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCw4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIixjLHAsXCIgICAgXCIpKTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvZ2VuZXJpY0F0dHJpYnV0ZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTsiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5jbGFzcyBDdWx0dXJlVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdDdWx0dXJlJ1xuICBjbGFzc05hbWU6ICdjdWx0dXJlJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmN1bHR1cmVcbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ0FyY2hTaXRlT3ZlcmxhcCdcbiAgXVxuICB0aW1lb3V0OiA2MDAwMFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBvdmVybGFwOiBAcmVjb3JkU2V0KFwiQXJjaFNpdGVPdmVybGFwXCIsIFwiQXJjaFNpdGVPdmVybGFwXCIpLmJvb2woJ1Jlc3VsdCcpXG4gICAgXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxubW9kdWxlLmV4cG9ydHMgPSBDdWx0dXJlVGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuY2xhc3MgRWNvbm9taWNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0Vjb25vbXknXG4gIGNsYXNzTmFtZTogJ2Vjb25vbWljJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmVjb25vbWljXG4gIGRlcGVuZGVuY2llczogW1xuICAgIFwiQ2xvc3VyZXNcIlxuICAgIFwiT3ZlcmxhcFdpdGhFeGlzdGluZ1Byb3ZpbmNpYWxUZW51cmVzXCJcbiAgXVxuICB0aW1lb3V0OiA2MDAwMFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB6b25lVHlwZSA9IF8uZmluZCBAbW9kZWwuZ2V0QXR0cmlidXRlcygpLCAoYXR0cikgLT4gXG4gICAgICBhdHRyLmV4cG9ydGlkIGlzICdaT05FX1RZUEUnXG4gICAgem9uZVR5cGUgPSB6b25lVHlwZT8udmFsdWUgb3IgJ3NteidcbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBjbG9zdXJlczogQHJlY29yZFNldChcIkNsb3N1cmVzXCIsIFwiRmlzaGVyaWVzQ2xvc3VyZXNcIikudG9BcnJheSgpXG4gICAgICBwcm92aW5jaWFsOiBAcmVjb3JkU2V0KFwiT3ZlcmxhcFdpdGhFeGlzdGluZ1Byb3ZpbmNpYWxUZW51cmVzXCIsIFwiUHJvdmluY2lhbFRlbnVyZXNcIikudG9BcnJheSgpXG4gICAgICBzbXo6IHpvbmVUeXBlIGlzICdzbXonXG4gICAgICBwbXo6IHpvbmVUeXBlIGlzICdwbXonXG4gICAgXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcbiAgICBAZW5hYmxlVGFibGVQYWdpbmcoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVjb25vbWljVGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuY2xhc3MgRW52aXJvbm1lbnRUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0Vudmlyb25tZW50J1xuICBjbGFzc05hbWU6ICdlbnZpcm9ubWVudCdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5lbnZpcm9ubWVudFxuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnSGFiaXRhdCdcbiAgICAnRXhpc3RpbmdNYXJpbmVQcm90ZWN0ZWRBcmVhcydcbiAgICAnT3ZlcmxhcFdpdGhJbXBBcmVhcydcbiAgICAnTWFyeGFuQW5hbHlzaXMnXG4gIF1cbiAgdGltZW91dDogNjAwMDBcblxuICByZW5kZXI6ICgpIC0+XG4gICAgem9uZVR5cGUgPSBfLmZpbmQgQG1vZGVsLmdldEF0dHJpYnV0ZXMoKSwgKGF0dHIpIC0+IFxuICAgICAgYXR0ci5leHBvcnRpZCBpcyAnWk9ORV9UWVBFJ1xuICAgIHpvbmVUeXBlID0gem9uZVR5cGU/LnZhbHVlIG9yICdzbXonXG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgcmVzdWx0OiBKU09OLnN0cmluZ2lmeShAcmVzdWx0cy5nZXQoJ2RhdGEnKSwgbnVsbCwgJyAgJylcbiAgICAgIGhhYml0YXRzOiBAcmVjb3JkU2V0KCdIYWJpdGF0JywgJ0ltcG9ydGFudEFyZWFzJykudG9BcnJheSgpXG4gICAgICBleGlzdGluZ01QQXM6IEByZWNvcmRTZXQoJ0V4aXN0aW5nTWFyaW5lUHJvdGVjdGVkQXJlYXMnLCBcbiAgICAgICAgXCJFeGlzdGluZ01hcmluZVByb3RlY3RlZEFyZWFzXCIpLnRvQXJyYXkoKVxuICAgICAgaW1wb3J0YW50QXJlYXM6IEByZWNvcmRTZXQoXCJPdmVybGFwV2l0aEltcEFyZWFzXCIsIFxuICAgICAgICBcIlByb3ZpbmNpYWxUZW51cmVzXCIpLnRvQXJyYXkoKVxuICAgICAgbWFyeGFuQW5hbHlzZXM6IF8ubWFwKEByZWNvcmRTZXQoXCJNYXJ4YW5BbmFseXNpc1wiLCBcIk1hcnhhbkFuYWx5c2lzXCIpXG4gICAgICAgIC50b0FycmF5KCksIChmKSAtPiBmLk5BTUUpXG4gICAgICBzbXo6IHpvbmVUeXBlIGlzICdzbXonXG4gICAgICBwbXo6IHpvbmVUeXBlIGlzICdwbXonXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZVRhYmxlUGFnaW5nKClcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG4gICAgQCQoJy5jaG9zZW4nKS5jaG9zZW4oe2Rpc2FibGVfc2VhcmNoX3RocmVzaG9sZDogMTAsIHdpZHRoOic0MDBweCd9KVxuICAgIEAkKCcuY2hvc2VuJykuY2hhbmdlICgpID0+XG4gICAgICBfLmRlZmVyIEByZW5kZXJNYXJ4YW5BbmFseXNpc1xuICAgIEByZW5kZXJNYXJ4YW5BbmFseXNpcygpXG5cbiAgcmVuZGVyTWFyeGFuQW5hbHlzaXM6ICgpID0+XG4gICAgbmFtZSA9IEAkKCcuY2hvc2VuJykudmFsKClcbiAgICByZWNvcmRzID0gQHJlY29yZFNldChcIk1hcnhhbkFuYWx5c2lzXCIsIFwiTWFyeGFuQW5hbHlzaXNcIikudG9BcnJheSgpXG4gICAgZGF0YSA9IF8uZmluZCByZWNvcmRzLCAocmVjb3JkKSAtPiByZWNvcmQuTkFNRSBpcyBuYW1lXG4gICAgaGlzdG8gPSBkYXRhLkhJU1RPLnNsaWNlKDEsIGRhdGEuSElTVE8ubGVuZ3RoIC0gMSkuc3BsaXQoL1xccy8pXG4gICAgaGlzdG8gPSBfLmZpbHRlciBoaXN0bywgKHMpIC0+IHMubGVuZ3RoID4gMFxuICAgIGhpc3RvID0gXy5tYXAgaGlzdG8sICh2YWwpIC0+XG4gICAgICBwYXJzZUludCh2YWwpXG4gICAgcXVhbnRpbGVzID0gXy5maWx0ZXIoXy5rZXlzKGRhdGEpLCAoa2V5KSAtPiBrZXkuaW5kZXhPZignUScpIGlzIDApXG4gICAgZm9yIHEsIGkgaW4gcXVhbnRpbGVzXG4gICAgICBpZiBwYXJzZUZsb2F0KGRhdGFbcV0pID4gcGFyc2VGbG9hdChkYXRhLlNDT1JFKSBvciBpIGlzIHF1YW50aWxlcy5sZW5ndGggLSAxXG4gICAgICAgIG1heF9xID0gcXVhbnRpbGVzW2ldXG4gICAgICAgIG1pbl9xID0gcXVhbnRpbGVzW2kgLSAxXSBvciBcIlEwXCIgIyBxdWFudGlsZXNbaV1cbiAgICAgICAgYnJlYWtcbiAgICBAJCgnLnNjZW5hcmlvUmVzdWx0cycpLmh0bWwgXCJcIlwiXG4gICAgICBUaGUgYXZlcmFnZSBNYXJ4YW4gc2NvcmUgZm9yIHRoaXMgem9uZSBpcyA8c3Ryb25nPiN7ZGF0YS5TQ09SRX08L3N0cm9uZz4sIHBsYWNpbmcgaXQgaW4gXG4gICAgICB0aGUgPHN0cm9uZz4je21pbl9xLnJlcGxhY2UoJ1EnLCAnJyl9JSAtICN7bWF4X3EucmVwbGFjZSgnUScsICcnKX0lIHF1YW50aWxlIFxuICAgICAgcmFuZ2U8L3N0cm9uZz4gZm9yIHRoaXMgc3ViLXJlZ2lvbi5cbiAgICBcIlwiXCJcblxuICAgIEAkKCcuc2NlbmFyaW9EZXNjcmlwdGlvbicpLmh0bWwgZGF0YS5NQVJYX0RFU0NcblxuICAgIGRvbWFpbiA9IF8ubWFwIHF1YW50aWxlcywgKHEpIC0+IGRhdGFbcV1cbiAgICBkb21haW4ucHVzaCAxMDBcbiAgICBkb21haW4udW5zaGlmdCAwXG4gICAgY29sb3IgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkb21haW4pXG4gICAgICAucmFuZ2UoW1wiIzQ3YWU0M1wiLCBcIiM2YzBcIiwgXCIjZWUwXCIsIFwiI2ViNFwiLCBcIiNlY2JiODlcIiwgXCIjZWVhYmEwXCJdLnJldmVyc2UoKSlcbiAgICBxdWFudGlsZXMgPSBfLm1hcCBxdWFudGlsZXMsIChrZXkpIC0+XG4gICAgICBtYXggPSBwYXJzZUZsb2F0KGRhdGFba2V5XSlcbiAgICAgIG1pbiAgPSBwYXJzZUZsb2F0KGRhdGFbcXVhbnRpbGVzW18uaW5kZXhPZihxdWFudGlsZXMsIGtleSkgLSAxXV0gb3IgMClcbiAgICAgIHtcbiAgICAgICAgcmFuZ2U6IFwiI3twYXJzZUludChrZXkucmVwbGFjZSgnUScsICcnKSkgLSAyMH0tI3trZXkucmVwbGFjZSgnUScsICcnKX0lXCJcbiAgICAgICAgbmFtZToga2V5XG4gICAgICAgIHN0YXJ0OiBtaW5cbiAgICAgICAgZW5kOiBtYXhcbiAgICAgICAgYmc6IGNvbG9yKChtYXggKyBtaW4pIC8gMilcbiAgICAgIH1cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIEAkKCcudml6JykuaHRtbCgnJylcbiAgICAgIGVsID0gQCQoJy52aXonKVswXVxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIDEwMF0pXG4gICAgICAgIC5yYW5nZShbMCwgNDAwXSkgICAgICBcblxuXG5cbiAgICAgICMgSGlzdG9ncmFtXG5cbiAgICAgIG1hcmdpbiA9IFxuICAgICAgICB0b3A6IDVcbiAgICAgICAgcmlnaHQ6IDIwXG4gICAgICAgIGJvdHRvbTogMzBcbiAgICAgICAgbGVmdDogNDVcbiAgICAgIHdpZHRoID0gNDAwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHRcbiAgICAgIGhlaWdodCA9IDMwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tXG4gICAgICBcbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCAxMDBdKVxuICAgICAgICAucmFuZ2UoWzAsIHdpZHRoXSlcbiAgICAgIHkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pXG4gICAgICAgIC5kb21haW4oWzAsIGQzLm1heChoaXN0byldKVxuXG4gICAgICB4QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLnNjYWxlKHgpXG4gICAgICAgIC5vcmllbnQoXCJib3R0b21cIilcbiAgICAgIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeSlcbiAgICAgICAgLm9yaWVudChcImxlZnRcIilcblxuICAgICAgc3ZnID0gZDMuc2VsZWN0KEAkKCcudml6JylbMF0pLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoI3ttYXJnaW4ubGVmdH0sICN7bWFyZ2luLnRvcH0pXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwje2hlaWdodH0pXCIpXG4gICAgICAgIC5jYWxsKHhBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC8gMilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjNlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAudGV4dChcIlNjb3JlXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcbiAgICAgICAgLmNhbGwoeUF4aXMpXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCA2KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQoXCJOdW1iZXIgb2YgUGxhbm5pbmcgVW5pdHNcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5iYXJcIilcbiAgICAgICAgICAuZGF0YShoaXN0bylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXJcIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgKGQsIGkpIC0+IHgoaSkpXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAod2lkdGggLyAxMDApKVxuICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geShkKSlcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCAoZCkgLT4gaGVpZ2h0IC0geShkKSlcbiAgICAgICAgICAuc3R5bGUgJ2ZpbGwnLCAoZCwgaSkgLT5cbiAgICAgICAgICAgIHEgPSBfLmZpbmQgcXVhbnRpbGVzLCAocSkgLT5cbiAgICAgICAgICAgICAgaSA+PSBxLnN0YXJ0IGFuZCBpIDw9IHEuZW5kXG4gICAgICAgICAgICBxPy5iZyBvciBcInN0ZWVsYmx1ZVwiXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChkYXRhLlNDT1JFKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlXCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSA4ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkoaGlzdG9bZF0pIC0gMTApICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5zY29yZVRleHRcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChkYXRhLlNDT1JFKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlVGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gNiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KGhpc3RvW2RdKSAtIDMwKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBkKVxuXG4gICAgICBAJCgnLnZpeicpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48L2Rpdj4nXG4gICAgICBmb3IgcXVhbnRpbGUgaW4gcXVhbnRpbGVzXG4gICAgICAgIEAkKCcudml6IC5sZWdlbmRzJykuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJsZWdlbmRcIj48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6I3txdWFudGlsZS5iZ307XCI+Jm5ic3A7PC9zcGFuPiN7cXVhbnRpbGUucmFuZ2V9PC9kaXY+XG4gICAgICAgIFwiXCJcIlxuICAgICAgQCQoJy52aXonKS5hcHBlbmQgJzxiciBzdHlsZT1cImNsZWFyOmJvdGg7XCI+J1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVudmlyb25tZW50VGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnWm9uZVNpemUnXG4gICAgJ1RlcnJlc3RyaWFsUHJvdGVjdGVkQXJlYXMnXG4gICAgJ0Rpc3RhbmNlVG9UcmFuc21pc3Npb25MaW5lcydcbiAgICAnRGlzdGFuY2VUb0luZnJhc3RydWN0dXJlJ1xuICBdXG4gIHRpbWVvdXQ6IDMwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHpvbmVUeXBlID0gXy5maW5kIEBtb2RlbC5nZXRBdHRyaWJ1dGVzKCksIChhdHRyKSAtPiBcbiAgICAgIGF0dHIuZXhwb3J0aWQgaXMgJ1pPTkVfVFlQRSdcbiAgICB6b25lVHlwZSA9IHpvbmVUeXBlPy52YWx1ZSBvciAnc216J1xuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgc2l6ZTogQHJlY29yZFNldCgnWm9uZVNpemUnLCAnWm9uZVNpemUnKS5mbG9hdCgnU0laRV9TUV9LTScsIDIpXG4gICAgICBhZGphY2VudFByb3RlY3RlZEFyZWE6IEByZWNvcmRTZXQoJ1RlcnJlc3RyaWFsUHJvdGVjdGVkQXJlYXMnLCBcbiAgICAgICAgJ1RlcnJlc3RyaWFsUHJvdGVjdGVkQXJlYXMnKS5ib29sKCdSZXN1bHQnKVxuICAgICAgdHJhbnNtaXNzaW9uTGluZXM6IEByZWNvcmRTZXQoXCJEaXN0YW5jZVRvVHJhbnNtaXNzaW9uTGluZXNcIiwgXG4gICAgICAgIFwiRGlzdGFuY2VUb1RyYW5zbWlzc2lvbkxpbmVzXCIpLmZsb2F0KCdEaXN0SW5LTScsIDIpXG4gICAgICBpbmZyYXN0cnVjdHVyZTogQHJlY29yZFNldChcIkRpc3RhbmNlVG9JbmZyYXN0cnVjdHVyZVwiLCBcbiAgICAgICAgXCJEaXN0YW5jZVRvSW5mcmFzdHJ1Y3R1cmVcIikudG9BcnJheSgpXG4gICAgICBzbXo6IHpvbmVUeXBlIGlzICdzbXonXG4gICAgICBwbXo6IHpvbmVUeXBlIGlzICdwbXonXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcnZpZXdUYWIiLCJPdmVydmlld1RhYiA9IHJlcXVpcmUgJy4vb3ZlcnZpZXdUYWIuY29mZmVlJ1xuRW52aXJvbm1lbnRUYWIgPSByZXF1aXJlICcuL2Vudmlyb25tZW50VGFiLmNvZmZlZSdcbkVjb25vbWljVGFiID0gcmVxdWlyZSAnLi9lY29ub21pY1RhYi5jb2ZmZWUnXG5DdWx0dXJlVGFiID0gcmVxdWlyZSAnLi9jdWx0dXJlVGFiLmNvZmZlZSdcblxud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbT3ZlcnZpZXdUYWIsIEVudmlyb25tZW50VGFiLCBFY29ub21pY1RhYiwgQ3VsdHVyZVRhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9yZXBvcnQuY3NzJ11cbiIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiY3VsdHVyZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIFwiKTtpZihfLnMoXy5mKFwib3ZlcmxhcFwiLGMscCwxKSxjLHAsMCwzOCw0NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiZW1waGFzaXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggSGlzdG9yaWNhbCBvciBBcmNoZW9sb2dpY2FsIFNpdGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJvdmVybGFwXCIsYyxwLDEpLGMscCwwLDE0MSwyMTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICBUaGlzIHpvbmUgb3ZlcmxhcHMgd2l0aCBzZW5zaXRpdmUgaGlzdG9yaWNhbCBvciBhcmNoZW9sb2dpY2FsIGFyZWFzLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJvdmVybGFwXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgIFRoaXMgem9uZSA8L3N0cm9uZz5kb2VzIG5vdDwvc3Ryb25nPiBvdmVybGFwIHdpdGggYW55IHNlbnNpdGl2ZSBoaXN0b3JpY2FsIG9yIGFyY2hlb2xvZ2ljYWwgYXJlYXMuXCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJkZW1vXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk91dHB1dDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cHJlPlwiKTtfLmIoXy52KF8uZihcInJlc3VsdFwiLGMscCwwKSkpO18uYihcIjwvcHJlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJlY29ub21pY1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwicG16XCIsYyxwLDEpLGMscCwwLDgsNjE0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggRmlzaGVyaWVzIENsb3N1cmVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgRmlzaGVyaWVzIENsb3N1cmVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5UZW51cmVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNsb3N1cmVzXCIsYyxwLDEpLGMscCwwLDMzOSw0NTcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIFByb3ZpbmNpYWwgVGVudXJlcyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYyZjVjYmE3MmVjMDY4MTYwNjIwOGVcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgUHJvdmluY2lhbCBUZW51cmVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5UZW51cmVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInByb3ZpbmNpYWxcIixjLHAsMSksYyxwLDAsMTA0OCwxMTY2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImVudmlyb25tZW50XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmYoXCJwbXpcIixjLHAsMSksYyxwLDAsOCw0NjcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXQgUmVwcmVzZW50YXRpb24gPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYzMDJkNTA4ZGM0ZjVmMmQwMDk5NmFcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+IC0tPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYSAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFiaXRhdHNcIixjLHAsMSksYyxwLDAsMzU2LDQyMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIEV4aXN0aW5nIFByb3RlY3RlZCBBcmVhcyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MjBkNGMyYTY3NDY1OWNiN2IzNWQ1NzVcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgRXhpc3RpbmcgUHJvdGVjdGVkIEFyZWFzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJleGlzdGluZ01QQXNcIixjLHAsMSksYyxwLDAsOTIyLDEwNDAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBJbXBvcnRhbnQgTWFyaW5lIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSAgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IEltcG9ydGFudCBNYXJpbmUgQXJlYXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkltcG9ydGFudCBBcmVhPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImltcG9ydGFudEFyZWFzXCIsYyxwLDEpLGMscCwwLDE1NTQsMTY3MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NYXJ4YW4gQW5hbHlzaXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHNlbGVjdCBjbGFzcz1cXFwiY2hvc2VuXFxcIiB3aWR0aD1cXFwiNDAwcHhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJ4YW5BbmFseXNlc1wiLGMscCwxKSxjLHAsMCwxOTU1LDIwMDEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8b3B0aW9uIHZhbHVlPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiPC9vcHRpb24+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvc2VsZWN0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvUmVzdWx0c1xcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb0Rlc2NyaXB0aW9uXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2l6ZVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUga2lsb21ldGVyczwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhZGphY2VudFByb3RlY3RlZEFyZWFcIixjLHAsMSksYyxwLDAsMTY3LDM0MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TmVhcmJ5IEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZSBncmVlbi1jaGVja1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgem9uZSBpcyBhZGphY2VudCB0byBhIDxzdHJvbmc+VGVycmVzdHJpYWwgUHJvdGVjdGVkIEFyZWE8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwicG16XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VHJhbnNtaXNzaW9uIExpbmVzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjZhZDY3N2JiYjliMjQ1NzAyMGY1MlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIFwiKTtfLmIoXy52KF8uZihcInRyYW5zbWlzc2lvbkxpbmVzXCIsYyxwLDApKSk7Xy5iKFwiIGttIGZyb20gdGhlIG5lYXJlc3QgdHJhbnNtaXNzaW9uIGxpbmVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGlzdGFuY2UgdG8gSW5mcmFzdHJ1Y3R1cmU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkluZnJhc3RydWN0dXJlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5EaXN0YW5jZSAoa20pPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImluZnJhc3RydWN0dXJlXCIsYyxwLDEpLGMscCwwLDg4Miw5NjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJEaXN0SW5LTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDExNTcsMTI4MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTsiXX0=
;