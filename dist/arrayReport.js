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
    var context, zoneType, _ref1, _ref2, _ref3;
    zoneType = _.find(this.model.getAttributes(), function(attr) {
      return attr.exportid === "ZONE_TYPE";
    });
    zoneType = (zoneType != null ? zoneType.value : void 0) || 'smz';
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      array: ((_ref1 = this.children) != null ? _ref1.length : void 0) > 0,
      pmz: !(((_ref2 = this.children) != null ? _ref2.length : void 0) > 0) && zoneType === 'pmz',
      smz: !(((_ref3 = this.children) != null ? _ref3.length : void 0) > 0) && zoneType === 'smz',
      existingMPAs: this.recordSet('ExistingMarineProtectedAreas', "ExistingMarineProtectedAreas").toArray(),
      closures: this.recordSet("Closures", "FisheriesClosures").toArray(),
      provincial: this.recordSet("OverlapWithExistingProvincialTenures", "ProvincialTenures").toArray()
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
    var context,
      _this = this;
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

this["Templates"]["arrayCulture"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Existing Protected Areas <a href=\"#\" data-toggle-node=\"520d4c2a674659cb7b35d575\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Existing Protected Areas. MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Protected Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("existingMPAs",c,p,1),c,p,0,663,781,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.  ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);if(_.s(_.f("pmz",c,p,1),c,p,0,1284,2566,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Fisheries Closures</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Fisheries Closures. Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,1664,1690,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". \">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("closures",c,p,1),c,p,0,1896,2014,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,2329,2355,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Provincial Tenures <a href=\"#\" data-toggle-node=\"51f2f5cba72ec0681606208e\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Provincial Tenures.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("provincial",c,p,1),c,p,0,3001,3119,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);if(_.s(_.f("smz",c,p,1),c,p,0,3232,3546,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          One of the objectives for Special Management Zones is to provide for certainty for business and user groups, including economic development opportunities.  To reduce potential conflicts between uses and activities, Special Management Zones need to consider existing provincial crown tenures. ");_.b("\n");});c.pop();}if(_.s(_.f("pmz",c,p,1),c,p,0,3573,3733,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          To reduce potential conflicts between uses and activities, Protection Management Zones need to consider existing provincial crown tenures.");_.b("\n");});c.pop();}if(_.s(_.f("array",c,p,1),c,p,0,3762,3900,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          To reduce potential conflicts between uses and activities, zones need to consider existing provincial crown tenures.");_.b("\n");});c.pop();}_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["arrayEconomic"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>No Reports </h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    Human Well-Being reports for collections are coming soon...");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});

this["Templates"]["arrayEnvironment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation (All Zones Combined)</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Protected Area (km²)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,267,333,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Habitat data for benthic ecosystems, pelagic areas, and oceanographic processes is used to inform siting of zones. Included here are biogenic habitats as well as community-forming species, such as eelgrass and kelp.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Existing Protected Areas <a href=\"#\" data-toggle-node=\"520d4c2a674659cb7b35d575\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Existing Protected Areas. MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Protected Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("existingMPAs",c,p,1),c,p,0,1373,1491,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.  ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Important Marine Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Important Marine Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Important Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("importantAreas",c,p,1),c,p,0,2339,2457,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          To reduce potential conflicts with these marine species, ");if(_.s(_.f("pmz",c,p,1),c,p,0,2631,2658,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Protection Management Zones");});c.pop();}if(_.s(_.f("smz",c,p,1),c,p,0,2674,2698,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Special Management Zones");});c.pop();}_.b(" may consider these areas. Important Areas were identified during the process of establishing Ecologically and Biologically Significant Areas (EBSAs) by the Pacific North Coast Integrated Management Area (PNCIMA). Important Bird Areas (IBAs) were identified by Bird Studies Canada and Nature Canada.  Critical Habitat meets Canada's Species at Risk Requirements. Potential critical is insufficient information to meet SARA requirements. See the <a href=\"http://pncima.org/site/atlas.html\" target=\"_blank\">PNCIMA atlas</a> for more information ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,3540,3586,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP collaborated with the <a href=\"http://bcmca.ca/\" target=\"_blank\">BC Marine Conservation Analysis (BCMCA)</a> to identify marine areas of high conservation value based on spatial datasets of ecological information. These Marxan scenarios can be used to inform the location or siting of MaPP zones. <a href=\"http://www.uq.edu.au/marxan/\" target=\"_blank\">Marxan</a> is a decision support tool developed by the University of Queensland to provide solutions to the “minimum set problem” - capturing a specified amount (target) of individual features for the least cost. Based on relatively simple mathematical algorithms and equations, Marxan searches millions of potential solutions to find the best balance between costs and benefits. In short, Marxan solutions minimize the overall cost subject to the constraint of meeting specified “targets” for all features.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP consulted the MaPP Science Advisory Committee (SAC) for advice on scenarios and target selection.  The SAC supported the decision to use the percentage target categories established by the BCMCA project team in 2006. Please see this <a href=\"https://dl.dropboxusercontent.com/u/1764986/BCMCA-Marxan for MaPP-Report on initial scenarios_27Feb2013.pdf\" target=\"_blank\">2013 BCMCA report</a> for more information about the MaPP-BCMCA project and Marxan scenarios, and consult the <a href=\"http://bcmca.ca\" target=\"_blank\">BCMCA Atlas</a> for detailed information about targets, species, and habitats.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Non Fish Breeding Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Non Fish Breeding Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Species</th>");_.b("\n" + i);_.b("        <th>Number of Breeding Areas or Nesting Sites</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("nonFishBreedingAreas",c,p,1),c,p,0,5580,5666,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SPECIES",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Marine Classifications</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Marine Classifications\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Classification</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("marineClassifications",c,p,1),c,p,0,6082,6204,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["arrayOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This regional proposal contains ");_.b(_.v(_.f("numChildren",c,p,0)));_.b(" zones and covers a total of <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <div class=\"tocContainer\"></div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!-- ");if(_.s(_.f("adjacentProtectedArea",c,p,1),c,p,0,270,746,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Nearby Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    Zones within this proposal are adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Build on past and existing zoning efforts that are consistent with an ecosystem-based management approach.  Wherever possible, do not duplicate existing zoning efforts and consider existing terrestrial zoning for adjacent marine zoning to achieve zoning objectives.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b(" -->");_.b("\n" + i);_.b("<!-- <div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Transmission Lines <a href=\"#\" data-toggle-node=\"51f6ad677bbb9b2457020f52\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is ");_.b(_.v(_.f("transmissionLines",c,p,0)));_.b(" km from the nearest transmission lines.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b(" -->");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,1066,1192,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["culture"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Existing Protected Areas <a href=\"#\" data-toggle-node=\"520d4c2a674659cb7b35d575\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Existing Protected Areas. MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Protected Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("existingMPAs",c,p,1),c,p,0,663,781,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          MaPP recommends spatial locations for marine protection that include either or both ecological and cultural values, including areas that contribute to a Marine Protected Area network for the Northern Shelf Bioregion.  ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);if(_.s(_.f("pmz",c,p,1),c,p,0,1284,2566,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Fisheries Closures</h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Fisheries Closures. Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,1664,1690,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". \">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("closures",c,p,1),c,p,0,1896,2014,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Fisheries closures may need to be considered to reduce potential conflicts between uses and activities. Federal Rockfish Conservation Areas and Federal Sponge Reef Reserve are analysed for overlap with ");if(_.s(_.f("array",c,p,1),c,p,0,2329,2355,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("zones within this proposal");});c.pop();}if(!_.s(_.f("array",c,p,1),c,p,1,0,0,"")){_.b("this zone");};_.b(". ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Provincial Tenures <a href=\"#\" data-toggle-node=\"51f2f5cba72ec0681606208e\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\" data-no-rows=\"Does not overlap any Provincial Tenures.\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Tenures</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("provincial",c,p,1),c,p,0,3001,3119,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);if(_.s(_.f("smz",c,p,1),c,p,0,3232,3546,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          One of the objectives for Special Management Zones is to provide for certainty for business and user groups, including economic development opportunities.  To reduce potential conflicts between uses and activities, Special Management Zones need to consider existing provincial crown tenures. ");_.b("\n");});c.pop();}if(_.s(_.f("pmz",c,p,1),c,p,0,3573,3733,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          To reduce potential conflicts between uses and activities, Protection Management Zones need to consider existing provincial crown tenures.");_.b("\n");});c.pop();}if(_.s(_.f("array",c,p,1),c,p,0,3762,3900,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          To reduce potential conflicts between uses and activities, zones need to consider existing provincial crown tenures.");_.b("\n");});c.pop();}_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");return _.fl();;});

