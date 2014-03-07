require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
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


},{}],3:[function(require,module,exports){
var JobItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JobItem = (function(_super) {
  __extends(JobItem, _super);

  JobItem.prototype.className = 'reportResult';

  JobItem.prototype.events = {};

  JobItem.prototype.bindings = {
    "h6 a": {
      observe: "serviceName",
      updateView: true,
      attributes: [
        {
          name: 'href',
          observe: 'serviceUrl'
        }
      ]
    },
    ".startedAt": {
      observe: ["startedAt", "status"],
      visible: function() {
        var _ref;
        return (_ref = this.model.get('status')) !== 'complete' && _ref !== 'error';
      },
      updateView: true,
      onGet: function() {
        if (this.model.get('startedAt')) {
          return "Started " + moment(this.model.get('startedAt')).fromNow() + ". ";
        } else {
          return "";
        }
      }
    },
    ".status": {
      observe: "status",
      onGet: function(s) {
        switch (s) {
          case 'pending':
            return "waiting in line";
          case 'running':
            return "running analytical service";
          case 'complete':
            return "completed";
          case 'error':
            return "an error occurred";
          default:
            return s;
        }
      }
    },
    ".queueLength": {
      observe: "queueLength",
      onGet: function(v) {
        var s;
        s = "Waiting behind " + v + " job";
        if (v.length > 1) {
          s += 's';
        }
        return s + ". ";
      },
      visible: function(v) {
        return (v != null) && parseInt(v) > 0;
      }
    },
    ".errors": {
      observe: 'error',
      updateView: true,
      visible: function(v) {
        return (v != null ? v.length : void 0) > 2;
      },
      onGet: function(v) {
        if (v != null) {
          return JSON.stringify(v, null, '  ');
        } else {
          return null;
        }
      }
    }
  };

  function JobItem(model) {
    this.model = model;
    JobItem.__super__.constructor.call(this);
  }

  JobItem.prototype.render = function() {
    this.$el.html("<h6><a href=\"#\" target=\"_blank\"></a><span class=\"status\"></span></h6>\n<div>\n  <span class=\"startedAt\"></span>\n  <span class=\"queueLength\"></span>\n  <pre class=\"errors\"></pre>\n</div>");
    return this.stickit();
  };

  return JobItem;

})(Backbone.View);

module.exports = JobItem;


},{}],4:[function(require,module,exports){
var ReportResults,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportResults = (function(_super) {
  __extends(ReportResults, _super);

  ReportResults.prototype.defaultPollingInterval = 3000;

  function ReportResults(sketch, deps) {
    var url;
    this.sketch = sketch;
    this.deps = deps;
    this.poll = __bind(this.poll, this);
    this.url = url = "/reports/" + this.sketch.id + "/" + (this.deps.join(','));
    ReportResults.__super__.constructor.call(this);
  }

  ReportResults.prototype.poll = function() {
    var _this = this;
    return this.fetch({
      success: function() {
        var problem, result, _i, _len, _ref, _ref1;
        _this.trigger('jobs');
        _ref = _this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          if ((_ref1 = result.get('status')) !== 'complete' && _ref1 !== 'error') {
            if (!_this.interval) {
              _this.interval = setInterval(_this.poll, _this.defaultPollingInterval);
            }
            return;
          }
        }
        if (_this.interval) {
          window.clearInterval(_this.interval);
        }
        if (problem = _.find(_this.models, function(r) {
          return r.get('error') != null;
        })) {
          return _this.trigger('error', "Problem with " + (problem.get('serviceName')) + " job");
        } else {
          return _this.trigger('finished');
        }
      },
      error: function(e, res, a, b) {
        var json, _ref, _ref1;
        if (res.status !== 0) {
          if ((_ref = res.responseText) != null ? _ref.length : void 0) {
            try {
              json = JSON.parse(res.responseText);
            } catch (_error) {

            }
          }
          if (_this.interval) {
            window.clearInterval(_this.interval);
          }
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"ljLVGb":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

ReportResults = require('./reportResults.coffee');

t = require('../templates/templates.js');

templates = {
  reportLoading: t['node_modules/seasketch-reporting-api/reportLoading']
};

JobItem = require('./jobItem.coffee');

CollectionView = require('views/collectionView');

RecordSet = (function() {
  function RecordSet(data, tab, sketchClassId) {
    this.data = data;
    this.tab = tab;
    this.sketchClassId = sketchClassId;
  }

  RecordSet.prototype.toArray = function() {
    var data,
      _this = this;
    if (this.sketchClassId) {
      data = _.find(this.data.value, function(v) {
        var _ref, _ref1, _ref2;
        return ((_ref = v.features) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.attributes) != null ? _ref2['SC_ID'] : void 0 : void 0 : void 0) === _this.sketchClassId;
      });
      if (!data) {
        throw "Could not find data for sketchClass " + this.sketchClassId;
      }
    } else {
      if (_.isArray(this.data.value)) {
        data = this.data.value[0];
      } else {
        data = this.data.value;
      }
    }
    return _.map(data.features, function(feature) {
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
      console.log(this.data);
      this.tab.reportError("Could not get attribute " + attr + " from results");
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
    this.renderJobDetails = __bind(this.renderJobDetails, this);
    this.startEtaCountdown = __bind(this.startEtaCountdown, this);
    this.reportJobs = __bind(this.reportJobs, this);
    this.showError = __bind(this.showError, this);
    this.reportError = __bind(this.reportError, this);
    this.reportRequested = __bind(this.reportRequested, this);
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
    _.extend(this, this.options);
    this.reportResults = new ReportResults(this.model, this.dependencies);
    this.listenToOnce(this.reportResults, 'error', this.reportError);
    this.listenToOnce(this.reportResults, 'jobs', this.renderJobDetails);
    this.listenToOnce(this.reportResults, 'jobs', this.reportJobs);
    this.listenTo(this.reportResults, 'finished', _.bind(this.render, this));
    return this.listenToOnce(this.reportResults, 'request', this.reportRequested);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    var _ref1, _ref2;
    this.$el.show();
    this.visible = true;
    if (((_ref1 = this.dependencies) != null ? _ref1.length : void 0) && !this.reportResults.models.length) {
      return this.reportResults.poll();
    } else if (!((_ref2 = this.dependencies) != null ? _ref2.length : void 0)) {
      return this.render();
    }
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    window.clearInterval(this.etaInterval);
    this.stopListening();
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.reportRequested = function() {
    return this.$el.html(templates.reportLoading.render({}));
  };

  ReportTab.prototype.reportError = function(msg, cancelledRequest) {
    if (!cancelledRequest) {
      if (msg === 'JOB_ERROR') {
        return this.showError('Error with specific job');
      } else {
        return this.showError(msg);
      }
    }
  };

  ReportTab.prototype.showError = function(msg) {
    this.$('.progress').remove();
    this.$('p.error').remove();
    return this.$('h4').text("An Error Occurred").after("<p class=\"error\" style=\"text-align:center;\">" + msg + "</p>");
  };

  ReportTab.prototype.reportJobs = function() {
    if (!this.maxEta) {
      this.$('.progress .bar').width('100%');
    }
    return this.$('h4').text("Analyzing Designs");
  };

  ReportTab.prototype.startEtaCountdown = function() {
    var left, total,
      _this = this;
    if (this.maxEta) {
      total = (new Date(this.maxEta).getTime() - new Date(this.etaStart).getTime()) / 1000;
      left = (new Date(this.maxEta).getTime() - new Date().getTime()) / 1000;
      _.delay(function() {
        return _this.reportResults.poll();
      }, (left + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (left + 1) + "s");
        return _this.$('.progress .bar').width('100%');
      }, 500);
    }
  };

  ReportTab.prototype.renderJobDetails = function() {
    var item, job, maxEta, _i, _j, _len, _len1, _ref1, _ref2, _results,
      _this = this;
    maxEta = null;
    _ref1 = this.reportResults.models;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job.get('eta')) {
        if (!maxEta || job.get('eta') > maxEta) {
          maxEta = job.get('eta');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.etaStart = new Date();
      this.startEtaCountdown();
    }
    this.$('[rel=details]').css('display', 'block');
    this.$('[rel=details]').click(function(e) {
      e.preventDefault();
      _this.$('[rel=details]').hide();
      return _this.$('.details').show();
    });
    _ref2 = this.reportResults.models;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      job = _ref2[_j];
      item = new JobItem(job);
      item.render();
      _results.push(this.$('.details').append(item.el));
    }
    return _results;
  };

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
    var results;
    results = this.reportResults.map(function(result) {
      return result.get('result').results;
    });
    if (!(results != null ? results.length : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref1;
      return (_ref1 = result.paramName) !== 'ResultCode' && _ref1 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param;
    if (sketchClassId == null) {
      sketchClassId = false;
    }
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = this.reportResults.find(function(r) {
      return r.get('serviceName') === dependency;
    });
    if (!dep) {
      console.log(this.reportResults.models);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('result').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param, this, sketchClassId);
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

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"../templates/templates.js":"m3z/87","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"pyomvO","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('ljLVGb');
},{}],"api/utils":[function(require,module,exports){
module.exports=require('pyomvO');
},{}],"pyomvO":[function(require,module,exports){
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


},{}],"m3z/87":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,81,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.rp("attributes/attributeItem",c,p,"    "));});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

module.exports = this["Templates"];
},{}],"api/templates":[function(require,module,exports){
module.exports=require('m3z/87');
},{}],11:[function(require,module,exports){
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

  CultureTab.prototype.name = 'Governance';

  CultureTab.prototype.className = 'culture';

  CultureTab.prototype.template = templates.culture;

  CultureTab.prototype.dependencies = ["ExistingMarineProtectedAreas", "Closures", "OverlapWithExistingProvincialTenures", 'TerrestrialProtectedAreas'];

  CultureTab.prototype.render = function() {
    var closures, context, existingMPAs, hasClosures, hasOverlapWithExistingMPAs, hasProvincialTenures, provincial, zoneType, _ref1, _ref2, _ref3;
    zoneType = _.find(this.model.getAttributes(), function(attr) {
      return attr.exportid === "ZONE_TYPE";
    });
    zoneType = (zoneType != null ? zoneType.value : void 0) || 'smz';
    provincial = this.recordSet("OverlapWithExistingProvincialTenures", "ProvincialTenures").toArray();
    existingMPAs = this.recordSet('ExistingMarineProtectedAreas', "ExistingMarineProtectedAreas").toArray();
    hasProvincialTenures = (provincial != null ? provincial.length : void 0) > 0;
    hasOverlapWithExistingMPAs = (existingMPAs != null ? existingMPAs.length : void 0) > 0;
    closures = this.recordSet("Closures", "FisheriesClosures").toArray();
    hasClosures = (closures != null ? closures.length : void 0) > 0;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      array: ((_ref1 = this.children) != null ? _ref1.length : void 0) > 0,
      pmz: !(((_ref2 = this.children) != null ? _ref2.length : void 0) > 0) && zoneType === 'pmz',
      smz: !(((_ref3 = this.children) != null ? _ref3.length : void 0) > 0) && zoneType === 'smz',
      closures: closures,
      hasClosures: hasClosures,
      provincial: provincial,
      hasProvincialTenures: hasProvincialTenures,
      existingMPAs: existingMPAs,
      hasOverlapWithExistingMPAs: hasOverlapWithExistingMPAs,
      adjacentProtectedArea: this.recordSet('TerrestrialProtectedAreas', 'TerrestrialProtectedAreas').bool('Result')
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers();
  };

  return CultureTab;

})(ReportTab);

module.exports = CultureTab;


},{"../templates/templates.js":16,"reportTab":"ljLVGb"}],12:[function(require,module,exports){
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

  EconomicTab.prototype.name = 'Human Well-Being';

  EconomicTab.prototype.className = 'economic';

  EconomicTab.prototype.template = templates.economic;

  EconomicTab.prototype.dependencies = ['DistanceToInfrastructure', 'DistanceToTransmissionLines'];

  EconomicTab.prototype.timeout = 600000;

  EconomicTab.prototype.render = function() {
    var context, dist_to_inf, dist_to_tl, zoneType, _ref1, _ref2, _ref3;
    zoneType = _.find(this.model.getAttributes(), function(attr) {
      return attr.exportid === 'ZONE_TYPE';
    });
    zoneType = (zoneType != null ? zoneType.value : void 0) || 'smz';
    dist_to_tl = 0.0;
    dist_to_inf = [];
    if (zoneType === 'smz') {
      dist_to_tl = this.recordSet("DistanceToTransmissionLines", "DistanceToTransmissionLines").float('DistInKM', 2);
      dist_to_inf = this.recordSet("DistanceToInfrastructure", "DistanceToInfrastructure").toArray();
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      array: ((_ref1 = this.children) != null ? _ref1.length : void 0) > 0,
      pmz: !(((_ref2 = this.children) != null ? _ref2.length : void 0) > 0) && zoneType === 'pmz',
      smz: !(((_ref3 = this.children) != null ? _ref3.length : void 0) > 0) && zoneType === 'smz',
      transmissionLines: dist_to_tl,
      infrastructure: dist_to_inf
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    return this.enableTablePaging();
  };

  return EconomicTab;

})(ReportTab);

module.exports = EconomicTab;


},{"../templates/templates.js":16,"reportTab":"ljLVGb"}],13:[function(require,module,exports){
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

  EnvironmentTab.prototype.name = 'Ecological Integrity';

  EnvironmentTab.prototype.className = 'environment';

  EnvironmentTab.prototype.template = templates.environment;

  EnvironmentTab.prototype.dependencies = ['OverlapWithImportantAreas', 'OverlapWithBiogenicAndCommunityFormingSpecies', 'OverlapWithNonFishBreedingAreas', 'OverlapWithMarineClassifications', 'MarxanAnalysis'];

  EnvironmentTab.prototype.timeout = 600000;

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
      nonFishBreedingAreas: this.recordSet('OverlapWithNonFishBreedingAreas', 'OverlapWithNonFishBreedingAreas').toArray(),
      habitats: this.recordSet('OverlapWithBiogenicAndCommunityFormingSpecies', 'OverlapWithBiogenicAndCommunityFormingSpecies').toArray(),
      importantAreas: this.recordSet("OverlapWithImportantAreas", "OverlapWithImportantAreas").toArray(),
      marineClassifications: this.recordSet('OverlapWithMarineClassifications', 'OverlapWithMarineClassifications').toArray(),
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


},{"../templates/templates.js":16,"reportTab":"ljLVGb"}],14:[function(require,module,exports){
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

  OverviewTab.prototype.dependencies = ['ZoneSize'];

  OverviewTab.prototype.timeout = 600000;

  OverviewTab.prototype.render = function() {
    var context, sketchclass_name, zoneType, _ref1;
    zoneType = _.find(this.model.getAttributes(), function(attr) {
      return attr.exportid === 'ZONE_TYPE';
    });
    zoneType = (zoneType != null ? zoneType.value : void 0) || 'smz';
    sketchclass_name = this.recordSet('ZoneSize', 'ZoneSize').raw('SC_NAME');
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      anyAttributes: ((_ref1 = this.model.getAttributes()) != null ? _ref1.length : void 0) > 0,
      admin: this.project.isAdmin(window.user),
      size: this.recordSet('ZoneSize', 'ZoneSize').float('SIZE_SQ_KM', 2),
      percent: this.recordSet('ZoneSize', 'ZoneSize').raw('SIZE_PERC'),
      sc_name: sketchclass_name,
      smz: zoneType === 'smz',
      pmz: zoneType === 'pmz'
    };
    this.$el.html(this.template.render(context, partials));
    return this.enableLayerTogglers();
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"m3z/87","../templates/templates.js":16,"reportTab":"ljLVGb"}],15:[function(require,module,exports){
var CultureTab, EconomicTab, EnvironmentTab, OverviewTab;

OverviewTab = require('./overviewTab.coffee');

EnvironmentTab = require('./environmentTab.coffee');

EconomicTab = require('./economicTab.coffee');

CultureTab = require('./cultureTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, EnvironmentTab, EconomicTab, CultureTab]);
  return report.stylesheets(['./report.css']);
});


},{"./cultureTab.coffee":11,"./economicTab.coffee":12,"./environmentTab.coffee":13,"./overviewTab.coffee":14}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["arrayCulture"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Existing Protected Areas <a href=\"#\" data-toggle-node=\"520d4c2a674659cb7b35d575\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Existing Protected Areas. MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Protected Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasOverlapWithExistingMPAs",c,p,1),c,p,1,0,0,"")){_.b("        <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with existing protected areas</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("existingMPAs",c,p,1),c,p,0,898,1016,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.  ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Fisheries Closures</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Fisheries Closures. Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,1891,1917,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". \">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasClosures",c,p,1),c,p,1,0,0,"")){_.b("          <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with fisheries closures</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("closures",c,p,1),c,p,0,2324,2442,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,2757,2783,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Provincial Tenures <a href=\"#\" data-toggle-node=\"51f2f5cba72ec0681606208e\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Provincial Tenures.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasProvincialTenures",c,p,1),c,p,1,0,0,"")){_.b("        <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with Provincial Tenures</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("provincial",c,p,1),c,p,0,3635,3753,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          To avoid, minimise and/or reduce potential conflicts between existing tenured uses and activities and marine protection, examine the overlap with provincial crown tenures from the BC Provincial tenures database. Data source: Provincial Tenures. Updated: Dec 1013");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["arrayEconomic"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>No Reports </h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    Human Well-Being reports for collections are coming soon...");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});

this["Templates"]["arrayEnvironment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation (All Zones Combined)</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Protected Area (km²)</th>");_.b("\n" + i);_.b("        <th>Protected Area (%)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,303,391,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\">");_.b("\n" + i);_.b("          Habitat data for benthic ecosystems, pelagic areas, and oceanographic processes is used to inform siting of zones. Included here are biogenic habitats as well as community-forming species, such as eelgrass and kelp.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Important Marine Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Important Marine Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Important Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("importantAreas",c,p,1),c,p,0,1120,1238,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            When selecting sites for PMZs, consider the location of Important Marine Areas for marine mammals, fish and birds. To reduce potential conflicts between human uses and marine species when siting SMZs, consider these Important Marine Areas for marine mammals, fish and birds. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            Important Areas were identified during the process of establishing Ecologically and Biologically Significant Areas (EBSAs) by the <a href=\"http://pncima.org/site/atlas.html\" target=\"_blank\"> Pacific North Coast Integrated Management Area (PNCIMA)</a>. Important Bird Areas (IBAs) were also identified by Bird Studies Canada and Nature Canada, in partnership with BirdLife International.  Critical Habitat meets Canada's Species at Risk (SARA) requirements. Potential critical is insufficient information to meet SARA requirements. See the PNCIMA atlas for more information. See data layers for more information.  Data sources: up to 2009.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,2625,2671,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP collaborated with the <a href=\"http://bcmca.ca/\" target=\"_blank\">BC Marine Conservation Analysis (BCMCA)</a> to identify marine areas of high conservation value based on spatial datasets of ecological information. These Marxan scenarios can be used to inform the location or siting of MaPP zones. <a href=\"http://www.uq.edu.au/marxan/\" target=\"_blank\">Marxan</a> is a decision support tool developed by the University of Queensland to provide solutions to the “minimum set problem” - capturing a specified amount (target) of individual features for the least cost. Based on relatively simple mathematical algorithms and equations, Marxan searches millions of potential solutions to find the best balance between costs and benefits. In short, Marxan solutions minimize the overall cost subject to the constraint of meeting specified “targets” for all features.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP consulted the MaPP Science Advisory Committee (SAC) for advice on scenarios and target selection.  The SAC supported the decision to use the percentage target categories established by the BCMCA project team in 2006. Please see this <a href=\"https://dl.dropboxusercontent.com/u/1764986/BCMCA-Marxan for MaPP-Report on initial scenarios_27Feb2013.pdf\" target=\"_blank\">2013 BCMCA report</a> for more information about the MaPP-BCMCA project and Marxan scenarios, and consult the <a href=\"http://bcmca.ca\" target=\"_blank\">BCMCA Atlas</a> for detailed information about targets, species, and habitats.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Adjacent Breeding Sites for Birds and Mammals</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Is not adjacent to breeding sites for birds and mammals\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Species</th>");_.b("\n" + i);_.b("        <th>Number of Breeding Areas or Nesting Sites</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("nonFishBreedingAreas",c,p,1),c,p,0,4684,4770,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SPECIES",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("      <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"2\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            When selecting sites, consider proximity to breeding areas or nesting sites for birds and mammals in effort to minimize disturbance and protect adjacent foraging area. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Marine Classifications</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Marine Classifications\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Classification</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("marineClassifications",c,p,1),c,p,0,5503,5625,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            In Protection Management Zones, representation is often one criteria for siting in a network. Data for this report includes benthic ecosystems and oceanographic processes.  See metadata in the data layers for more information. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["arrayOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This regional proposal contains ");_.b(_.v(_.f("numChildren",c,p,0)));_.b(" zones and covers a total of <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>, which represents <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the ");_.b(_.v(_.f("sc_name",c,p,0)));_.b(".");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"tocContainer\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!-- ");if(_.s(_.f("adjacentProtectedArea",c,p,1),c,p,0,337,813,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Nearby Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    Zones within this proposal are adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Build on past and existing zoning efforts that are consistent with an ecosystem-based management approach.  Wherever possible, do not duplicate existing zoning efforts and consider existing terrestrial zoning for adjacent marine zoning to achieve zoning objectives.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b(" -->");_.b("\n" + i);_.b("<!-- <div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Transmission Lines <a href=\"#\" data-toggle-node=\"51f6ad677bbb9b2457020f52\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is ");_.b(_.v(_.f("transmissionLines",c,p,0)));_.b(" km from the nearest transmission lines.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b(" -->");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,1133,1259,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["culture"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Existing Protected Areas <a href=\"#\" data-toggle-node=\"520d4c2a674659cb7b35d575\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Existing Protected Areas. MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Protected Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasOverlapWithExistingMPAs",c,p,1),c,p,1,0,0,"")){_.b("        <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with existing protected areas</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("existingMPAs",c,p,1),c,p,0,896,1014,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.  ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);if(_.s(_.f("adjacentProtectedArea",c,p,1),c,p,0,1535,2020,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Adjacent to Terrestrial Protected Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    This zone is adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Build on past and existing zoning efforts that are consistent with an ecosystem-based management approach.  Wherever possible, do not duplicate existing zoning efforts and consider existing terrestrial zoning for adjacent marine zoning to achieve zoning objectives.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Fisheries Closures</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Fisheries Closures. Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,2427,2453,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". \">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasClosures",c,p,1),c,p,1,0,0,"")){_.b("          <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with fisheries closures</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("closures",c,p,1),c,p,0,2858,2976,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,3291,3317,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Provincial Tenures <a href=\"#\" data-toggle-node=\"51f2f5cba72ec0681606208e\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Provincial Tenures.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasProvincialTenures",c,p,1),c,p,1,0,0,"")){_.b("        <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with Provincial Tenures</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("provincial",c,p,1),c,p,0,4169,4287,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          To avoid, minimise and/or reduce potential conflicts between existing tenured uses and activities and marine protection, examine the overlap with provincial crown tenures from the BC Provincial tenures database. Data source: Provincial Tenures. Updated: Dec 1013");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Output</h4>");_.b("\n" + i);_.b("  <pre>");_.b(_.v(_.f("result",c,p,0)));_.b("</pre>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["economic"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(!_.s(_.f("pmz",c,p,1),c,p,1,0,0,"")){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Distance to Transmission Lines <a href=\"#\" data-toggle-node=\"51f6ad677bbb9b2457020f52\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is <strong>");_.b(_.v(_.f("transmissionLines",c,p,0)));_.b("</strong> km from the nearest <strong>transmission lines</strong>. This horizontal, straight line distance might be helpful in calculating the possible economic costs for renewable energy development in this zone. ");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Distance to Infrastructure</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Infrastructure</th>");_.b("\n" + i);_.b("        <th>Distance (km)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("infrastructure",c,p,1),c,p,0,705,791,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("DistInKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("      <td colspan=\"2\" class=\"paragraph\">");_.b("\n" + i);_.b("      The horizontal distance to ferries, ports, harbours, fuel docks, and other marine and coastal infrastructure might be helpful for planning marine uses and activities that are supported in this zone. ");_.b("\n" + i);_.b("      </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");};if(_.s(_.f("pmz",c,p,1),c,p,0,1166,1315,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>No Reports</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    No Human Well-Being reports for Protection Management Zones");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation <!-- <a href=\"#\" data-toggle-node=\"51f302d508dc4f5f2d00996a\" data-visible=\"false\">show layer</a> --></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Protected Area (km²)</th>");_.b("\n" + i);_.b("        <th>Protected Area (%)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,383,471,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Habitat data for benthic ecosystems, pelagic areas, and oceanographic processes is used to inform siting of this zone. Included here are biogenic habitats as well as community-forming species, such as eelgrass and kelp.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Important Marine Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Important Marine Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Important Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("importantAreas",c,p,1),c,p,0,1204,1322,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);if(_.s(_.f("pmz",c,p,1),c,p,0,1438,2167,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <p>");_.b("\n" + i);_.b("            When selecting sites for PMZs, consider the location of Important Marine Areas for marine mammals, fish and birds. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            Important Areas were identified during the process of establishing Ecologically and Biologically Significant Areas (EBSAs) by the <a href=\"http://pncima.org/site/atlas.html\" target=\"_blank\"> Pacific North Coast Integrated Management Area (PNCIMA)</a>. Important Bird Areas (IBAs) were also identified by Bird Studies Canada and Nature Canada, in partnership with BirdLife International.  Critical Habitat meets Canada's Species at Risk (SARA) requirements. See data layers for more information.  Data sources: up to 2009.");_.b("\n" + i);_.b("          </p>");_.b("\n");});c.pop();}if(_.s(_.f("smz",c,p,1),c,p,0,2192,3181,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <p>");_.b("\n" + i);_.b("            To reduce potential conflicts between human uses and marine species, consider these Important Marine Areas for marine mammals, fish and birds.  These areas do not include all of the foraging and breeding locations for marine species in the MaPP study area. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            Important Areas were identified during the process of establishing Ecologically and Biologically Significant Areas (EBSAs) by the <a href=\"http://pncima.org/site/atlas.html\" target=\"_blank\"> Pacific North Coast Integrated Management Area (PNCIMA)</a>. Important Bird Areas (IBAs) were also identified by Bird Studies Canada and Nature Canada, in partnership with BirdLife International.  Critical Habitat meets Canada's Species at Risk (SARA) requirements. Potential critical is insufficient information to meet SARA requirements. See the PNCIMA atlas for more information. See data layers for more information.  Data sources: up to 2009.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("\n");});c.pop();}_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,3481,3527,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP collaborated with the <a href=\"http://bcmca.ca/\" target=\"_blank\">BC Marine Conservation Analysis (BCMCA)</a> to identify marine areas of high conservation value based on spatial datasets of ecological information. These Marxan scenarios can be used to inform the location or siting of MaPP zones. <a href=\"http://www.uq.edu.au/marxan/\" target=\"_blank\">Marxan</a> is a decision support tool developed by the University of Queensland to provide solutions to the “minimum set problem” - capturing a specified amount (target) of individual features for the least cost. Based on relatively simple mathematical algorithms and equations, Marxan searches millions of potential solutions to find the best balance between costs and benefits. In short, Marxan solutions minimize the overall cost subject to the constraint of meeting specified “targets” for all features.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP consulted the MaPP Science Advisory Committee (SAC) for advice on scenarios and target selection.  The SAC supported the decision to use the percentage target categories established by the BCMCA project team in 2006. Please see this <a href=\"https://dl.dropboxusercontent.com/u/1764986/BCMCA-Marxan for MaPP-Report on initial scenarios_27Feb2013.pdf\" target=\"_blank\">2013 BCMCA report</a> for more information about the MaPP-BCMCA project and Marxan scenarios, and consult the <a href=\"http://bcmca.ca\" target=\"_blank\">BCMCA Atlas</a> for detailed information about targets, species, and habitats.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Adjacent Breeding Sites for Birds and Mammals</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Is not adjacent to breeding sites for birds and mammals\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Species</th>");_.b("\n" + i);_.b("        <th>Number of Breeding Areas or Nesting Sites</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("nonFishBreedingAreas",c,p,1),c,p,0,5540,5626,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SPECIES",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"2\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            When selecting sites, consider proximity to breeding areas or nesting sites for birds and mammals in effort to minimize disturbance and protect adjacent foraging area. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Marine Classifications</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Marine Classifications\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Classification</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("marineClassifications",c,p,1),c,p,0,6357,6479,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            In Protection Management Zones, representation is often one criteria for siting in a network. Data for this report includes benthic ecosystems and oceanographic processes.  See metadata in the data layers for more information. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>, which represents <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the ");_.b(_.v(_.f("sc_name",c,p,0)));_.b(". Size is used to quantify draft spatial zones and provide percent coverage. ");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,303,429,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[15])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9fZW1wdHkuanMiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvbWFwcC1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0UmVzdWx0cy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9zY3JpcHRzL2N1bHR1cmVUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvc2NyaXB0cy9lY29ub21pY1RhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9zY3JpcHRzL2Vudmlyb25tZW50VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvbWFwcC1yZXBvcnRzLXYyL3NjcmlwdHMvb3ZlcnZpZXdUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvc2NyaXB0cy9yZXBvcnQuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FEQSxDQUNBO0FBQytCLENBRi9CLENBRThCLENBQUUsQ0FBaEMsRUFBQSxFQUFRLENBQXdCLEtBQWhDO0NBRkEsQ0FHeUIsRUFBekIsRUFBQSxFQUFRLENBQVI7TUFKRjtDQU1FLEtBREk7Q0FDSixDQUFnQyxFQUFoQyxFQUFBLEVBQVEsUUFBUjtNQVRK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QVQsQ0FBQSxTQVBBO0NBQUEsQ0FVSyxDQUFMLEVBQWlCLENBQWpCLEVBQUs7Q0FWTCxDQVdLLENBQUwsRUFBaUIsQ0FBakIsRUFBSztDQWxCUCxLQUFBO0NBQUEsQ0FvQm9DLENBQWhDLENBQUosRUFBVSxDQUFBLENBQVM7Q0FDbEIsR0FBQSxPQUFELFFBQUE7Q0E5QkYsRUFRUTs7Q0FSUjs7Q0FEd0I7O0FBaUMxQixDQXhDQSxFQXdDaUIsR0FBWCxDQUFOLElBeENBOzs7O0FDQUEsSUFBQSxnREFBQTs7QUFBQSxDQUFBLEVBQWMsSUFBQSxJQUFkLFdBQWM7O0FBQ2QsQ0FEQSxFQUNpQixJQUFBLE9BQWpCLFdBQWlCOztBQUNqQixDQUZBLEVBRWMsSUFBQSxJQUFkLFdBQWM7O0FBQ2QsQ0FIQSxFQUdhLElBQUEsR0FBYixXQUFhOztBQUViLENBTEEsRUFLVSxHQUFKLEdBQXFCLEtBQTNCO0NBQ0UsQ0FBQSxFQUFBLEVBQU0sSUFBTSxDQUFBLEdBQUE7Q0FFTCxLQUFELEdBQU4sRUFBQSxHQUFtQjtDQUhLOzs7O0FDTDFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICMgYWxsIGNvbXBsZXRlIHRoZW5cbiAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgaWYgcHJvYmxlbSA9IF8uZmluZChAbW9kZWxzLCAocikgLT4gci5nZXQoJ2Vycm9yJyk/KVxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIFwiUHJvYmxlbSB3aXRoICN7cHJvYmxlbS5nZXQoJ3NlcnZpY2VOYW1lJyl9IGpvYlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAdHJpZ2dlciAnZmluaXNoZWQnXG4gICAgICBlcnJvcjogKGUsIHJlcywgYSwgYikgPT5cbiAgICAgICAgdW5sZXNzIHJlcy5zdGF0dXMgaXMgMFxuICAgICAgICAgIGlmIHJlcy5yZXNwb25zZVRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgIGpzb24gPSBKU09OLnBhcnNlKHJlcy5yZXNwb25zZVRleHQpXG4gICAgICAgICAgICBjYXRjaFxuICAgICAgICAgICAgICAjIGRvIG5vdGhpbmdcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGpzb24/LmVycm9yPy5tZXNzYWdlIG9yIFxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+IFxuICAgICAgICB2LmZlYXR1cmVzP1swXT8uYXR0cmlidXRlcz9bJ1NDX0lEJ10gaXMgQHNrZXRjaENsYXNzSWQgICAgICAgIFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlldyBcbiAgICAjICAgICAgICBjYWxsIEBvcHRpb25zLnBhcmVudC5kZXN0cm95KCkgdG8gY2xvc2UgdGhlIHdob2xlIHJlcG9ydCB3aW5kb3dcbiAgICBAYXBwID0gd2luZG93LmFwcFxuICAgIF8uZXh0ZW5kIEAsIEBvcHRpb25zXG4gICAgQHJlcG9ydFJlc3VsdHMgPSBuZXcgUmVwb3J0UmVzdWx0cyhAbW9kZWwsIEBkZXBlbmRlbmNpZXMpXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2Vycm9yJywgQHJlcG9ydEVycm9yXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVuZGVySm9iRGV0YWlsc1xuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlcG9ydEpvYnNcbiAgICBAbGlzdGVuVG8gQHJlcG9ydFJlc3VsdHMsICdmaW5pc2hlZCcsIF8uYmluZCBAcmVuZGVyLCBAXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ3JlcXVlc3QnLCBAcmVwb3J0UmVxdWVzdGVkXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRocm93ICdyZW5kZXIgbWV0aG9kIG11c3QgYmUgb3ZlcmlkZGVuJ1xuXG4gIHNob3c6ICgpIC0+XG4gICAgQCRlbC5zaG93KClcbiAgICBAdmlzaWJsZSA9IHRydWVcbiAgICBpZiBAZGVwZW5kZW5jaWVzPy5sZW5ndGggYW5kICFAcmVwb3J0UmVzdWx0cy5tb2RlbHMubGVuZ3RoXG4gICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICBlbHNlIGlmICFAZGVwZW5kZW5jaWVzPy5sZW5ndGhcbiAgICAgIEByZW5kZXIoKVxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG4gIFxuICByZXBvcnRSZXF1ZXN0ZWQ6ICgpID0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlcy5yZXBvcnRMb2FkaW5nLnJlbmRlcih7fSlcblxuICByZXBvcnRFcnJvcjogKG1zZywgY2FuY2VsbGVkUmVxdWVzdCkgPT5cbiAgICB1bmxlc3MgY2FuY2VsbGVkUmVxdWVzdFxuICAgICAgaWYgbXNnIGlzICdKT0JfRVJST1InXG4gICAgICAgIEBzaG93RXJyb3IgJ0Vycm9yIHdpdGggc3BlY2lmaWMgam9iJ1xuICAgICAgZWxzZVxuICAgICAgICBAc2hvd0Vycm9yIG1zZ1xuXG4gIHNob3dFcnJvcjogKG1zZykgPT5cbiAgICBAJCgnLnByb2dyZXNzJykucmVtb3ZlKClcbiAgICBAJCgncC5lcnJvcicpLnJlbW92ZSgpXG4gICAgQCQoJ2g0JykudGV4dChcIkFuIEVycm9yIE9jY3VycmVkXCIpLmFmdGVyIFwiXCJcIlxuICAgICAgPHAgY2xhc3M9XCJlcnJvclwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+I3ttc2d9PC9wPlxuICAgIFwiXCJcIlxuXG4gIHJlcG9ydEpvYnM6ICgpID0+XG4gICAgdW5sZXNzIEBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICBAJCgnaDQnKS50ZXh0IFwiQW5hbHl6aW5nIERlc2lnbnNcIlxuXG4gIHN0YXJ0RXRhQ291bnRkb3duOiAoKSA9PlxuICAgIGlmIEBtYXhFdGFcbiAgICAgIHRvdGFsID0gKG5ldyBEYXRlKEBtYXhFdGEpLmdldFRpbWUoKSAtIG5ldyBEYXRlKEBldGFTdGFydCkuZ2V0VGltZSgpKSAvIDEwMDBcbiAgICAgIGxlZnQgPSAobmV3IERhdGUoQG1heEV0YSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoKS5nZXRUaW1lKCkpIC8gMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICAgICwgKGxlZnQgKyAxKSAqIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbicsICdsaW5lYXInXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi1kdXJhdGlvbicsIFwiI3tsZWZ0ICsgMX1zXCJcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgICAgLCA1MDBcblxuICByZW5kZXJKb2JEZXRhaWxzOiAoKSA9PlxuICAgIG1heEV0YSA9IG51bGxcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaWYgam9iLmdldCgnZXRhJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGEnKSA+IG1heEV0YVxuICAgICAgICAgIG1heEV0YSA9IGpvYi5nZXQoJ2V0YScpXG4gICAgaWYgbWF4RXRhXG4gICAgICBAbWF4RXRhID0gbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnNSUnKVxuICAgICAgQGV0YVN0YXJ0ID0gbmV3IERhdGUoKVxuICAgICAgQHN0YXJ0RXRhQ291bnRkb3duKClcblxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNsaWNrIChlKSA9PlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmhpZGUoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuc2hvdygpXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGl0ZW0gPSBuZXcgSm9iSXRlbShqb2IpXG4gICAgICBpdGVtLnJlbmRlcigpXG4gICAgICBAJCgnLmRldGFpbHMnKS5hcHBlbmQgaXRlbS5lbFxuXG4gIGdldFJlc3VsdDogKGlkKSAtPlxuICAgIHJlc3VsdHMgPSBAZ2V0UmVzdWx0cygpXG4gICAgcmVzdWx0ID0gXy5maW5kIHJlc3VsdHMsIChyKSAtPiByLnBhcmFtTmFtZSBpcyBpZFxuICAgIHVubGVzcyByZXN1bHQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJlc3VsdCB3aXRoIGlkICcgKyBpZClcbiAgICByZXN1bHQudmFsdWVcblxuICBnZXRGaXJzdFJlc3VsdDogKHBhcmFtLCBpZCkgLT5cbiAgICByZXN1bHQgPSBAZ2V0UmVzdWx0KHBhcmFtKVxuICAgIHRyeVxuICAgICAgcmV0dXJuIHJlc3VsdFswXS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzW2lkXVxuICAgIGNhdGNoIGVcbiAgICAgIHRocm93IFwiRXJyb3IgZmluZGluZyAje3BhcmFtfToje2lkfSBpbiBncCByZXN1bHRzXCJcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJlc3VsdHMgPSBAcmVwb3J0UmVzdWx0cy5tYXAoKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgncmVzdWx0JykucmVzdWx0cylcbiAgICB1bmxlc3MgcmVzdWx0cz8ubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdwIHJlc3VsdHMnKVxuICAgIF8uZmlsdGVyIHJlc3VsdHMsIChyZXN1bHQpIC0+XG4gICAgICByZXN1bHQucGFyYW1OYW1lIG5vdCBpbiBbJ1Jlc3VsdENvZGUnLCAnUmVzdWx0TXNnJ11cblxuICByZWNvcmRTZXQ6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUsIHNrZXRjaENsYXNzSWQ9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcCA9IEByZXBvcnRSZXN1bHRzLmZpbmQgKHIpIC0+IHIuZ2V0KCdzZXJ2aWNlTmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwXG4gICAgICBjb25zb2xlLmxvZyBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzLCAocGFyYW0pIC0+IFxuICAgICAgcGFyYW0ucGFyYW1OYW1lIGlzIHBhcmFtTmFtZVxuICAgIHVubGVzcyBwYXJhbVxuICAgICAgY29uc29sZS5sb2cgZGVwLmdldCgnZGF0YScpLnJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHBhcmFtICN7cGFyYW1OYW1lfSBpbiAje2RlcGVuZGVuY3l9XCJcbiAgICBuZXcgUmVjb3JkU2V0KHBhcmFtLCBALCBza2V0Y2hDbGFzc0lkKVxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuICAgICAgXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KCkgICAgXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWIiLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0YWJsZSBjbGFzcz1cXFwiYXR0cmlidXRlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQsODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0TG9hZGluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxkaXYgY2xhc3M9XFxcInNwaW5uZXJcXFwiPjM8L2Rpdj4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVxdWVzdGluZyBSZXBvcnQgZnJvbSBTZXJ2ZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJiYXJcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiByZWw9XFxcImRldGFpbHNcXFwiPmRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImRldGFpbHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07IiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuY2xhc3MgQ3VsdHVyZVRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnR292ZXJuYW5jZSdcbiAgY2xhc3NOYW1lOiAnY3VsdHVyZSdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5jdWx0dXJlXG4gIGRlcGVuZGVuY2llczogW1xuICAgIFwiRXhpc3RpbmdNYXJpbmVQcm90ZWN0ZWRBcmVhc1wiXG4gICAgXCJDbG9zdXJlc1wiXG4gICAgXCJPdmVybGFwV2l0aEV4aXN0aW5nUHJvdmluY2lhbFRlbnVyZXNcIlxuICAgICdUZXJyZXN0cmlhbFByb3RlY3RlZEFyZWFzJ1xuICBdXG5cbiAgIyB0aW1lb3V0OiA2MDAwMFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgem9uZVR5cGUgPSBfLmZpbmQgQG1vZGVsLmdldEF0dHJpYnV0ZXMoKSwgKGF0dHIpIC0+IFxuICAgICAgYXR0ci5leHBvcnRpZCBpcyBcIlpPTkVfVFlQRVwiXG4gICAgem9uZVR5cGUgPSB6b25lVHlwZT8udmFsdWUgb3IgJ3NteidcbiAgICBwcm92aW5jaWFsID0gQHJlY29yZFNldChcIk92ZXJsYXBXaXRoRXhpc3RpbmdQcm92aW5jaWFsVGVudXJlc1wiLCBcIlByb3ZpbmNpYWxUZW51cmVzXCIpLnRvQXJyYXkoKVxuICAgIGV4aXN0aW5nTVBBcyA9IEByZWNvcmRTZXQoJ0V4aXN0aW5nTWFyaW5lUHJvdGVjdGVkQXJlYXMnLCBcbiAgICAgICAgXCJFeGlzdGluZ01hcmluZVByb3RlY3RlZEFyZWFzXCIpLnRvQXJyYXkoKVxuICAgIGhhc1Byb3ZpbmNpYWxUZW51cmVzID0gcHJvdmluY2lhbD8ubGVuZ3RoID4gMFxuICAgIGhhc092ZXJsYXBXaXRoRXhpc3RpbmdNUEFzID0gZXhpc3RpbmdNUEFzPy5sZW5ndGggPiAwXG4gICAgY2xvc3VyZXMgPSBAcmVjb3JkU2V0KFwiQ2xvc3VyZXNcIiwgXCJGaXNoZXJpZXNDbG9zdXJlc1wiKS50b0FycmF5KClcbiAgICBoYXNDbG9zdXJlcyA9IGNsb3N1cmVzPy5sZW5ndGggPiAwXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICAjIG92ZXJsYXA6IEByZWNvcmRTZXQoXCJBcmNoU2l0ZU92ZXJsYXBcIiwgXCJBcmNoU2l0ZU92ZXJsYXBcIikuYm9vbCgnUmVzdWx0JylcbiAgICAgIGFycmF5OiBAY2hpbGRyZW4/Lmxlbmd0aCA+IDBcbiAgICAgIHBtejogIShAY2hpbGRyZW4/Lmxlbmd0aCA+IDApIGFuZCB6b25lVHlwZSBpcyAncG16J1xuICAgICAgc216OiAhKEBjaGlsZHJlbj8ubGVuZ3RoID4gMCkgYW5kIHpvbmVUeXBlIGlzICdzbXonXG5cbiAgICAgIGNsb3N1cmVzOiBjbG9zdXJlc1xuICAgICAgaGFzQ2xvc3VyZXM6IGhhc0Nsb3N1cmVzXG4gICAgICBwcm92aW5jaWFsOiBwcm92aW5jaWFsXG4gICAgICBoYXNQcm92aW5jaWFsVGVudXJlczogaGFzUHJvdmluY2lhbFRlbnVyZXNcbiAgICAgIGV4aXN0aW5nTVBBczogZXhpc3RpbmdNUEFzXG4gICAgICBoYXNPdmVybGFwV2l0aEV4aXN0aW5nTVBBczogaGFzT3ZlcmxhcFdpdGhFeGlzdGluZ01QQXNcbiAgICAgIFxuICAgICAgYWRqYWNlbnRQcm90ZWN0ZWRBcmVhOiBAcmVjb3JkU2V0KCdUZXJyZXN0cmlhbFByb3RlY3RlZEFyZWFzJywgXG4gICAgICAgICdUZXJyZXN0cmlhbFByb3RlY3RlZEFyZWFzJykuYm9vbCgnUmVzdWx0JylcbiAgICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbm1vZHVsZS5leHBvcnRzID0gQ3VsdHVyZVRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEVjb25vbWljVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdIdW1hbiBXZWxsLUJlaW5nJ1xuICBjbGFzc05hbWU6ICdlY29ub21pYydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5lY29ub21pY1xuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnRGlzdGFuY2VUb0luZnJhc3RydWN0dXJlJ1xuICAgICdEaXN0YW5jZVRvVHJhbnNtaXNzaW9uTGluZXMnXG4gIF1cbiAgdGltZW91dDogNjAwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHpvbmVUeXBlID0gXy5maW5kIEBtb2RlbC5nZXRBdHRyaWJ1dGVzKCksIChhdHRyKSAtPiBcbiAgICAgIGF0dHIuZXhwb3J0aWQgaXMgJ1pPTkVfVFlQRSdcbiAgICB6b25lVHlwZSA9IHpvbmVUeXBlPy52YWx1ZSBvciAnc216J1xuICAgIGRpc3RfdG9fdGwgPSAwLjBcbiAgICBkaXN0X3RvX2luZiA9IFtdXG5cbiAgICBpZiB6b25lVHlwZSBpcyAnc216J1xuICAgICAgZGlzdF90b190bCA9IEByZWNvcmRTZXQoXCJEaXN0YW5jZVRvVHJhbnNtaXNzaW9uTGluZXNcIiwgXG4gICAgICAgICAgXCJEaXN0YW5jZVRvVHJhbnNtaXNzaW9uTGluZXNcIikuZmxvYXQoJ0Rpc3RJbktNJywgMilcbiAgICAgIGRpc3RfdG9faW5mID0gQHJlY29yZFNldChcIkRpc3RhbmNlVG9JbmZyYXN0cnVjdHVyZVwiLCBcbiAgICAgICAgICBcIkRpc3RhbmNlVG9JbmZyYXN0cnVjdHVyZVwiKS50b0FycmF5KClcbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG5cbiAgICAgIGFycmF5OiBAY2hpbGRyZW4/Lmxlbmd0aCA+IDBcbiAgICAgIHBtejogIShAY2hpbGRyZW4/Lmxlbmd0aCA+IDApIGFuZCB6b25lVHlwZSBpcyAncG16J1xuICAgICAgc216OiAhKEBjaGlsZHJlbj8ubGVuZ3RoID4gMCkgYW5kIHpvbmVUeXBlIGlzICdzbXonXG5cbiAgICAgIHRyYW5zbWlzc2lvbkxpbmVzOiBkaXN0X3RvX3RsXG5cbiAgICAgIGluZnJhc3RydWN0dXJlOiBkaXN0X3RvX2luZlxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcbiAgICBAZW5hYmxlVGFibGVQYWdpbmcoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVjb25vbWljVGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuY2xhc3MgRW52aXJvbm1lbnRUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0Vjb2xvZ2ljYWwgSW50ZWdyaXR5J1xuICBjbGFzc05hbWU6ICdlbnZpcm9ubWVudCdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5lbnZpcm9ubWVudFxuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnT3ZlcmxhcFdpdGhJbXBvcnRhbnRBcmVhcydcbiAgICAnT3ZlcmxhcFdpdGhCaW9nZW5pY0FuZENvbW11bml0eUZvcm1pbmdTcGVjaWVzJ1xuICAgICdPdmVybGFwV2l0aE5vbkZpc2hCcmVlZGluZ0FyZWFzJ1xuICAgICdPdmVybGFwV2l0aE1hcmluZUNsYXNzaWZpY2F0aW9ucydcbiAgICAnTWFyeGFuQW5hbHlzaXMnXG4gIF1cbiAgdGltZW91dDogNjAwMDAwXG5cblxuICByZW5kZXI6ICgpIC0+XG4gICAgem9uZVR5cGUgPSBfLmZpbmQgQG1vZGVsLmdldEF0dHJpYnV0ZXMoKSwgKGF0dHIpIC0+IFxuICAgICAgYXR0ci5leHBvcnRpZCBpcyAnWk9ORV9UWVBFJ1xuICAgIHpvbmVUeXBlID0gem9uZVR5cGU/LnZhbHVlIG9yICdzbXonXG5cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICAjIHJlc3VsdDogSlNPTi5zdHJpbmdpZnkoQHJlc3VsdHMuZ2V0KCdkYXRhJyksIG51bGwsICcgICcpXG4gICAgICBcbiAgICAgIG5vbkZpc2hCcmVlZGluZ0FyZWFzOiBAcmVjb3JkU2V0KCdPdmVybGFwV2l0aE5vbkZpc2hCcmVlZGluZ0FyZWFzJywgJ092ZXJsYXBXaXRoTm9uRmlzaEJyZWVkaW5nQXJlYXMnKS50b0FycmF5KClcbiAgICAgIGhhYml0YXRzOiBAcmVjb3JkU2V0KCdPdmVybGFwV2l0aEJpb2dlbmljQW5kQ29tbXVuaXR5Rm9ybWluZ1NwZWNpZXMnLCAnT3ZlcmxhcFdpdGhCaW9nZW5pY0FuZENvbW11bml0eUZvcm1pbmdTcGVjaWVzJykudG9BcnJheSgpXG4gICAgICBpbXBvcnRhbnRBcmVhczogQHJlY29yZFNldChcIk92ZXJsYXBXaXRoSW1wb3J0YW50QXJlYXNcIiwgXG4gICAgICAgIFwiT3ZlcmxhcFdpdGhJbXBvcnRhbnRBcmVhc1wiKS50b0FycmF5KClcbiAgICAgIFxuICAgICAgbWFyaW5lQ2xhc3NpZmljYXRpb25zOiBAcmVjb3JkU2V0KCdPdmVybGFwV2l0aE1hcmluZUNsYXNzaWZpY2F0aW9ucycsICdPdmVybGFwV2l0aE1hcmluZUNsYXNzaWZpY2F0aW9ucycpLnRvQXJyYXkoKVxuXG5cbiAgICAgIG1hcnhhbkFuYWx5c2VzOiBfLm1hcChAcmVjb3JkU2V0KFwiTWFyeGFuQW5hbHlzaXNcIiwgXCJNYXJ4YW5BbmFseXNpc1wiKVxuICAgICAgICAudG9BcnJheSgpLCAoZikgLT4gZi5OQU1FKVxuICAgICAgc216OiB6b25lVHlwZSBpcyAnc216J1xuICAgICAgcG16OiB6b25lVHlwZSBpcyAncG16J1xuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVUYWJsZVBhZ2luZygpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuICAgIEAkKCcuY2hvc2VuJykuY2hvc2VuKHtkaXNhYmxlX3NlYXJjaF90aHJlc2hvbGQ6IDEwLCB3aWR0aDonNDAwcHgnfSlcbiAgICBAJCgnLmNob3NlbicpLmNoYW5nZSAoKSA9PlxuICAgICAgXy5kZWZlciBAcmVuZGVyTWFyeGFuQW5hbHlzaXNcbiAgICBAcmVuZGVyTWFyeGFuQW5hbHlzaXMoKVxuXG4gIHJlbmRlck1hcnhhbkFuYWx5c2lzOiAoKSA9PlxuICAgIG5hbWUgPSBAJCgnLmNob3NlbicpLnZhbCgpXG4gICAgcmVjb3JkcyA9IEByZWNvcmRTZXQoXCJNYXJ4YW5BbmFseXNpc1wiLCBcIk1hcnhhbkFuYWx5c2lzXCIpLnRvQXJyYXkoKVxuICAgIGRhdGEgPSBfLmZpbmQgcmVjb3JkcywgKHJlY29yZCkgLT4gcmVjb3JkLk5BTUUgaXMgbmFtZVxuICAgIGhpc3RvID0gZGF0YS5ISVNUTy5zbGljZSgxLCBkYXRhLkhJU1RPLmxlbmd0aCAtIDEpLnNwbGl0KC9cXHMvKVxuICAgIGhpc3RvID0gXy5maWx0ZXIgaGlzdG8sIChzKSAtPiBzLmxlbmd0aCA+IDBcbiAgICBoaXN0byA9IF8ubWFwIGhpc3RvLCAodmFsKSAtPlxuICAgICAgcGFyc2VJbnQodmFsKVxuICAgIHF1YW50aWxlcyA9IF8uZmlsdGVyKF8ua2V5cyhkYXRhKSwgKGtleSkgLT4ga2V5LmluZGV4T2YoJ1EnKSBpcyAwKVxuICAgIGZvciBxLCBpIGluIHF1YW50aWxlc1xuICAgICAgaWYgcGFyc2VGbG9hdChkYXRhW3FdKSA+IHBhcnNlRmxvYXQoZGF0YS5TQ09SRSkgb3IgaSBpcyBxdWFudGlsZXMubGVuZ3RoIC0gMVxuICAgICAgICBtYXhfcSA9IHF1YW50aWxlc1tpXVxuICAgICAgICBtaW5fcSA9IHF1YW50aWxlc1tpIC0gMV0gb3IgXCJRMFwiICMgcXVhbnRpbGVzW2ldXG4gICAgICAgIGJyZWFrXG4gICAgQCQoJy5zY2VuYXJpb1Jlc3VsdHMnKS5odG1sIFwiXCJcIlxuICAgICAgVGhlIGF2ZXJhZ2UgTWFyeGFuIHNjb3JlIGZvciB0aGlzIHpvbmUgaXMgPHN0cm9uZz4je2RhdGEuU0NPUkV9PC9zdHJvbmc+LCBwbGFjaW5nIGl0IGluIFxuICAgICAgdGhlIDxzdHJvbmc+I3ttaW5fcS5yZXBsYWNlKCdRJywgJycpfSUgLSAje21heF9xLnJlcGxhY2UoJ1EnLCAnJyl9JSBxdWFudGlsZSBcbiAgICAgIHJhbmdlPC9zdHJvbmc+IGZvciB0aGlzIHN1Yi1yZWdpb24uXG4gICAgXCJcIlwiXG5cbiAgICBAJCgnLnNjZW5hcmlvRGVzY3JpcHRpb24nKS5odG1sIGRhdGEuTUFSWF9ERVNDXG5cbiAgICBkb21haW4gPSBfLm1hcCBxdWFudGlsZXMsIChxKSAtPiBkYXRhW3FdXG4gICAgZG9tYWluLnB1c2ggMTAwXG4gICAgZG9tYWluLnVuc2hpZnQgMFxuICAgIGNvbG9yID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZG9tYWluKVxuICAgICAgLnJhbmdlKFtcIiM0N2FlNDNcIiwgXCIjNmMwXCIsIFwiI2VlMFwiLCBcIiNlYjRcIiwgXCIjZWNiYjg5XCIsIFwiI2VlYWJhMFwiXS5yZXZlcnNlKCkpXG4gICAgcXVhbnRpbGVzID0gXy5tYXAgcXVhbnRpbGVzLCAoa2V5KSAtPlxuICAgICAgbWF4ID0gcGFyc2VGbG9hdChkYXRhW2tleV0pXG4gICAgICBtaW4gID0gcGFyc2VGbG9hdChkYXRhW3F1YW50aWxlc1tfLmluZGV4T2YocXVhbnRpbGVzLCBrZXkpIC0gMV1dIG9yIDApXG4gICAgICB7XG4gICAgICAgIHJhbmdlOiBcIiN7cGFyc2VJbnQoa2V5LnJlcGxhY2UoJ1EnLCAnJykpIC0gMjB9LSN7a2V5LnJlcGxhY2UoJ1EnLCAnJyl9JVwiXG4gICAgICAgIG5hbWU6IGtleVxuICAgICAgICBzdGFydDogbWluXG4gICAgICAgIGVuZDogbWF4XG4gICAgICAgIGJnOiBjb2xvcigobWF4ICsgbWluKSAvIDIpXG4gICAgICB9XG4gICAgaWYgd2luZG93LmQzXG4gICAgICBAJCgnLnZpeicpLmh0bWwoJycpXG4gICAgICBlbCA9IEAkKCcudml6JylbMF1cbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCAxMDBdKVxuICAgICAgICAucmFuZ2UoWzAsIDQwMF0pICAgICAgXG5cblxuXG4gICAgICAjIEhpc3RvZ3JhbVxuXG4gICAgICBtYXJnaW4gPSBcbiAgICAgICAgdG9wOiA1XG4gICAgICAgIHJpZ2h0OiAyMFxuICAgICAgICBib3R0b206IDMwXG4gICAgICAgIGxlZnQ6IDQ1XG4gICAgICB3aWR0aCA9IDQwMCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0XG4gICAgICBoZWlnaHQgPSAzMDAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbVxuICAgICAgXG4gICAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihbMCwgMTAwXSlcbiAgICAgICAgLnJhbmdlKFswLCB3aWR0aF0pXG4gICAgICB5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKVxuICAgICAgICAuZG9tYWluKFswLCBkMy5tYXgoaGlzdG8pXSlcblxuICAgICAgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgIC5zY2FsZSh4KVxuICAgICAgICAub3JpZW50KFwiYm90dG9tXCIpXG4gICAgICB5QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLnNjYWxlKHkpXG4gICAgICAgIC5vcmllbnQoXCJsZWZ0XCIpXG5cbiAgICAgIHN2ZyA9IGQzLnNlbGVjdChAJCgnLnZpeicpWzBdKS5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcbiAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKCN7bWFyZ2luLmxlZnR9LCAje21hcmdpbi50b3B9KVwiKVxuXG4gICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsI3toZWlnaHR9KVwiKVxuICAgICAgICAuY2FsbCh4QXhpcylcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCB3aWR0aCAvIDIpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIzZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgLnRleHQoXCJTY29yZVwiKVxuXG4gICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgICAgIC5jYWxsKHlBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxuICAgICAgICAuYXR0cihcInlcIiwgNilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgICAgIC50ZXh0KFwiTnVtYmVyIG9mIFBsYW5uaW5nIFVuaXRzXCIpXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuYmFyXCIpXG4gICAgICAgICAgLmRhdGEoaGlzdG8pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFyXCIpXG4gICAgICAgICAgLmF0dHIoXCJ4XCIsIChkLCBpKSAtPiB4KGkpKVxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgKHdpZHRoIC8gMTAwKSlcbiAgICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+IHkoZCkpXG4gICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgKGQpIC0+IGhlaWdodCAtIHkoZCkpXG4gICAgICAgICAgLnN0eWxlICdmaWxsJywgKGQsIGkpIC0+XG4gICAgICAgICAgICBxID0gXy5maW5kIHF1YW50aWxlcywgKHEpIC0+XG4gICAgICAgICAgICAgIGkgPj0gcS5zdGFydCBhbmQgaSA8PSBxLmVuZFxuICAgICAgICAgICAgcT8uYmcgb3IgXCJzdGVlbGJsdWVcIlxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoZGF0YS5TQ09SRSldKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZVwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gOCApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KGhpc3RvW2RdKSAtIDEwKSArICdweCcpXG4gICAgICAgIC50ZXh0KFwi4pa8XCIpXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVUZXh0XCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoZGF0YS5TQ09SRSldKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZVRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeChkKSAtIDYgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShoaXN0b1tkXSkgLSAzMCkgKyAncHgnKVxuICAgICAgICAudGV4dCgoZCkgLT4gZClcblxuICAgICAgQCQoJy52aXonKS5hcHBlbmQgJzxkaXYgY2xhc3M9XCJsZWdlbmRzXCI+PC9kaXY+J1xuICAgICAgZm9yIHF1YW50aWxlIGluIHF1YW50aWxlc1xuICAgICAgICBAJCgnLnZpeiAubGVnZW5kcycpLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibGVnZW5kXCI+PHNwYW4gc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOiN7cXVhbnRpbGUuYmd9O1wiPiZuYnNwOzwvc3Bhbj4je3F1YW50aWxlLnJhbmdlfTwvZGl2PlxuICAgICAgICBcIlwiXCJcbiAgICAgIEAkKCcudml6JykuYXBwZW5kICc8YnIgc3R5bGU9XCJjbGVhcjpib3RoO1wiPidcblxubW9kdWxlLmV4cG9ydHMgPSBFbnZpcm9ubWVudFRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5fcGFydGlhbHMgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIE92ZXJ2aWV3VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdPdmVydmlldydcbiAgY2xhc3NOYW1lOiAnb3ZlcnZpZXcnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMub3ZlcnZpZXdcbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ1pvbmVTaXplJ1xuICBdXG4gIHRpbWVvdXQ6IDYwMDAwMFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB6b25lVHlwZSA9IF8uZmluZCBAbW9kZWwuZ2V0QXR0cmlidXRlcygpLCAoYXR0cikgLT4gXG4gICAgICBhdHRyLmV4cG9ydGlkIGlzICdaT05FX1RZUEUnXG4gICAgem9uZVR5cGUgPSB6b25lVHlwZT8udmFsdWUgb3IgJ3NteidcblxuICAgIHNrZXRjaGNsYXNzX25hbWUgPSBAcmVjb3JkU2V0KCdab25lU2l6ZScsICdab25lU2l6ZScpLnJhdygnU0NfTkFNRScpXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYW55QXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKT8ubGVuZ3RoID4gMFxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIHNpemU6IEByZWNvcmRTZXQoJ1pvbmVTaXplJywgJ1pvbmVTaXplJykuZmxvYXQoJ1NJWkVfU1FfS00nLCAyKVxuICAgICAgcGVyY2VudDogQHJlY29yZFNldCgnWm9uZVNpemUnLCAnWm9uZVNpemUnKS5yYXcoJ1NJWkVfUEVSQycpXG4gICAgICBzY19uYW1lOiBza2V0Y2hjbGFzc19uYW1lXG5cblxuICAgICAgc216OiB6b25lVHlwZSBpcyAnc216J1xuICAgICAgcG16OiB6b25lVHlwZSBpcyAncG16J1xuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgcGFydGlhbHMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IE92ZXJ2aWV3VGFiIiwiT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3VGFiLmNvZmZlZSdcbkVudmlyb25tZW50VGFiID0gcmVxdWlyZSAnLi9lbnZpcm9ubWVudFRhYi5jb2ZmZWUnXG5FY29ub21pY1RhYiA9IHJlcXVpcmUgJy4vZWNvbm9taWNUYWIuY29mZmVlJ1xuQ3VsdHVyZVRhYiA9IHJlcXVpcmUgJy4vY3VsdHVyZVRhYi5jb2ZmZWUnXG5cbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW092ZXJ2aWV3VGFiLCBFbnZpcm9ubWVudFRhYiwgRWNvbm9taWNUYWIsIEN1bHR1cmVUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcmVwb3J0LmNzcyddXG4iLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5Q3VsdHVyZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggRXhpc3RpbmcgUHJvdGVjdGVkIEFyZWFzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUyMGQ0YzJhNjc0NjU5Y2I3YjM1ZDU3NVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBFeGlzdGluZyBQcm90ZWN0ZWQgQXJlYXMuIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UHJvdGVjdGVkIEFyZWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImhhc092ZXJsYXBXaXRoRXhpc3RpbmdNUEFzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpjZW50ZXI7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8cD5ObyBvdmVybGFwIHdpdGggZXhpc3RpbmcgcHJvdGVjdGVkIGFyZWFzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImV4aXN0aW5nTVBBc1wiLGMscCwxKSxjLHAsMCw4OTgsMTAxNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLiAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIEZpc2hlcmllcyBDbG9zdXJlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IEZpc2hlcmllcyBDbG9zdXJlcy4gRmlzaGVyaWVzIGNsb3N1cmVzIG1heSBuZWVkIHRvIGJlIGNvbnNpZGVyZWQgdG8gcmVkdWNlIHBvdGVudGlhbCBjb25mbGljdHMgYmV0d2VlbiB1c2VzIGFuZCBhY3Rpdml0aWVzLiBGZWRlcmFsIFJvY2tmaXNoIENvbnNlcnZhdGlvbiBBcmVhcyBhbmQgRmVkZXJhbCBTcG9uZ2UgUmVlZiBSZXNlcnZlIGFyZSBhbmFseXNlZCBmb3Igb3ZlcmxhcCB3aXRoIFwiKTtpZihfLnMoXy5mKFwiYXJyYXlcIixjLHAsMSksYyxwLDAsMTg5MSwxOTE3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ6b25lcyB3aXRoaW4gdGhpcyBwcm9wb3NhbFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwidGhpcyB6b25lXCIpO307Xy5iKFwiLiBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlRlbnVyZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImhhc0Nsb3N1cmVzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmNlbnRlcjtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDxwPk5vIG92ZXJsYXAgd2l0aCBmaXNoZXJpZXMgY2xvc3VyZXM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiY2xvc3VyZXNcIixjLHAsMSksYyxwLDAsMjMyNCwyNDQyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgRmlzaGVyaWVzIGNsb3N1cmVzIG1heSBuZWVkIHRvIGJlIGNvbnNpZGVyZWQgdG8gcmVkdWNlIHBvdGVudGlhbCBjb25mbGljdHMgYmV0d2VlbiB1c2VzIGFuZCBhY3Rpdml0aWVzLiBGZWRlcmFsIFJvY2tmaXNoIENvbnNlcnZhdGlvbiBBcmVhcyBhbmQgRmVkZXJhbCBTcG9uZ2UgUmVlZiBSZXNlcnZlIGFyZSBhbmFseXNlZCBmb3Igb3ZlcmxhcCB3aXRoIFwiKTtpZihfLnMoXy5mKFwiYXJyYXlcIixjLHAsMSksYyxwLDAsMjc1NywyNzgzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ6b25lcyB3aXRoaW4gdGhpcyBwcm9wb3NhbFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwidGhpcyB6b25lXCIpO307Xy5iKFwiLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggUHJvdmluY2lhbCBUZW51cmVzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjJmNWNiYTcyZWMwNjgxNjA2MjA4ZVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBQcm92aW5jaWFsIFRlbnVyZXMuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5UZW51cmVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJoYXNQcm92aW5jaWFsVGVudXJlc1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246Y2VudGVyO1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHA+Tm8gb3ZlcmxhcCB3aXRoIFByb3ZpbmNpYWwgVGVudXJlczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9O2lmKF8ucyhfLmYoXCJwcm92aW5jaWFsXCIsYyxwLDEpLGMscCwwLDM2MzUsMzc1MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIFRvIGF2b2lkLCBtaW5pbWlzZSBhbmQvb3IgcmVkdWNlIHBvdGVudGlhbCBjb25mbGljdHMgYmV0d2VlbiBleGlzdGluZyB0ZW51cmVkIHVzZXMgYW5kIGFjdGl2aXRpZXMgYW5kIG1hcmluZSBwcm90ZWN0aW9uLCBleGFtaW5lIHRoZSBvdmVybGFwIHdpdGggcHJvdmluY2lhbCBjcm93biB0ZW51cmVzIGZyb20gdGhlIEJDIFByb3ZpbmNpYWwgdGVudXJlcyBkYXRhYmFzZS4gRGF0YSBzb3VyY2U6IFByb3ZpbmNpYWwgVGVudXJlcy4gVXBkYXRlZDogRGVjIDEwMTNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlFY29ub21pY1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ObyBSZXBvcnRzIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBIdW1hbiBXZWxsLUJlaW5nIHJlcG9ydHMgZm9yIGNvbGxlY3Rpb25zIGFyZSBjb21pbmcgc29vbi4uLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5RW52aXJvbm1lbnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdCBSZXByZXNlbnRhdGlvbiAoQWxsIFpvbmVzIENvbWJpbmVkKTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYSAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlByb3RlY3RlZCBBcmVhICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwzMDMsMzkxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9OQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNFxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIEhhYml0YXQgZGF0YSBmb3IgYmVudGhpYyBlY29zeXN0ZW1zLCBwZWxhZ2ljIGFyZWFzLCBhbmQgb2NlYW5vZ3JhcGhpYyBwcm9jZXNzZXMgaXMgdXNlZCB0byBpbmZvcm0gc2l0aW5nIG9mIHpvbmVzLiBJbmNsdWRlZCBoZXJlIGFyZSBiaW9nZW5pYyBoYWJpdGF0cyBhcyB3ZWxsIGFzIGNvbW11bml0eS1mb3JtaW5nIHNwZWNpZXMsIHN1Y2ggYXMgZWVsZ3Jhc3MgYW5kIGtlbHAuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIEltcG9ydGFudCBNYXJpbmUgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlICBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgSW1wb3J0YW50IE1hcmluZSBBcmVhc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW1wb3J0YW50IEFyZWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaW1wb3J0YW50QXJlYXNcIixjLHAsMSksYyxwLDAsMTEyMCwxMjM4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgV2hlbiBzZWxlY3Rpbmcgc2l0ZXMgZm9yIFBNWnMsIGNvbnNpZGVyIHRoZSBsb2NhdGlvbiBvZiBJbXBvcnRhbnQgTWFyaW5lIEFyZWFzIGZvciBtYXJpbmUgbWFtbWFscywgZmlzaCBhbmQgYmlyZHMuIFRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gaHVtYW4gdXNlcyBhbmQgbWFyaW5lIHNwZWNpZXMgd2hlbiBzaXRpbmcgU01acywgY29uc2lkZXIgdGhlc2UgSW1wb3J0YW50IE1hcmluZSBBcmVhcyBmb3IgbWFyaW5lIG1hbW1hbHMsIGZpc2ggYW5kIGJpcmRzLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBJbXBvcnRhbnQgQXJlYXMgd2VyZSBpZGVudGlmaWVkIGR1cmluZyB0aGUgcHJvY2VzcyBvZiBlc3RhYmxpc2hpbmcgRWNvbG9naWNhbGx5IGFuZCBCaW9sb2dpY2FsbHkgU2lnbmlmaWNhbnQgQXJlYXMgKEVCU0FzKSBieSB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL3BuY2ltYS5vcmcvc2l0ZS9hdGxhcy5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+IFBhY2lmaWMgTm9ydGggQ29hc3QgSW50ZWdyYXRlZCBNYW5hZ2VtZW50IEFyZWEgKFBOQ0lNQSk8L2E+LiBJbXBvcnRhbnQgQmlyZCBBcmVhcyAoSUJBcykgd2VyZSBhbHNvIGlkZW50aWZpZWQgYnkgQmlyZCBTdHVkaWVzIENhbmFkYSBhbmQgTmF0dXJlIENhbmFkYSwgaW4gcGFydG5lcnNoaXAgd2l0aCBCaXJkTGlmZSBJbnRlcm5hdGlvbmFsLiAgQ3JpdGljYWwgSGFiaXRhdCBtZWV0cyBDYW5hZGEncyBTcGVjaWVzIGF0IFJpc2sgKFNBUkEpIHJlcXVpcmVtZW50cy4gUG90ZW50aWFsIGNyaXRpY2FsIGlzIGluc3VmZmljaWVudCBpbmZvcm1hdGlvbiB0byBtZWV0IFNBUkEgcmVxdWlyZW1lbnRzLiBTZWUgdGhlIFBOQ0lNQSBhdGxhcyBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gU2VlIGRhdGEgbGF5ZXJzIGZvciBtb3JlIGluZm9ybWF0aW9uLiAgRGF0YSBzb3VyY2VzOiB1cCB0byAyMDA5LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TWFyeGFuIEFuYWx5c2lzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxzZWxlY3QgY2xhc3M9XFxcImNob3NlblxcXCIgd2lkdGg9XFxcIjQwMHB4XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibWFyeGFuQW5hbHlzZXNcIixjLHAsMSksYyxwLDAsMjYyNSwyNjcxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPG9wdGlvbiB2YWx1ZT1cXFwiXCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIjwvb3B0aW9uPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3NlbGVjdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb1Jlc3VsdHNcXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9EZXNjcmlwdGlvblxcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIE1hUFAgY29sbGFib3JhdGVkIHdpdGggdGhlIDxhIGhyZWY9XFxcImh0dHA6Ly9iY21jYS5jYS9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5CQyBNYXJpbmUgQ29uc2VydmF0aW9uIEFuYWx5c2lzIChCQ01DQSk8L2E+IHRvIGlkZW50aWZ5IG1hcmluZSBhcmVhcyBvZiBoaWdoIGNvbnNlcnZhdGlvbiB2YWx1ZSBiYXNlZCBvbiBzcGF0aWFsIGRhdGFzZXRzIG9mIGVjb2xvZ2ljYWwgaW5mb3JtYXRpb24uIFRoZXNlIE1hcnhhbiBzY2VuYXJpb3MgY2FuIGJlIHVzZWQgdG8gaW5mb3JtIHRoZSBsb2NhdGlvbiBvciBzaXRpbmcgb2YgTWFQUCB6b25lcy4gPGEgaHJlZj1cXFwiaHR0cDovL3d3dy51cS5lZHUuYXUvbWFyeGFuL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPk1hcnhhbjwvYT4gaXMgYSBkZWNpc2lvbiBzdXBwb3J0IHRvb2wgZGV2ZWxvcGVkIGJ5IHRoZSBVbml2ZXJzaXR5IG9mIFF1ZWVuc2xhbmQgdG8gcHJvdmlkZSBzb2x1dGlvbnMgdG8gdGhlIOKAnG1pbmltdW0gc2V0IHByb2JsZW3igJ0gLSBjYXB0dXJpbmcgYSBzcGVjaWZpZWQgYW1vdW50ICh0YXJnZXQpIG9mIGluZGl2aWR1YWwgZmVhdHVyZXMgZm9yIHRoZSBsZWFzdCBjb3N0LiBCYXNlZCBvbiByZWxhdGl2ZWx5IHNpbXBsZSBtYXRoZW1hdGljYWwgYWxnb3JpdGhtcyBhbmQgZXF1YXRpb25zLCBNYXJ4YW4gc2VhcmNoZXMgbWlsbGlvbnMgb2YgcG90ZW50aWFsIHNvbHV0aW9ucyB0byBmaW5kIHRoZSBiZXN0IGJhbGFuY2UgYmV0d2VlbiBjb3N0cyBhbmQgYmVuZWZpdHMuIEluIHNob3J0LCBNYXJ4YW4gc29sdXRpb25zIG1pbmltaXplIHRoZSBvdmVyYWxsIGNvc3Qgc3ViamVjdCB0byB0aGUgY29uc3RyYWludCBvZiBtZWV0aW5nIHNwZWNpZmllZCDigJx0YXJnZXRz4oCdIGZvciBhbGwgZmVhdHVyZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgTWFQUCBjb25zdWx0ZWQgdGhlIE1hUFAgU2NpZW5jZSBBZHZpc29yeSBDb21taXR0ZWUgKFNBQykgZm9yIGFkdmljZSBvbiBzY2VuYXJpb3MgYW5kIHRhcmdldCBzZWxlY3Rpb24uICBUaGUgU0FDIHN1cHBvcnRlZCB0aGUgZGVjaXNpb24gdG8gdXNlIHRoZSBwZXJjZW50YWdlIHRhcmdldCBjYXRlZ29yaWVzIGVzdGFibGlzaGVkIGJ5IHRoZSBCQ01DQSBwcm9qZWN0IHRlYW0gaW4gMjAwNi4gUGxlYXNlIHNlZSB0aGlzIDxhIGhyZWY9XFxcImh0dHBzOi8vZGwuZHJvcGJveHVzZXJjb250ZW50LmNvbS91LzE3NjQ5ODYvQkNNQ0EtTWFyeGFuIGZvciBNYVBQLVJlcG9ydCBvbiBpbml0aWFsIHNjZW5hcmlvc18yN0ZlYjIwMTMucGRmXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+MjAxMyBCQ01DQSByZXBvcnQ8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBNYVBQLUJDTUNBIHByb2plY3QgYW5kIE1hcnhhbiBzY2VuYXJpb3MsIGFuZCBjb25zdWx0IHRoZSA8YSBocmVmPVxcXCJodHRwOi8vYmNtY2EuY2FcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5CQ01DQSBBdGxhczwvYT4gZm9yIGRldGFpbGVkIGluZm9ybWF0aW9uIGFib3V0IHRhcmdldHMsIHNwZWNpZXMsIGFuZCBoYWJpdGF0cy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5BZGphY2VudCBCcmVlZGluZyBTaXRlcyBmb3IgQmlyZHMgYW5kIE1hbW1hbHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlICBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiSXMgbm90IGFkamFjZW50IHRvIGJyZWVkaW5nIHNpdGVzIGZvciBiaXJkcyBhbmQgbWFtbWFsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+U3BlY2llczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TnVtYmVyIG9mIEJyZWVkaW5nIEFyZWFzIG9yIE5lc3RpbmcgU2l0ZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibm9uRmlzaEJyZWVkaW5nQXJlYXNcIixjLHAsMSksYyxwLDAsNDY4NCw0NzcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiU1BFQ0lFU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ09VTlRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjJcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBXaGVuIHNlbGVjdGluZyBzaXRlcywgY29uc2lkZXIgcHJveGltaXR5IHRvIGJyZWVkaW5nIGFyZWFzIG9yIG5lc3Rpbmcgc2l0ZXMgZm9yIGJpcmRzIGFuZCBtYW1tYWxzIGluIGVmZm9ydCB0byBtaW5pbWl6ZSBkaXN0dXJiYW5jZSBhbmQgcHJvdGVjdCBhZGphY2VudCBmb3JhZ2luZyBhcmVhLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggTWFyaW5lIENsYXNzaWZpY2F0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBNYXJpbmUgQ2xhc3NpZmljYXRpb25zXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5DbGFzc2lmaWNhdGlvbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJpbmVDbGFzc2lmaWNhdGlvbnNcIixjLHAsMSksYyxwLDAsNTUwMyw1NjI1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX05BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIEluIFByb3RlY3Rpb24gTWFuYWdlbWVudCBab25lcywgcmVwcmVzZW50YXRpb24gaXMgb2Z0ZW4gb25lIGNyaXRlcmlhIGZvciBzaXRpbmcgaW4gYSBuZXR3b3JrLiBEYXRhIGZvciB0aGlzIHJlcG9ydCBpbmNsdWRlcyBiZW50aGljIGVjb3N5c3RlbXMgYW5kIG9jZWFub2dyYXBoaWMgcHJvY2Vzc2VzLiAgU2VlIG1ldGFkYXRhIGluIHRoZSBkYXRhIGxheWVycyBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5T3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIHJlZ2lvbmFsIHByb3Bvc2FsIGNvbnRhaW5zIFwiKTtfLmIoXy52KF8uZihcIm51bUNoaWxkcmVuXCIsYyxwLDApKSk7Xy5iKFwiIHpvbmVzIGFuZCBjb3ZlcnMgYSB0b3RhbCBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNpemVcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIGtpbG9tZXRlcnM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgXCIpO18uYihfLnYoXy5mKFwic2NfbmFtZVwiLGMscCwwKSkpO18uYihcIi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInRvY0NvbnRhaW5lclxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tIFwiKTtpZihfLnMoXy5mKFwiYWRqYWNlbnRQcm90ZWN0ZWRBcmVhXCIsYyxwLDEpLGMscCwwLDMzNyw4MTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TmVhcmJ5IEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZSBncmVlbi1jaGVja1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFpvbmVzIHdpdGhpbiB0aGlzIHByb3Bvc2FsIGFyZSBhZGphY2VudCB0byBhIDxzdHJvbmc+VGVycmVzdHJpYWwgUHJvdGVjdGVkIEFyZWE8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQnVpbGQgb24gcGFzdCBhbmQgZXhpc3Rpbmcgem9uaW5nIGVmZm9ydHMgdGhhdCBhcmUgY29uc2lzdGVudCB3aXRoIGFuIGVjb3N5c3RlbS1iYXNlZCBtYW5hZ2VtZW50IGFwcHJvYWNoLiAgV2hlcmV2ZXIgcG9zc2libGUsIGRvIG5vdCBkdXBsaWNhdGUgZXhpc3Rpbmcgem9uaW5nIGVmZm9ydHMgYW5kIGNvbnNpZGVyIGV4aXN0aW5nIHRlcnJlc3RyaWFsIHpvbmluZyBmb3IgYWRqYWNlbnQgbWFyaW5lIHpvbmluZyB0byBhY2hpZXZlIHpvbmluZyBvYmplY3RpdmVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VHJhbnNtaXNzaW9uIExpbmVzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjZhZDY3N2JiYjliMjQ1NzAyMGY1MlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIFwiKTtfLmIoXy52KF8uZihcInRyYW5zbWlzc2lvbkxpbmVzXCIsYyxwLDApKSk7Xy5iKFwiIGttIGZyb20gdGhlIG5lYXJlc3QgdHJhbnNtaXNzaW9uIGxpbmVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwxMTMzLDEyNTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiY3VsdHVyZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggRXhpc3RpbmcgUHJvdGVjdGVkIEFyZWFzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUyMGQ0YzJhNjc0NjU5Y2I3YjM1ZDU3NVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBFeGlzdGluZyBQcm90ZWN0ZWQgQXJlYXMuIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UHJvdGVjdGVkIEFyZWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImhhc092ZXJsYXBXaXRoRXhpc3RpbmdNUEFzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpjZW50ZXI7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8cD5ObyBvdmVybGFwIHdpdGggZXhpc3RpbmcgcHJvdGVjdGVkIGFyZWFzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImV4aXN0aW5nTVBBc1wiLGMscCwxKSxjLHAsMCw4OTYsMTAxNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLiAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhZGphY2VudFByb3RlY3RlZEFyZWFcIixjLHAsMSksYyxwLDAsMTUzNSwyMDIwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5BZGphY2VudCB0byBUZXJyZXN0cmlhbCBQcm90ZWN0ZWQgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlIGdyZWVuLWNoZWNrXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIGFkamFjZW50IHRvIGEgPHN0cm9uZz5UZXJyZXN0cmlhbCBQcm90ZWN0ZWQgQXJlYTwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCdWlsZCBvbiBwYXN0IGFuZCBleGlzdGluZyB6b25pbmcgZWZmb3J0cyB0aGF0IGFyZSBjb25zaXN0ZW50IHdpdGggYW4gZWNvc3lzdGVtLWJhc2VkIG1hbmFnZW1lbnQgYXBwcm9hY2guICBXaGVyZXZlciBwb3NzaWJsZSwgZG8gbm90IGR1cGxpY2F0ZSBleGlzdGluZyB6b25pbmcgZWZmb3J0cyBhbmQgY29uc2lkZXIgZXhpc3RpbmcgdGVycmVzdHJpYWwgem9uaW5nIGZvciBhZGphY2VudCBtYXJpbmUgem9uaW5nIHRvIGFjaGlldmUgem9uaW5nIG9iamVjdGl2ZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBGaXNoZXJpZXMgQ2xvc3VyZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBGaXNoZXJpZXMgQ2xvc3VyZXMuIEZpc2hlcmllcyBjbG9zdXJlcyBtYXkgbmVlZCB0byBiZSBjb25zaWRlcmVkIHRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gdXNlcyBhbmQgYWN0aXZpdGllcy4gRmVkZXJhbCBSb2NrZmlzaCBDb25zZXJ2YXRpb24gQXJlYXMgYW5kIEZlZGVyYWwgU3BvbmdlIFJlZWYgUmVzZXJ2ZSBhcmUgYW5hbHlzZWQgZm9yIG92ZXJsYXAgd2l0aCBcIik7aWYoXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwwLDI0MjcsMjQ1MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiem9uZXMgd2l0aGluIHRoaXMgcHJvcG9zYWxcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJhcnJheVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInRoaXMgem9uZVwiKTt9O18uYihcIi4gXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5UZW51cmVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJoYXNDbG9zdXJlc1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpjZW50ZXI7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8cD5ObyBvdmVybGFwIHdpdGggZmlzaGVyaWVzIGNsb3N1cmVzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImNsb3N1cmVzXCIsYyxwLDEpLGMscCwwLDI4NTgsMjk3NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIEZpc2hlcmllcyBjbG9zdXJlcyBtYXkgbmVlZCB0byBiZSBjb25zaWRlcmVkIHRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gdXNlcyBhbmQgYWN0aXZpdGllcy4gRmVkZXJhbCBSb2NrZmlzaCBDb25zZXJ2YXRpb24gQXJlYXMgYW5kIEZlZGVyYWwgU3BvbmdlIFJlZWYgUmVzZXJ2ZSBhcmUgYW5hbHlzZWQgZm9yIG92ZXJsYXAgd2l0aCBcIik7aWYoXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwwLDMyOTEsMzMxNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiem9uZXMgd2l0aGluIHRoaXMgcHJvcG9zYWxcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJhcnJheVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInRoaXMgem9uZVwiKTt9O18uYihcIi4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIFByb3ZpbmNpYWwgVGVudXJlcyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYyZjVjYmE3MmVjMDY4MTYwNjIwOGVcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgUHJvdmluY2lhbCBUZW51cmVzLlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VGVudXJlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiaGFzUHJvdmluY2lhbFRlbnVyZXNcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmNlbnRlcjtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDxwPk5vIG92ZXJsYXAgd2l0aCBQcm92aW5jaWFsIFRlbnVyZXM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwicHJvdmluY2lhbFwiLGMscCwxKSxjLHAsMCw0MTY5LDQyODcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBUbyBhdm9pZCwgbWluaW1pc2UgYW5kL29yIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gZXhpc3RpbmcgdGVudXJlZCB1c2VzIGFuZCBhY3Rpdml0aWVzIGFuZCBtYXJpbmUgcHJvdGVjdGlvbiwgZXhhbWluZSB0aGUgb3ZlcmxhcCB3aXRoIHByb3ZpbmNpYWwgY3Jvd24gdGVudXJlcyBmcm9tIHRoZSBCQyBQcm92aW5jaWFsIHRlbnVyZXMgZGF0YWJhc2UuIERhdGEgc291cmNlOiBQcm92aW5jaWFsIFRlbnVyZXMuIFVwZGF0ZWQ6IERlYyAxMDEzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImRlbW9cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3V0cHV0PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwcmU+XCIpO18uYihfLnYoXy5mKFwicmVzdWx0XCIsYyxwLDApKSk7Xy5iKFwiPC9wcmU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImVjb25vbWljXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKCFfLnMoXy5mKFwicG16XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGlzdGFuY2UgdG8gVHJhbnNtaXNzaW9uIExpbmVzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjZhZDY3N2JiYjliMjQ1NzAyMGY1MlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwidHJhbnNtaXNzaW9uTGluZXNcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4ga20gZnJvbSB0aGUgbmVhcmVzdCA8c3Ryb25nPnRyYW5zbWlzc2lvbiBsaW5lczwvc3Ryb25nPi4gVGhpcyBob3Jpem9udGFsLCBzdHJhaWdodCBsaW5lIGRpc3RhbmNlIG1pZ2h0IGJlIGhlbHBmdWwgaW4gY2FsY3VsYXRpbmcgdGhlIHBvc3NpYmxlIGVjb25vbWljIGNvc3RzIGZvciByZW5ld2FibGUgZW5lcmd5IGRldmVsb3BtZW50IGluIHRoaXMgem9uZS4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGlzdGFuY2UgdG8gSW5mcmFzdHJ1Y3R1cmU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkluZnJhc3RydWN0dXJlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5EaXN0YW5jZSAoa20pPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImluZnJhc3RydWN0dXJlXCIsYyxwLDEpLGMscCwwLDcwNSw3OTEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJEaXN0SW5LTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0ZCBjb2xzcGFuPVxcXCIyXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUaGUgaG9yaXpvbnRhbCBkaXN0YW5jZSB0byBmZXJyaWVzLCBwb3J0cywgaGFyYm91cnMsIGZ1ZWwgZG9ja3MsIGFuZCBvdGhlciBtYXJpbmUgYW5kIGNvYXN0YWwgaW5mcmFzdHJ1Y3R1cmUgbWlnaHQgYmUgaGVscGZ1bCBmb3IgcGxhbm5pbmcgbWFyaW5lIHVzZXMgYW5kIGFjdGl2aXRpZXMgdGhhdCBhcmUgc3VwcG9ydGVkIGluIHRoaXMgem9uZS4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcInBtelwiLGMscCwxKSxjLHAsMCwxMTY2LDEzMTUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk5vIFJlcG9ydHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgTm8gSHVtYW4gV2VsbC1CZWluZyByZXBvcnRzIGZvciBQcm90ZWN0aW9uIE1hbmFnZW1lbnQgWm9uZXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZW52aXJvbm1lbnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdCBSZXByZXNlbnRhdGlvbiA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjMwMmQ1MDhkYzRmNWYyZDAwOTk2YVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT4gLS0+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlByb3RlY3RlZCBBcmVhIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UHJvdGVjdGVkIEFyZWEgKCUpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhYml0YXRzXCIsYyxwLDEpLGMscCwwLDM4Myw0NzEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj48dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX05BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPjwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgSGFiaXRhdCBkYXRhIGZvciBiZW50aGljIGVjb3N5c3RlbXMsIHBlbGFnaWMgYXJlYXMsIGFuZCBvY2Vhbm9ncmFwaGljIHByb2Nlc3NlcyBpcyB1c2VkIHRvIGluZm9ybSBzaXRpbmcgb2YgdGhpcyB6b25lLiBJbmNsdWRlZCBoZXJlIGFyZSBiaW9nZW5pYyBoYWJpdGF0cyBhcyB3ZWxsIGFzIGNvbW11bml0eS1mb3JtaW5nIHNwZWNpZXMsIHN1Y2ggYXMgZWVsZ3Jhc3MgYW5kIGtlbHAuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIEltcG9ydGFudCBNYXJpbmUgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlICBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgSW1wb3J0YW50IE1hcmluZSBBcmVhc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW1wb3J0YW50IEFyZWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaW1wb3J0YW50QXJlYXNcIixjLHAsMSksYyxwLDAsMTIwNCwxMzIyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJwbXpcIixjLHAsMSksYyxwLDAsMTQzOCwyMTY3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgV2hlbiBzZWxlY3Rpbmcgc2l0ZXMgZm9yIFBNWnMsIGNvbnNpZGVyIHRoZSBsb2NhdGlvbiBvZiBJbXBvcnRhbnQgTWFyaW5lIEFyZWFzIGZvciBtYXJpbmUgbWFtbWFscywgZmlzaCBhbmQgYmlyZHMuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIEltcG9ydGFudCBBcmVhcyB3ZXJlIGlkZW50aWZpZWQgZHVyaW5nIHRoZSBwcm9jZXNzIG9mIGVzdGFibGlzaGluZyBFY29sb2dpY2FsbHkgYW5kIEJpb2xvZ2ljYWxseSBTaWduaWZpY2FudCBBcmVhcyAoRUJTQXMpIGJ5IHRoZSA8YSBocmVmPVxcXCJodHRwOi8vcG5jaW1hLm9yZy9zaXRlL2F0bGFzLmh0bWxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj4gUGFjaWZpYyBOb3J0aCBDb2FzdCBJbnRlZ3JhdGVkIE1hbmFnZW1lbnQgQXJlYSAoUE5DSU1BKTwvYT4uIEltcG9ydGFudCBCaXJkIEFyZWFzIChJQkFzKSB3ZXJlIGFsc28gaWRlbnRpZmllZCBieSBCaXJkIFN0dWRpZXMgQ2FuYWRhIGFuZCBOYXR1cmUgQ2FuYWRhLCBpbiBwYXJ0bmVyc2hpcCB3aXRoIEJpcmRMaWZlIEludGVybmF0aW9uYWwuICBDcml0aWNhbCBIYWJpdGF0IG1lZXRzIENhbmFkYSdzIFNwZWNpZXMgYXQgUmlzayAoU0FSQSkgcmVxdWlyZW1lbnRzLiBTZWUgZGF0YSBsYXllcnMgZm9yIG1vcmUgaW5mb3JtYXRpb24uICBEYXRhIHNvdXJjZXM6IHVwIHRvIDIwMDkuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJzbXpcIixjLHAsMSksYyxwLDAsMjE5MiwzMTgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgVG8gcmVkdWNlIHBvdGVudGlhbCBjb25mbGljdHMgYmV0d2VlbiBodW1hbiB1c2VzIGFuZCBtYXJpbmUgc3BlY2llcywgY29uc2lkZXIgdGhlc2UgSW1wb3J0YW50IE1hcmluZSBBcmVhcyBmb3IgbWFyaW5lIG1hbW1hbHMsIGZpc2ggYW5kIGJpcmRzLiAgVGhlc2UgYXJlYXMgZG8gbm90IGluY2x1ZGUgYWxsIG9mIHRoZSBmb3JhZ2luZyBhbmQgYnJlZWRpbmcgbG9jYXRpb25zIGZvciBtYXJpbmUgc3BlY2llcyBpbiB0aGUgTWFQUCBzdHVkeSBhcmVhLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBJbXBvcnRhbnQgQXJlYXMgd2VyZSBpZGVudGlmaWVkIGR1cmluZyB0aGUgcHJvY2VzcyBvZiBlc3RhYmxpc2hpbmcgRWNvbG9naWNhbGx5IGFuZCBCaW9sb2dpY2FsbHkgU2lnbmlmaWNhbnQgQXJlYXMgKEVCU0FzKSBieSB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL3BuY2ltYS5vcmcvc2l0ZS9hdGxhcy5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+IFBhY2lmaWMgTm9ydGggQ29hc3QgSW50ZWdyYXRlZCBNYW5hZ2VtZW50IEFyZWEgKFBOQ0lNQSk8L2E+LiBJbXBvcnRhbnQgQmlyZCBBcmVhcyAoSUJBcykgd2VyZSBhbHNvIGlkZW50aWZpZWQgYnkgQmlyZCBTdHVkaWVzIENhbmFkYSBhbmQgTmF0dXJlIENhbmFkYSwgaW4gcGFydG5lcnNoaXAgd2l0aCBCaXJkTGlmZSBJbnRlcm5hdGlvbmFsLiAgQ3JpdGljYWwgSGFiaXRhdCBtZWV0cyBDYW5hZGEncyBTcGVjaWVzIGF0IFJpc2sgKFNBUkEpIHJlcXVpcmVtZW50cy4gUG90ZW50aWFsIGNyaXRpY2FsIGlzIGluc3VmZmljaWVudCBpbmZvcm1hdGlvbiB0byBtZWV0IFNBUkEgcmVxdWlyZW1lbnRzLiBTZWUgdGhlIFBOQ0lNQSBhdGxhcyBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gU2VlIGRhdGEgbGF5ZXJzIGZvciBtb3JlIGluZm9ybWF0aW9uLiAgRGF0YSBzb3VyY2VzOiB1cCB0byAyMDA5LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk1hcnhhbiBBbmFseXNpczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8c2VsZWN0IGNsYXNzPVxcXCJjaG9zZW5cXFwiIHdpZHRoPVxcXCI0MDBweFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1hcnhhbkFuYWx5c2VzXCIsYyxwLDEpLGMscCwwLDM0ODEsMzUyNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxvcHRpb24gdmFsdWU9XFxcIlwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCI8L29wdGlvbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC9zZWxlY3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9SZXN1bHRzXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvRGVzY3JpcHRpb25cXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBNYVBQIGNvbGxhYm9yYXRlZCB3aXRoIHRoZSA8YSBocmVmPVxcXCJodHRwOi8vYmNtY2EuY2EvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+QkMgTWFyaW5lIENvbnNlcnZhdGlvbiBBbmFseXNpcyAoQkNNQ0EpPC9hPiB0byBpZGVudGlmeSBtYXJpbmUgYXJlYXMgb2YgaGlnaCBjb25zZXJ2YXRpb24gdmFsdWUgYmFzZWQgb24gc3BhdGlhbCBkYXRhc2V0cyBvZiBlY29sb2dpY2FsIGluZm9ybWF0aW9uLiBUaGVzZSBNYXJ4YW4gc2NlbmFyaW9zIGNhbiBiZSB1c2VkIHRvIGluZm9ybSB0aGUgbG9jYXRpb24gb3Igc2l0aW5nIG9mIE1hUFAgem9uZXMuIDxhIGhyZWY9XFxcImh0dHA6Ly93d3cudXEuZWR1LmF1L21hcnhhbi9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5NYXJ4YW48L2E+IGlzIGEgZGVjaXNpb24gc3VwcG9ydCB0b29sIGRldmVsb3BlZCBieSB0aGUgVW5pdmVyc2l0eSBvZiBRdWVlbnNsYW5kIHRvIHByb3ZpZGUgc29sdXRpb25zIHRvIHRoZSDigJxtaW5pbXVtIHNldCBwcm9ibGVt4oCdIC0gY2FwdHVyaW5nIGEgc3BlY2lmaWVkIGFtb3VudCAodGFyZ2V0KSBvZiBpbmRpdmlkdWFsIGZlYXR1cmVzIGZvciB0aGUgbGVhc3QgY29zdC4gQmFzZWQgb24gcmVsYXRpdmVseSBzaW1wbGUgbWF0aGVtYXRpY2FsIGFsZ29yaXRobXMgYW5kIGVxdWF0aW9ucywgTWFyeGFuIHNlYXJjaGVzIG1pbGxpb25zIG9mIHBvdGVudGlhbCBzb2x1dGlvbnMgdG8gZmluZCB0aGUgYmVzdCBiYWxhbmNlIGJldHdlZW4gY29zdHMgYW5kIGJlbmVmaXRzLiBJbiBzaG9ydCwgTWFyeGFuIHNvbHV0aW9ucyBtaW5pbWl6ZSB0aGUgb3ZlcmFsbCBjb3N0IHN1YmplY3QgdG8gdGhlIGNvbnN0cmFpbnQgb2YgbWVldGluZyBzcGVjaWZpZWQg4oCcdGFyZ2V0c+KAnSBmb3IgYWxsIGZlYXR1cmVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIE1hUFAgY29uc3VsdGVkIHRoZSBNYVBQIFNjaWVuY2UgQWR2aXNvcnkgQ29tbWl0dGVlIChTQUMpIGZvciBhZHZpY2Ugb24gc2NlbmFyaW9zIGFuZCB0YXJnZXQgc2VsZWN0aW9uLiAgVGhlIFNBQyBzdXBwb3J0ZWQgdGhlIGRlY2lzaW9uIHRvIHVzZSB0aGUgcGVyY2VudGFnZSB0YXJnZXQgY2F0ZWdvcmllcyBlc3RhYmxpc2hlZCBieSB0aGUgQkNNQ0EgcHJvamVjdCB0ZWFtIGluIDIwMDYuIFBsZWFzZSBzZWUgdGhpcyA8YSBocmVmPVxcXCJodHRwczovL2RsLmRyb3Bib3h1c2VyY29udGVudC5jb20vdS8xNzY0OTg2L0JDTUNBLU1hcnhhbiBmb3IgTWFQUC1SZXBvcnQgb24gaW5pdGlhbCBzY2VuYXJpb3NfMjdGZWIyMDEzLnBkZlxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPjIwMTMgQkNNQ0EgcmVwb3J0PC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgTWFQUC1CQ01DQSBwcm9qZWN0IGFuZCBNYXJ4YW4gc2NlbmFyaW9zLCBhbmQgY29uc3VsdCB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL2JjbWNhLmNhXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+QkNNQ0EgQXRsYXM8L2E+IGZvciBkZXRhaWxlZCBpbmZvcm1hdGlvbiBhYm91dCB0YXJnZXRzLCBzcGVjaWVzLCBhbmQgaGFiaXRhdHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+QWRqYWNlbnQgQnJlZWRpbmcgU2l0ZXMgZm9yIEJpcmRzIGFuZCBNYW1tYWxzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSAgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIklzIG5vdCBhZGphY2VudCB0byBicmVlZGluZyBzaXRlcyBmb3IgYmlyZHMgYW5kIG1hbW1hbHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlNwZWNpZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk51bWJlciBvZiBCcmVlZGluZyBBcmVhcyBvciBOZXN0aW5nIFNpdGVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm5vbkZpc2hCcmVlZGluZ0FyZWFzXCIsYyxwLDEpLGMscCwwLDU1NDAsNTYyNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlNQRUNJRVNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNPVU5UXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiMlxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFdoZW4gc2VsZWN0aW5nIHNpdGVzLCBjb25zaWRlciBwcm94aW1pdHkgdG8gYnJlZWRpbmcgYXJlYXMgb3IgbmVzdGluZyBzaXRlcyBmb3IgYmlyZHMgYW5kIG1hbW1hbHMgaW4gZWZmb3J0IHRvIG1pbmltaXplIGRpc3R1cmJhbmNlIGFuZCBwcm90ZWN0IGFkamFjZW50IGZvcmFnaW5nIGFyZWEuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBNYXJpbmUgQ2xhc3NpZmljYXRpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSAgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IE1hcmluZSBDbGFzc2lmaWNhdGlvbnNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkNsYXNzaWZpY2F0aW9uPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1hcmluZUNsYXNzaWZpY2F0aW9uc1wiLGMscCwxKSxjLHAsMCw2MzU3LDY0NzksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgSW4gUHJvdGVjdGlvbiBNYW5hZ2VtZW50IFpvbmVzLCByZXByZXNlbnRhdGlvbiBpcyBvZnRlbiBvbmUgY3JpdGVyaWEgZm9yIHNpdGluZyBpbiBhIG5ldHdvcmsuIERhdGEgZm9yIHRoaXMgcmVwb3J0IGluY2x1ZGVzIGJlbnRoaWMgZWNvc3lzdGVtcyBhbmQgb2NlYW5vZ3JhcGhpYyBwcm9jZXNzZXMuICBTZWUgbWV0YWRhdGEgaW4gdGhlIGRhdGEgbGF5ZXJzIGZvciBtb3JlIGluZm9ybWF0aW9uLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wib3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIHpvbmUgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzaXplXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBraWxvbWV0ZXJzPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudFwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIFwiKTtfLmIoXy52KF8uZihcInNjX25hbWVcIixjLHAsMCkpKTtfLmIoXCIuIFNpemUgaXMgdXNlZCB0byBxdWFudGlmeSBkcmFmdCBzcGF0aWFsIHpvbmVzIGFuZCBwcm92aWRlIHBlcmNlbnQgY292ZXJhZ2UuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwzMDMsNDI5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdOyJdfQ==
;