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
var ArrayCultureTab, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

ArrayCultureTab = (function(_super) {
  __extends(ArrayCultureTab, _super);

  function ArrayCultureTab() {
    _ref = ArrayCultureTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayCultureTab.prototype.name = 'Governance';

  ArrayCultureTab.prototype.className = 'culture';

  ArrayCultureTab.prototype.template = templates.arrayCulture;

  ArrayCultureTab.prototype.dependencies = ["ExistingMarineProtectedAreas", "Closures", "OverlapWithExistingProvincialTenures"];

  ArrayCultureTab.prototype.timeout = 600000;

  ArrayCultureTab.prototype.render = function() {
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
      hasOverlapWithExistingMPAs: hasOverlapWithExistingMPAs
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    return this.enableTablePaging();
  };

  return ArrayCultureTab;

})(ReportTab);

module.exports = ArrayCultureTab;


},{"../templates/templates.js":16,"reportTab":"ljLVGb"}],12:[function(require,module,exports){
var ArrayEconomicTab, ReportTab, templates, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

ArrayEconomicTab = (function(_super) {
  __extends(ArrayEconomicTab, _super);

  function ArrayEconomicTab() {
    _ref = ArrayEconomicTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayEconomicTab.prototype.name = 'Human Well-Being';

  ArrayEconomicTab.prototype.className = 'economic';

  ArrayEconomicTab.prototype.template = templates.arrayEconomic;

  ArrayEconomicTab.prototype.dependencies = [];

  ArrayEconomicTab.prototype.timeout = 600000;

  ArrayEconomicTab.prototype.render = function() {
    var context;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      array: true
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    return this.enableTablePaging();
  };

  return ArrayEconomicTab;

})(ReportTab);

module.exports = ArrayEconomicTab;


},{"../templates/templates.js":16,"reportTab":"ljLVGb"}],13:[function(require,module,exports){
var ArrayEnvironmentTab, ReportTab, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

ArrayEnvironmentTab = (function(_super) {
  __extends(ArrayEnvironmentTab, _super);

  function ArrayEnvironmentTab() {
    this.renderMarxanAnalysis = __bind(this.renderMarxanAnalysis, this);
    _ref = ArrayEnvironmentTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayEnvironmentTab.prototype.name = 'Ecological Integrity';

  ArrayEnvironmentTab.prototype.className = 'environment';

  ArrayEnvironmentTab.prototype.template = templates.arrayEnvironment;

  ArrayEnvironmentTab.prototype.dependencies = ['OverlapWithImportantAreas', 'OverlapWithBiogenicAndCommunityFormingSpecies', 'OverlapWithNonFishBreedingAreas', 'OverlapWithMarineClassifications', 'MarxanAnalysis'];

  ArrayEnvironmentTab.prototype.timeout = 600000;

  ArrayEnvironmentTab.prototype.render = function() {
    var context, importantAreas,
      _this = this;
    importantAreas = this.recordSet("OverlapWithImportantAreas", "OverlapWithImportantAreas").toArray();
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      nonFishBreedingAreas: this.recordSet('OverlapWithNonFishBreedingAreas', 'OverlapWithNonFishBreedingAreas').toArray(),
      habitats: this.recordSet('OverlapWithBiogenicAndCommunityFormingSpecies', 'OverlapWithBiogenicAndCommunityFormingSpecies').toArray(),
      importantAreas: importantAreas,
      marineClassifications: this.recordSet('OverlapWithMarineClassifications', 'OverlapWithMarineClassifications').toArray(),
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

  ArrayEnvironmentTab.prototype.renderMarxanAnalysis = function() {
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
    this.$('.scenarioResults').html("The average Marxan score for this zones within this proposal is <strong>" + data.SCORE + "</strong>, placing it in \nthe <strong>" + (min_q.replace('Q', '')) + "% - " + (max_q.replace('Q', '')) + "% quantile \nrange</strong> for this sub-region.");
    this.$('.scenarioDescription').html(data.MARX_DESC.replace('this zone ', 'zones within this proposal '));
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
      this.$('.viz').append('<br style="clear:both;">');
      return this.$('');
    }
  };

  return ArrayEnvironmentTab;

})(ReportTab);

module.exports = ArrayEnvironmentTab;


},{"../templates/templates.js":16,"reportTab":"ljLVGb"}],14:[function(require,module,exports){
var ArrayOverviewTab, ReportTab, key, partials, templates, val, _partials, _ref,
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

ArrayOverviewTab = (function(_super) {
  __extends(ArrayOverviewTab, _super);

  function ArrayOverviewTab() {
    _ref = ArrayOverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ArrayOverviewTab.prototype.name = 'Overview';

  ArrayOverviewTab.prototype.className = 'overview';

  ArrayOverviewTab.prototype.template = templates.arrayOverview;

  ArrayOverviewTab.prototype.dependencies = ['ZoneSize'];

  ArrayOverviewTab.prototype.timeout = 600000;

  ArrayOverviewTab.prototype.render = function() {
    var TableOfContents, context, node, nodes, _i, _len;
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      size: this.recordSet('ZoneSize', 'ZoneSize').float('SIZE_SQ_KM', 2),
      percent: this.recordSet('ZoneSize', 'ZoneSize').float('SIZE_PERC', 1),
      sc_name: this.recordSet('ZoneSize', 'ZoneSize').raw('SC_NAME'),
      numChildren: this.children.length
    };
    this.$el.html(this.template.render(context, partials));
    this.enableLayerTogglers();
    nodes = [this.model];
    this.model.set('open', true);
    nodes = nodes.concat(this.children);
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      node.set('selected', false);
    }
    TableOfContents = window.require('views/tableOfContents');
    this.toc = new TableOfContents(nodes);
    this.$('.tocContainer').append(this.toc.el);
    return this.toc.render();
  };

  ArrayOverviewTab.prototype.remove = function() {
    var _ref1;
    if ((_ref1 = this.toc) != null) {
      _ref1.remove();
    }
    return ArrayOverviewTab.__super__.remove.call(this);
  };

  return ArrayOverviewTab;

})(ReportTab);

module.exports = ArrayOverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"m3z/87","../templates/templates.js":16,"reportTab":"ljLVGb"}],15:[function(require,module,exports){
var ArrayCultureTab, ArrayEconomicTab, ArrayEnvironmentTab, ArrayOverviewTab;

ArrayOverviewTab = require('./arrayOverviewTab.coffee');

ArrayEnvironmentTab = require('./arrayEnvironmentTab.coffee');

ArrayEconomicTab = require('./arrayEconomicTab.coffee');

ArrayCultureTab = require('./arrayCultureTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([ArrayOverviewTab, ArrayEnvironmentTab, ArrayEconomicTab, ArrayCultureTab]);
  return report.stylesheets(['./report.css']);
});


},{"./arrayCultureTab.coffee":11,"./arrayEconomicTab.coffee":12,"./arrayEnvironmentTab.coffee":13,"./arrayOverviewTab.coffee":14}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};