this["Templates"]["demo"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Output</h4>");_.b("\n" + i);_.b("  <pre>");_.b(_.v(_.f("result",c,p,0)));_.b("</pre>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["economic"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(!_.s(_.f("pmz",c,p,1),c,p,1,0,0,"")){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Transmission Lines <a href=\"#\" data-toggle-node=\"51f6ad677bbb9b2457020f52\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is ");_.b(_.v(_.f("transmissionLines",c,p,0)));_.b(" km from the nearest transmission lines.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Distance to Infrastructure</h4>");_.b("\n" + i);_.b("  <table>");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Infrastructure</th>");_.b("\n" + i);_.b("        <th>Distance (km)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("infrastructure",c,p,1),c,p,0,512,598,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("Name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("DistInKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("      <td colspan=\"2\" class=\"paragraph\">");_.b("\n" + i);_.b("      The horizontal distance to ferries, ports, harbours, fuel docks, and other marine and coastal infrastructure might be helpful for planning marine uses and activities that are supported in this zone. ");_.b("\n" + i);_.b("      </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");};_.b("\n" + i);if(_.s(_.f("pmz",c,p,1),c,p,0,974,1139,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>No Reports</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    Human Well-Being reports for Protection Management Zones are coming soon...");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Habitat Representation <!-- <a href=\"#\" data-toggle-node=\"51f302d508dc4f5f2d00996a\" data-visible=\"false\">show layer</a> --></h4>");_.b("\n" + i);_.b("  <table data-paging=\"10\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Habitat</th>");_.b("\n" + i);_.b("        <th>Protected Area (km²)</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,347,413,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr><td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td><td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td></tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          Habitat data for benthic ecosystems, pelagic areas, and oceanographic processes is used to inform siting of this zone. Included here are biogenic habitats as well as community-forming species, such as eelgrass and kelp.");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Important Marine Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Important Marine Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Important Area</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("importantAreas",c,p,1),c,p,0,1146,1264,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("    <tfoot>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <td colspan=\"3\" class=\"paragraph\">");_.b("\n" + i);_.b("          To reduce potential conflicts with these marine species, ");if(_.s(_.f("pmz",c,p,1),c,p,0,1438,1465,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Protection Management Zones");});c.pop();}if(_.s(_.f("smz",c,p,1),c,p,0,1481,1505,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("Special Management Zones");});c.pop();}_.b(" may consider these areas. Important Areas were identified during the process of establishing Ecologically and Biologically Significant Areas (EBSAs) by the Pacific North Coast Integrated Management Area (PNCIMA). Important Bird Areas (IBAs) were identified by Bird Studies Canada and Nature Canada.  Critical Habitat meets Canada's Species at Risk Requirements. Potential critical is insufficient information to meet SARA requirements. See the <a href=\"http://pncima.org/site/atlas.html\" target=\"_blank\">PNCIMA atlas</a> for more information ");_.b("\n" + i);_.b("        </td>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </tfoot>");_.b("\n" + i);_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("  <!-- <a href=\"#\" data-toggle-node=\"51f5545c08dc4f5f2d216146\" data-visible=\"false\">show habitats layer</a> -->");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Marxan Analysis</h4>");_.b("\n" + i);_.b("  <select class=\"chosen\" width=\"400px\">");_.b("\n" + i);if(_.s(_.f("marxanAnalyses",c,p,1),c,p,0,2347,2393,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <option value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("  </select>");_.b("\n" + i);_.b("  <p class=\"scenarioResults\"></p>");_.b("\n" + i);_.b("  <div class=\"viz\"></div>");_.b("\n" + i);_.b("  <p class=\"scenarioDescription\"></p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP collaborated with the <a href=\"http://bcmca.ca/\" target=\"_blank\">BC Marine Conservation Analysis (BCMCA)</a> to identify marine areas of high conservation value based on spatial datasets of ecological information. These Marxan scenarios can be used to inform the location or siting of MaPP zones. <a href=\"http://www.uq.edu.au/marxan/\" target=\"_blank\">Marxan</a> is a decision support tool developed by the University of Queensland to provide solutions to the “minimum set problem” - capturing a specified amount (target) of individual features for the least cost. Based on relatively simple mathematical algorithms and equations, Marxan searches millions of potential solutions to find the best balance between costs and benefits. In short, Marxan solutions minimize the overall cost subject to the constraint of meeting specified “targets” for all features.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    MaPP consulted the MaPP Science Advisory Committee (SAC) for advice on scenarios and target selection.  The SAC supported the decision to use the percentage target categories established by the BCMCA project team in 2006. Please see this <a href=\"https://dl.dropboxusercontent.com/u/1764986/BCMCA-Marxan for MaPP-Report on initial scenarios_27Feb2013.pdf\" target=\"_blank\">2013 BCMCA report</a> for more information about the MaPP-BCMCA project and Marxan scenarios, and consult the <a href=\"http://bcmca.ca\" target=\"_blank\">BCMCA Atlas</a> for detailed information about targets, species, and habitats.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Non Fish Breeding Areas</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Non Fish Breeding Areas\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Species</th>");_.b("\n" + i);_.b("        <th>Number of Breeding Areas or Nesting Sites</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("nonFishBreedingAreas",c,p,1),c,p,0,4387,4473,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("SPECIES",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Overlap with Marine Classifications</h4>");_.b("\n" + i);_.b("  <table  data-paging=\"10\" data-no-rows=\"Does not overlap any Marine Classifications\">");_.b("\n" + i);_.b("    <thead>");_.b("\n" + i);_.b("      <tr>");_.b("\n" + i);_.b("        <th>Classification</th>");_.b("\n" + i);_.b("        <th>Overlap (km²)</th>");_.b("\n" + i);_.b("        <th>Overlap %</th>");_.b("\n" + i);_.b("      </tr>");_.b("\n" + i);_.b("    </thead>");_.b("\n" + i);_.b("    <tbody>");_.b("\n" + i);if(_.s(_.f("marineClassifications",c,p,1),c,p,0,4889,5011,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <tr>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("HAB_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("CLPD_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        <td>");_.b(_.v(_.f("PERC_AREA",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("      </tr>");_.b("\n");});c.pop();}_.b("    </tbody>");_.b("\n" + i);_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p class=\"large\">");_.b("\n" + i);_.b("    This zone is <strong>");_.b(_.v(_.f("size",c,p,0)));_.b(" square kilometers</strong>. Size is used to quantify draft spatial zones and provide percent coverage. ");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("adjacentProtectedArea",c,p,1),c,p,0,243,701,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Nearby Areas</h4>");_.b("\n" + i);_.b("  <p class=\"large green-check\">");_.b("\n" + i);_.b("    This zone is adjacent to a <strong>Terrestrial Protected Area</strong>.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Build on past and existing zoning efforts that are consistent with an ecosystem-based management approach.  Wherever possible, do not duplicate existing zoning efforts and consider existing terrestrial zoning for adjacent marine zoning to achieve zoning objectives.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("anyAttributes",c,p,1),c,p,0,748,874,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});

module.exports = this["Templates"];
},{}]},{},[15])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9fZW1wdHkuanMiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvbWFwcC1yZXBvcnRzLXYyL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0UmVzdWx0cy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5Q3VsdHVyZVRhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5RWNvbm9taWNUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9tYXBwLXJlcG9ydHMtdjIvc2NyaXB0cy9hcnJheUVudmlyb25tZW50VGFiLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvbWFwcC1yZXBvcnRzLXYyL3NjcmlwdHMvYXJyYXlPdmVydmlld1RhYi5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL21hcHAtcmVwb3J0cy12Mi9zY3JpcHRzL2FycmF5UmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvbWFwcC1yZXBvcnRzLXYyL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztBQ0FBLENBQU8sQ0FBVSxDQUFBLEdBQVgsQ0FBTixFQUFrQjtDQUNoQixLQUFBLDJFQUFBO0NBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQUFBLEdBQVk7Q0FEWixDQUVBLENBQUEsR0FBTTtBQUNDLENBQVAsQ0FBQSxDQUFBLENBQUE7Q0FDRSxFQUFBLENBQUEsR0FBTyxxQkFBUDtDQUNBLFNBQUE7SUFMRjtDQUFBLENBTUEsQ0FBVyxDQUFBLElBQVgsYUFBVztDQUVYO0NBQUEsTUFBQSxvQ0FBQTt3QkFBQTtDQUNFLEVBQVcsQ0FBWCxHQUFXLENBQVg7Q0FBQSxFQUNTLENBQVQsRUFBQSxFQUFpQixLQUFSO0NBQ1Q7Q0FDRSxFQUFPLENBQVAsRUFBQSxVQUFPO0NBQVAsRUFDTyxDQUFQLENBREEsQ0FDQTtBQUMrQixDQUYvQixDQUU4QixDQUFFLENBQWhDLEVBQUEsRUFBUSxDQUF3QixLQUFoQztDQUZBLENBR3lCLEVBQXpCLEVBQUEsRUFBUSxDQUFSO01BSkY7Q0FNRSxLQURJO0NBQ0osQ0FBZ0Ms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LGVBQUE7Q0FmQSxFQWdCUSxDQUFSLENBQUE7Q0FoQkEsQ0FpQm1CLENBQW5CLENBQUEsQ0FBTSxDQUFOO0NBakJBLEVBa0JRLENBQVIsQ0FBQSxDQUFRLEVBQUE7QUFDUixDQUFBLFFBQUEsbUNBQUE7d0JBQUE7Q0FDRSxDQUFxQixDQUFyQixDQUFJLENBQUosQ0FBQSxJQUFBO0NBREYsSUFuQkE7Q0FBQSxFQXFCa0IsQ0FBbEIsRUFBd0IsQ0FBTixRQUFsQixRQUFrQjtDQXJCbEIsRUFzQkEsQ0FBQSxDQUFXLFVBQUE7Q0F0QlgsQ0F1QkEsQ0FBK0IsQ0FBL0IsRUFBQSxTQUFBO0NBQ0MsRUFBRyxDQUFILEVBQUQsS0FBQTtDQXBDRixFQVVROztDQVZSLEVBc0NRLEdBQVIsR0FBUTtDQUNOLElBQUEsR0FBQTs7Q0FBTSxJQUFGLENBQUo7TUFBQTtDQURNLFVBRU4sZ0NBQUE7Q0F4Q0YsRUFzQ1E7O0NBdENSOztDQUQ2Qjs7QUE0Qy9CLENBbkRBLEVBbURpQixHQUFYLENBQU4sU0FuREE7Ozs7QUNBQSxJQUFBLG9FQUFBOztBQUFBLENBQUEsRUFBbUIsSUFBQSxTQUFuQixXQUFtQjs7QUFDbkIsQ0FEQSxFQUNzQixJQUFBLFlBQXRCLFdBQXNCOztBQUN0QixDQUZBLEVBRW1CLElBQUEsU0FBbkIsV0FBbUI7O0FBQ25CLENBSEEsRUFHa0IsSUFBQSxRQUFsQixXQUFrQjs7QUFFbEIsQ0FMQSxFQUtVLEdBQUosR0FBcUIsS0FBM0I7Q0FDRSxDQUFBLEVBQUEsRUFBTSxTQUFNLENBQUEsR0FBQTtDQU9MLEtBQUQsR0FBTixFQUFBLEdBQW1CO0NBUks7Ozs7QUNMMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3IgXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT4gXG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZCAgICAgICAgXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBpZiBfLmlzQXJyYXkgQGRhdGEudmFsdWVcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlWzBdXG4gICAgICBlbHNlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVxuICAgIF8ubWFwIGRhdGEuZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgY29uc29sZS5sb2cgQGRhdGFcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3IFxuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIHN1cGVyKClcbiAgXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgdG90YWwgPSAobmV3IERhdGUoQG1heEV0YSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoQGV0YVN0YXJ0KS5nZXRUaW1lKCkpIC8gMTAwMFxuICAgICAgbGVmdCA9IChuZXcgRGF0ZShAbWF4RXRhKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZSgpLmdldFRpbWUoKSkgLyAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAobGVmdCArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje2xlZnQgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGEnKVxuICAgICAgICBpZiAhbWF4RXRhIG9yIGpvYi5nZXQoJ2V0YScpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAZXRhU3RhcnQgPSBuZXcgRGF0ZSgpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT4gXG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG4gICAgICBcbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKSAgICBcbiAgICAgICAgICAkdGFibGUucmVtb3ZlKClcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MgJ3RhYmxlQ29udGFpbmVyJ1xuICAgICAgICAgIHBhcmVudC5hcHBlbmQgXCI8cD4je25vUm93c01lc3NhZ2V9PC9wPlwiXG5cbiAgZW5hYmxlTGF5ZXJUb2dnbGVyczogKCkgLT5cbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCw4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIixjLHAsXCIgICAgXCIpKTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvZ2VuZXJpY0F0dHJpYnV0ZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTsiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5jbGFzcyBBcnJheUN1bHR1cmVUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0dvdmVybmFuY2UnXG4gIGNsYXNzTmFtZTogJ2N1bHR1cmUnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYXJyYXlDdWx0dXJlXG4gIGRlcGVuZGVuY2llczogW1xuICAgIFwiRXhpc3RpbmdNYXJpbmVQcm90ZWN0ZWRBcmVhc1wiXG4gICAgXCJDbG9zdXJlc1wiXG4gICAgXCJPdmVybGFwV2l0aEV4aXN0aW5nUHJvdmluY2lhbFRlbnVyZXNcIlxuICBdXG4gIHRpbWVvdXQ6IDYwMDAwMFxuICByZW5kZXI6ICgpIC0+XG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIHpvbmVUeXBlID0gXy5maW5kIEBtb2RlbC5nZXRBdHRyaWJ1dGVzKCksIChhdHRyKSAtPiBcbiAgICAgIGF0dHIuZXhwb3J0aWQgaXMgXCJaT05FX1RZUEVcIlxuICAgIHpvbmVUeXBlID0gem9uZVR5cGU/LnZhbHVlIG9yICdzbXonXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgICMgb3ZlcmxhcDogQHJlY29yZFNldChcIkFyY2hTaXRlT3ZlcmxhcFwiLCBcIkFyY2hTaXRlT3ZlcmxhcFwiKS5ib29sKCdSZXN1bHQnKVxuICAgICAgYXJyYXk6IEBjaGlsZHJlbj8ubGVuZ3RoID4gMFxuICAgICAgcG16OiAhKEBjaGlsZHJlbj8ubGVuZ3RoID4gMCkgYW5kIHpvbmVUeXBlIGlzICdwbXonXG4gICAgICBzbXo6ICEoQGNoaWxkcmVuPy5sZW5ndGggPiAwKSBhbmQgem9uZVR5cGUgaXMgJ3NteidcblxuICAgICAgZXhpc3RpbmdNUEFzOiBAcmVjb3JkU2V0KCdFeGlzdGluZ01hcmluZVByb3RlY3RlZEFyZWFzJywgXG4gICAgICAgIFwiRXhpc3RpbmdNYXJpbmVQcm90ZWN0ZWRBcmVhc1wiKS50b0FycmF5KClcbiAgICAgIGNsb3N1cmVzOiBAcmVjb3JkU2V0KFwiQ2xvc3VyZXNcIiwgXCJGaXNoZXJpZXNDbG9zdXJlc1wiKS50b0FycmF5KClcbiAgICAgIHByb3ZpbmNpYWw6IEByZWNvcmRTZXQoXCJPdmVybGFwV2l0aEV4aXN0aW5nUHJvdmluY2lhbFRlbnVyZXNcIiwgXCJQcm92aW5jaWFsVGVudXJlc1wiKS50b0FycmF5KClcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG4gICAgQGVuYWJsZVRhYmxlUGFnaW5nKClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5Q3VsdHVyZVRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEFycmF5RWNvbm9taWNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0h1bWFuIFdlbGwtQmVpbmcnXG4gIGNsYXNzTmFtZTogJ2Vjb25vbWljJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmFycmF5RWNvbm9taWNcbiAgZGVwZW5kZW5jaWVzOiBbXG5cbiAgXVxuICB0aW1lb3V0OiA2MDAwMDBcblxuICByZW5kZXI6ICgpIC0+XG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgYXJyYXk6IHRydWVcbiAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuICAgIEBlbmFibGVUYWJsZVBhZ2luZygpXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlFY29ub21pY1RhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbmNsYXNzIEFycmF5RW52aXJvbm1lbnRUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0Vjb2xvZ2ljYWwgSW50ZWdyaXR5J1xuICBjbGFzc05hbWU6ICdlbnZpcm9ubWVudCdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5hcnJheUVudmlyb25tZW50XG4gIGRlcGVuZGVuY2llczogW1xuICAgICdPdmVybGFwV2l0aEltcG9ydGFudEFyZWFzJ1xuICAgICdPdmVybGFwV2l0aEJpb2dlbmljQW5kQ29tbXVuaXR5Rm9ybWluZ1NwZWNpZXMnXG4gICAgJ092ZXJsYXBXaXRoTm9uRmlzaEJyZWVkaW5nQXJlYXMnXG4gICAgJ092ZXJsYXBXaXRoTWFyaW5lQ2xhc3NpZmljYXRpb25zJ1xuICAgICdNYXJ4YW5BbmFseXNpcydcbiAgXVxuICB0aW1lb3V0OiA2MDAwMDBcblxuICByZW5kZXI6ICgpIC0+XG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgbm9uRmlzaEJyZWVkaW5nQXJlYXM6IEByZWNvcmRTZXQoJ092ZXJsYXBXaXRoTm9uRmlzaEJyZWVkaW5nQXJlYXMnLCAnT3ZlcmxhcFdpdGhOb25GaXNoQnJlZWRpbmdBcmVhcycpLnRvQXJyYXkoKVxuICAgICAgaGFiaXRhdHM6IEByZWNvcmRTZXQoJ092ZXJsYXBXaXRoQmlvZ2VuaWNBbmRDb21tdW5pdHlGb3JtaW5nU3BlY2llcycsICdPdmVybGFwV2l0aEJpb2dlbmljQW5kQ29tbXVuaXR5Rm9ybWluZ1NwZWNpZXMnKS50b0FycmF5KClcbiAgICAgIGltcG9ydGFudEFyZWFzOiBAcmVjb3JkU2V0KFwiT3ZlcmxhcFdpdGhJbXBvcnRhbnRBcmVhc1wiLCBcbiAgICAgICAgXCJPdmVybGFwV2l0aEltcG9ydGFudEFyZWFzXCIpLnRvQXJyYXkoKVxuICAgICAgbWFyaW5lQ2xhc3NpZmljYXRpb25zOiBAcmVjb3JkU2V0KCdPdmVybGFwV2l0aE1hcmluZUNsYXNzaWZpY2F0aW9ucycsICdPdmVybGFwV2l0aE1hcmluZUNsYXNzaWZpY2F0aW9ucycpLnRvQXJyYXkoKVxuXG4gICAgICBtYXJ4YW5BbmFseXNlczogXy5tYXAoQHJlY29yZFNldChcIk1hcnhhbkFuYWx5c2lzXCIsIFwiTWFyeGFuQW5hbHlzaXNcIilcbiAgICAgICAgLnRvQXJyYXkoKSwgKGYpIC0+IGYuTkFNRSlcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlVGFibGVQYWdpbmcoKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcbiAgICBAJCgnLmNob3NlbicpLmNob3Nlbih7ZGlzYWJsZV9zZWFyY2hfdGhyZXNob2xkOiAxMCwgd2lkdGg6JzQwMHB4J30pXG4gICAgQCQoJy5jaG9zZW4nKS5jaGFuZ2UgKCkgPT5cbiAgICAgIF8uZGVmZXIgQHJlbmRlck1hcnhhbkFuYWx5c2lzXG4gICAgQHJlbmRlck1hcnhhbkFuYWx5c2lzKClcblxuICByZW5kZXJNYXJ4YW5BbmFseXNpczogKCkgPT5cbiAgICBuYW1lID0gQCQoJy5jaG9zZW4nKS52YWwoKVxuICAgIHJlY29yZHMgPSBAcmVjb3JkU2V0KFwiTWFyeGFuQW5hbHlzaXNcIiwgXCJNYXJ4YW5BbmFseXNpc1wiKS50b0FycmF5KClcbiAgICBkYXRhID0gXy5maW5kIHJlY29yZHMsIChyZWNvcmQpIC0+IHJlY29yZC5OQU1FIGlzIG5hbWVcbiAgICBoaXN0byA9IGRhdGEuSElTVE8uc2xpY2UoMSwgZGF0YS5ISVNUTy5sZW5ndGggLSAxKS5zcGxpdCgvXFxzLylcbiAgICBoaXN0byA9IF8uZmlsdGVyIGhpc3RvLCAocykgLT4gcy5sZW5ndGggPiAwXG4gICAgaGlzdG8gPSBfLm1hcCBoaXN0bywgKHZhbCkgLT5cbiAgICAgIHBhcnNlSW50KHZhbClcbiAgICBxdWFudGlsZXMgPSBfLmZpbHRlcihfLmtleXMoZGF0YSksIChrZXkpIC0+IGtleS5pbmRleE9mKCdRJykgaXMgMClcbiAgICBmb3IgcSwgaSBpbiBxdWFudGlsZXNcbiAgICAgIGlmIHBhcnNlRmxvYXQoZGF0YVtxXSkgPiBwYXJzZUZsb2F0KGRhdGEuU0NPUkUpIG9yIGkgaXMgcXVhbnRpbGVzLmxlbmd0aCAtIDFcbiAgICAgICAgbWF4X3EgPSBxdWFudGlsZXNbaV1cbiAgICAgICAgbWluX3EgPSBxdWFudGlsZXNbaSAtIDFdIG9yIFwiUTBcIiAjIHF1YW50aWxlc1tpXVxuICAgICAgICBicmVha1xuICAgIEAkKCcuc2NlbmFyaW9SZXN1bHRzJykuaHRtbCBcIlwiXCJcbiAgICAgIFRoZSBhdmVyYWdlIE1hcnhhbiBzY29yZSBmb3IgdGhpcyB6b25lcyB3aXRoaW4gdGhpcyBwcm9wb3NhbCBpcyA8c3Ryb25nPiN7ZGF0YS5TQ09SRX08L3N0cm9uZz4sIHBsYWNpbmcgaXQgaW4gXG4gICAgICB0aGUgPHN0cm9uZz4je21pbl9xLnJlcGxhY2UoJ1EnLCAnJyl9JSAtICN7bWF4X3EucmVwbGFjZSgnUScsICcnKX0lIHF1YW50aWxlIFxuICAgICAgcmFuZ2U8L3N0cm9uZz4gZm9yIHRoaXMgc3ViLXJlZ2lvbi5cbiAgICBcIlwiXCJcblxuICAgIEAkKCcuc2NlbmFyaW9EZXNjcmlwdGlvbicpLmh0bWwgZGF0YS5NQVJYX0RFU0MucmVwbGFjZSgndGhpcyB6b25lICcsICd6b25lcyB3aXRoaW4gdGhpcyBwcm9wb3NhbCAnKVxuXG4gICAgZG9tYWluID0gXy5tYXAgcXVhbnRpbGVzLCAocSkgLT4gZGF0YVtxXVxuICAgIGRvbWFpbi5wdXNoIDEwMFxuICAgIGRvbWFpbi51bnNoaWZ0IDBcbiAgICBjb2xvciA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGRvbWFpbilcbiAgICAgIC5yYW5nZShbXCIjNDdhZTQzXCIsIFwiIzZjMFwiLCBcIiNlZTBcIiwgXCIjZWI0XCIsIFwiI2VjYmI4OVwiLCBcIiNlZWFiYTBcIl0ucmV2ZXJzZSgpKVxuICAgIHF1YW50aWxlcyA9IF8ubWFwIHF1YW50aWxlcywgKGtleSkgLT5cbiAgICAgIG1heCA9IHBhcnNlRmxvYXQoZGF0YVtrZXldKVxuICAgICAgbWluICA9IHBhcnNlRmxvYXQoZGF0YVtxdWFudGlsZXNbXy5pbmRleE9mKHF1YW50aWxlcywga2V5KSAtIDFdXSBvciAwKVxuICAgICAge1xuICAgICAgICByYW5nZTogXCIje3BhcnNlSW50KGtleS5yZXBsYWNlKCdRJywgJycpKSAtIDIwfS0je2tleS5yZXBsYWNlKCdRJywgJycpfSVcIlxuICAgICAgICBuYW1lOiBrZXlcbiAgICAgICAgc3RhcnQ6IG1pblxuICAgICAgICBlbmQ6IG1heFxuICAgICAgICBiZzogY29sb3IoKG1heCArIG1pbikgLyAyKVxuICAgICAgfVxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgQCQoJy52aXonKS5odG1sKCcnKVxuICAgICAgZWwgPSBAJCgnLnZpeicpWzBdXG4gICAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihbMCwgMTAwXSlcbiAgICAgICAgLnJhbmdlKFswLCA0MDBdKSAgICAgIFxuXG5cblxuICAgICAgIyBIaXN0b2dyYW1cblxuICAgICAgbWFyZ2luID0gXG4gICAgICAgIHRvcDogNVxuICAgICAgICByaWdodDogMjBcbiAgICAgICAgYm90dG9tOiAzMFxuICAgICAgICBsZWZ0OiA0NVxuICAgICAgd2lkdGggPSA0MDAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodFxuICAgICAgaGVpZ2h0ID0gMzAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b21cbiAgICAgIFxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIDEwMF0pXG4gICAgICAgIC5yYW5nZShbMCwgd2lkdGhdKVxuICAgICAgeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSlcbiAgICAgICAgLmRvbWFpbihbMCwgZDMubWF4KGhpc3RvKV0pXG5cbiAgICAgIHhBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeClcbiAgICAgICAgLm9yaWVudChcImJvdHRvbVwiKVxuICAgICAgeUF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgIC5zY2FsZSh5KVxuICAgICAgICAub3JpZW50KFwibGVmdFwiKVxuXG4gICAgICBzdmcgPSBkMy5zZWxlY3QoQCQoJy52aXonKVswXSkuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pXG4gICAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgje21hcmdpbi5sZWZ0fSwgI3ttYXJnaW4udG9wfSlcIilcblxuICAgICAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLCN7aGVpZ2h0fSlcIilcbiAgICAgICAgLmNhbGwoeEF4aXMpXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgd2lkdGggLyAyKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiM2VtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC50ZXh0KFwiU2NvcmVcIilcblxuICAgICAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICAuY2FsbCh5QXhpcylcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDYpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgICAgICAudGV4dChcIk51bWJlciBvZiBQbGFubmluZyBVbml0c1wiKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLmJhclwiKVxuICAgICAgICAgIC5kYXRhKGhpc3RvKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhclwiKVxuICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCwgaSkgLT4geChpKSlcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsICh3aWR0aCAvIDEwMCkpXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiB5KGQpKVxuICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIChkKSAtPiBoZWlnaHQgLSB5KGQpKVxuICAgICAgICAgIC5zdHlsZSAnZmlsbCcsIChkLCBpKSAtPlxuICAgICAgICAgICAgcSA9IF8uZmluZCBxdWFudGlsZXMsIChxKSAtPlxuICAgICAgICAgICAgICBpID49IHEuc3RhcnQgYW5kIGkgPD0gcS5lbmRcbiAgICAgICAgICAgIHE/LmJnIG9yIFwic3RlZWxibHVlXCJcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5zY29yZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGRhdGEuU0NPUkUpXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeChkKSAtIDggKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShoaXN0b1tkXSkgLSAxMCkgKyAncHgnKVxuICAgICAgICAudGV4dChcIuKWvFwiKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlVGV4dFwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGRhdGEuU0NPUkUpXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVUZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSA2ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkoaGlzdG9bZF0pIC0gMzApICsgJ3B4JylcbiAgICAgICAgLnRleHQoKGQpIC0+IGQpXG5cbiAgICAgIEAkKCcudml6JykuYXBwZW5kICc8ZGl2IGNsYXNzPVwibGVnZW5kc1wiPjwvZGl2PidcbiAgICAgIGZvciBxdWFudGlsZSBpbiBxdWFudGlsZXNcbiAgICAgICAgQCQoJy52aXogLmxlZ2VuZHMnKS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjoje3F1YW50aWxlLmJnfTtcIj4mbmJzcDs8L3NwYW4+I3txdWFudGlsZS5yYW5nZX08L2Rpdj5cbiAgICAgICAgXCJcIlwiXG4gICAgICBAJCgnLnZpeicpLmFwcGVuZCAnPGJyIHN0eWxlPVwiY2xlYXI6Ym90aDtcIj4nXG5cbiAgICAgIEAkKCcnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5RW52aXJvbm1lbnRUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBBcnJheU92ZXJ2aWV3VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdPdmVydmlldydcbiAgY2xhc3NOYW1lOiAnb3ZlcnZpZXcnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuYXJyYXlPdmVydmlld1xuICBkZXBlbmRlbmNpZXM6IFtcbiAgICAnWm9uZVNpemUnXG4gICAgIyAnVGVycmVzdHJpYWxQcm90ZWN0ZWRBcmVhcydcbiAgICAjICdEaXN0YW5jZVRvVHJhbnNtaXNzaW9uTGluZXMnXG4gIF1cbiAgdGltZW91dDogNjAwMDAwXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgICMgY29uc29sZS5sb2cgQHJlY29yZFNldChcIkRpc3RhbmNlVG9UcmFuc21pc3Npb25MaW5lc1wiLCBcIkRpc3RhbmNlVG9UcmFuc21pc3Npb25MaW5lc1wiKVxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgc2l6ZTogQHJlY29yZFNldCgnWm9uZVNpemUnLCAnWm9uZVNpemUnKS5mbG9hdCgnU0laRV9TUV9LTScsIDIpXG4gICAgICBudW1DaGlsZHJlbjogQGNoaWxkcmVuLmxlbmd0aFxuICAgICAgIyBhZGphY2VudFByb3RlY3RlZEFyZWE6IEByZWNvcmRTZXQoJ1RlcnJlc3RyaWFsUHJvdGVjdGVkQXJlYXMnLCBcbiAgICAgICMgICAnVGVycmVzdHJpYWxQcm90ZWN0ZWRBcmVhcycpLmJvb2woJ1Jlc3VsdCcpWzBdXG4gICAgICAjIHRyYW5zbWlzc2lvbkxpbmVzOiBAcmVjb3JkU2V0KFwiRGlzdGFuY2VUb1RyYW5zbWlzc2lvbkxpbmVzXCIsIFxuICAgICAgIyAgIFwiRGlzdGFuY2VUb1RyYW5zbWlzc2lvbkxpbmVzXCIpLmZsb2F0KCdEaXN0SW5LTScsIDIpXG4gICAgICAjIGluZnJhc3RydWN0dXJlOiBAcmVjb3JkU2V0KFwiRGlzdGFuY2VUb0luZnJhc3RydWN0dXJlXCIsIFxuICAgICAgIyAgIFwiRGlzdGFuY2VUb0luZnJhc3RydWN0dXJlXCIpLnRvQXJyYXkoKVxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgcGFydGlhbHMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuICAgIG5vZGVzID0gW0Btb2RlbF1cbiAgICBAbW9kZWwuc2V0ICdvcGVuJywgdHJ1ZVxuICAgIG5vZGVzID0gbm9kZXMuY29uY2F0IEBjaGlsZHJlblxuICAgIGZvciBub2RlIGluIG5vZGVzXG4gICAgICBub2RlLnNldCAnc2VsZWN0ZWQnLCBmYWxzZVxuICAgIFRhYmxlT2ZDb250ZW50cyA9IHdpbmRvdy5yZXF1aXJlKCd2aWV3cy90YWJsZU9mQ29udGVudHMnKVxuICAgIEB0b2MgPSBuZXcgVGFibGVPZkNvbnRlbnRzKG5vZGVzKVxuICAgIEAkKCcudG9jQ29udGFpbmVyJykuYXBwZW5kIEB0b2MuZWxcbiAgICBAdG9jLnJlbmRlcigpXG5cbiAgcmVtb3ZlOiAoKSAtPlxuICAgIEB0b2M/LnJlbW92ZSgpXG4gICAgc3VwZXIoKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXlPdmVydmlld1RhYiIsIkFycmF5T3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL2FycmF5T3ZlcnZpZXdUYWIuY29mZmVlJ1xuQXJyYXlFbnZpcm9ubWVudFRhYiA9IHJlcXVpcmUgJy4vYXJyYXlFbnZpcm9ubWVudFRhYi5jb2ZmZWUnXG5BcnJheUVjb25vbWljVGFiID0gcmVxdWlyZSAnLi9hcnJheUVjb25vbWljVGFiLmNvZmZlZSdcbkFycmF5Q3VsdHVyZVRhYiA9IHJlcXVpcmUgJy4vYXJyYXlDdWx0dXJlVGFiLmNvZmZlZSdcblxud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbXG4gICAgQXJyYXlPdmVydmlld1RhYiwgXG4gICAgQXJyYXlFbnZpcm9ubWVudFRhYiwgXG4gICAgQXJyYXlFY29ub21pY1RhYiwgXG4gICAgQXJyYXlDdWx0dXJlVGFiXG4gIF1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9yZXBvcnQuY3NzJ11cbiIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlDdWx0dXJlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBFeGlzdGluZyBQcm90ZWN0ZWQgQXJlYXMgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTIwZDRjMmE2NzQ2NTljYjdiMzVkNTc1XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IEV4aXN0aW5nIFByb3RlY3RlZCBBcmVhcy4gTWFQUCByZWNvbW1lbmRzIHNwYXRpYWwgbG9jYXRpb25zIGZvciBtYXJpbmUgcHJvdGVjdGlvbiB0aGF0IGluY2x1ZGUgZWl0aGVyIG9yIGJvdGggZWNvbG9naWNhbCBhbmQgY3VsdHVyYWwgdmFsdWVzLCBpbmNsdWRpbmcgYXJlYXMgdGhhdCBjb250cmlidXRlIHRvIGEgTWFyaW5lIFByb3RlY3RlZCBBcmVhIG5ldHdvcmsgZm9yIHRoZSBOb3J0aGVybiBTaGVsZiBCaW9yZWdpb24uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJleGlzdGluZ01QQXNcIixjLHAsMSksYyxwLDAsNjYzLDc4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLiAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJwbXpcIixjLHAsMSksYyxwLDAsMTI4NCwyNTY2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggRmlzaGVyaWVzIENsb3N1cmVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgRmlzaGVyaWVzIENsb3N1cmVzLiBGaXNoZXJpZXMgY2xvc3VyZXMgbWF5IG5lZWQgdG8gYmUgY29uc2lkZXJlZCB0byByZWR1Y2UgcG90ZW50aWFsIGNvbmZsaWN0cyBiZXR3ZWVuIHVzZXMgYW5kIGFjdGl2aXRpZXMuIEZlZGVyYWwgUm9ja2Zpc2ggQ29uc2VydmF0aW9uIEFyZWFzIGFuZCBGZWRlcmFsIFNwb25nZSBSZWVmIFJlc2VydmUgYXJlIGFuYWx5c2VkIGZvciBvdmVybGFwIHdpdGggXCIpO2lmKF8ucyhfLmYoXCJhcnJheVwiLGMscCwxKSxjLHAsMCwxNjY0LDE2OTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInpvbmVzIHdpdGhpbiB0aGlzIHByb3Bvc2FsXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiYXJyYXlcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ0aGlzIHpvbmVcIik7fTtfLmIoXCIuIFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VGVudXJlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjbG9zdXJlc1wiLGMscCwxKSxjLHAsMCwxODk2LDIwMTQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBGaXNoZXJpZXMgY2xvc3VyZXMgbWF5IG5lZWQgdG8gYmUgY29uc2lkZXJlZCB0byByZWR1Y2UgcG90ZW50aWFsIGNvbmZsaWN0cyBiZXR3ZWVuIHVzZXMgYW5kIGFjdGl2aXRpZXMuIEZlZGVyYWwgUm9ja2Zpc2ggQ29uc2VydmF0aW9uIEFyZWFzIGFuZCBGZWRlcmFsIFNwb25nZSBSZWVmIFJlc2VydmUgYXJlIGFuYWx5c2VkIGZvciBvdmVybGFwIHdpdGggXCIpO2lmKF8ucyhfLmYoXCJhcnJheVwiLGMscCwxKSxjLHAsMCwyMzI5LDIzNTUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInpvbmVzIHdpdGhpbiB0aGlzIHByb3Bvc2FsXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiYXJyYXlcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ0aGlzIHpvbmVcIik7fTtfLmIoXCIuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIFByb3ZpbmNpYWwgVGVudXJlcyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYyZjVjYmE3MmVjMDY4MTYwNjIwOGVcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgUHJvdmluY2lhbCBUZW51cmVzLlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VGVudXJlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJwcm92aW5jaWFsXCIsYyxwLDEpLGMscCwwLDMwMDEsMzExOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNtelwiLGMscCwxKSxjLHAsMCwzMjMyLDM1NDYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICBPbmUgb2YgdGhlIG9iamVjdGl2ZXMgZm9yIFNwZWNpYWwgTWFuYWdlbWVudCBab25lcyBpcyB0byBwcm92aWRlIGZvciBjZXJ0YWludHkgZm9yIGJ1c2luZXNzIGFuZCB1c2VyIGdyb3VwcywgaW5jbHVkaW5nIGVjb25vbWljIGRldmVsb3BtZW50IG9wcG9ydHVuaXRpZXMuICBUbyByZWR1Y2UgcG90ZW50aWFsIGNvbmZsaWN0cyBiZXR3ZWVuIHVzZXMgYW5kIGFjdGl2aXRpZXMsIFNwZWNpYWwgTWFuYWdlbWVudCBab25lcyBuZWVkIHRvIGNvbnNpZGVyIGV4aXN0aW5nIHByb3ZpbmNpYWwgY3Jvd24gdGVudXJlcy4gXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwicG16XCIsYyxwLDEpLGMscCwwLDM1NzMsMzczMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIFRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gdXNlcyBhbmQgYWN0aXZpdGllcywgUHJvdGVjdGlvbiBNYW5hZ2VtZW50IFpvbmVzIG5lZWQgdG8gY29uc2lkZXIgZXhpc3RpbmcgcHJvdmluY2lhbCBjcm93biB0ZW51cmVzLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwwLDM3NjIsMzkwMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIFRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gdXNlcyBhbmQgYWN0aXZpdGllcywgem9uZXMgbmVlZCB0byBjb25zaWRlciBleGlzdGluZyBwcm92aW5jaWFsIGNyb3duIHRlbnVyZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiYXJyYXlFY29ub21pY1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ObyBSZXBvcnRzIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBIdW1hbiBXZWxsLUJlaW5nIHJlcG9ydHMgZm9yIGNvbGxlY3Rpb25zIGFyZSBjb21pbmcgc29vbi4uLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImFycmF5RW52aXJvbm1lbnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+SGFiaXRhdCBSZXByZXNlbnRhdGlvbiAoQWxsIFpvbmVzIENvbWJpbmVkKTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYSAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFiaXRhdHNcIixjLHAsMSksYyxwLDAsMjY3LDMzMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBIYWJpdGF0IGRhdGEgZm9yIGJlbnRoaWMgZWNvc3lzdGVtcywgcGVsYWdpYyBhcmVhcywgYW5kIG9jZWFub2dyYXBoaWMgcHJvY2Vzc2VzIGlzIHVzZWQgdG8gaW5mb3JtIHNpdGluZyBvZiB6b25lcy4gSW5jbHVkZWQgaGVyZSBhcmUgYmlvZ2VuaWMgaGFiaXRhdHMgYXMgd2VsbCBhcyBjb21tdW5pdHktZm9ybWluZyBzcGVjaWVzLCBzdWNoIGFzIGVlbGdyYXNzIGFuZCBrZWxwLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBFeGlzdGluZyBQcm90ZWN0ZWQgQXJlYXMgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTIwZDRjMmE2NzQ2NTljYjdiMzVkNTc1XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IEV4aXN0aW5nIFByb3RlY3RlZCBBcmVhcy4gTWFQUCByZWNvbW1lbmRzIHNwYXRpYWwgbG9jYXRpb25zIGZvciBtYXJpbmUgcHJvdGVjdGlvbiB0aGF0IGluY2x1ZGUgZWl0aGVyIG9yIGJvdGggZWNvbG9naWNhbCBhbmQgY3VsdHVyYWwgdmFsdWVzLCBpbmNsdWRpbmcgYXJlYXMgdGhhdCBjb250cmlidXRlIHRvIGEgTWFyaW5lIFByb3RlY3RlZCBBcmVhIG5ldHdvcmsgZm9yIHRoZSBOb3J0aGVybiBTaGVsZiBCaW9yZWdpb24uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJleGlzdGluZ01QQXNcIixjLHAsMSksYyxwLDAsMTM3MywxNDkxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ0xQRF9BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCIzXFxcIiBjbGFzcz1cXFwicGFyYWdyYXBoXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgTWFQUCByZWNvbW1lbmRzIHNwYXRpYWwgbG9jYXRpb25zIGZvciBtYXJpbmUgcHJvdGVjdGlvbiB0aGF0IGluY2x1ZGUgZWl0aGVyIG9yIGJvdGggZWNvbG9naWNhbCBhbmQgY3VsdHVyYWwgdmFsdWVzLCBpbmNsdWRpbmcgYXJlYXMgdGhhdCBjb250cmlidXRlIHRvIGEgTWFyaW5lIFByb3RlY3RlZCBBcmVhIG5ldHdvcmsgZm9yIHRoZSBOb3J0aGVybiBTaGVsZiBCaW9yZWdpb24uICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggSW1wb3J0YW50IE1hcmluZSBBcmVhczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBJbXBvcnRhbnQgTWFyaW5lIEFyZWFzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JbXBvcnRhbnQgQXJlYTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpbXBvcnRhbnRBcmVhc1wiLGMscCwxKSxjLHAsMCwyMzM5LDI0NTcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBUbyByZWR1Y2UgcG90ZW50aWFsIGNvbmZsaWN0cyB3aXRoIHRoZXNlIG1hcmluZSBzcGVjaWVzLCBcIik7aWYoXy5zKF8uZihcInBtelwiLGMscCwxKSxjLHAsMCwyNjMxLDI2NTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlByb3RlY3Rpb24gTWFuYWdlbWVudCBab25lc1wiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwic216XCIsYyxwLDEpLGMscCwwLDI2NzQsMjY5OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiU3BlY2lhbCBNYW5hZ2VtZW50IFpvbmVzXCIpO30pO2MucG9wKCk7fV8uYihcIiBtYXkgY29uc2lkZXIgdGhlc2UgYXJlYXMuIEltcG9ydGFudCBBcmVhcyB3ZXJlIGlkZW50aWZpZWQgZHVyaW5nIHRoZSBwcm9jZXNzIG9mIGVzdGFibGlzaGluZyBFY29sb2dpY2FsbHkgYW5kIEJpb2xvZ2ljYWxseSBTaWduaWZpY2FudCBBcmVhcyAoRUJTQXMpIGJ5IHRoZSBQYWNpZmljIE5vcnRoIENvYXN0IEludGVncmF0ZWQgTWFuYWdlbWVudCBBcmVhIChQTkNJTUEpLiBJbXBvcnRhbnQgQmlyZCBBcmVhcyAoSUJBcykgd2VyZSBpZGVudGlmaWVkIGJ5IEJpcmQgU3R1ZGllcyBDYW5hZGEgYW5kIE5hdHVyZSBDYW5hZGEuICBDcml0aWNhbCBIYWJpdGF0IG1lZXRzIENhbmFkYSdzIFNwZWNpZXMgYXQgUmlzayBSZXF1aXJlbWVudHMuIFBvdGVudGlhbCBjcml0aWNhbCBpcyBpbnN1ZmZpY2llbnQgaW5mb3JtYXRpb24gdG8gbWVldCBTQVJBIHJlcXVpcmVtZW50cy4gU2VlIHRoZSA8YSBocmVmPVxcXCJodHRwOi8vcG5jaW1hLm9yZy9zaXRlL2F0bGFzLmh0bWxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5QTkNJTUEgYXRsYXM8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NYXJ4YW4gQW5hbHlzaXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHNlbGVjdCBjbGFzcz1cXFwiY2hvc2VuXFxcIiB3aWR0aD1cXFwiNDAwcHhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJ4YW5BbmFseXNlc1wiLGMscCwxKSxjLHAsMCwzNTQwLDM1ODYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8b3B0aW9uIHZhbHVlPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiPC9vcHRpb24+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvc2VsZWN0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvUmVzdWx0c1xcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb0Rlc2NyaXB0aW9uXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgTWFQUCBjb2xsYWJvcmF0ZWQgd2l0aCB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL2JjbWNhLmNhL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkJDIE1hcmluZSBDb25zZXJ2YXRpb24gQW5hbHlzaXMgKEJDTUNBKTwvYT4gdG8gaWRlbnRpZnkgbWFyaW5lIGFyZWFzIG9mIGhpZ2ggY29uc2VydmF0aW9uIHZhbHVlIGJhc2VkIG9uIHNwYXRpYWwgZGF0YXNldHMgb2YgZWNvbG9naWNhbCBpbmZvcm1hdGlvbi4gVGhlc2UgTWFyeGFuIHNjZW5hcmlvcyBjYW4gYmUgdXNlZCB0byBpbmZvcm0gdGhlIGxvY2F0aW9uIG9yIHNpdGluZyBvZiBNYVBQIHpvbmVzLiA8YSBocmVmPVxcXCJodHRwOi8vd3d3LnVxLmVkdS5hdS9tYXJ4YW4vXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+TWFyeGFuPC9hPiBpcyBhIGRlY2lzaW9uIHN1cHBvcnQgdG9vbCBkZXZlbG9wZWQgYnkgdGhlIFVuaXZlcnNpdHkgb2YgUXVlZW5zbGFuZCB0byBwcm92aWRlIHNvbHV0aW9ucyB0byB0aGUg4oCcbWluaW11bSBzZXQgcHJvYmxlbeKAnSAtIGNhcHR1cmluZyBhIHNwZWNpZmllZCBhbW91bnQgKHRhcmdldCkgb2YgaW5kaXZpZHVhbCBmZWF0dXJlcyBmb3IgdGhlIGxlYXN0IGNvc3QuIEJhc2VkIG9uIHJlbGF0aXZlbHkgc2ltcGxlIG1hdGhlbWF0aWNhbCBhbGdvcml0aG1zIGFuZCBlcXVhdGlvbnMsIE1hcnhhbiBzZWFyY2hlcyBtaWxsaW9ucyBvZiBwb3RlbnRpYWwgc29sdXRpb25zIHRvIGZpbmQgdGhlIGJlc3QgYmFsYW5jZSBiZXR3ZWVuIGNvc3RzIGFuZCBiZW5lZml0cy4gSW4gc2hvcnQsIE1hcnhhbiBzb2x1dGlvbnMgbWluaW1pemUgdGhlIG92ZXJhbGwgY29zdCBzdWJqZWN0IHRvIHRoZSBjb25zdHJhaW50IG9mIG1lZXRpbmcgc3BlY2lmaWVkIOKAnHRhcmdldHPigJ0gZm9yIGFsbCBmZWF0dXJlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBNYVBQIGNvbnN1bHRlZCB0aGUgTWFQUCBTY2llbmNlIEFkdmlzb3J5IENvbW1pdHRlZSAoU0FDKSBmb3IgYWR2aWNlIG9uIHNjZW5hcmlvcyBhbmQgdGFyZ2V0IHNlbGVjdGlvbi4gIFRoZSBTQUMgc3VwcG9ydGVkIHRoZSBkZWNpc2lvbiB0byB1c2UgdGhlIHBlcmNlbnRhZ2UgdGFyZ2V0IGNhdGVnb3JpZXMgZXN0YWJsaXNoZWQgYnkgdGhlIEJDTUNBIHByb2plY3QgdGVhbSBpbiAyMDA2LiBQbGVhc2Ugc2VlIHRoaXMgPGEgaHJlZj1cXFwiaHR0cHM6Ly9kbC5kcm9wYm94dXNlcmNvbnRlbnQuY29tL3UvMTc2NDk4Ni9CQ01DQS1NYXJ4YW4gZm9yIE1hUFAtUmVwb3J0IG9uIGluaXRpYWwgc2NlbmFyaW9zXzI3RmViMjAxMy5wZGZcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj4yMDEzIEJDTUNBIHJlcG9ydDwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIE1hUFAtQkNNQ0EgcHJvamVjdCBhbmQgTWFyeGFuIHNjZW5hcmlvcywgYW5kIGNvbnN1bHQgdGhlIDxhIGhyZWY9XFxcImh0dHA6Ly9iY21jYS5jYVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkJDTUNBIEF0bGFzPC9hPiBmb3IgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgdGFyZ2V0cywgc3BlY2llcywgYW5kIGhhYml0YXRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIE5vbiBGaXNoIEJyZWVkaW5nIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSAgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IE5vbiBGaXNoIEJyZWVkaW5nIEFyZWFzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5TcGVjaWVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgQnJlZWRpbmcgQXJlYXMgb3IgTmVzdGluZyBTaXRlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub25GaXNoQnJlZWRpbmdBcmVhc1wiLGMscCwxKSxjLHAsMCw1NTgwLDU2NjYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTUEVDSUVTXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggTWFyaW5lIENsYXNzaWZpY2F0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBNYXJpbmUgQ2xhc3NpZmljYXRpb25zXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5DbGFzc2lmaWNhdGlvbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJpbmVDbGFzc2lmaWNhdGlvbnNcIixjLHAsMSksYyxwLDAsNjA4Miw2MjA0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX05BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJhcnJheU92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyByZWdpb25hbCBwcm9wb3NhbCBjb250YWlucyBcIik7Xy5iKF8udihfLmYoXCJudW1DaGlsZHJlblwiLGMscCwwKSkpO18uYihcIiB6b25lcyBhbmQgY292ZXJzIGEgdG90YWwgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJzaXplXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBraWxvbWV0ZXJzPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidG9jQ29udGFpbmVyXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS0gXCIpO2lmKF8ucyhfLmYoXCJhZGphY2VudFByb3RlY3RlZEFyZWFcIixjLHAsMSksYyxwLDAsMjcwLDc0NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5OZWFyYnkgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlIGdyZWVuLWNoZWNrXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgWm9uZXMgd2l0aGluIHRoaXMgcHJvcG9zYWwgYXJlIGFkamFjZW50IHRvIGEgPHN0cm9uZz5UZXJyZXN0cmlhbCBQcm90ZWN0ZWQgQXJlYTwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCdWlsZCBvbiBwYXN0IGFuZCBleGlzdGluZyB6b25pbmcgZWZmb3J0cyB0aGF0IGFyZSBjb25zaXN0ZW50IHdpdGggYW4gZWNvc3lzdGVtLWJhc2VkIG1hbmFnZW1lbnQgYXBwcm9hY2guICBXaGVyZXZlciBwb3NzaWJsZSwgZG8gbm90IGR1cGxpY2F0ZSBleGlzdGluZyB6b25pbmcgZWZmb3J0cyBhbmQgY29uc2lkZXIgZXhpc3RpbmcgdGVycmVzdHJpYWwgem9uaW5nIGZvciBhZGphY2VudCBtYXJpbmUgem9uaW5nIHRvIGFjaGlldmUgem9uaW5nIG9iamVjdGl2ZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPCEtLSA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5UcmFuc21pc3Npb24gTGluZXMgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNmFkNjc3YmJiOWIyNDU3MDIwZjUyXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIHpvbmUgaXMgXCIpO18uYihfLnYoXy5mKFwidHJhbnNtaXNzaW9uTGluZXNcIixjLHAsMCkpKTtfLmIoXCIga20gZnJvbSB0aGUgbmVhcmVzdCB0cmFuc21pc3Npb24gbGluZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDEwNjYsMTE5MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJjdWx0dXJlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBFeGlzdGluZyBQcm90ZWN0ZWQgQXJlYXMgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTIwZDRjMmE2NzQ2NTljYjdiMzVkNTc1XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IEV4aXN0aW5nIFByb3RlY3RlZCBBcmVhcy4gTWFQUCByZWNvbW1lbmRzIHNwYXRpYWwgbG9jYXRpb25zIGZvciBtYXJpbmUgcHJvdGVjdGlvbiB0aGF0IGluY2x1ZGUgZWl0aGVyIG9yIGJvdGggZWNvbG9naWNhbCBhbmQgY3VsdHVyYWwgdmFsdWVzLCBpbmNsdWRpbmcgYXJlYXMgdGhhdCBjb250cmlidXRlIHRvIGEgTWFyaW5lIFByb3RlY3RlZCBBcmVhIG5ldHdvcmsgZm9yIHRoZSBOb3J0aGVybiBTaGVsZiBCaW9yZWdpb24uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJleGlzdGluZ01QQXNcIixjLHAsMSksYyxwLDAsNjYzLDc4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIE1hUFAgcmVjb21tZW5kcyBzcGF0aWFsIGxvY2F0aW9ucyBmb3IgbWFyaW5lIHByb3RlY3Rpb24gdGhhdCBpbmNsdWRlIGVpdGhlciBvciBib3RoIGVjb2xvZ2ljYWwgYW5kIGN1bHR1cmFsIHZhbHVlcywgaW5jbHVkaW5nIGFyZWFzIHRoYXQgY29udHJpYnV0ZSB0byBhIE1hcmluZSBQcm90ZWN0ZWQgQXJlYSBuZXR3b3JrIGZvciB0aGUgTm9ydGhlcm4gU2hlbGYgQmlvcmVnaW9uLiAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJwbXpcIixjLHAsMSksYyxwLDAsMTI4NCwyNTY2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggRmlzaGVyaWVzIENsb3N1cmVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgRmlzaGVyaWVzIENsb3N1cmVzLiBGaXNoZXJpZXMgY2xvc3VyZXMgbWF5IG5lZWQgdG8gYmUgY29uc2lkZXJlZCB0byByZWR1Y2UgcG90ZW50aWFsIGNvbmZsaWN0cyBiZXR3ZWVuIHVzZXMgYW5kIGFjdGl2aXRpZXMuIEZlZGVyYWwgUm9ja2Zpc2ggQ29uc2VydmF0aW9uIEFyZWFzIGFuZCBGZWRlcmFsIFNwb25nZSBSZWVmIFJlc2VydmUgYXJlIGFuYWx5c2VkIGZvciBvdmVybGFwIHdpdGggXCIpO2lmKF8ucyhfLmYoXCJhcnJheVwiLGMscCwxKSxjLHAsMCwxNjY0LDE2OTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInpvbmVzIHdpdGhpbiB0aGlzIHByb3Bvc2FsXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiYXJyYXlcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ0aGlzIHpvbmVcIik7fTtfLmIoXCIuIFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VGVudXJlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjbG9zdXJlc1wiLGMscCwxKSxjLHAsMCwxODk2LDIwMTQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBGaXNoZXJpZXMgY2xvc3VyZXMgbWF5IG5lZWQgdG8gYmUgY29uc2lkZXJlZCB0byByZWR1Y2UgcG90ZW50aWFsIGNvbmZsaWN0cyBiZXR3ZWVuIHVzZXMgYW5kIGFjdGl2aXRpZXMuIEZlZGVyYWwgUm9ja2Zpc2ggQ29uc2VydmF0aW9uIEFyZWFzIGFuZCBGZWRlcmFsIFNwb25nZSBSZWVmIFJlc2VydmUgYXJlIGFuYWx5c2VkIGZvciBvdmVybGFwIHdpdGggXCIpO2lmKF8ucyhfLmYoXCJhcnJheVwiLGMscCwxKSxjLHAsMCwyMzI5LDIzNTUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInpvbmVzIHdpdGhpbiB0aGlzIHByb3Bvc2FsXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiYXJyYXlcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ0aGlzIHpvbmVcIik7fTtfLmIoXCIuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNTU0NWMwOGRjNGY1ZjJkMjE2MTQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhhYml0YXRzIGxheWVyPC9hPiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIFByb3ZpbmNpYWwgVGVudXJlcyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYyZjVjYmE3MmVjMDY4MTYwNjIwOGVcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiIGRhdGEtbm8tcm93cz1cXFwiRG9lcyBub3Qgb3ZlcmxhcCBhbnkgUHJvdmluY2lhbCBUZW51cmVzLlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+VGVudXJlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJwcm92aW5jaWFsXCIsYyxwLDEpLGMscCwwLDMwMDEsMzExOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQgY29sc3Bhbj1cXFwiM1xcXCIgY2xhc3M9XFxcInBhcmFncmFwaFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNtelwiLGMscCwxKSxjLHAsMCwzMjMyLDM1NDYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICBPbmUgb2YgdGhlIG9iamVjdGl2ZXMgZm9yIFNwZWNpYWwgTWFuYWdlbWVudCBab25lcyBpcyB0byBwcm92aWRlIGZvciBjZXJ0YWludHkgZm9yIGJ1c2luZXNzIGFuZCB1c2VyIGdyb3VwcywgaW5jbHVkaW5nIGVjb25vbWljIGRldmVsb3BtZW50IG9wcG9ydHVuaXRpZXMuICBUbyByZWR1Y2UgcG90ZW50aWFsIGNvbmZsaWN0cyBiZXR3ZWVuIHVzZXMgYW5kIGFjdGl2aXRpZXMsIFNwZWNpYWwgTWFuYWdlbWVudCBab25lcyBuZWVkIHRvIGNvbnNpZGVyIGV4aXN0aW5nIHByb3ZpbmNpYWwgY3Jvd24gdGVudXJlcy4gXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwicG16XCIsYyxwLDEpLGMscCwwLDM1NzMsMzczMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIFRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gdXNlcyBhbmQgYWN0aXZpdGllcywgUHJvdGVjdGlvbiBNYW5hZ2VtZW50IFpvbmVzIG5lZWQgdG8gY29uc2lkZXIgZXhpc3RpbmcgcHJvdmluY2lhbCBjcm93biB0ZW51cmVzLlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImFycmF5XCIsYyxwLDEpLGMscCwwLDM3NjIsMzkwMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIFRvIHJlZHVjZSBwb3RlbnRpYWwgY29uZmxpY3RzIGJldHdlZW4gdXNlcyBhbmQgYWN0aXZpdGllcywgem9uZXMgbmVlZCB0byBjb25zaWRlciBleGlzdGluZyBwcm92aW5jaWFsIGNyb3duIHRlbnVyZXMuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjU1NDVjMDhkYzRmNWYyZDIxNjE0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoYWJpdGF0cyBsYXllcjwvYT4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZGVtb1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdXRwdXQ8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHByZT5cIik7Xy5iKF8udihfLmYoXCJyZXN1bHRcIixjLHAsMCkpKTtfLmIoXCI8L3ByZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZWNvbm9taWNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoIV8ucyhfLmYoXCJwbXpcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5UcmFuc21pc3Npb24gTGluZXMgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmNmFkNjc3YmJiOWIyNDU3MDIwZjUyXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGlzIHpvbmUgaXMgXCIpO18uYihfLnYoXy5mKFwidHJhbnNtaXNzaW9uTGluZXNcIixjLHAsMCkpKTtfLmIoXCIga20gZnJvbSB0aGUgbmVhcmVzdCB0cmFuc21pc3Npb24gbGluZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EaXN0YW5jZSB0byBJbmZyYXN0cnVjdHVyZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+SW5mcmFzdHJ1Y3R1cmU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPkRpc3RhbmNlIChrbSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaW5mcmFzdHJ1Y3R1cmVcIixjLHAsMSksYyxwLDAsNTEyLDU5OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkRpc3RJbktNXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRkIGNvbHNwYW49XFxcIjJcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFRoZSBob3Jpem9udGFsIGRpc3RhbmNlIHRvIGZlcnJpZXMsIHBvcnRzLCBoYXJib3VycywgZnVlbCBkb2NrcywgYW5kIG90aGVyIG1hcmluZSBhbmQgY29hc3RhbCBpbmZyYXN0cnVjdHVyZSBtaWdodCBiZSBoZWxwZnVsIGZvciBwbGFubmluZyBtYXJpbmUgdXNlcyBhbmQgYWN0aXZpdGllcyB0aGF0IGFyZSBzdXBwb3J0ZWQgaW4gdGhpcyB6b25lLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJwbXpcIixjLHAsMSksYyxwLDAsOTc0LDExMzksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk5vIFJlcG9ydHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgSHVtYW4gV2VsbC1CZWluZyByZXBvcnRzIGZvciBQcm90ZWN0aW9uIE1hbmFnZW1lbnQgWm9uZXMgYXJlIGNvbWluZyBzb29uLi4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcblxudGhpc1tcIlRlbXBsYXRlc1wiXVtcImVudmlyb25tZW50XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkhhYml0YXQgUmVwcmVzZW50YXRpb24gPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYzMDJkNTA4ZGM0ZjVmMmQwMDk5NmFcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+IC0tPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5Qcm90ZWN0ZWQgQXJlYSAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFiaXRhdHNcIixjLHAsMSksYyxwLDAsMzQ3LDQxMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHRyPjx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+PC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBIYWJpdGF0IGRhdGEgZm9yIGJlbnRoaWMgZWNvc3lzdGVtcywgcGVsYWdpYyBhcmVhcywgYW5kIG9jZWFub2dyYXBoaWMgcHJvY2Vzc2VzIGlzIHVzZWQgdG8gaW5mb3JtIHNpdGluZyBvZiB0aGlzIHpvbmUuIEluY2x1ZGVkIGhlcmUgYXJlIGJpb2dlbmljIGhhYml0YXRzIGFzIHdlbGwgYXMgY29tbXVuaXR5LWZvcm1pbmcgc3BlY2llcywgc3VjaCBhcyBlZWxncmFzcyBhbmQga2VscC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggSW1wb3J0YW50IE1hcmluZSBBcmVhczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBJbXBvcnRhbnQgTWFyaW5lIEFyZWFzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5JbXBvcnRhbnQgQXJlYTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpbXBvcnRhbnRBcmVhc1wiLGMscCwxKSxjLHAsMCwxMTQ2LDEyNjQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDTFBEX0FSRUFcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkIGNvbHNwYW49XFxcIjNcXFwiIGNsYXNzPVxcXCJwYXJhZ3JhcGhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBUbyByZWR1Y2UgcG90ZW50aWFsIGNvbmZsaWN0cyB3aXRoIHRoZXNlIG1hcmluZSBzcGVjaWVzLCBcIik7aWYoXy5zKF8uZihcInBtelwiLGMscCwxKSxjLHAsMCwxNDM4LDE0NjUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlByb3RlY3Rpb24gTWFuYWdlbWVudCBab25lc1wiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwic216XCIsYyxwLDEpLGMscCwwLDE0ODEsMTUwNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiU3BlY2lhbCBNYW5hZ2VtZW50IFpvbmVzXCIpO30pO2MucG9wKCk7fV8uYihcIiBtYXkgY29uc2lkZXIgdGhlc2UgYXJlYXMuIEltcG9ydGFudCBBcmVhcyB3ZXJlIGlkZW50aWZpZWQgZHVyaW5nIHRoZSBwcm9jZXNzIG9mIGVzdGFibGlzaGluZyBFY29sb2dpY2FsbHkgYW5kIEJpb2xvZ2ljYWxseSBTaWduaWZpY2FudCBBcmVhcyAoRUJTQXMpIGJ5IHRoZSBQYWNpZmljIE5vcnRoIENvYXN0IEludGVncmF0ZWQgTWFuYWdlbWVudCBBcmVhIChQTkNJTUEpLiBJbXBvcnRhbnQgQmlyZCBBcmVhcyAoSUJBcykgd2VyZSBpZGVudGlmaWVkIGJ5IEJpcmQgU3R1ZGllcyBDYW5hZGEgYW5kIE5hdHVyZSBDYW5hZGEuICBDcml0aWNhbCBIYWJpdGF0IG1lZXRzIENhbmFkYSdzIFNwZWNpZXMgYXQgUmlzayBSZXF1aXJlbWVudHMuIFBvdGVudGlhbCBjcml0aWNhbCBpcyBpbnN1ZmZpY2llbnQgaW5mb3JtYXRpb24gdG8gbWVldCBTQVJBIHJlcXVpcmVtZW50cy4gU2VlIHRoZSA8YSBocmVmPVxcXCJodHRwOi8vcG5jaW1hLm9yZy9zaXRlL2F0bGFzLmh0bWxcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5QTkNJTUEgYXRsYXM8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWY1NTQ1YzA4ZGM0ZjVmMmQyMTYxNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGFiaXRhdHMgbGF5ZXI8L2E+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5NYXJ4YW4gQW5hbHlzaXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHNlbGVjdCBjbGFzcz1cXFwiY2hvc2VuXFxcIiB3aWR0aD1cXFwiNDAwcHhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJ4YW5BbmFseXNlc1wiLGMscCwxKSxjLHAsMCwyMzQ3LDIzOTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8b3B0aW9uIHZhbHVlPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiPC9vcHRpb24+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvc2VsZWN0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcInNjZW5hcmlvUmVzdWx0c1xcXCI+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwidml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzY2VuYXJpb0Rlc2NyaXB0aW9uXFxcIj48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgTWFQUCBjb2xsYWJvcmF0ZWQgd2l0aCB0aGUgPGEgaHJlZj1cXFwiaHR0cDovL2JjbWNhLmNhL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkJDIE1hcmluZSBDb25zZXJ2YXRpb24gQW5hbHlzaXMgKEJDTUNBKTwvYT4gdG8gaWRlbnRpZnkgbWFyaW5lIGFyZWFzIG9mIGhpZ2ggY29uc2VydmF0aW9uIHZhbHVlIGJhc2VkIG9uIHNwYXRpYWwgZGF0YXNldHMgb2YgZWNvbG9naWNhbCBpbmZvcm1hdGlvbi4gVGhlc2UgTWFyeGFuIHNjZW5hcmlvcyBjYW4gYmUgdXNlZCB0byBpbmZvcm0gdGhlIGxvY2F0aW9uIG9yIHNpdGluZyBvZiBNYVBQIHpvbmVzLiA8YSBocmVmPVxcXCJodHRwOi8vd3d3LnVxLmVkdS5hdS9tYXJ4YW4vXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+TWFyeGFuPC9hPiBpcyBhIGRlY2lzaW9uIHN1cHBvcnQgdG9vbCBkZXZlbG9wZWQgYnkgdGhlIFVuaXZlcnNpdHkgb2YgUXVlZW5zbGFuZCB0byBwcm92aWRlIHNvbHV0aW9ucyB0byB0aGUg4oCcbWluaW11bSBzZXQgcHJvYmxlbeKAnSAtIGNhcHR1cmluZyBhIHNwZWNpZmllZCBhbW91bnQgKHRhcmdldCkgb2YgaW5kaXZpZHVhbCBmZWF0dXJlcyBmb3IgdGhlIGxlYXN0IGNvc3QuIEJhc2VkIG9uIHJlbGF0aXZlbHkgc2ltcGxlIG1hdGhlbWF0aWNhbCBhbGdvcml0aG1zIGFuZCBlcXVhdGlvbnMsIE1hcnhhbiBzZWFyY2hlcyBtaWxsaW9ucyBvZiBwb3RlbnRpYWwgc29sdXRpb25zIHRvIGZpbmQgdGhlIGJlc3QgYmFsYW5jZSBiZXR3ZWVuIGNvc3RzIGFuZCBiZW5lZml0cy4gSW4gc2hvcnQsIE1hcnhhbiBzb2x1dGlvbnMgbWluaW1pemUgdGhlIG92ZXJhbGwgY29zdCBzdWJqZWN0IHRvIHRoZSBjb25zdHJhaW50IG9mIG1lZXRpbmcgc3BlY2lmaWVkIOKAnHRhcmdldHPigJ0gZm9yIGFsbCBmZWF0dXJlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBNYVBQIGNvbnN1bHRlZCB0aGUgTWFQUCBTY2llbmNlIEFkdmlzb3J5IENvbW1pdHRlZSAoU0FDKSBmb3IgYWR2aWNlIG9uIHNjZW5hcmlvcyBhbmQgdGFyZ2V0IHNlbGVjdGlvbi4gIFRoZSBTQUMgc3VwcG9ydGVkIHRoZSBkZWNpc2lvbiB0byB1c2UgdGhlIHBlcmNlbnRhZ2UgdGFyZ2V0IGNhdGVnb3JpZXMgZXN0YWJsaXNoZWQgYnkgdGhlIEJDTUNBIHByb2plY3QgdGVhbSBpbiAyMDA2LiBQbGVhc2Ugc2VlIHRoaXMgPGEgaHJlZj1cXFwiaHR0cHM6Ly9kbC5kcm9wYm94dXNlcmNvbnRlbnQuY29tL3UvMTc2NDk4Ni9CQ01DQS1NYXJ4YW4gZm9yIE1hUFAtUmVwb3J0IG9uIGluaXRpYWwgc2NlbmFyaW9zXzI3RmViMjAxMy5wZGZcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj4yMDEzIEJDTUNBIHJlcG9ydDwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIE1hUFAtQkNNQ0EgcHJvamVjdCBhbmQgTWFyeGFuIHNjZW5hcmlvcywgYW5kIGNvbnN1bHQgdGhlIDxhIGhyZWY9XFxcImh0dHA6Ly9iY21jYS5jYVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPkJDTUNBIEF0bGFzPC9hPiBmb3IgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgdGFyZ2V0cywgc3BlY2llcywgYW5kIGhhYml0YXRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T3ZlcmxhcCB3aXRoIE5vbiBGaXNoIEJyZWVkaW5nIEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0YWJsZSAgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIiBkYXRhLW5vLXJvd3M9XFxcIkRvZXMgbm90IG92ZXJsYXAgYW55IE5vbiBGaXNoIEJyZWVkaW5nIEFyZWFzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5TcGVjaWVzPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5OdW1iZXIgb2YgQnJlZWRpbmcgQXJlYXMgb3IgTmVzdGluZyBTaXRlczwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub25GaXNoQnJlZWRpbmdBcmVhc1wiLGMscCwxKSxjLHAsMCw0Mzg3LDQ0NzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJTUEVDSUVTXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PdmVybGFwIHdpdGggTWFyaW5lIENsYXNzaWZpY2F0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGFibGUgIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCIgZGF0YS1uby1yb3dzPVxcXCJEb2VzIG5vdCBvdmVybGFwIGFueSBNYXJpbmUgQ2xhc3NpZmljYXRpb25zXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aD5DbGFzc2lmaWNhdGlvbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGg+T3ZlcmxhcCAoa23Csik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoPk92ZXJsYXAgJTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYXJpbmVDbGFzc2lmaWNhdGlvbnNcIixjLHAsMSksYyxwLDAsNDg4OSw1MDExLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX05BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNMUERfQVJFQVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19BUkVBXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoaXMgem9uZSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNpemVcIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIGtpbG9tZXRlcnM8L3N0cm9uZz4uIFNpemUgaXMgdXNlZCB0byBxdWFudGlmeSBkcmFmdCBzcGF0aWFsIHpvbmVzIGFuZCBwcm92aWRlIHBlcmNlbnQgY292ZXJhZ2UuIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFkamFjZW50UHJvdGVjdGVkQXJlYVwiLGMscCwxKSxjLHAsMCwyNDMsNzAxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5OZWFyYnkgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgY2xhc3M9XFxcImxhcmdlIGdyZWVuLWNoZWNrXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhpcyB6b25lIGlzIGFkamFjZW50IHRvIGEgPHN0cm9uZz5UZXJyZXN0cmlhbCBQcm90ZWN0ZWQgQXJlYTwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBCdWlsZCBvbiBwYXN0IGFuZCBleGlzdGluZyB6b25pbmcgZWZmb3J0cyB0aGF0IGFyZSBjb25zaXN0ZW50IHdpdGggYW4gZWNvc3lzdGVtLWJhc2VkIG1hbmFnZW1lbnQgYXBwcm9hY2guICBXaGVyZXZlciBwb3NzaWJsZSwgZG8gbm90IGR1cGxpY2F0ZSBleGlzdGluZyB6b25pbmcgZWZmb3J0cyBhbmQgY29uc2lkZXIgZXhpc3RpbmcgdGVycmVzdHJpYWwgem9uaW5nIGZvciBhZGphY2VudCBtYXJpbmUgem9uaW5nIHRvIGFjaGlldmUgem9uaW5nIG9iamVjdGl2ZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNzQ4LDg3NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9cmV0dXJuIF8uZmwoKTs7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTsiXX0=
;