// Generated by CoffeeScript 1.10.0
var Found, Q, aka, akas, aliases, async, consoleFn, events, j, len, makeEmitter, orig, processArrayOrObject, throat,
  slice = [].slice,
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Q = require('q');

throat = require('throat');

events = require('events');

aliases = {
  each: ['map', 'forEach'],
  eachSeries: ['mapSeries', 'forEachSeries'],
  eachLimit: ['mapLimit', 'forEachLimit'],
  filter: ['select'],
  filterSeries: ['selectSeries'],
  reduce: ['inject', 'foldl'],
  reduceRight: ['foldr'],
  some: ['any'],
  every: ['all']
};

consoleFn = function(name) {
  return function() {
    var args, fn;
    fn = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return Q.fapply(fn, args)["catch"](function(err) {
      return typeof console !== "undefined" && console !== null ? typeof console.error === "function" ? console.error(err) : void 0 : void 0;
    }).then(function(res) {
      return typeof console !== "undefined" && console !== null ? typeof console[name] === "function" ? console[name](res) : void 0 : void 0;
    });
  };
};

processArrayOrObject = function(tasks, fn) {
  var arr, key, keys;
  arr = tasks.constructor === Array ? tasks : (keys = (function() {
    var results1;
    results1 = [];
    for (key in tasks) {
      results1.push(key);
    }
    return results1;
  })(), (function() {
    var j, len, results1;
    results1 = [];
    for (j = 0, len = keys.length; j < len; j++) {
      key = keys[j];
      results1.push(tasks[key]);
    }
    return results1;
  })());
  return Q["try"](fn, arr).then(function(results) {
    var i, j, len, res;
    if (keys) {
      res = {};
      for (i = j = 0, len = keys.length; j < len; i = ++j) {
        key = keys[i];
        res[key] = results[i];
      }
      return res;
    } else {
      return results;
    }
  });
};

makeEmitter = function(obj) {
  var fn, prop, ref;
  ref = events.EventEmitter.prototype;
  for (prop in ref) {
    fn = ref[prop];
    obj[prop] = fn;
  }
  return obj;
};

Found = (function() {
  function Found(val) {
    this.val = val;
  }

  return Found;

})();