this["Templates"]["arrayCulture"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Existing Protected Areas <a href=\"#\" data-toggle-node=\"520d4c2a674659cb7b35d575\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Existing Protected Areas. MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Protected Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasOverlapWithExistingMPAs",c,p,1),c,p,1,0,0,"")){_.b("        <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with existing protected areas</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("existingMPAs",c,p,1),c,p,0,898,1016,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.  ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("pmz",c,p,1),c,p,0,1520,3003,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Fisheries Closures</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Fisheries Closures. Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,1900,1926,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". \">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasClosures",c,p,1),c,p,1,0,0,"")){_.b("          <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with fisheries closures</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("closures",c,p,1),c,p,0,2333,2451,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,2766,2792,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Provincial Tenures <a href=\"#\" data-toggle-node=\"51f2f5cba72ec0681606208e\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Provincial Tenures.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasProvincialTenures",c,p,1),c,p,1,0,0,"")){_.b("        <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with Provincial Tenures</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("provincial",c,p,1),c,p,0,3653,3771,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          To avoid, minimise and/or reduce potential conflicts between existing tenured uses and activities and marine protection, examine the overlap with provincial crown tenures from the BC Provincial tenures database. Data source: Provincial Tenures. Updated: Dec 1013");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["arrayEconomic"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>No Reports </h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    Human Well-Being reports for collections are coming soon...");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});

this["Templates"]["arrayEnvironment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation (All Zones Combined)</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Protected Area (km²)</th>");_.b("\n" + i);_.b("        <th>Protected Area (%)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,303,391,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"4\" class=\"paragraph\">");_.b("\n" + i);_.b("          Habitat data for benthic ecosystems, pelagic areas, and oceanographic processes is used to inform siting of zones. Included here are biogenic habitats as well as community-forming species, such as eelgrass and kelp.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Important Marine Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Important Marine Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Important Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("importantAreas",c,p,1),c,p,0,1120,1238,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            When selecting sites for PMZs, consider the location of Important Marine Areas for marine mammals, fish and birds. To reduce potential conflicts between human uses and marine species when siting SMZs, consider these Important Marine Areas for marine mammals, fish and birds. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            Important Areas were identified during the process of establishing Ecologically and Biologically Significant Areas (EBSAs) by the <a href=\"http://pncima.org/site/atlas.html\" target=\"_blank\"> Pacific North Coast Integrated Management Area (PNCIMA)</a>. Important Bird Areas (IBAs) were also identified by Bird Studies Canada and Nature Canada, in partnership with BirdLife International.  Critical Habitat meets Canada's Species at Risk (SARA) requirements. Potential critical is insufficient information to meet SARA requirements. See the PNCIMA atlas for more information. See data layers for more information.  Data sources: up to 2009.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,2625,2671,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP collaborated with the <a href=\"http://bcmca.ca/\" target=\"_blank\">BC Marine Conservation Analysis (BCMCA)</a> to identify marine areas of high conservation value based on spatial datasets of ecological information. These Marxan scenarios can be used to inform the location or siting of MaPP zones. <a href=\"http://www.uq.edu.au/marxan/\" target=\"_blank\">Marxan</a> is a decision support tool developed by the University of Queensland to provide solutions to the “minimum set problem” - capturing a specified amount (target) of individual features for the least cost. Based on relatively simple mathematical algorithms and equations, Marxan searches millions of potential solutions to find the best balance between costs and benefits. In short, Marxan solutions minimize the overall cost subject to the constraint of meeting specified “targets” for all features.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP consulted the MaPP Science Advisory Committee (SAC) for advice on scenarios and target selection.  The SAC supported the decision to use the percentage target categories established by the BCMCA project team in 2006. Please see this <a href=\"https://dl.dropboxusercontent.com/u/1764986/BCMCA-Marxan for MaPP-Report on initial scenarios_27Feb2013.pdf\" target=\"_blank\">2013 BCMCA report</a> for more information about the MaPP-BCMCA project and Marxan scenarios, and consult the <a href=\"http://bcmca.ca\" target=\"_blank\">BCMCA Atlas</a> for detailed information about targets, species, and habitats.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Adjacent Breeding Sites for Birds and Mammals</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Is not adjacent to breeding sites for birds and mammals\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Species</th>");_.b("\n" + i);_.b("        <th>Number of Breeding Areas or Nesting Sites</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("nonFishBreedingAreas",c,p,1),c,p,0,4684,4770,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SPECIES",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("      <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"2\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            When selecting sites, consider proximity to breeding areas or nesting sites for birds and mammals in effort to minimize disturbance and protect adjacent foraging area. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Marine Classifications</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Marine Classifications\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Classification</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("marineClassifications",c,p,1),c,p,0,5503,5625,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            In Protection Management Zones, representation is often one criteria for siting in a network. Data for this report includes benthic ecosystems and oceanographic processes.  See metadata in the data layers for more information. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["arrayOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This regional proposal contains ");_.b(_.v(_.f("numChildren",c,p,0)));_.b(" zones and covers a total of <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>, which represents <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the ");_.b(_.v(_.f("sc_name",c,p,0)));_.b(".");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"tocContainer\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!-- ");if(_.s(_.f("adjacentProtectedArea",c,p,1),c,p,0,337,813,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Nearby Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    Zones within this proposal are adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Build on past and existing zoning efforts that are consistent with an ecosystem-based management approach.  Wherever possible, do not duplicate existing zoning efforts and consider existing terrestrial zoning for adjacent marine zoning to achieve zoning objectives.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b(" -->");_.b("\n" + i);_.b("<!-- <div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Transmission Lines <a href=\"#\" data-toggle-node=\"51f6ad677bbb9b2457020f52\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is ");_.b(_.v(_.f("transmissionLines",c,p,0)));_.b(" km from the nearest transmission lines.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b(" -->");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,1133,1259,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["culture"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Existing Protected Areas <a href=\"#\" data-toggle-node=\"520d4c2a674659cb7b35d575\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Existing Protected Areas. MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Protected Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasOverlapWithExistingMPAs",c,p,1),c,p,1,0,0,"")){_.b("        <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with existing protected areas</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("existingMPAs",c,p,1),c,p,0,896,1014,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.  ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);if(_.s(_.f("adjacentProtectedArea",c,p,1),c,p,0,1535,2020,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Adjacent to Terrestrial Protected Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    This zone is adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Build on past and existing zoning efforts that are consistent with an ecosystem-based management approach.  Wherever possible, do not duplicate existing zoning efforts and consider existing terrestrial zoning for adjacent marine zoning to achieve zoning objectives.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}if(_.s(_.f("pmz",c,p,1),c,p,0,2055,3536,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Fisheries Closures</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Fisheries Closures. Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,2435,2461,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". \">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasClosures",c,p,1),c,p,1,0,0,"")){_.b("          <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with fisheries closures</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("closures",c,p,1),c,p,0,2866,2984,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,3299,3325,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Provincial Tenures <a href=\"#\" data-toggle-node=\"51f2f5cba72ec0681606208e\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Provincial Tenures.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(!_.s(_.f("hasProvincialTenures",c,p,1),c,p,1,0,0,"")){_.b("        <tr>");_.b("\n" + i);_.b("          <td colspan=\"3\" style=\"text-align:center;\">");_.b("\n" + i);_.b("            <p>No overlap with Provincial Tenures</p>");_.b("\n" + i);_.b("          </td>");_.b("\n" + i);_.b("        </tr>");_.b("\n");};if(_.s(_.f("provincial",c,p,1),c,p,0,4186,4304,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          To avoid, minimise and/or reduce potential conflicts between existing tenured uses and activities and marine protection, examine the overlap with provincial crown tenures from the BC Provincial tenures database. Data source: Provincial Tenures. Updated: Dec 1013");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Output</h4>");_.b("\n" + i);_.b("  <pre>");_.b(_.v(_.f("result",c,p,0)));_.b("</pre>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["economic"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(!_.s(_.f("pmz",c,p,1),c,p,1,0,0,"")){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Distance to Transmission Lines <a href=\"#\" data-toggle-node=\"51f6ad677bbb9b2457020f52\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is <strong>");_.b(_.v(_.f("transmissionLines",c,p,0)));_.b("</strong> km from the nearest <strong>transmission lines</strong>. This horizontal, straight line distance might be helpful in calculating the possible economic costs for renewable energy development in this zone. ");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Distance to Infrastructure</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Infrastructure</th>");_.b("\n" + i);_.b("        <th>Distance (km)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("infrastructure",c,p,1),c,p,0,705,791,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("DistInKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("      <td colspan=\"2\" class=\"paragraph\">");_.b("\n" + i);_.b("      The horizontal distance to ferries, ports, harbours, fuel docks, and other marine and coastal infrastructure might be helpful for planning marine uses and activities that are supported in this zone. ");_.b("\n" + i);_.b("      </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");};if(_.s(_.f("pmz",c,p,1),c,p,0,1166,1315,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>No Reports</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    No Human Well-Being reports for Protection Management Zones");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation <!-- <a href=\"#\" data-toggle-node=\"51f302d508dc4f5f2d00996a\" data-visible=\"false\">show layer</a> --></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Protected Area (km²)</th>");_.b("\n" + i);_.b("        <th>Protected Area (%)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,383,471,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Habitat data for benthic ecosystems, pelagic areas, and oceanographic processes is used to inform siting of this zone. Included here are biogenic habitats as well as community-forming species, such as eelgrass and kelp.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Important Marine Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Important Marine Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Important Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("importantAreas",c,p,1),c,p,0,1204,1322,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);if(_.s(_.f("pmz",c,p,1),c,p,0,1438,2167,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <p>");_.b("\n" + i);_.b("            When selecting sites for PMZs, consider the location of Important Marine Areas for marine mammals, fish and birds. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            Important Areas were identified during the process of establishing Ecologically and Biologically Significant Areas (EBSAs) by the <a href=\"http://pncima.org/site/atlas.html\" target=\"_blank\"> Pacific North Coast Integrated Management Area (PNCIMA)</a>. Important Bird Areas (IBAs) were also identified by Bird Studies Canada and Nature Canada, in partnership with BirdLife International.  Critical Habitat meets Canada's Species at Risk (SARA) requirements. See data layers for more information.  Data sources: up to 2009.");_.b("\n" + i);_.b("          </p>");_.b("\n");});c.pop();}if(_.s(_.f("smz",c,p,1),c,p,0,2192,3181,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <p>");_.b("\n" + i);_.b("            To reduce potential conflicts between human uses and marine species, consider these Important Marine Areas for marine mammals, fish and birds.  These areas do not include all of the foraging and breeding locations for marine species in the MaPP study area. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            Important Areas were identified during the process of establishing Ecologically and Biologically Significant Areas (EBSAs) by the <a href=\"http://pncima.org/site/atlas.html\" target=\"_blank\"> Pacific North Coast Integrated Management Area (PNCIMA)</a>. Important Bird Areas (IBAs) were also identified by Bird Studies Canada and Nature Canada, in partnership with BirdLife International.  Critical Habitat meets Canada's Species at Risk (SARA) requirements. Potential critical is insufficient information to meet SARA requirements. See the PNCIMA atlas for more information. See data layers for more information.  Data sources: up to 2009.");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("\n");});c.pop();}_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,3481,3527,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP collaborated with the <a href=\"http://bcmca.ca/\" target=\"_blank\">BC Marine Conservation Analysis (BCMCA)</a> to identify marine areas of high conservation value based on spatial datasets of ecological information. These Marxan scenarios can be used to inform the location or siting of MaPP zones. <a href=\"http://www.uq.edu.au/marxan/\" target=\"_blank\">Marxan</a> is a decision support tool developed by the University of Queensland to provide solutions to the “minimum set problem” - capturing a specified amount (target) of individual features for the least cost. Based on relatively simple mathematical algorithms and equations, Marxan searches millions of potential solutions to find the best balance between costs and benefits. In short, Marxan solutions minimize the overall cost subject to the constraint of meeting specified “targets” for all features.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP consulted the MaPP Science Advisory Committee (SAC) for advice on scenarios and target selection.  The SAC supported the decision to use the percentage target categories established by the BCMCA project team in 2006. Please see this <a href=\"https://dl.dropboxusercontent.com/u/1764986/BCMCA-Marxan for MaPP-Report on initial scenarios_27Feb2013.pdf\" target=\"_blank\">2013 BCMCA report</a> for more information about the MaPP-BCMCA project and Marxan scenarios, and consult the <a href=\"http://bcmca.ca\" target=\"_blank\">BCMCA Atlas</a> for detailed information about targets, species, and habitats.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Adjacent Breeding Sites for Birds and Mammals</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Is not adjacent to breeding sites for birds and mammals\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Species</th>");_.b("\n" + i);_.b("        <th>Number of Breeding Areas or Nesting Sites</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("nonFishBreedingAreas",c,p,1),c,p,0,5540,5626,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SPECIES",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"2\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            When selecting sites, consider proximity to breeding areas or nesting sites for birds and mammals in effort to minimize disturbance and protect adjacent foraging area. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Marine Classifications</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Marine Classifications\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Classification</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("marineClassifications",c,p,1),c,p,0,6357,6479,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          <p>");_.b("\n" + i);_.b("            In Protection Management Zones, representation is often one criteria for siting in a network. Data for this report includes benthic ecosystems and oceanographic processes.  See metadata in the data layers for more information. ");_.b("\n" + i);_.b("          </p>");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>, which represents <strong>");_.b(_.v(_.f("percent",c,p,0)));_.b("%</strong> of the ");_.b(_.v(_.f("sc_name",c,p,0)));_.b(". Size is used to quantify draft spatial zones and provide percent coverage. ");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,303,429,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[15])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9fZW1wdHkuanMiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvbWFwcC1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0UmVzdWx0cy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5Q3VsdHVyZVRhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5RWNvbm9taWNUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvc2NyaXB0cy9hcnJheUVudmlyb25tZW50VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvbWFwcC1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlPdmVydmlld1RhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5UmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvbWFwcC1yZXBvcnRzLXYyL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztBQ0FBLENBQU8sQ0FBVSxDQUFBLEdBQVgsQ0FBTixFQUFrQjtDQUNoQixLQUFBLDJFQUFBO0NBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQUFBLEdBQVk7Q0FEWixDQUVBLENBQUEsR0FBTTtBQUNDLENBQVAsQ0FBQSxDQUFBLENBQUE7Q0FDRSxFQUFBLENBQUEsR0FBTyxxQkFBUDtDQUNBLFNBQUE7SUFMRjtDQUFBLENBTUEsQ0FBVyxDQUFBLElBQVgsYUFBVztDQUVYO0NBQUEsTUFBQSxvQ0FBQTt3QkFBQTtDQUNFLEVBQVcsQ0FBWCxHQUFXLENBQVg7Q0FBQSxFQUNTLENBQVQsRUFBQSxFQUFpQixLQUFSO0NBQ1Q7Q0FDRSxFQUFPLENBQVAsRUFBQSxVQUFPO0NBQVAsRUFDTyxDQUFQLENBREEsQ0FDQTtBQUMrQixDQUYvQixDQUU4QixDQUFFLENBQWhDLEVBQUEsRUFBUSxDQUF3QixLQUFoQztDQUZBLENBR3lCLEVBQXpCLEVBQUEsRUFBUSxDQUFSO01BSkY7Q0FNRSxLQURJO0NBQ0osQ0FBZ0Ms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QUdrQixJQUFBLFFBQWxCLFdBQWtCOztBQUVsQixDQUxBLEVBS1UsR0FBSixHQUFxQixLQUEzQjtDQUNFLENBQUEsRUFBQSxFQUFNLFNBQU0sQ0FBQSxHQUFBO0NBT0wsS0FBRCxHQUFOLEVBQUEsR0FBbUI7Q0FSSzs7OztBQ0wxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6W251bGwsIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJjbGFzcyBKb2JJdGVtIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjbGFzc05hbWU6ICdyZXBvcnRSZXN1bHQnXG4gIGV2ZW50czoge31cbiAgYmluZGluZ3M6XG4gICAgXCJoNiBhXCI6XG4gICAgICBvYnNlcnZlOiBcInNlcnZpY2VOYW1lXCJcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIG5hbWU6ICdocmVmJ1xuICAgICAgICBvYnNlcnZlOiAnc2VydmljZVVybCdcbiAgICAgIH1dXG4gICAgXCIuc3RhcnRlZEF0XCI6XG4gICAgICBvYnNlcnZlOiBbXCJzdGFydGVkQXRcIiwgXCJzdGF0dXNcIl1cbiAgICAgIHZpc2libGU6ICgpIC0+XG4gICAgICAgIEBtb2RlbC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIG9uR2V0OiAoKSAtPlxuICAgICAgICBpZiBAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKVxuICAgICAgICAgIHJldHVybiBcIlN0YXJ0ZWQgXCIgKyBtb21lbnQoQG1vZGVsLmdldCgnc3RhcnRlZEF0JykpLmZyb21Ob3coKSArIFwiLiBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgXCJcIlxuICAgIFwiLnN0YXR1c1wiOiAgICAgIFxuICAgICAgb2JzZXJ2ZTogXCJzdGF0dXNcIlxuICAgICAgb25HZXQ6IChzKSAtPlxuICAgICAgICBzd2l0Y2ggc1xuICAgICAgICAgIHdoZW4gJ3BlbmRpbmcnXG4gICAgICAgICAgICBcIndhaXRpbmcgaW4gbGluZVwiXG4gICAgICAgICAgd2hlbiAncnVubmluZydcbiAgICAgICAgICAgIFwicnVubmluZyBhbmFseXRpY2FsIHNlcnZpY2VcIlxuICAgICAgICAgIHdoZW4gJ2NvbXBsZXRlJ1xuICAgICAgICAgICAgXCJjb21wbGV0ZWRcIlxuICAgICAgICAgIHdoZW4gJ2Vycm9yJ1xuICAgICAgICAgICAgXCJhbiBlcnJvciBvY2N1cnJlZFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc1xuICAgIFwiLnF1ZXVlTGVuZ3RoXCI6IFxuICAgICAgb2JzZXJ2ZTogXCJxdWV1ZUxlbmd0aFwiXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIHMgPSBcIldhaXRpbmcgYmVoaW5kICN7dn0gam9iXCJcbiAgICAgICAgaWYgdi5sZW5ndGggPiAxXG4gICAgICAgICAgcyArPSAncydcbiAgICAgICAgcmV0dXJuIHMgKyBcIi4gXCJcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2PyBhbmQgcGFyc2VJbnQodikgPiAwXG4gICAgXCIuZXJyb3JzXCI6XG4gICAgICBvYnNlcnZlOiAnZXJyb3InXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8ubGVuZ3RoID4gMlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHYsIG51bGwsICcgICcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAbW9kZWwpIC0+XG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBAJGVsLmh0bWwgXCJcIlwiXG4gICAgICA8aDY+PGEgaHJlZj1cIiNcIiB0YXJnZXQ9XCJfYmxhbmtcIj48L2E+PHNwYW4gY2xhc3M9XCJzdGF0dXNcIj48L3NwYW4+PC9oNj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwic3RhcnRlZEF0XCI+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInF1ZXVlTGVuZ3RoXCI+PC9zcGFuPlxuICAgICAgICA8cHJlIGNsYXNzPVwiZXJyb3JzXCI+PC9wcmU+XG4gICAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICBAc3RpY2tpdCgpXG5cbm1vZHVsZS5leHBvcnRzID0gSm9iSXRlbSIsImNsYXNzIFJlcG9ydFJlc3VsdHMgZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG5cbiAgZGVmYXVsdFBvbGxpbmdJbnRlcnZhbDogMzAwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQHNrZXRjaCwgQGRlcHMpIC0+XG4gICAgQHVybCA9IHVybCA9IFwiL3JlcG9ydHMvI3tAc2tldGNoLmlkfS8je0BkZXBzLmpvaW4oJywnKX1cIlxuICAgIHN1cGVyKClcblxuICBwb2xsOiAoKSA9PlxuICAgIEBmZXRjaCB7XG4gICAgICBzdWNjZXNzOiAoKSA9PlxuICAgICAgICBAdHJpZ2dlciAnam9icydcbiAgICAgICAgZm9yIHJlc3VsdCBpbiBAbW9kZWxzXG4gICAgICAgICAgaWYgcmVzdWx0LmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgICAgICAgdW5sZXNzIEBpbnRlcnZhbFxuICAgICAgICAgICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAcG9sbCwgQGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvciBcbiAgICAgICAgICAgICdQcm9ibGVtIGNvbnRhY3RpbmcgdGhlIFNlYVNrZXRjaCBzZXJ2ZXInXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFJlc3VsdHNcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5SZXBvcnRSZXN1bHRzID0gcmVxdWlyZSAnLi9yZXBvcnRSZXN1bHRzLmNvZmZlZSdcbnQgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJylcbnRlbXBsYXRlcyA9XG4gIHJlcG9ydExvYWRpbmc6IHRbJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nJ11cbkpvYkl0ZW0gPSByZXF1aXJlICcuL2pvYkl0ZW0uY29mZmVlJ1xuQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCd2aWV3cy9jb2xsZWN0aW9uVmlldycpXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEsIEB0YWIsIEBza2V0Y2hDbGFzc0lkKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgaWYgQHNrZXRjaENsYXNzSWRcbiAgICAgIGRhdGEgPSBfLmZpbmQgQGRhdGEudmFsdWUsICh2KSA9PiBcbiAgICAgICAgdi5mZWF0dXJlcz9bMF0/LmF0dHJpYnV0ZXM/WydTQ19JRCddIGlzIEBza2V0Y2hDbGFzc0lkICAgICAgICBcbiAgICAgIHVubGVzcyBkYXRhXG4gICAgICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgZGF0YSBmb3Igc2tldGNoQ2xhc3MgI3tAc2tldGNoQ2xhc3NJZH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIF8uaXNBcnJheSBAZGF0YS52YWx1ZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlXG4gICAgXy5tYXAgZGF0YS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICBjb25zb2xlLmxvZyBAZGF0YVxuICAgICAgQHRhYi5yZXBvcnRFcnJvciBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn0gZnJvbSByZXN1bHRzXCJcbiAgICAgIHRocm93IFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfVwiXG4gICAgZWxzZSBpZiBhdHRycy5sZW5ndGggaXMgMVxuICAgICAgcmV0dXJuIGF0dHJzWzBdXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGF0dHJzXG5cbiAgaW50OiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgcGFyc2VJbnRcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChyYXcpXG5cbiAgZmxvYXQ6IChhdHRyLCBkZWNpbWFsUGxhY2VzPTIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHJvdW5kKHZhbCwgZGVjaW1hbFBsYWNlcylcbiAgICBlbHNlXG4gICAgICByb3VuZChyYXcsIGRlY2ltYWxQbGFjZXMpXG5cbiAgYm9vbDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHZhbC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG4gICAgZWxzZVxuICAgICAgcmF3LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcblxuY2xhc3MgUmVwb3J0VGFiIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBuYW1lOiAnSW5mb3JtYXRpb24nXG4gIGRlcGVuZGVuY2llczogW11cblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAb3B0aW9ucykgLT5cbiAgICAjIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYnkgU2VhU2tldGNoIHdpdGggdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgIyAgICogbW9kZWwgLSBUaGUgc2tldGNoIGJlaW5nIHJlcG9ydGVkIG9uXG4gICAgIyAgICogb3B0aW9uc1xuICAgICMgICAgIC0gLnBhcmVudCAtIHRoZSBwYXJlbnQgcmVwb3J0IHZpZXcgXG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCBAZXRhSW50ZXJ2YWxcbiAgICBAc3RvcExpc3RlbmluZygpXG4gICAgc3VwZXIoKVxuICBcbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICB0b3RhbCA9IChuZXcgRGF0ZShAbWF4RXRhKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShAZXRhU3RhcnQpLmdldFRpbWUoKSkgLyAxMDAwXG4gICAgICBsZWZ0ID0gKG5ldyBEYXRlKEBtYXhFdGEpLmdldFRpbWUoKSAtIG5ldyBEYXRlKCkuZ2V0VGltZSgpKSAvIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgICAsIChsZWZ0ICsgMSkgKiAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24nLCAnbGluZWFyJ1xuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBcIiN7bGVmdCArIDF9c1wiXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICAgICwgNTAwXG5cbiAgcmVuZGVySm9iRGV0YWlsczogKCkgPT5cbiAgICBtYXhFdGEgPSBudWxsXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGlmIGpvYi5nZXQoJ2V0YScpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGEnKVxuICAgIGlmIG1heEV0YVxuICAgICAgQG1heEV0YSA9IG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzUlJylcbiAgICAgIEBldGFTdGFydCA9IG5ldyBEYXRlKClcbiAgICAgIEBzdGFydEV0YUNvdW50ZG93bigpXG5cbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jbGljayAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5oaWRlKClcbiAgICAgIEAkKCcuZGV0YWlscycpLnNob3coKVxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpdGVtID0gbmV3IEpvYkl0ZW0oam9iKVxuICAgICAgaXRlbS5yZW5kZXIoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuYXBwZW5kIGl0ZW0uZWxcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXN1bHRzID0gQHJlcG9ydFJlc3VsdHMubWFwKChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMpXG4gICAgdW5sZXNzIHJlc3VsdHM/Lmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkPWZhbHNlKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBAcmVwb3J0UmVzdWx0cy5maW5kIChyKSAtPiByLmdldCgnc2VydmljZU5hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgncmVzdWx0JykucmVzdWx0cywgKHBhcmFtKSAtPiBcbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcbiAgICAgIFxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpICAgIFxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBnZXRDaGlsZHJlbjogKHNrZXRjaENsYXNzSWQpIC0+XG4gICAgXy5maWx0ZXIgQGNoaWxkcmVuLCAoY2hpbGQpIC0+IGNoaWxkLmdldFNrZXRjaENsYXNzKCkuaWQgaXMgc2tldGNoQ2xhc3NJZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0VGFiIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dHIgZGF0YS1hdHRyaWJ1dGUtaWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS1leHBvcnRpZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiZXhwb3J0aWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLXR5cGU9XFxcIlwiKTtfLmIoXy52KF8uZihcInR5cGVcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJuYW1lXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwidmFsdWVcXFwiPlwiKTtfLmIoXy52KF8uZihcImZvcm1hdHRlZFZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3RyPlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO30pO2MucG9wKCk7fV8uYihcIjwvdGFibGU+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdOyIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEFycmF5Q3VsdHVyZVRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnR292ZXJuYW5jZSdcbiAgY2xhc3NOYW1lOiAnY3VsdHVyZSdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hcnJheUN1bHR1cmVcbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgXCJFeGlzdGluZ01hcmluZVByb3RlY3RlZEFyZWFzXCJcbiAgICBcIkNsb3N1cmVzXCJcbiAgICBcIk92ZXJsYXBXaXRoRXhpc3RpbmdQcm92aW5jaWFsVGVudXJlc1wiXG4gIF1cbiAgdGltZW91dDogNjAwMDAwXG4gIHJlbmRlcjogKCkgLT5cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgem9uZVR5cGUgPSBfLmZpbmQgQG1vZGVsLmdldEF0dHJpYnV0ZXMoKSwgKGF0dHIpIC0+IFxuICAgICAgYXR0ci5leHBvcnRpZCBpcyBcIlpPTkVfVFlQRVwiXG4gICAgem9uZVR5cGUgPSB6b25lVHlwZT8udmFsdWUgb3IgJ3NteidcbiAgICBwcm92aW5jaWFsID0gQHJlY29yZFNldChcIk92ZXJsYXBXaXRoRXhpc3RpbmdQcm92aW5jaWFsVGVudXJlc1wiLCBcIlByb3ZpbmNpYWxUZW51cmVzXCIpLnRvQXJyYXkoKVxuICAgIGV4aXN0aW5nTVBBcyA9IEByZWNvcmRTZXQoJ0V4aXN0aW5nTWFyaW5lUHJvdGVjdGVkQXJlYXMnLCBcbiAgICAgICAgXCJFeGlzdGluZ01hcmluZVByb3RlY3RlZEFyZWFzXCIpLnRvQXJyYXkoKVxuICAgIGhhc1Byb3ZpbmNpYWxUZW51cmVzID0gcHJvdmluY2lhbD8ubGVuZ3RoID4gMFxuICAgIGhhc092ZXJsYXBXaXRoRXhpc3RpbmdNUEFzID0gZXhpc3RpbmdNUEFzPy5sZW5ndGggPiAwXG4gICAgY2xvc3VyZXMgPSBAcmVjb3JkU2V0KFwiQ2xvc3VyZXNcIiwgXCJGaXNoZXJpZXNDbG9zdXJlc1wiKS50b0FycmF5KClcbiAgICBoYXNDbG9zdXJlcyA9IGNsb3N1cmVzPy5sZW5ndGggPiAwXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICAjIG92ZXJsYXA6IEByZWNvcmRTZXQoXCJBcmNoU2l0ZU92ZXJsYXBcIiwgXCJBcmNoU2l0ZU92ZXJsYXBcIikuYm9vbCgnUmVzdWx0JylcbiAgICAgIGFycmF5OiBAY2hpbGRyZW4/Lmxlbmd0aCA+IDBcbiAgICAgIHBtejogIShAY2hpbGRyZW4/Lmxlbmd0aCA+IDApIGFuZCB6b25lVHlwZSBpcyAncG16J1xuICAgICAgc216OiAhKEBjaGlsZHJlbj8ubGVuZ3RoID4gMCkgYW5kIHpvbmVUeXBlIGlzICdzbXonXG4gICAgICBcbiAgICAgIGNsb3N1cmVzOiBjbG9zdXJlc1xuICAgICAgaGFzQ2xvc3VyZXM6IGhhc0Nsb3N1cmVzXG4gICAgICBwcm92aW5jaWFsOiBwcm92aW5jaWFsXG4gICAgICBoYXNQcm92aW5jaWFsVGVudXJlczogaGFzUHJvdmluY2lhbFRlbnVyZXNcbiAgICAgIGV4aXN0aW5nTVBBczogZXhpc3RpbmdNUEFzXG4gICAgICBoYXNPdmVybGFwV2l0aEV4aXN0aW5nTVBBczogaGFzT3ZlcmxhcFdpdGhFeGlzdGluZ01QQXNcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG4gICAgQGVuYWJsZVRhYmxlUGFnaW5nKClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5Q3VsdHVyZVRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEFycmF5RWNvbm9taWNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0h1bWFuIFdlbGwtQmVpbmcnXG4gIGNsYXNzTmFtZTogJ2Vjb25vbWljJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5RWNvbm9taWNcbiAgZGVwZW5kZW5jaWVzOiBbXG5cbiAgXVxuICB0aW1lb3V0OiA2MDAwMDBcblxuICByZW5kZXI6ICgpIC0+XG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgYXJyYXk6IHRydWVcbiAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuICAgIEBlbmFibGVUYWJsZVBhZ2luZygpXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlFY29ub21pY1RhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEFycmF5RW52aXJvbm1lbnRUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0Vjb2xvZ2ljYWwgSW50ZWdyaXR5J1xuICBjbGFzc05hbWU6ICdlbnZpcm9ubWVudCdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hcnJheUVudmlyb25tZW50XG4gIGRlcGVuZGVuY2llczogW1xuICAgICdPdmVybGFwV2l0aEltcG9ydGFudEFyZWFzJ1xuICAgICdPdmVybGFwV2l0aEJpb2dlbmljQW5kQ29tbXVuaXR5Rm9ybWluZ1NwZWNpZXMnXG4gICAgJ092ZXJsYXBXaXRoTm9uRmlzaEJyZWVkaW5nQXJlYXMnXG4gICAgJ092ZXJsYXBXaXRoTWFyaW5lQ2xhc3NpZmljYXRpb25zJ1xuICAgICdNYXJ4YW5BbmFseXNpcydcbiAgXVxuICB0aW1lb3V0OiA2MDAwMDBcblxuICByZW5kZXI6ICgpIC0+XG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGltcG9ydGFudEFyZWFzID0gQHJlY29yZFNldChcIk92ZXJsYXBXaXRoSW1wb3J0YW50QXJlYXNcIiwgXCJPdmVybGFwV2l0aEltcG9ydGFudEFyZWFzXCIpLnRvQXJyYXkoKVxuXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBub25GaXNoQnJlZWRpbmdBcmVhczogQHJlY29yZFNldCgnT3ZlcmxhcFdpdGhOb25GaXNoQnJlZWRpbmdBcmVhcycsICdPdmVybGFwV2l0aE5vbkZpc2hCcmVlZGluZ0FyZWFzJykudG9BcnJheSgpXG4gICAgICBoYWJpdGF0czogQHJlY29yZFNldCgnT3ZlcmxhcFdpdGhCaW9nZW5pY0FuZENvbW11bml0eUZvcm1pbmdTcGVjaWVzJywgJ092ZXJsYXBXaXRoQmlvZ2VuaWNBbmRDb21tdW5pdHlGb3JtaW5nU3BlY2llcycpLnRvQXJyYXkoKVxuICAgICAgaW1wb3J0YW50QXJlYXM6IGltcG9ydGFudEFyZWFzXG5cbiAgICAgIG1hcmluZUNsYXNzaWZpY2F0aW9uczogQHJlY29yZFNldCgnT3ZlcmxhcFdpdGhNYXJpbmVDbGFzc2lmaWNhdGlvbnMnLCAnT3ZlcmxhcFdpdGhNYXJpbmVDbGFzc2lmaWNhdGlvbnMnKS50b0FycmF5KClcblxuICAgICAgbWFyeGFuQW5hbHlzZXM6IF8ubWFwKEByZWNvcmRTZXQoXCJNYXJ4YW5BbmFseXNpc1wiLCBcIk1hcnhhbkFuYWx5c2lzXCIpXG4gICAgICAgIC50b0FycmF5KCksIChmKSAtPiBmLk5BTUUpXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZVRhYmxlUGFnaW5nKClcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG4gICAgQCQoJy5jaG9zZW4nKS5jaG9zZW4oe2Rpc2FibGVfc2VhcmNoX3RocmVzaG9sZDogMTAsIHdpZHRoOic0MDBweCd9KVxuICAgIEAkKCcuY2hvc2VuJykuY2hhbmdlICgpID0+XG4gICAgICBfLmRlZmVyIEByZW5kZXJNYXJ4YW5BbmFseXNpc1xuICAgIEByZW5kZXJNYXJ4YW5BbmFseXNpcygpXG5cbiAgcmVuZGVyTWFyeGFuQW5hbHlzaXM6ICgpID0+XG4gICAgbmFtZSA9IEAkKCcuY2hvc2VuJykudmFsKClcbiAgICByZWNvcmRzID0gQHJlY29yZFNldChcIk1hcnhhbkFuYWx5c2lzXCIsIFwiTWFyeGFuQW5hbHlzaXNcIikudG9BcnJheSgpXG4gICAgZGF0YSA9IF8uZmluZCByZWNvcmRzLCAocmVjb3JkKSAtPiByZWNvcmQuTkFNRSBpcyBuYW1lXG4gICAgaGlzdG8gPSBkYXRhLkhJU1RPLnNsaWNlKDEsIGRhdGEuSElTVE8ubGVuZ3RoIC0gMSkuc3BsaXQoL1xccy8pXG4gICAgaGlzdG8gPSBfLmZpbHRlciBoaXN0bywgKHMpIC0+IHMubGVuZ3RoID4gMFxuICAgIGhpc3RvID0gXy5tYXAgaGlzdG8sICh2YWwpIC0+XG4gICAgICBwYXJzZUludCh2YWwpXG4gICAgcXVhbnRpbGVzID0gXy5maWx0ZXIoXy5rZXlzKGRhdGEpLCAoa2V5KSAtPiBrZXkuaW5kZXhPZignUScpIGlzIDApXG4gICAgZm9yIHEsIGkgaW4gcXVhbnRpbGVzXG4gICAgICBpZiBwYXJzZUZsb2F0KGRhdGFbcV0pID4gcGFyc2VGbG9hdChkYXRhLlNDT1JFKSBvciBpIGlzIHF1YW50aWxlcy5sZW5ndGggLSAxXG4gICAgICAgIG1heF9xID0gcXVhbnRpbGVzW2ldXG4gICAgICAgIG1pbl9xID0gcXVhbnRpbGVzW2kgLSAxXSBvciBcIlEwXCIgIyBxdWFudGlsZXNbaV1cbiAgICAgICAgYnJlYWtcbiAgICBAJCgnLnNjZW5hcmlvUmVzdWx0cycpLmh0bWwgXCJcIlwiXG4gICAgICBUaGUgYXZlcmFnZSBNYXJ4YW4gc2NvcmUgZm9yIHRoaXMgem9uZXMgd2l0aGluIHRoaXMgcHJvcG9zYWwgaXMgPHN0cm9uZz4je2RhdGEuU0NPUkV9PC9zdHJvbmc+LCBwbGFjaW5nIGl0IGluIFxuICAgICAgdGhlIDxzdHJvbmc+I3ttaW5fcS5yZXBsYWNlKCdRJywgJycpfSUgLSAje21heF9xLnJlcGxhY2UoJ1EnLCAnJyl9JSBxdWFudGlsZSBcbiAgICAgIHJhbmdlPC9zdHJvbmc+IGZvciB0aGlzIHN1Yi1yZWdpb24uXG4gICAgXCJcIlwiXG5cbiAgICBAJCgnLnNjZW5hcmlvRGVzY3JpcHRpb24nKS5odG1sIGRhdGEuTUFSWF9ERVNDLnJlcGxhY2UoJ3RoaXMgem9uZSAnLCAnem9uZXMgd2l0aGluIHRoaXMgcHJvcG9zYWwgJylcblxuICAgIGRvbWFpbiA9IF8ubWFwIHF1YW50aWxlcywgKHEpIC0+IGRhdGFbcV1cbiAgICBkb21haW4ucHVzaCAxMDBcbiAgICBkb21haW4udW5zaGlmdCAwXG4gICAgY29sb3IgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkb21haW4pXG4gICAgICAucmFuZ2UoW1wiIzQ3YWU0M1wiLCBcIiM2YzBcIiwgXCIjZWUwXCIsIFwiI2ViNFwiLCBcIiNlY2JiODlcIiwgXCIjZWVhYmEwXCJdLnJldmVyc2UoKSlcbiAgICBxdWFudGlsZXMgPSBfLm1hcCBxdWFudGlsZXMsIChrZXkpIC0+XG4gICAgICBtYXggPSBwYXJzZUZsb2F0KGRhdGFba2V5XSlcbiAgICAgIG1pbiAgPSBwYXJzZUZsb2F0KGRhdGFbcXVhbnRpbGVzW18uaW5kZXhPZihxdWFudGlsZXMsIGtleSkgLSAxXV0gb3IgMClcbiAgICAgIHtcbiAgICAgICAgcmFuZ2U6IFwiI3twYXJzZUludChrZXkucmVwbGFjZSgnUScsICcnKSkgLSAyMH0tI3trZXkucmVwbGFjZSgnUScsICcnKX0lXCJcbiAgICAgICAgbmFtZToga2V5XG4gICAgICAgIHN0YXJ0OiBtaW5cbiAgICAgICAgZW5kOiBtYXhcbiAgICAgICAgYmc6IGNvbG9yKChtYXggKyBtaW4pIC8gMilcbiAgICAgIH1cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIEAkKCcudml6JykuaHRtbCgnJylcbiAgICAgIGVsID0gQCQoJy52aXonKVswXVxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIDEwMF0pXG4gICAgICAgIC5yYW5nZShbMCwgNDAwXSkgICAgICBcblxuXG5cbiAgICAgICMgSGlzdG9ncmFtXG5cbiAgICAgIG1hcmdpbiA9IFxuICAgICAgICB0b3A6IDVcbiAgICAgICAgcmlnaHQ6IDIwXG4gICAgICAgIGJvdHRvbTogMzBcbiAgICAgICAgbGVmdDogNDVcbiAgICAgIHdpZHRoID0gNDAwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHRcbiAgICAgIGhlaWdodCA9IDMwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tXG4gICAgICBcbiAgICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAuZG9tYWluKFswLCAxMDBdKVxuICAgICAgICAucmFuZ2UoWzAsIHdpZHRoXSlcbiAgICAgIHkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pXG4gICAgICAgIC5kb21haW4oWzAsIGQzLm1heChoaXN0byldKVxuXG4gICAgICB4QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLnNjYWxlKHgpXG4gICAgICAgIC5vcmllbnQoXCJib3R0b21cIilcbiAgICAgIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeSlcbiAgICAgICAgLm9yaWVudChcImxlZnRcIilcblxuICAgICAgc3ZnID0gZDMuc2VsZWN0KEAkKCcudml6JylbMF0pLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoI3ttYXJnaW4ubGVmdH0sICN7bWFyZ2luLnRvcH0pXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwje2hlaWdodH0pXCIpXG4gICAgICAgIC5jYWxsKHhBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC8gMilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjNlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAudGV4dChcIlNjb3JlXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcbiAgICAgICAgLmNhbGwoeUF4aXMpXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCA2KVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQoXCJOdW1iZXIgb2YgUGxhbm5pbmcgVW5pdHNcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5iYXJcIilcbiAgICAgICAgICAuZGF0YShoaXN0bylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXJcIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgKGQsIGkpIC0+IHgoaSkpXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAod2lkdGggLyAxMDApKVxuICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geShkKSlcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCAoZCkgLT4gaGVpZ2h0IC0geShkKSlcbiAgICAgICAgICAuc3R5bGUgJ2ZpbGwnLCAoZCwgaSkgLT5cbiAgICAgICAgICAgIHEgPSBfLmZpbmQgcXVhbnRpbGVzLCAocSkgLT5cbiAgICAgICAgICAgICAgaSA+PSBxLnN0YXJ0IGFuZCBpIDw9IHEuZW5kXG4gICAgICAgICAgICBxPy5iZyBvciBcInN0ZWVsYmx1ZVwiXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChkYXRhLlNDT1JFKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlXCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSA4ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkoaGlzdG9bZF0pIC0gMTApICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5zY29yZVRleHRcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChkYXRhLlNDT1JFKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlVGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gNiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KGhpc3RvW2RdKSAtIDMwKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBkKVxuXG4gICAgICBAJCgnLnZpeicpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48L2Rpdj4nXG4gICAgICBmb3IgcXVhbnRpbGUgaW4gcXVhbnRpbGVzXG4gICAgICAgIEAkKCcudml6IC5sZWdlbmRzJykuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJsZWdlbmRcIj48c3BhbiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6I3txdWFudGlsZS5iZ307XCI+Jm5ic3A7PC9zcGFuPiN7cXVhbnRpbGUucmFuZ2V9PC9kaXY+XG4gICAgICAgIFwiXCJcIlxuICAgICAgQCQoJy52aXonKS5hcHBlbmQgJzxiciBzdHlsZT1cImNsZWFyOmJvdGg7XCI+J1xuXG4gICAgICBAJCgnJylcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheUVudmlyb25tZW50VGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgQXJyYXlPdmVydmlld1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnT3ZlcnZpZXcnXG4gIGNsYXNzTmFtZTogJ292ZXJ2aWV3J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5T3ZlcnZpZXdcbiAgZGVwZW5kZW5jaWVzOiBbXG4gICAgJ1pvbmVTaXplJ1xuICBdXG4gIHRpbWVvdXQ6IDYwMDAwMFxuXG4gIHJlbmRlcjogKCkgLT5cblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgc2l6ZTogQHJlY29yZFNldCgnWm9uZVNpemUnLCAnWm9uZVNpemUnKS5mbG9hdCgnU0laRV9TUV9LTScsIDIpXG4gICAgICBwZXJjZW50OiBAcmVjb3JkU2V0KCdab25lU2l6ZScsICdab25lU2l6ZScpLmZsb2F0KCdTSVpFX1BFUkMnLCAxKVxuICAgICAgc2NfbmFtZTogQHJlY29yZFNldCgnWm9uZVNpemUnLCAnWm9uZVNpemUnKS5yYXcoJ1NDX05BTUUnKVxuICAgICAgbnVtQ2hpbGRyZW46IEBjaGlsZHJlbi5sZW5ndGhcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcbiAgICBub2RlcyA9IFtAbW9kZWxdXG4gICAgQG1vZGVsLnNldCAnb3BlbicsIHRydWVcbiAgICBub2RlcyA9IG5vZGVzLmNvbmNhdCBAY2hpbGRyZW5cbiAgICBmb3Igbm9kZSBpbiBub2Rlc1xuICAgICAgbm9kZS5zZXQgJ3NlbGVjdGVkJywgZmFsc2VcbiAgICBUYWJsZU9mQ29udGVudHMgPSB3aW5kb3cucmVxdWlyZSgndmlld3MvdGFibGVPZkNvbnRlbnRzJylcbiAgICBAdG9jID0gbmV3IFRhYmxlT2ZDb250ZW50cyhub2RlcylcbiAgICBAJCgnLnRvY0NvbnRhaW5lcicpLmFwcGVuZCBAdG9jLmVsXG4gICAgQHRvYy5yZW5kZXIoKVxuXG4gIHJlbW92ZTogKCkgLT5cbiAgICBAdG9jPy5yZW1vdmUoKVxuICAgIHN1cGVyKClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5T3ZlcnZpZXdUYWIiLCJBcnJheU92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9hcnJheU92ZXJ2aWV3VGFiLmNvZmZlZSdcbkFycmF5RW52aXJvbm1lbnRUYWIgPSByZXF1aXJlICcuL2FycmF5RW52aXJvbm1lbnRUYWIuY29mZmVlJ1xuQXJyYXlFY29ub21pY1RhYiA9IHJlcXVpcmUgJy4vYXJyYXlFY29ub21pY1RhYi5jb2ZmZWUnXG5BcnJheUN1bHR1cmVUYWIgPSByZXF1aXJlICcuL2FycmF5Q3VsdHVyZVRhYi5jb2ZmZWUnXG5cbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW1xuICAgIEFycmF5T3ZlcnZpZXdUYWIsIFxuICAgIEFycmF5RW52aXJvbm1lbnRUYWIsIFxuICAgIEFycmF5RWNvbm9taWNUYWIsIFxuICAgIEFycmF5Q3VsdHVyZVRhYlxuICBdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcmVwb3J0LmNzcyddXG4iLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5Q3VsdHVyZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggRXhpc3RpbmcgUHJvdGVjdGVkIEFyZWFzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUyMGQ0YzJhNjc0NjU5Y2I3YjM1ZDU3NVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBFeGlzdGluZyBQcm90ZWN0ZWQgQXJlYXMuIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UHJvdGVjdGVkIEFyZWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImhhc092ZXJsYXBXaXRoRXhpc3RpbmdNUEFzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpjZW50ZXI7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8cD5ObyBvdmVybGFwIHdpdGggZXhpc3RpbmcgcHJvdGVjdGVkIGFyZWFzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImV4aXN0aW5nTVBBc1wiLGMscCwxKSxjLHAsMCw4OTgsMTAxNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLiAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInBtelwiLGMscCwxKSxjLHAsMCwxNTIwLDMwMDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBGaXNoZXJpZXMgQ2xvc3VyZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBGaXNoZXJpZXMgQ2xvc3VyZXMuIEZpc2hlcmllcyBjbG9zdXJlcyBtYXkgbmVlZCB0byBiZSBjb25zaWRlcmVkIHRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gdXNlcyBhbmQgYWN0aXZpdGllcy4gRmVkZXJhbCBSb2NrZmlzaCBDb25zZXJ2YXRpb24gQXJlYXMgYW5kIEZlZGVyYWwgU3BvbmdlIFJlZWYgUmVzZXJ2ZSBhcmUgYW5hbHlzZWQgZm9yIG92ZXJsYXAgd2l0aCBcIik7aWYoXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwwLDE5MDAsMTkyNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiem9uZXMgd2l0aGluIHRoaXMgcHJvcG9zYWxcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJhcnJheVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInRoaXMgem9uZVwiKTt9O18uYihcIi4gXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5UZW51cmVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJoYXNDbG9zdXJlc1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpjZW50ZXI7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8cD5ObyBvdmVybGFwIHdpdGggZmlzaGVyaWVzIGNsb3N1cmVzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImNsb3N1cmVzXCIsYyxwLDEpLGMscCwwLDIzMzMsMjQ1MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIEZpc2hlcmllcyBjbG9zdXJlcyBtYXkgbmVlZCB0byBiZSBjb25zaWRlcmVkIHRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gdXNlcyBhbmQgYWN0aXZpdGllcy4gRmVkZXJhbCBSb2NrZmlzaCBDb25zZXJ2YXRpb24gQXJlYXMgYW5kIEZlZGVyYWwgU3BvbmdlIFJlZWYgUmVzZXJ2ZSBhcmUgYW5hbHlzZWQgZm9yIG92ZXJsYXAgd2l0aCBcIik7aWYoXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwwLDI3NjYsMjc5MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiem9uZXMgd2l0aGluIHRoaXMgcHJvcG9zYWxcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJhcnJheVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInRoaXMgem9uZVwiKTt9O18uYihcIi4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggUHJvdmluY2lhbCBUZW51cmVzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjJmNWNiYTcyZWMwNjgxNjA2MjA4ZVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBQcm92aW5jaWFsIFRlbnVyZXMuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5UZW51cmVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJoYXNQcm92aW5jaWFsVGVudXJlc1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246Y2VudGVyO1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHA+Tm8gb3ZlcmxhcCB3aXRoIFByb3ZpbmNpYWwgVGVudXJlczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9O2lmKF8ucyhfLmYoXCJwcm92aW5jaWFsXCIsYyxwLDEpLGMscCwwLDM2NTMsMzc3MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIFRvIGF2b2lkLCBtaW5pbWlzZSBhbmQvb3IgcmVkdWNlIHBvdGVudGlhbCBjb25mbGljdHMgYmV0d2VlbiBleGlzdGluZyB0ZW51cmVkIHVzZXMgYW5kIGFjdGl2aXRpZXMgYW5kIG1hcmluZSBwcm90ZWN0aW9uLCBleGFtaW5lIHRoZSBvdmVybGFwIHdpdGggcHJvdmluY2lhbCBjcm93biB0ZW51cmVzIGZyb20gdGhlIEJDIFByb3ZpbmNpYWwgdGVudXJlcyBkYXRhYmFzZS4gRGF0YSBzb3VyY2U6IFByb3ZpbmNpYWwgVGVudXJlcy4gVXBkYXRlZDogRGVjIDEwMTNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlFY29ub21pY1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ObyBSZXBvcnRzIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBIdW1hbiBXZWxsLUJlaW5nIHJlcG9ydHMgZm9yIGNvbGxlY3Rpb25zIGFyZSBjb21pbmcgc29vbi4uLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5RW52aXJvbm1lbnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdCBSZXByZXNlbnRhdGlvbiAoQWxsIFpvbmVzIENvbWJpbmVkKTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYSAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlByb3RlY3RlZCBBcmVhICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwzMDMsMzkxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9OQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNFxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIEhhYml0YXQgZGF0YSBmb3IgYmVudGhpYyBlY29zeXN0ZW1zLCBwZWxhZ2ljIGFyZWFzLCBhbmQgb2NlYW5vZ3JhcGhpYyBwcm9jZXNzZXMgaXMgdXNlZCB0byBpbmZvcm0gc2l0aW5nIG9mIHpvbmVzLiBJbmNsdWRlZCBoZXJlIGFyZSBiaW9nZW5pYyBoYWJpdGF0cyBhcyB3ZWxsIGFzIGNvbW11bml0eS1mb3JtaW5nIHNwZWNpZXMsIHN1Y2ggYXMgZWVsZ3Jhc3MgYW5kIGtlbHAuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIEltcG9ydGFudCBNYXJpbmUgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlICBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgSW1wb3J0YW50IE1hcmluZSBBcmVhc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW1wb3J0YW50IEFyZWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaW1wb3J0YW50QXJlYXNcIixjLHAsMSksYyxwLDAsMTEyMCwxMjM4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgV2hlbiBzZWxlY3Rpbmcgc2l0ZXMgZm9yIFBNWnMsIGNvbnNpZGVyIHRoZSBsb2NhdGlvbiBvZiBJbXBvcnRhbnQgTWFyaW5lIEFyZWFzIGZvciBtYXJpbmUgbWFtbWFscywgZmlzaCBhbmQgYmlyZHMuIFRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gaHVtYW4gdXNlcyBhbmQgbWFyaW5lIHNwZWNpZXMgd2hlbiBzaXRpbmcgU01acywgY29uc2lkZXIgdGhlc2UgSW1wb3J0YW50IE1hcmluZSBBcmVhcyBmb3IgbWFyaW5lIG1hbW1hbHMsIGZpc2ggYW5kIGJpcmRzLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBJbXBvcnRhbnQgQXJlYXMgd2VyZSBpZGVudGlmaWVkIGR1cmluZyB0aGUgcHJvY2VzcyBvZiBlc3RhYmxpc2hpbmcgRWNvbG9naWNhbGx5IGFuZCBCaW9sb2dpY2FsbHkgU2lnbmlmaWNhbnQgQXJlYXMgKEVCU0FzKSBieSB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL3BuY2ltYS5vcmcvc2l0ZS9hdGxhcy5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+IFBhY2lmaWMgTm9ydGggQ29hc3QgSW50ZWdyYXRlZCBNYW5hZ2VtZW50IEFyZWEgKFBOQ0lNQSk8L2E+LiBJbXBvcnRhbnQgQmlyZCBBcmVhcyAoSUJBcykgd2VyZSBhbHNvIGlkZW50aWZpZWQgYnkgQmlyZCBTdHVkaWVzIENhbmFkYSBhbmQgTmF0dXJlIENhbmFkYSwgaW4gcGFydG5lcnNoaXAgd2l0aCBCaXJkTGlmZSBJbnRlcm5hdGlvbmFsLiAgQ3JpdGljYWwgSGFiaXRhdCBtZWV0cyBDYW5hZGEncyBTcGVjaWVzIGF0IFJpc2sgKFNBUkEpIHJlcXVpcmVtZW50cy4gUG90ZW50aWFsIGNyaXRpY2FsIGlzIGluc3VmZmljaWVudCBpbmZvcm1hdGlvbiB0byBtZWV0IFNBUkEgcmVxdWlyZW1lbnRzLiBTZWUgdGhlIFBOQ0lNQSBhdGxhcyBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gU2VlIGRhdGEgbGF5ZXJzIGZvciBtb3JlIGluZm9ybWF0aW9uLiAgRGF0YSBzb3VyY2VzOiB1cCB0byAyMDA5LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TWFyeGFuIEFuYWx5c2lzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxzZWxlY3QgY2xhc3M9XFxcImNob3NlblxcXCIgd2lkdGg9XFxcIjQwMHB4XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibWFyeGFuQW5hbHlzZXNcIixjLHAsMSksYyxwLDAsMjYyNSwyNjcxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPG9wdGlvbiB2YWx1ZT1cXFwiXCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIjwvb3B0aW9uPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3NlbGVjdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb1Jlc3VsdHNcXFwiPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwic2NlbmFyaW9EZXNjcmlwdGlvblxcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIE1hUFAgY29sbGFib3JhdGVkIHdpdGggdGhlIDxhIGhyZWY9XFxcImh0dHA6Ly9iY21jYS5jYS9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5CQyBNYXJpbmUgQ29uc2VydmF0aW9uIEFuYWx5c2lzIChCQ01DQSk8L2E+IHRvIGlkZW50aWZ5IG1hcmluZSBhcmVhcyBvZiBoaWdoIGNvbnNlcnZhdGlvbiB2YWx1ZSBiYXNlZCBvbiBzcGF0aWFsIGRhdGFzZXRzIG9mIGVjb2xvZ2ljYWwgaW5mb3JtYXRpb24uIFRoZXNlIE1hcnhhbiBzY2VuYXJpb3MgY2FuIGJlIHVzZWQgdG8gaW5mb3JtIHRoZSBsb2NhdGlvbiBvciBzaXRpbmcgb2YgTWFQUCB6b25lcy4gPGEgaHJlZj1cXFwiaHR0cDovL3d3dy51cS5lZHUuYXUvbWFyeGFuL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPk1hcnhhbjwvYT4gaXMgYSBkZWNpc2lvbiBzdXBwb3J0IHRvb2wgZGV2ZWxvcGVkIGJ5IHRoZSBVbml2ZXJzaXR5IG9mIFF1ZWVuc2xhbmQgdG8gcHJvdmlkZSBzb2x1dGlvbnMgdG8gdGhlIOKAnG1pbmltdW0gc2V0IHByb2JsZW3igJ0gLSBjYXB0dXJpbmcgYSBzcGVjaWZpZWQgYW1vdW50ICh0YXJnZXQpIG9mIGluZGl2aWR1YWwgZmVhdHVyZXMgZm9yIHRoZSBsZWFzdCBjb3N0LiBCYXNlZCBvbiByZWxhdGl2ZWx5IHNpbXBsZSBtYXRoZW1hdGljYWwgYWxnb3JpdGhtcyBhbmQgZXF1YXRpb25zLCBNYXJ4YW4gc2VhcmNoZXMgbWlsbGlvbnMgb2YgcG90ZW50aWFsIHNvbHV0aW9ucyB0byBmaW5kIHRoZSBiZXN0IGJhbGFuY2UgYmV0d2VlbiBjb3N0cyBhbmQgYmVuZWZpdHMuIEluIHNob3J0LCBNYXJ4YW4gc29sdXRpb25zIG1pbmltaXplIHRoZSBvdmVyYWxsIGNvc3Qgc3ViamVjdCB0byB0aGUgY29uc3RyYWludCBvZiBtZWV0aW5nIHNwZWNpZmllZCDigJx0YXJnZXRz4oCdIGZvciBhbGwgZmVhdHVyZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgTWFQUCBjb25zdWx0ZWQgdGhlIE1hUFAgU2NpZW5jZSBBZHZpc29yeSBDb21taXR0ZWUgKFNBQykgZm9yIGFkdmljZSBvbiBzY2VuYXJpb3MgYW5kIHRhcmdldCBzZWxlY3Rpb24uICBUaGUgU0FDIHN1cHBvcnRlZCB0aGUgZGVjaXNpb24gdG8gdXNlIHRoZSBwZXJjZW50YWdlIHRhcmdldCBjYXRlZ29yaWVzIGVzdGFibGlzaGVkIGJ5IHRoZSBCQ01DQSBwcm9qZWN0IHRlYW0gaW4gMjAwNi4gUGxlYXNlIHNlZSB0aGlzIDxhIGhyZWY9XFxcImh0dHBzOi8vZGwuZHJvcGJveHVzZXJjb250ZW50LmNvbS91LzE3NjQ5ODYvQkNNQ0EtTWFyeGFuIGZvciBNYVBQLVJlcG9ydCBvbiBpbml0aWFsIHNjZW5hcmlvc18yN0ZlYjIwMTMucGRmXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+MjAxMyBCQ01DQSByZXBvcnQ8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBNYVBQLUJDTUNBIHByb2plY3QgYW5kIE1hcnhhbiBzY2VuYXJpb3MsIGFuZCBjb25zdWx0IHRoZSA8YSBocmVmPVxcXCJodHRwOi8vYmNtY2EuY2FcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5CQ01DQSBBdGxhczwvYT4gZm9yIGRldGFpbGVkIGluZm9ybWF0aW9uIGFib3V0IHRhcmdldHMsIHNwZWNpZXMsIGFuZCBoYWJpdGF0cy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5BZGphY2VudCBCcmVlZGluZyBTaXRlcyBmb3IgQmlyZHMgYW5kIE1hbW1hbHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlICBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiSXMgbm90IGFkamFjZW50IHRvIGJyZWVkaW5nIHNpdGVzIGZvciBiaXJkcyBhbmQgbWFtbWFsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+U3BlY2llczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+TnVtYmVyIG9mIEJyZWVkaW5nIEFyZWFzIG9yIE5lc3RpbmcgU2l0ZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibm9uRmlzaEJyZWVkaW5nQXJlYXNcIixjLHAsMSksYyxwLDAsNDY4NCw0NzcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiU1BFQ0lFU1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ09VTlRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjJcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBXaGVuIHNlbGVjdGluZyBzaXRlcywgY29uc2lkZXIgcHJveGltaXR5IHRvIGJyZWVkaW5nIGFyZWFzIG9yIG5lc3Rpbmcgc2l0ZXMgZm9yIGJpcmRzIGFuZCBtYW1tYWxzIGluIGVmZm9ydCB0byBtaW5pbWl6ZSBkaXN0dXJiYW5jZSBhbmQgcHJvdGVjdCBhZGphY2VudCBmb3JhZ2luZyBhcmVhLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggTWFyaW5lIENsYXNzaWZpY2F0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBNYXJpbmUgQ2xhc3NpZmljYXRpb25zXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5DbGFzc2lmaWNhdGlvbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJpbmVDbGFzc2lmaWNhdGlvbnNcIixjLHAsMSksYyxwLDAsNTUwMyw1NjI1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX05BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIEluIFByb3RlY3Rpb24gTWFuYWdlbWVudCBab25lcywgcmVwcmVzZW50YXRpb24gaXMgb2Z0ZW4gb25lIGNyaXRlcmlhIGZvciBzaXRpbmcgaW4gYSBuZXR3b3JrLiBEYXRhIGZvciB0aGlzIHJlcG9ydCBpbmNsdWRlcyBiZW50aGljIGVjb3N5c3RlbXMgYW5kIG9jZWFub2dyYXBoaWMgcHJvY2Vzc2VzLiAgU2VlIG1ldGFkYXRhIGluIHRoZSBkYXRhIGxheWVycyBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5T3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIHJlZ2lvbmFsIHByb3Bvc2FsIGNvbnRhaW5zIFwiKTtfLmIoXy52KF8uZihcIm51bUNoaWxkcmVuXCIsYyxwLDApKSk7Xy5iKFwiIHpvbmVzIGFuZCBjb3ZlcnMgYSB0b3RhbCBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNpemVcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIGtpbG9tZXRlcnM8L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50XCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgXCIpO18uYihfLnYoXy5mKFwic2NfbmFtZVwiLGMscCwwKSkpO18uYihcIi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInRvY0NvbnRhaW5lclxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tIFwiKTtpZihfLnMoXy5mKFwiYWRqYWNlbnRQcm90ZWN0ZWRBcmVhXCIsYyxwLDEpLGMscCwwLDMzNyw4MTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+TmVhcmJ5IEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZSBncmVlbi1jaGVja1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFpvbmVzIHdpdGhpbiB0aGlzIHByb3Bvc2FsIGFyZSBhZGphY2VudCB0byBhIDxzdHJvbmc+VGVycmVzdHJpYWwgUHJvdGVjdGVkIEFyZWE8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgQnVpbGQgb24gcGFzdCBhbmQgZXhpc3Rpbmcgem9uaW5nIGVmZm9ydHMgdGhhdCBhcmUgY29uc2lzdGVudCB3aXRoIGFuIGVjb3N5c3RlbS1iYXNlZCBtYW5hZ2VtZW50IGFwcHJvYWNoLiAgV2hlcmV2ZXIgcG9zc2libGUsIGRvIG5vdCBkdXBsaWNhdGUgZXhpc3Rpbmcgem9uaW5nIGVmZm9ydHMgYW5kIGNvbnNpZGVyIGV4aXN0aW5nIHRlcnJlc3RyaWFsIHpvbmluZyBmb3IgYWRqYWNlbnQgbWFyaW5lIHpvbmluZyB0byBhY2hpZXZlIHpvbmluZyBvYmplY3RpdmVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VHJhbnNtaXNzaW9uIExpbmVzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjZhZDY3N2JiYjliMjQ1NzAyMGY1MlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIFwiKTtfLmIoXy52KF8uZihcInRyYW5zbWlzc2lvbkxpbmVzXCIsYyxwLDApKSk7Xy5iKFwiIGttIGZyb20gdGhlIG5lYXJlc3QgdHJhbnNtaXNzaW9uIGxpbmVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwxMTMzLDEyNTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fXJldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiY3VsdHVyZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggRXhpc3RpbmcgUHJvdGVjdGVkIEFyZWFzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUyMGQ0YzJhNjc0NjU5Y2I3YjM1ZDU3NVxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBFeGlzdGluZyBQcm90ZWN0ZWQgQXJlYXMuIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+UHJvdGVjdGVkIEFyZWE8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImhhc092ZXJsYXBXaXRoRXhpc3RpbmdNUEFzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpjZW50ZXI7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8cD5ObyBvdmVybGFwIHdpdGggZXhpc3RpbmcgcHJvdGVjdGVkIGFyZWFzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImV4aXN0aW5nTVBBc1wiLGMscCwxKSxjLHAsMCw4OTYsMTAxNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLiAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhZGphY2VudFByb3RlY3RlZEFyZWFcIixjLHAsMSksYyxwLDAsMTUzNSwyMDIwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5BZGphY2VudCB0byBUZXJyZXN0cmlhbCBQcm90ZWN0ZWQgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlIGdyZWVuLWNoZWNrXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIGFkamFjZW50IHRvIGEgPHN0cm9uZz5UZXJyZXN0cmlhbCBQcm90ZWN0ZWQgQXJlYTwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCdWlsZCBvbiBwYXN0IGFuZCBleGlzdGluZyB6b25pbmcgZWZmb3J0cyB0aGF0IGFyZSBjb25zaXN0ZW50IHdpdGggYW4gZWNvc3lzdGVtLWJhc2VkIG1hbmFnZW1lbnQgYXBwcm9hY2guICBXaGVyZXZlciBwb3NzaWJsZSwgZG8gbm90IGR1cGxpY2F0ZSBleGlzdGluZyB6b25pbmcgZWZmb3J0cyBhbmQgY29uc2lkZXIgZXhpc3RpbmcgdGVycmVzdHJpYWwgem9uaW5nIGZvciBhZGphY2VudCBtYXJpbmUgem9uaW5nIHRvIGFjaGlldmUgem9uaW5nIG9iamVjdGl2ZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwicG16XCIsYyxwLDEpLGMscCwwLDIwNTUsMzUzNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIEZpc2hlcmllcyBDbG9zdXJlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IEZpc2hlcmllcyBDbG9zdXJlcy4gRmlzaGVyaWVzIGNsb3N1cmVzIG1heSBuZWVkIHRvIGJlIGNvbnNpZGVyZWQgdG8gcmVkdWNlIHBvdGVudGlhbCBjb25mbGljdHMgYmV0d2VlbiB1c2VzIGFuZCBhY3Rpdml0aWVzLiBGZWRlcmFsIFJvY2tmaXNoIENvbnNlcnZhdGlvbiBBcmVhcyBhbmQgRmVkZXJhbCBTcG9uZ2UgUmVlZiBSZXNlcnZlIGFyZSBhbmFseXNlZCBmb3Igb3ZlcmxhcCB3aXRoIFwiKTtpZihfLnMoXy5mKFwiYXJyYXlcIixjLHAsMSksYyxwLDAsMjQzNSwyNDYxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ6b25lcyB3aXRoaW4gdGhpcyBwcm9wb3NhbFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwidGhpcyB6b25lXCIpO307Xy5iKFwiLiBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlRlbnVyZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImhhc0Nsb3N1cmVzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmNlbnRlcjtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDxwPk5vIG92ZXJsYXAgd2l0aCBmaXNoZXJpZXMgY2xvc3VyZXM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiY2xvc3VyZXNcIixjLHAsMSksYyxwLDAsMjg2NiwyOTg0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgRmlzaGVyaWVzIGNsb3N1cmVzIG1heSBuZWVkIHRvIGJlIGNvbnNpZGVyZWQgdG8gcmVkdWNlIHBvdGVudGlhbCBjb25mbGljdHMgYmV0d2VlbiB1c2VzIGFuZCBhY3Rpdml0aWVzLiBGZWRlcmFsIFJvY2tmaXNoIENvbnNlcnZhdGlvbiBBcmVhcyBhbmQgRmVkZXJhbCBTcG9uZ2UgUmVlZiBSZXNlcnZlIGFyZSBhbmFseXNlZCBmb3Igb3ZlcmxhcCB3aXRoIFwiKTtpZihfLnMoXy5mKFwiYXJyYXlcIixjLHAsMSksYyxwLDAsMzI5OSwzMzI1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ6b25lcyB3aXRoaW4gdGhpcyBwcm9wb3NhbFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwidGhpcyB6b25lXCIpO307Xy5iKFwiLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBQcm92aW5jaWFsIFRlbnVyZXMgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmMmY1Y2JhNzJlYzA2ODE2MDYyMDhlXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IFByb3ZpbmNpYWwgVGVudXJlcy5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlRlbnVyZXM8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgKGttwrIpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwICU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImhhc1Byb3ZpbmNpYWxUZW51cmVzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjpjZW50ZXI7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8cD5ObyBvdmVybGFwIHdpdGggUHJvdmluY2lhbCBUZW51cmVzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcInByb3ZpbmNpYWxcIixjLHAsMSksYyxwLDAsNDE4Niw0MzA0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgVG8gYXZvaWQsIG1pbmltaXNlIGFuZC9vciByZWR1Y2UgcG90ZW50aWFsIGNvbmZsaWN0cyBiZXR3ZWVuIGV4aXN0aW5nIHRlbnVyZWQgdXNlcyBhbmQgYWN0aXZpdGllcyBhbmQgbWFyaW5lIHByb3RlY3Rpb24sIGV4YW1pbmUgdGhlIG92ZXJsYXAgd2l0aCBwcm92aW5jaWFsIGNyb3duIHRlbnVyZXMgZnJvbSB0aGUgQkMgUHJvdmluY2lhbCB0ZW51cmVzIGRhdGFiYXNlLiBEYXRhIHNvdXJjZTogUHJvdmluY2lhbCBUZW51cmVzLiBVcGRhdGVkOiBEZWMgMTAxM1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJkZW1vXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk91dHB1dDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cHJlPlwiKTtfLmIoXy52KF8uZihcInJlc3VsdFwiLGMscCwwKSkpO18uYihcIjwvcHJlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJlY29ub21pY1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZighXy5zKF8uZihcInBtelwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIHRvIFRyYW5zbWlzc2lvbiBMaW5lcyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY2YWQ2NzdiYmI5YjI0NTcwMjBmNTJcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgem9uZSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInRyYW5zbWlzc2lvbkxpbmVzXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IGttIGZyb20gdGhlIG5lYXJlc3QgPHN0cm9uZz50cmFuc21pc3Npb24gbGluZXM8L3N0cm9uZz4uIFRoaXMgaG9yaXpvbnRhbCwgc3RyYWlnaHQgbGluZSBkaXN0YW5jZSBtaWdodCBiZSBoZWxwZnVsIGluIGNhbGN1bGF0aW5nIHRoZSBwb3NzaWJsZSBlY29ub21pYyBjb3N0cyBmb3IgcmVuZXdhYmxlIGVuZXJneSBkZXZlbG9wbWVudCBpbiB0aGlzIHpvbmUuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIHRvIEluZnJhc3RydWN0dXJlPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JbmZyYXN0cnVjdHVyZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+RGlzdGFuY2UgKGttKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpbmZyYXN0cnVjdHVyZVwiLGMscCwxKSxjLHAsMCw3MDUsNzkxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRGlzdEluS01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGQgY29sc3Bhbj1cXFwiMlxcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhlIGhvcml6b250YWwgZGlzdGFuY2UgdG8gZmVycmllcywgcG9ydHMsIGhhcmJvdXJzLCBmdWVsIGRvY2tzLCBhbmQgb3RoZXIgbWFyaW5lIGFuZCBjb2FzdGFsIGluZnJhc3RydWN0dXJlIG1pZ2h0IGJlIGhlbHBmdWwgZm9yIHBsYW5uaW5nIG1hcmluZSB1c2VzIGFuZCBhY3Rpdml0aWVzIHRoYXQgYXJlIHN1cHBvcnRlZCBpbiB0aGlzIHpvbmUuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9O2lmKF8ucyhfLmYoXCJwbXpcIixjLHAsMSksYyxwLDAsMTE2NiwxMzE1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ObyBSZXBvcnRzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIE5vIEh1bWFuIFdlbGwtQmVpbmcgcmVwb3J0cyBmb3IgUHJvdGVjdGlvbiBNYW5hZ2VtZW50IFpvbmVzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImVudmlyb25tZW50XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXQgUmVwcmVzZW50YXRpb24gPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYzMDJkNTA4ZGM0ZjVmMmQwMDk5NmFcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+IC0tPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYSAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPlByb3RlY3RlZCBBcmVhICglKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwzODMsNDcxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+PHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9OQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD48L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIEhhYml0YXQgZGF0YSBmb3IgYmVudGhpYyBlY29zeXN0ZW1zLCBwZWxhZ2ljIGFyZWFzLCBhbmQgb2NlYW5vZ3JhcGhpYyBwcm9jZXNzZXMgaXMgdXNlZCB0byBpbmZvcm0gc2l0aW5nIG9mIHRoaXMgem9uZS4gSW5jbHVkZWQgaGVyZSBhcmUgYmlvZ2VuaWMgaGFiaXRhdHMgYXMgd2VsbCBhcyBjb21tdW5pdHktZm9ybWluZyBzcGVjaWVzLCBzdWNoIGFzIGVlbGdyYXNzIGFuZCBrZWxwLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBJbXBvcnRhbnQgTWFyaW5lIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSAgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IEltcG9ydGFudCBNYXJpbmUgQXJlYXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkltcG9ydGFudCBBcmVhPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5PdmVybGFwIChrbcKyKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImltcG9ydGFudEFyZWFzXCIsYyxwLDEpLGMscCwwLDEyMDQsMTMyMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicG16XCIsYyxwLDEpLGMscCwwLDE0MzgsMjE2NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFdoZW4gc2VsZWN0aW5nIHNpdGVzIGZvciBQTVpzLCBjb25zaWRlciB0aGUgbG9jYXRpb24gb2YgSW1wb3J0YW50IE1hcmluZSBBcmVhcyBmb3IgbWFyaW5lIG1hbW1hbHMsIGZpc2ggYW5kIGJpcmRzLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBJbXBvcnRhbnQgQXJlYXMgd2VyZSBpZGVudGlmaWVkIGR1cmluZyB0aGUgcHJvY2VzcyBvZiBlc3RhYmxpc2hpbmcgRWNvbG9naWNhbGx5IGFuZCBCaW9sb2dpY2FsbHkgU2lnbmlmaWNhbnQgQXJlYXMgKEVCU0FzKSBieSB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL3BuY2ltYS5vcmcvc2l0ZS9hdGxhcy5odG1sXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+IFBhY2lmaWMgTm9ydGggQ29hc3QgSW50ZWdyYXRlZCBNYW5hZ2VtZW50IEFyZWEgKFBOQ0lNQSk8L2E+LiBJbXBvcnRhbnQgQmlyZCBBcmVhcyAoSUJBcykgd2VyZSBhbHNvIGlkZW50aWZpZWQgYnkgQmlyZCBTdHVkaWVzIENhbmFkYSBhbmQgTmF0dXJlIENhbmFkYSwgaW4gcGFydG5lcnNoaXAgd2l0aCBCaXJkTGlmZSBJbnRlcm5hdGlvbmFsLiAgQ3JpdGljYWwgSGFiaXRhdCBtZWV0cyBDYW5hZGEncyBTcGVjaWVzIGF0IFJpc2sgKFNBUkEpIHJlcXVpcmVtZW50cy4gU2VlIGRhdGEgbGF5ZXJzIGZvciBtb3JlIGluZm9ybWF0aW9uLiAgRGF0YSBzb3VyY2VzOiB1cCB0byAyMDA5LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwic216XCIsYyxwLDEpLGMscCwwLDIxOTIsMzE4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIFRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gaHVtYW4gdXNlcyBhbmQgbWFyaW5lIHNwZWNpZXMsIGNvbnNpZGVyIHRoZXNlIEltcG9ydGFudCBNYXJpbmUgQXJlYXMgZm9yIG1hcmluZSBtYW1tYWxzLCBmaXNoIGFuZCBiaXJkcy4gIFRoZXNlIGFyZWFzIGRvIG5vdCBpbmNsdWRlIGFsbCBvZiB0aGUgZm9yYWdpbmcgYW5kIGJyZWVkaW5nIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHNwZWNpZXMgaW4gdGhlIE1hUFAgc3R1ZHkgYXJlYS4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgSW1wb3J0YW50IEFyZWFzIHdlcmUgaWRlbnRpZmllZCBkdXJpbmcgdGhlIHByb2Nlc3Mgb2YgZXN0YWJsaXNoaW5nIEVjb2xvZ2ljYWxseSBhbmQgQmlvbG9naWNhbGx5IFNpZ25pZmljYW50IEFyZWFzIChFQlNBcykgYnkgdGhlIDxhIGhyZWY9XFxcImh0dHA6Ly9wbmNpbWEub3JnL3NpdGUvYXRsYXMuaHRtbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPiBQYWNpZmljIE5vcnRoIENvYXN0IEludGVncmF0ZWQgTWFuYWdlbWVudCBBcmVhIChQTkNJTUEpPC9hPi4gSW1wb3J0YW50IEJpcmQgQXJlYXMgKElCQXMpIHdlcmUgYWxzbyBpZGVudGlmaWVkIGJ5IEJpcmQgU3R1ZGllcyBDYW5hZGEgYW5kIE5hdHVyZSBDYW5hZGEsIGluIHBhcnRuZXJzaGlwIHdpdGggQmlyZExpZmUgSW50ZXJuYXRpb25hbC4gIENyaXRpY2FsIEhhYml0YXQgbWVldHMgQ2FuYWRhJ3MgU3BlY2llcyBhdCBSaXNrIChTQVJBKSByZXF1aXJlbWVudHMuIFBvdGVudGlhbCBjcml0aWNhbCBpcyBpbnN1ZmZpY2llbnQgaW5mb3JtYXRpb24gdG8gbWVldCBTQVJBIHJlcXVpcmVtZW50cy4gU2VlIHRoZSBQTkNJTUEgYXRsYXMgZm9yIG1vcmUgaW5mb3JtYXRpb24uIFNlZSBkYXRhIGxheWVycyBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gIERhdGEgc291cmNlczogdXAgdG8gMjAwOS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NYXJ4YW4gQW5hbHlzaXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHNlbGVjdCBjbGFzcz1cXFwiY2hvc2VuXFxcIiB3aWR0aD1cXFwiNDAwcHhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJ4YW5BbmFseXNlc1wiLGMscCwxKSxjLHAsMCwzNDgxLDM1MjcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8b3B0aW9uIHZhbHVlPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiPC9vcHRpb24+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvc2VsZWN0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvUmVzdWx0c1xcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb0Rlc2NyaXB0aW9uXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgTWFQUCBjb2xsYWJvcmF0ZWQgd2l0aCB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL2JjbWNhLmNhL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkJDIE1hcmluZSBDb25zZXJ2YXRpb24gQW5hbHlzaXMgKEJDTUNBKTwvYT4gdG8gaWRlbnRpZnkgbWFyaW5lIGFyZWFzIG9mIGhpZ2ggY29uc2VydmF0aW9uIHZhbHVlIGJhc2VkIG9uIHNwYXRpYWwgZGF0YXNldHMgb2YgZWNvbG9naWNhbCBpbmZvcm1hdGlvbi4gVGhlc2UgTWFyeGFuIHNjZW5hcmlvcyBjYW4gYmUgdXNlZCB0byBpbmZvcm0gdGhlIGxvY2F0aW9uIG9yIHNpdGluZyBvZiBNYVBQIHpvbmVzLiA8YSBocmVmPVxcXCJodHRwOi8vd3d3LnVxLmVkdS5hdS9tYXJ4YW4vXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+TWFyeGFuPC9hPiBpcyBhIGRlY2lzaW9uIHN1cHBvcnQgdG9vbCBkZXZlbG9wZWQgYnkgdGhlIFVuaXZlcnNpdHkgb2YgUXVlZW5zbGFuZCB0byBwcm92aWRlIHNvbHV0aW9ucyB0byB0aGUg4oCcbWluaW11bSBzZXQgcHJvYmxlbeKAnSAtIGNhcHR1cmluZyBhIHNwZWNpZmllZCBhbW91bnQgKHRhcmdldCkgb2YgaW5kaXZpZHVhbCBmZWF0dXJlcyBmb3IgdGhlIGxlYXN0IGNvc3QuIEJhc2VkIG9uIHJlbGF0aXZlbHkgc2ltcGxlIG1hdGhlbWF0aWNhbCBhbGdvcml0aG1zIGFuZCBlcXVhdGlvbnMsIE1hcnhhbiBzZWFyY2hlcyBtaWxsaW9ucyBvZiBwb3RlbnRpYWwgc29sdXRpb25zIHRvIGZpbmQgdGhlIGJlc3QgYmFsYW5jZSBiZXR3ZWVuIGNvc3RzIGFuZCBiZW5lZml0cy4gSW4gc2hvcnQsIE1hcnhhbiBzb2x1dGlvbnMgbWluaW1pemUgdGhlIG92ZXJhbGwgY29zdCBzdWJqZWN0IHRvIHRoZSBjb25zdHJhaW50IG9mIG1lZXRpbmcgc3BlY2lmaWVkIOKAnHRhcmdldHPigJ0gZm9yIGFsbCBmZWF0dXJlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBNYVBQIGNvbnN1bHRlZCB0aGUgTWFQUCBTY2llbmNlIEFkdmlzb3J5IENvbW1pdHRlZSAoU0FDKSBmb3IgYWR2aWNlIG9uIHNjZW5hcmlvcyBhbmQgdGFyZ2V0IHNlbGVjdGlvbi4gIFRoZSBTQUMgc3VwcG9ydGVkIHRoZSBkZWNpc2lvbiB0byB1c2UgdGhlIHBlcmNlbnRhZ2UgdGFyZ2V0IGNhdGVnb3JpZXMgZXN0YWJsaXNoZWQgYnkgdGhlIEJDTUNBIHByb2plY3QgdGVhbSBpbiAyMDA2LiBQbGVhc2Ugc2VlIHRoaXMgPGEgaHJlZj1cXFwiaHR0cHM6Ly9kbC5kcm9wYm94dXNlcmNvbnRlbnQuY29tL3UvMTc2NDk4Ni9CQ01DQS1NYXJ4YW4gZm9yIE1hUFAtUmVwb3J0IG9uIGluaXRpYWwgc2NlbmFyaW9zXzI3RmViMjAxMy5wZGZcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj4yMDEzIEJDTUNBIHJlcG9ydDwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIE1hUFAtQkNNQ0EgcHJvamVjdCBhbmQgTWFyeGFuIHNjZW5hcmlvcywgYW5kIGNvbnN1bHQgdGhlIDxhIGhyZWY9XFxcImh0dHA6Ly9iY21jYS5jYVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkJDTUNBIEF0bGFzPC9hPiBmb3IgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgdGFyZ2V0cywgc3BlY2llcywgYW5kIGhhYml0YXRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkFkamFjZW50IEJyZWVkaW5nIFNpdGVzIGZvciBCaXJkcyBhbmQgTWFtbWFsczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJJcyBub3QgYWRqYWNlbnQgdG8gYnJlZWRpbmcgc2l0ZXMgZm9yIGJpcmRzIGFuZCBtYW1tYWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5TcGVjaWVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgQnJlZWRpbmcgQXJlYXMgb3IgTmVzdGluZyBTaXRlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub25GaXNoQnJlZWRpbmdBcmVhc1wiLGMscCwxKSxjLHAsMCw1NTQwLDU2MjYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTUEVDSUVTXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjJcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICBXaGVuIHNlbGVjdGluZyBzaXRlcywgY29uc2lkZXIgcHJveGltaXR5IHRvIGJyZWVkaW5nIGFyZWFzIG9yIG5lc3Rpbmcgc2l0ZXMgZm9yIGJpcmRzIGFuZCBtYW1tYWxzIGluIGVmZm9ydCB0byBtaW5pbWl6ZSBkaXN0dXJiYW5jZSBhbmQgcHJvdGVjdCBhZGphY2VudCBmb3JhZ2luZyBhcmVhLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggTWFyaW5lIENsYXNzaWZpY2F0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBNYXJpbmUgQ2xhc3NpZmljYXRpb25zXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5DbGFzc2lmaWNhdGlvbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJpbmVDbGFzc2lmaWNhdGlvbnNcIixjLHAsMSksYyxwLDAsNjM1Nyw2NDc5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX05BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIEluIFByb3RlY3Rpb24gTWFuYWdlbWVudCBab25lcywgcmVwcmVzZW50YXRpb24gaXMgb2Z0ZW4gb25lIGNyaXRlcmlhIGZvciBzaXRpbmcgaW4gYSBuZXR3b3JrLiBEYXRhIGZvciB0aGlzIHJlcG9ydCBpbmNsdWRlcyBiZW50aGljIGVjb3N5c3RlbXMgYW5kIG9jZWFub2dyYXBoaWMgcHJvY2Vzc2VzLiAgU2VlIG1ldGFkYXRhIGluIHRoZSBkYXRhIGxheWVycyBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2l6ZVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUga2lsb21ldGVyczwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSBcIik7Xy5iKF8udihfLmYoXCJzY19uYW1lXCIsYyxwLDApKSk7Xy5iKFwiLiBTaXplIGlzIHVzZWQgdG8gcXVhbnRpZnkgZHJhZnQgc3BhdGlhbCB6b25lcyBhbmQgcHJvdmlkZSBwZXJjZW50IGNvdmVyYWdlLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsMzAzLDQyOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTsiXX0=
;