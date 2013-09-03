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


},{"../templates/templates.js":10,"reportTab":"/+NBkR"}],5:[function(require,module,exports){
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

  EconomicTab.prototype.name = 'Economic';

  EconomicTab.prototype.className = 'economic';

  EconomicTab.prototype.template = templates.economic;

  EconomicTab.prototype.dependencies = ["Closures", "OverlapWithExistingProvincialTenures"];

  EconomicTab.prototype.timeout = 60000;

  EconomicTab.prototype.render = function() {
    var context;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      closures: this.recordSet("Closures", "FisheriesClosures").toArray(),
      provincial: this.recordSet("OverlapWithExistingProvincialTenures", "ProvincialTenures").toArray()
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    return this.enableTablePaging();
  };

  return EconomicTab;

})(ReportTab);

module.exports = EconomicTab;


},{"../templates/templates.js":10,"reportTab":"/+NBkR"}],6:[function(require,module,exports){
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
    var context,
      _this = this;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      result: JSON.stringify(this.results.get('data'), null, '  '),
      habitats: this.recordSet('Habitat', 'ImportantAreas').toArray(),
      existingMPAs: this.recordSet('ExistingMarineProtectedAreas', "ExistingMarineProtectedAreas").toArray(),
      importantAreas: this.recordSet("OverlapWithImpAreas", "ProvincialTenures").toArray(),
      marxan: JSON.stringify(this.recordSet("MarxanAnalysis", "MarxanAnalysis").toArray(), null, ' '),
      marxanAnalyses: _.map(this.recordSet("MarxanAnalysis", "MarxanAnalysis").toArray(), function(f) {
        return f.NAME;
      })
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
    var chart, color, data, domain, el, i, max_q, min_q, name, q, quantiles, records, x, _i, _len;
    name = this.$('.chosen').val();
    records = this.recordSet("MarxanAnalysis", "MarxanAnalysis").toArray();
    data = _.find(records, function(record) {
      return record.NAME === name;
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
    this.$('.scenarioResults').html("The average Marxan score for this zone is " + data.SCORE + ", placing it in \nthe " + (min_q.replace('Q', '')) + "% - " + (max_q.replace('Q', '')) + "% quantile \nrange for this sub-region.");
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
      chart = d3.select(el);
      chart.selectAll("div.quantile").data(quantiles).enter().append("div").style("width", function(d) {
        return x(d.end - d.start) + 'px';
      }).style('background-color', function(d) {
        return d.bg;
      }).style('height', '10px').style('float', 'left').attr("class", function(d) {
        return "quantile";
      }).append("span").style('position', 'relative').style('top', '10px').text(function(d) {
        return d.start;
      });
      chart.selectAll("div.score").data([data.SCORE]).enter().append("div").attr("class", "score").style("left", function(d) {
        return x(d) + 'px';
      }).text(function(d) {
        return "";
      });
      return this.$('.viz').append("<p>Sub-Region Quantile Values</p>");
    }
  };

  return EnvironmentTab;

})(ReportTab);