module.exports = async = {
  each: Q.promised(function(arr, iterator) {
    return Q.when(arr, function(arr) {
      return Q.all(arr.map(function(a, i) {
        return Q["try"](iterator, a, i, arr);
      }));
    });
  }),
  eachSeries: Q.promised(function(arr, iterator) {
    return async.series(arr.map(function(a, i) {
      return function() {
        return iterator(a, i, arr);
      };
    }));
  }),
  eachLimit: Q.promised(function(arr, limit, iterator) {
    return async.parallelLimit(arr.map(function(a, i) {
      return function() {
        return iterator(a, i, arr);
      };
    }), limit);
  }),
  filter: Q.promised(function(arr, iterator, _reject) {
    if (_reject == null) {
      _reject = false;
    }
    return Q.all(arr.map(function(a) {
      return Q["try"](iterator, a).then(function(ok) {
        return [ok, a];
      });
    })).then(function(res) {
      return res.filter(function(arg1) {
        var ok;
        ok = arg1[0];
        return _reject ^ ok;
      }).map(function(arg1) {
        var a, ok;
        ok = arg1[0], a = arg1[1];
        return a;
      });
    });
  }),
  filterSeries: Q.promised(function(arr, iterator, _reject) {
    if (_reject == null) {
      _reject = false;
    }
    return async.series(arr.map(function(a) {
      return function() {
        return iterator(a).then(function(ok) {
          return [ok, a];
        });
      };
    })).then(function(res) {
      return res.filter(function(arg1) {
        var ok;
        ok = arg1[0];
        return _reject ^ ok;
      }).map(function(arg1) {
        var a, ok;
        ok = arg1[0], a = arg1[1];
        return a;
      });
    });
  }),
  reject: function(arr, iterator) {
    return async.filter(arr, iterator, true);
  },
  rejectSeries: function(arr, iterator) {
    return async.filterSeries(arr, iterator, true);
  },
  reduce: Q.promised(function(arr, memo, iterator, _method) {
    if (_method == null) {
      _method = 'reduce';
    }
    return arr[_method](function(res, a) {
      return res.then(function(b) {
        return iterator(b, a);
      });
    }, Q(memo));
  }),
  reduceRight: function(arr, memo, iterator) {
    return async.reduce(arr, memo, iterator, 'reduceRight');
  },
  detect: Q.promised(function(arr, iterator, _notFound) {
    if (_notFound == null) {
      _notFound = void 0;
    }
    return Q.all(arr.map(function(a) {
      return Q["try"](iterator, a).then(function(ok) {
        if (ok) {
          throw new Found(a);
        }
      });
    })).thenResolve(_notFound)["catch"](function(ball) {
      if (!(ball instanceof Found)) {
        throw ball;
      }
      return ball.val;
    });
  }),
  detectSeries: Q.promised(function(arr, iterator, _notFound) {
    if (_notFound == null) {
      _notFound = void 0;
    }
    if (arr.length === 0) {
      return Q(_notFound);
    }
    return iterator(arr[0]).then(function(ok) {
      if (ok) {
        return arr[0];
      } else {
        return async.detectSeries(arr.slice(1), iterator);
      }
    });
  }),
  sortBy: Q.promised(function(arr, iterator) {
    return Q.all(arr.map(function(a) {
      return Q["try"](iterator, a).then(function(b) {
        return [b, a];
      });
    })).then(function(res) {
      return res.sort(function(x, y) {
        if (x[0] < y[0]) {
          return -1;
        } else if (x[0] > y[0]) {
          return 1;
        } else {
          return 0;
        }
      }).map(function(x) {
        return x[1];
      });
    });
  }),
  some: function(arr, iterator) {
    var nf;
    return async.detect(arr, iterator, nf = {}).then(function(res) {
      return res !== nf;
    });
  },
  every: Q.promised(function(arr, iterator) {
    var negator, nf;
    negator = function(a) {
      return Q["try"](iterator, a).then(function(ok) {
        return !ok;
      });
    };
    return async.detect(arr, negator, nf = {}).then(function(res) {
      return res === nf;
    });
  }),
  concat: Q.promised(function(arr, iterator) {
    var results;
    results = [];
    return Q.all(arr.map(function(a) {
      return Q["try"](iterator, a).then(function(res) {
        return results.push.apply(results, res);
      });
    })).thenResolve(results);
  }),
  concatSeries: Q.promised(function(arr, iterator) {
    return async.reduce(arr, [], function(res, a) {
      return iterator(a).then(function(bs) {
        return res.concat(bs);
      });
    });
  }),
  series: Q.promised(function(tasks) {
    return processArrayOrObject(tasks, function(arr) {
      var results;
      results = [];
      return arr.reduce(function(res, task) {
        return res.then(task).then(results.push.bind(results));
      }, Q()).then(function() {
        return results;
      });
    });
  }),
  parallel: Q.promised(function(tasks) {
    return processArrayOrObject(tasks, function(arr) {
      return Q.all(arr.map(function(task) {
        if (task.then) {
          return task;
        } else {
          return Q["try"](task);
        }
      }));
    });
  }),
  parallelLimit: Q.promised(function(tasks, limit) {
    return processArrayOrObject(tasks, function(arr) {
      if (limit > 0) {
        return Q.all(arr.map(throat(limit)));
      } else {
        return Q([]);
      }
    });
  }),
  whilst: Q.promised(function(test, fn, _invert) {
    if (_invert == null) {
      _invert = false;
    }
    return Q["try"](function() {
      if (_invert ^ test()) {
        return Q["try"](fn).then(function() {
          return async.whilst(test, fn, _invert);
        });
      }
    });
  }),
  until: function(test, fn) {
    return async.whilst(test, fn, true);
  },
  doWhilst: Q.promised(function(fn, test) {
    return Q["try"](fn).then(function() {
      return async.whilst(test, fn);
    });
  }),
  doUntil: Q.promised(function(fn, test) {
    return Q["try"](fn).then(function() {
      return async.whilst(test, fn, true);
    });
  }),
  forever: Q.promised(function(fn) {
    return Q["try"](fn).then(function() {
      return async.forever(fn);
    });
  }),
  waterfall: Q.promised(function(tasks) {
    return tasks.reduce((function(res, task) {
      return res.then(task);
    }), Q());
  }),
  compose: function() {
    var fns;
    fns = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return function(arg) {
      var that;
      that = this;
      return async.waterfall(fns.concat(function() {
        return Q(arg);
      }).reverse().map(function(fn) {
        return function() {
          return fn.apply(that, arguments);
        };
      }));
    };
  },
  applyEach: function() {
    var args, doApply, fns;
    fns = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    doApply = function() {
      var a;
      a = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return Q.all(fns.map(function(fn) {
        return Q.fapply(fn, a);
      }));
    };
    if (args.length) {
      return doApply.apply(null, args);
    } else {
      return doApply;
    }
  },
  applyEachSeries: function() {
    var args, doApply, fns;
    fns = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    doApply = function() {
      var a;
      a = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return async.series(fns.map(function(fn) {
        return function() {
          return fn.apply(null, a);
        };
      }));
    };
    if (args.length) {
      return doApply.apply(null, args);
    } else {
      return doApply;
    }
  },
  queue: function(worker, concurrency) {
    var _insert, q, tasks, workers;
    if (concurrency == null) {
      concurrency = 1;
    }
    _insert = function(data, op) {
      var gotArray, promises;
      gotArray = data.constructor === Array;
      if (!gotArray) {
        data = [data];
      }
      promises = data.map(function(task) {
        var finish, start;
        start = Q.defer();
        finish = Q.defer();
        finish.promise.start = start.promise;
        tasks[op]({
          data: task,
          start: start,
          finish: finish
        });
        if (tasks.length === q.concurrency) {
          q.emit('saturated');
        }
        process.nextTick(q.process);
        return finish.promise;
      });
      if (gotArray) {
        return promises;
      } else {
        return promises[0];
      }
    };
    workers = 0;
    tasks = [];
    return q = makeEmitter({
      concurrency: concurrency,
      push: function(data) {
        return _insert(data, 'push');
      },
      unshift: function(data) {
        return _insert(data, 'unshift');
      },
      length: function() {
        return tasks.length;
      },
      process: function() {
        var task;
        if (workers < q.concurrency && tasks.length) {
          task = tasks.shift();
          task.start.resolve();
          if (tasks.length === 0) {
            q.emit('empty');
          }
          workers++;
          return Q["try"](worker, task.data)["catch"](function(e) {
            return task.finish.reject(e);
          }).then(function(res) {
            workers--;
            task.finish.resolve(res);
            if (tasks.length + workers === 0) {
              q.emit('drain');
            }
            return q.process();
          });
        }
      }
    });
  },
  cargo: function(worker, payload) {
    var cargo, tasks, working;
    if (payload == null) {
      payload = null;
    }
    working = false;
    tasks = [];
    return cargo = makeEmitter({
      tasks: tasks,
      payload: payload,
      length: function() {
        return tasks.length;
      },
      running: function() {
        return working;
      },
      push: function(data) {
        var gotArray, promises;
        gotArray = data.constructor === Array;
        if (!gotArray) {
          data = [data];
        }
        promises = data.map(function(task) {
          var d;
          tasks.push({
            data: task,
            defer: (d = Q.defer())
          });
          return d.promise;
        });
        if (tasks.length === payload) {
          cargo.emit('saturated');
        }
        process.nextTick(cargo.process);
        if (gotArray) {
          return promises;
        } else {
          return promises[0];
        }
      },
      process: function() {
        var ts;
        if (working) {
          return;
        }
        if (tasks.length === 0) {
          return cargo.emit('drain');
        }
        ts = payload != null ? tasks.splice(0, payload) : tasks.splice(0);
        cargo.emit('empty');
        working = true;
        return Q["try"](worker, ts.map(function(t) {
          return t.data;
        }))["catch"](function(err) {
          return ts.forEach(function(task) {
            return task.defer.reject(err);
          });
        }).then(function(res) {
          working = false;
          ts.forEach(function(task) {
            return task.defer.resolve(res);
          });
          return cargo.process();
        });
      }
    });
  },
  auto: Q.promised(function(tasks) {
    var checkPending, finished, key, qdef, reject, results, running, total;
    total = ((function() {
      var results1;
      results1 = [];
      for (key in tasks) {
        if (!hasProp.call(tasks, key)) continue;
        results1.push(key);
      }
      return results1;
    })()).length;
    qdef = Q.defer();
    reject = qdef.reject.bind(qdef);
    results = {};
    running = {};
    finished = false;
    (checkPending = function() {
      var done, fn, name, reqs, results1, stuff;
      if (finished) {
        return;
      }
      done = (function() {
        var results1;
        results1 = [];
        for (key in results) {
          results1.push(key);
        }
        return results1;
      })();
      if (done.length === total) {
        qdef.resolve(results);
        finished = true;
        return;
      }
      results1 = [];
      for (name in tasks) {
        stuff = tasks[name];
        if (indexOf.call(done, name) >= 0) {
          continue;
        }
        if ('function' === typeof stuff) {
          reqs = [];
          fn = stuff;
        } else {
          reqs = stuff.slice(0);
          fn = reqs.pop();
        }
        if (!running[name] && reqs.reduce((function(ok, req) {
          return ok && indexOf.call(done, req) >= 0;
        }), true)) {
          results1.push((function(name) {
            running[name] = true;
            return Q["try"](fn, results).then(function(res) {
              results[name] = res;
              return checkPending();
            })["catch"](reject);
          })(name));
        } else {
          results1.push(void 0);
        }
      }
      return results1;
    })();
    return qdef.promise;
  }),
  iterator: function() {
    throw new Error('NOT YET(?) IMPLEMENTED');
  },
  apply: function() {
    throw new Error('NOT YET(?) IMPLEMENTED');
  },
  nextTick: function() {
    throw new Error('NOT YET(?) IMPLEMENTED');
  },
  times: Q.promised(function(n, fn) {
    var j, results1;
    return async.parallel((function() {
      results1 = [];
      for (var j = 0; 0 <= n ? j < n : j > n; 0 <= n ? j++ : j--){ results1.push(j); }
      return results1;
    }).apply(this).map(function(i) {
      return function() {
        return fn(i);
      };
    }));
  }),
  timesSeries: Q.promised(function(n, fn) {
    var j, results1;
    return async.series((function() {
      results1 = [];
      for (var j = 0; 0 <= n ? j < n : j > n; 0 <= n ? j++ : j--){ results1.push(j); }
      return results1;
    }).apply(this).map(function(i) {
      return function() {
        return fn(i);
      };
    }));
  }),
  memoize: function(fn, hasher) {
    var memo, memoized, queues;
    if (hasher == null) {
      hasher = null;
    }
    memo = {};
    queues = {};
    if (hasher == null) {
      hasher = function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return args.join();
      };
    }
    memoized = function() {
      var args, d, key;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      key = hasher.apply(null, args);
      if (key in memo) {
        return Q(memo[key]);
      }
      d = Q.defer();
      if (!(key in queues)) {
        queues[key] = [];
        Q.fapply(fn, args).then(function(res) {
          var q;
          memo[key] = res;
          q = queues[key];
          delete queues[key];
          return q.forEach(function(qd) {
            return qd.resolve(res);
          });
        })["catch"](function(err) {
          var q;
          q = queues[key];
          delete queues[key];
          return q.forEach(function(qd) {
            return qd.reject(err);
          });
        });
      }
      queues[key].push(d);
      return d.promise;
    };
    memoized.memo = memo;
    memoized.unmemoized = fn;
    return memoized;
  },
  unmemoize: function(fn) {
    return fn.unmemoized || fn;
  },
  log: consoleFn('log'),
  dir: consoleFn('dir')
};

for (orig in aliases) {
  akas = aliases[orig];
  for (j = 0, len = akas.length; j < len; j++) {
    aka = akas[j];
    async[aka] = async[orig];
  }
}