module.exports = EnvironmentTab;


},{"../templates/templates.js":10,"reportTab":"/+NBkR"}],7:[function(require,module,exports){
var OverviewTab, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

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
    var context;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      size: this.recordSet('ZoneSize', 'ZoneSize').float('SIZE_SQ_KM', 2),
      adjacentProtectedArea: this.recordSet('TerrestrialProtectedAreas', 'TerrestrialProtectedAreas').bool('Result'),
      transmissionLines: this.recordSet("DistanceToTransmissionLines", "DistanceToTransmissionLines").float('DistInKM', 2),
      infrastructure: this.recordSet("DistanceToInfrastructure", "DistanceToInfrastructure").toArray()
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers();
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../templates/templates.js":10,"reportTab":"/+NBkR"}],"reportTab":[function(require,module,exports){
module.exports=require('/+NBkR');
},{}],9:[function(require,module,exports){
var CultureTab, EconomicTab, EnvironmentTab, OverviewTab;

OverviewTab = require('./overviewTab.coffee');

EnvironmentTab = require('./environmentTab.coffee');

EconomicTab = require('./economicTab.coffee');

CultureTab = require('./cultureTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, EnvironmentTab, EconomicTab, CultureTab]);
  return report.stylesheets(['./report.css']);
});


},{"./cultureTab.coffee":4,"./economicTab.coffee":5,"./environmentTab.coffee":6,"./overviewTab.coffee":7}],10:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["culture"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection ");if(_.s(_.f("overlap",c,p,1),c,p,0,38,46,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("emphasis");});c.pop();}_.b("\">");_.b("\n" + i);_.b("  <h4>Overlap with Historical or Archeological Sites</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);if(_.s(_.f("overlap",c,p,1),c,p,0,141,219,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    This zone overlaps with sensitive historical or archeological areas.");_.b("\n");});c.pop();}if(!_.s(_.f("overlap",c,p,1),c,p,1,0,0,"")){_.b("    This zone </strong>does not</strong> overlap with any sensitive historical or archeological areas.");_.b("\n");};_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Output</h4>");_.b("\n" + i);_.b("  <pre>");_.b(_.v(_.f("result",c,p,0)));_.b("</pre>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["economic"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Fisheries Closures</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Fisheries Closures\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("closures",c,p,1),c,p,0,330,448,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Provincial Tenures <a href=\"#\" data-toggle-node=\"51f2f5cba72ec0681606208e\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Provincial Tenures\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("provincial",c,p,1),c,p,0,1030,1148,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation <a href=\"#\" data-toggle-node=\"51f302d508dc4f5f2d00996a\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Protected Area (km²)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,338,404,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Existing Protected Areas <a href=\"#\" data-toggle-node=\"520d4c2a674659cb7b35d575\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Existing Protected Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Protected Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("existingMPAs",c,p,1),c,p,0,895,1013,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Important Marine Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Important Marine Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Important Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("importantAreas",c,p,1),c,p,0,1527,1645,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analaysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,1929,1975,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone adds <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong> to be managed");_.b("\n" + i);_.b("    for protection.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("adjacentProtectedArea",c,p,1),c,p,0,202,387,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Nearby Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    This protected area is adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Transmission Lines <a href=\"#\" data-toggle-node=\"51f6ad677bbb9b2457020f52\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is ");_.b(_.v(_.f("transmissionLines",c,p,0)));_.b(" km from the nearest transmission lines.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Distance to Infrastructure</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Infrastructure</th>");_.b("\n" + i);_.b("        <th>Distance (km)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("infrastructure",c,p,1),c,p,0,918,1004,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("DistInKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,1184,1310,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[9])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2J1cnQvV29ya2luZy9tYXBwLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9tYXBwLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy91dGlscy5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9tYXBwLXJlcG9ydHMvc2NyaXB0cy9jdWx0dXJlVGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9zY3JpcHRzL2Vjb25vbWljVGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9zY3JpcHRzL2Vudmlyb25tZW50VGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9zY3JpcHRzL292ZXJ2aWV3VGFiLmNvZmZlZSIsIi9Vc2Vycy9jYnVydC9Xb3JraW5nL21hcHAtcmVwb3J0cy9zY3JpcHRzL3JlcG9ydC5jb2ZmZWUiLCIvVXNlcnMvY2J1cnQvV29ya2luZy9tYXBwLXJlcG9ydHMvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQ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QUFoQyxDQUFKLEVBQVUsQ0FBQSxDQUFTLENBQVQ7Q0FDVCxHQUFBLE9BQUQsUUFBQTtDQTFCRixFQVdROztDQVhSOztDQUR3Qjs7QUE2QjFCLENBaENBLEVBZ0NpQixHQUFYLENBQU4sSUFoQ0E7Ozs7OztBQ0FBLElBQUEsZ0RBQUE7O0FBQUEsQ0FBQSxFQUFjLElBQUEsSUFBZCxXQUFjOztBQUNkLENBREEsRUFDaUIsSUFBQSxPQUFqQixXQUFpQjs7QUFDakIsQ0FGQSxFQUVjLElBQUEsSUFBZCxXQUFjOztBQUNkLENBSEEsRUFHYSxJQUFBLEdBQWIsV0FBYTs7QUFFYixDQUxBLEVBS1UsR0FBSixHQUFxQixLQUEzQjtDQUNFLENBQUEsRUFBQSxFQUFNLElBQU0sQ0FBQSxHQUFBO0NBRUwsS0FBRCxHQUFOLEVBQUEsR0FBbUI7Q0FISzs7OztBQ0wxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgXy5tYXAgQGRhdGEudmFsdWVbMF0uZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlldyBcbiAgICAjICAgICAgICBjYWxsIEBvcHRpb25zLnBhcmVudC5kZXN0cm95KCkgdG8gY2xvc2UgdGhlIHdob2xlIHJlcG9ydCB3aW5kb3dcbiAgICBAYXBwID0gd2luZG93LmFwcFxuICAgIF8uZXh0ZW5kIEAsIEBvcHRpb25zXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRocm93ICdyZW5kZXIgbWV0aG9kIG11c3QgYmUgb3ZlcmlkZGVuJ1xuXG4gIHNob3c6ICgpIC0+XG4gICAgQCRlbC5zaG93KClcbiAgICBAdmlzaWJsZSA9IHRydWVcblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICBzdXBlcigpXG4gIFxuICBvbkxvYWRpbmc6ICgpIC0+ICMgZXh0ZW5zaW9uIHBvaW50IGZvciBzdWJjbGFzc2VzXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgdW5sZXNzIHJlc3VsdHMgPSBAcmVzdWx0cz8uZ2V0KCdkYXRhJyk/LnJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gXy5maW5kIEBhbGxSZXN1bHRzLCAocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCduYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEBhbGxSZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgnZGF0YScpLnJlc3VsdHMsIChwYXJhbSkgLT4gXG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSlcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcbiAgICAgIFxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpICAgIFxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWIiLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuY2xhc3MgQ3VsdHVyZVRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnQ3VsdHVyZSdcbiAgY2xhc3NOYW1lOiAnY3VsdHVyZSdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5jdWx0dXJlXG4gIGRlcGVuZGVuY2llczogW1xuICAgICdBcmNoU2l0ZU92ZXJsYXAnXG4gIF1cbiAgdGltZW91dDogNjAwMDBcblxuICByZW5kZXI6ICgpIC0+XG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgb3ZlcmxhcDogQHJlY29yZFNldChcIkFyY2hTaXRlT3ZlcmxhcFwiLCBcIkFyY2hTaXRlT3ZlcmxhcFwiKS5ib29sKCdSZXN1bHQnKVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbm1vZHVsZS5leHBvcnRzID0gQ3VsdHVyZVRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEVjb25vbWljVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdFY29ub21pYydcbiAgY2xhc3NOYW1lOiAnZWNvbm9taWMnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZWNvbm9taWNcbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgXCJDbG9zdXJlc1wiXG4gICAgXCJPdmVybGFwV2l0aEV4aXN0aW5nUHJvdmluY2lhbFRlbnVyZXNcIlxuICBdXG4gIHRpbWVvdXQ6IDYwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgICMgc2V0dXAgY29udGV4dCBvYmplY3Qgd2l0aCBkYXRhIGFuZCByZW5kZXIgdGhlIHRlbXBsYXRlIGZyb20gaXRcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIGNsb3N1cmVzOiBAcmVjb3JkU2V0KFwiQ2xvc3VyZXNcIiwgXCJGaXNoZXJpZXNDbG9zdXJlc1wiKS50b0FycmF5KClcbiAgICAgIHByb3ZpbmNpYWw6IEByZWNvcmRTZXQoXCJPdmVybGFwV2l0aEV4aXN0aW5nUHJvdmluY2lhbFRlbnVyZXNcIiwgXCJQcm92aW5jaWFsVGVudXJlc1wiKS50b0FycmF5KClcbiAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuICAgIEBlbmFibGVUYWJsZVBhZ2luZygpXG5cbm1vZHVsZS5leHBvcnRzID0gRWNvbm9taWNUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5jbGFzcyBFbnZpcm9ubWVudFRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnRW52aXJvbm1lbnQnXG4gIGNsYXNzTmFtZTogJ2Vudmlyb25tZW50J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmVudmlyb25tZW50XG4gIGRlcGVuZGVuY2llczogW1xuICAgICdIYWJpdGF0J1xuICAgICdFeGlzdGluZ01hcmluZVByb3RlY3RlZEFyZWFzJ1xuICAgICdPdmVybGFwV2l0aEltcEFyZWFzJ1xuICAgICdNYXJ4YW5BbmFseXNpcydcbiAgXVxuICB0aW1lb3V0OiA2MDAwMFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICByZXN1bHQ6IEpTT04uc3RyaW5naWZ5KEByZXN1bHRzLmdldCgnZGF0YScpLCBudWxsLCAnICAnKVxuICAgICAgaGFiaXRhdHM6IEByZWNvcmRTZXQoJ0hhYml0YXQnLCAnSW1wb3J0YW50QXJlYXMnKS50b0FycmF5KClcbiAgICAgIGV4aXN0aW5nTVBBczogQHJlY29yZFNldCgnRXhpc3RpbmdNYXJpbmVQcm90ZWN0ZWRBcmVhcycsIFxuICAgICAgICBcIkV4aXN0aW5nTWFyaW5lUHJvdGVjdGVkQXJlYXNcIikudG9BcnJheSgpXG4gICAgICBpbXBvcnRhbnRBcmVhczogQHJlY29yZFNldChcIk92ZXJsYXBXaXRoSW1wQXJlYXNcIiwgXG4gICAgICAgIFwiUHJvdmluY2lhbFRlbnVyZXNcIikudG9BcnJheSgpXG4gICAgICBtYXJ4YW46IEpTT04uc3RyaW5naWZ5KFxuICAgICAgICBAcmVjb3JkU2V0KFwiTWFyeGFuQW5hbHlzaXNcIiwgXCJNYXJ4YW5BbmFseXNpc1wiKS50b0FycmF5KCksIG51bGwsICcgJylcbiAgICAgIG1hcnhhbkFuYWx5c2VzOiBfLm1hcChAcmVjb3JkU2V0KFwiTWFyeGFuQW5hbHlzaXNcIiwgXCJNYXJ4YW5BbmFseXNpc1wiKVxuICAgICAgICAudG9BcnJheSgpLCAoZikgLT4gZi5OQU1FKVxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlVGFibGVQYWdpbmcoKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcbiAgICBAJCgnLmNob3NlbicpLmNob3Nlbih7ZGlzYWJsZV9zZWFyY2hfdGhyZXNob2xkOiAxMCwgd2lkdGg6JzQwMHB4J30pXG4gICAgQCQoJy5jaG9zZW4nKS5jaGFuZ2UgKCkgPT5cbiAgICAgIF8uZGVmZXIgQHJlbmRlck1hcnhhbkFuYWx5c2lzXG4gICAgQHJlbmRlck1hcnhhbkFuYWx5c2lzKClcblxuICByZW5kZXJNYXJ4YW5BbmFseXNpczogKCkgPT5cbiAgICBuYW1lID0gQCQoJy5jaG9zZW4nKS52YWwoKVxuICAgIHJlY29yZHMgPSBAcmVjb3JkU2V0KFwiTWFyeGFuQW5hbHlzaXNcIiwgXCJNYXJ4YW5BbmFseXNpc1wiKS50b0FycmF5KClcbiAgICBkYXRhID0gXy5maW5kIHJlY29yZHMsIChyZWNvcmQpIC0+IHJlY29yZC5OQU1FIGlzIG5hbWVcbiAgICBxdWFudGlsZXMgPSBfLmZpbHRlcihfLmtleXMoZGF0YSksIChrZXkpIC0+IGtleS5pbmRleE9mKCdRJykgaXMgMClcbiAgICBmb3IgcSwgaSBpbiBxdWFudGlsZXNcbiAgICAgIGlmIHBhcnNlRmxvYXQoZGF0YVtxXSkgPiBwYXJzZUZsb2F0KGRhdGEuU0NPUkUpIG9yIGkgaXMgcXVhbnRpbGVzLmxlbmd0aCAtIDFcbiAgICAgICAgbWF4X3EgPSBxdWFudGlsZXNbaV1cbiAgICAgICAgbWluX3EgPSBxdWFudGlsZXNbaSAtIDFdIG9yIFwiUTBcIiAjIHF1YW50aWxlc1tpXVxuICAgICAgICBicmVha1xuICAgIEAkKCcuc2NlbmFyaW9SZXN1bHRzJykuaHRtbCBcIlwiXCJcbiAgICAgIFRoZSBhdmVyYWdlIE1hcnhhbiBzY29yZSBmb3IgdGhpcyB6b25lIGlzICN7ZGF0YS5TQ09SRX0sIHBsYWNpbmcgaXQgaW4gXG4gICAgICB0aGUgI3ttaW5fcS5yZXBsYWNlKCdRJywgJycpfSUgLSAje21heF9xLnJlcGxhY2UoJ1EnLCAnJyl9JSBxdWFudGlsZSBcbiAgICAgIHJhbmdlIGZvciB0aGlzIHN1Yi1yZWdpb24uXG4gICAgXCJcIlwiXG5cbiAgICBkb21haW4gPSBfLm1hcCBxdWFudGlsZXMsIChxKSAtPiBkYXRhW3FdXG4gICAgZG9tYWluLnB1c2ggMTAwXG4gICAgZG9tYWluLnVuc2hpZnQgMFxuICAgIGNvbG9yID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZG9tYWluKVxuICAgICAgLnJhbmdlKFtcIiM0N2FlNDNcIiwgXCIjNmMwXCIsIFwiI2VlMFwiLCBcIiNlYjRcIiwgXCIjZWNiYjg5XCIsIFwiI2VlYWJhMFwiXS5yZXZlcnNlKCkpXG4gICAgcXVhbnRpbGVzID0gXy5tYXAgcXVhbnRpbGVzLCAoa2V5KSAtPlxuICAgICAgbWF4ID0gcGFyc2VGbG9hdChkYXRhW2tleV0pXG4gICAgICBtaW4gID0gcGFyc2VGbG9hdChkYXRhW3F1YW50aWxlc1tfLmluZGV4T2YocXVhbnRpbGVzLCBrZXkpIC0gMV1dIG9yIDApXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGtleVxuICAgICAgICBzdGFydDogbWluXG4gICAgICAgIGVuZDogbWF4XG4gICAgICAgIGJnOiBjb2xvcigobWF4ICsgbWluKSAvIDIpXG4gICAgICB9XG4gICAgaWYgd2luZG93LmQzXG4gICAgICBAJCgnLnZpeicpLmh0bWwoJycpXG4gICAgICBlbCA9IEAkKCcudml6JylbMF1cbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCAxMDBdKVxuICAgICAgICAucmFuZ2UoWzAsIDQwMF0pICAgICAgXG4gICAgICBjaGFydCA9IGQzLnNlbGVjdChlbClcbiAgICAgIGNoYXJ0LnNlbGVjdEFsbChcImRpdi5xdWFudGlsZVwiKVxuICAgICAgICAuZGF0YShxdWFudGlsZXMpXG4gICAgICAuZW50ZXIoKS5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGQpIC0+IHgoZC5lbmQgLSBkLnN0YXJ0KSArICdweCcpXG4gICAgICAgIC5zdHlsZSgnYmFja2dyb3VuZC1jb2xvcicsIChkKSAtPiBkLmJnKVxuICAgICAgICAuc3R5bGUoJ2hlaWdodCcsICcxMHB4JylcbiAgICAgICAgLnN0eWxlKCdmbG9hdCcsICdsZWZ0JylcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCkgLT4gXCJxdWFudGlsZVwiKVxuICAgICAgICAuYXBwZW5kKFwic3BhblwiKVxuICAgICAgICAgIC5zdHlsZSgncG9zaXRpb24nLCAncmVsYXRpdmUnKVxuICAgICAgICAgIC5zdHlsZSgndG9wJywgJzEwcHgnKVxuICAgICAgICAgIC50ZXh0KChkKSAtPiBkLnN0YXJ0KVxuICAgICAgY2hhcnQuc2VsZWN0QWxsKFwiZGl2LnNjb3JlXCIpXG4gICAgICAgIC5kYXRhKFtkYXRhLlNDT1JFXSlcbiAgICAgIC5lbnRlcigpLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVcIilcbiAgICAgICAgLnN0eWxlKFwibGVmdFwiLCAoZCkgLT4geChkKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIlwiKVxuICAgICAgQCQoJy52aXonKS5hcHBlbmQgXCJcIlwiXG4gICAgICA8cD5TdWItUmVnaW9uIFF1YW50aWxlIFZhbHVlczwvcD5cbiAgICAgIFwiXCJcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudmlyb25tZW50VGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnWm9uZVNpemUnXG4gICAgJ1RlcnJlc3RyaWFsUHJvdGVjdGVkQXJlYXMnXG4gICAgJ0Rpc3RhbmNlVG9UcmFuc21pc3Npb25MaW5lcydcbiAgICAnRGlzdGFuY2VUb0luZnJhc3RydWN0dXJlJ1xuICBdXG4gIHRpbWVvdXQ6IDMwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgc2l6ZTogQHJlY29yZFNldCgnWm9uZVNpemUnLCAnWm9uZVNpemUnKS5mbG9hdCgnU0laRV9TUV9LTScsIDIpXG4gICAgICBhZGphY2VudFByb3RlY3RlZEFyZWE6IEByZWNvcmRTZXQoJ1RlcnJlc3RyaWFsUHJvdGVjdGVkQXJlYXMnLCBcbiAgICAgICAgJ1RlcnJlc3RyaWFsUHJvdGVjdGVkQXJlYXMnKS5ib29sKCdSZXN1bHQnKVxuICAgICAgdHJhbnNtaXNzaW9uTGluZXM6IEByZWNvcmRTZXQoXCJEaXN0YW5jZVRvVHJhbnNtaXNzaW9uTGluZXNcIiwgXG4gICAgICAgIFwiRGlzdGFuY2VUb1RyYW5zbWlzc2lvbkxpbmVzXCIpLmZsb2F0KCdEaXN0SW5LTScsIDIpXG4gICAgICBpbmZyYXN0cnVjdHVyZTogQHJlY29yZFNldChcIkRpc3RhbmNlVG9JbmZyYXN0cnVjdHVyZVwiLCBcbiAgICAgICAgXCJEaXN0YW5jZVRvSW5mcmFzdHJ1Y3R1cmVcIikudG9BcnJheSgpXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IE92ZXJ2aWV3VGFiIiwiT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3VGFiLmNvZmZlZSdcbkVudmlyb25tZW50VGFiID0gcmVxdWlyZSAnLi9lbnZpcm9ubWVudFRhYi5jb2ZmZWUnXG5FY29ub21pY1RhYiA9IHJlcXVpcmUgJy4vZWNvbm9taWNUYWIuY29mZmVlJ1xuQ3VsdHVyZVRhYiA9IHJlcXVpcmUgJy4vY3VsdHVyZVRhYi5jb2ZmZWUnXG5cbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW092ZXJ2aWV3VGFiLCBFbnZpcm9ubWVudFRhYiwgRWNvbm9taWNUYWIsIEN1bHR1cmVUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcmVwb3J0LmNzcyddXG4iLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImN1bHR1cmVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBcIik7aWYoXy5zKF8uZihcIm92ZXJsYXBcIixjLHAsMSksYyxwLDAsMzgsNDYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImVtcGhhc2lzXCIpO30pO2MucG9wKCk7fV8uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIEhpc3RvcmljYWwgb3IgQXJjaGVvbG9naWNhbCBTaXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwib3ZlcmxhcFwiLGMscCwxKSxjLHAsMCwxNDEsMjE5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgVGhpcyB6b25lIG92ZXJsYXBzIHdpdGggc2Vuc2l0aXZlIGhpc3RvcmljYWwgb3IgYXJjaGVvbG9naWNhbCBhcmVhcy5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwib3ZlcmxhcFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICBUaGlzIHpvbmUgPC9zdHJvbmc+ZG9lcyBub3Q8L3N0cm9uZz4gb3ZlcmxhcCB3aXRoIGFueSBzZW5zaXRpdmUgaGlzdG9yaWNhbCBvciBhcmNoZW9sb2dpY2FsIGFyZWFzLlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZGVtb1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdXRwdXQ8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHByZT5cIik7Xy5iKF8udihfLmYoXCJyZXN1bHRcIixjLHAsMCkpKTtfLmIoXCI8L3ByZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZWNvbm9taWNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIEZpc2hlcmllcyBDbG9zdXJlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IEZpc2hlcmllcyBDbG9zdXJlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VGVudXJlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjbG9zdXJlc1wiLGMscCwxKSxjLHAsMCwzMzAsNDQ4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggUHJvdmluY2lhbCBUZW51cmVzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjJmNWNiYTcyZWMwNjgxNjA2MjA4ZVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBQcm92aW5jaWFsIFRlbnVyZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlRlbnVyZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicHJvdmluY2lhbFwiLGMscCwxKSxjLHAsMCwxMDMwLDExNDgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZW52aXJvbm1lbnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdCBSZXByZXNlbnRhdGlvbiA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYzMDJkNTA4ZGM0ZjVmMmQwMDk5NmFcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlByb3RlY3RlZCBBcmVhIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwzMzgsNDA0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9OQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIEV4aXN0aW5nIFByb3RlY3RlZCBBcmVhcyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MjBkNGMyYTY3NDY1OWNiN2IzNWQ1NzVcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgRXhpc3RpbmcgUHJvdGVjdGVkIEFyZWFzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJleGlzdGluZ01QQXNcIixjLHAsMSksYyxwLDAsODk1LDEwMTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBJbXBvcnRhbnQgTWFyaW5lIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSAgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IEltcG9ydGFudCBNYXJpbmUgQXJlYXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkltcG9ydGFudCBBcmVhPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImltcG9ydGFudEFyZWFzXCIsYyxwLDEpLGMscCwwLDE1MjcsMTY0NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NYXJ4YW4gQW5hbGF5c2lzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxzZWxlY3QgY2xhc3M9XFxcImNob3NlblxcXCIgd2lkdGg9XFxcIjQwMHB4XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibWFyeGFuQW5hbHlzZXNcIixjLHAsMSksYyxwLDAsMTkyOSwxOTc1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPG9wdGlvbiB2YWx1ZT1cXFwiXCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIjwvb3B0aW9uPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3NlbGVjdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb1Jlc3VsdHNcXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9EZXNjcmlwdGlvblxcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgem9uZSBhZGRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2l6ZVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUga2lsb21ldGVyczwvc3Ryb25nPiB0byBiZSBtYW5hZ2VkXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGZvciBwcm90ZWN0aW9uLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFkamFjZW50UHJvdGVjdGVkQXJlYVwiLGMscCwxKSxjLHAsMCwyMDIsMzg3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5OZWFyYnkgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlIGdyZWVuLWNoZWNrXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyBwcm90ZWN0ZWQgYXJlYSBpcyBhZGphY2VudCB0byBhIDxzdHJvbmc+VGVycmVzdHJpYWwgUHJvdGVjdGVkIEFyZWE8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlRyYW5zbWlzc2lvbiBMaW5lcyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY2YWQ2NzdiYmI5YjI0NTcwMjBmNTJcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgem9uZSBpcyBcIik7Xy5iKF8udihfLmYoXCJ0cmFuc21pc3Npb25MaW5lc1wiLGMscCwwKSkpO18uYihcIiBrbSBmcm9tIHRoZSBuZWFyZXN0IHRyYW5zbWlzc2lvbiBsaW5lcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIHRvIEluZnJhc3RydWN0dXJlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JbmZyYXN0cnVjdHVyZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+RGlzdGFuY2UgKGttKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpbmZyYXN0cnVjdHVyZVwiLGMscCwxKSxjLHAsMCw5MTgsMTAwNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkRpc3RJbktNXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwxMTg0LDEzMTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07Il19
;