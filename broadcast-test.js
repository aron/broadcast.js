var Broadcast = require('broadcast'),
    assert = require('assert'),
    vows = require('vows');

// Patching an issue in the assert.include() that is shipped with Vows 0.5.8
// that fails to error when a non String/Array/Object is provided for the
// actual argument.
function isArray(obj) {
  return Array.isArray(obj);
}

function isString(obj) {
  return typeof(obj) === 'string' || obj instanceof String;
}

function isObject(obj) {
  return typeof(obj) === 'object' && obj && !isArray(obj);
}

assert.include = function (actual, expected, message) {
  if ((function (obj) {
    if (isArray(obj) || isString(obj)) {
      return obj.indexOf(expected) === -1;
    } else if (isObject(actual)) {
      return ! obj.hasOwnProperty(expected);
    }
    return true;
  })(actual)) {
    assert.fail(actual, expected, message || "expected {actual} to include {expected}", "include", assert.include);
  }
};

vows.describe('Broadcast').addBatch({
  'new Broadcast()': {
    topic: new Broadcast(),
    'should create a new Broadcast instance': function (event) {
      assert.instanceOf(event, Broadcast);
    },
    'should create the _callbacks property': function (event) {
      assert.isObject(event._callbacks);
    },
    'should alias .addListener() to .on()': function (event) {
      assert.equal(event.on, event.addListener, true);
    },
    'should alias .emit() to .trigger()': function (event) {
      assert.equal(event.trigger, event.emit, true);
    },
    'new Broadcast(options)': {
      topic: new Broadcast({alias: false}),
      'should NOT alias .addListener() to .on()': function (event) {
        assert.isUndefined(event.on);
      },
      'should NOT alias .emit() to .trigger()': function (event) {
        assert.isUndefined(event.trigger);
      }
    }
  },
  '.emit()': {
    topic: function () {
      var event = new Broadcast();
      event._callbacks.change = [
        function A() { A.args = arguments; A.called = true; },
        function B() { B.args = arguments; B.called = true; },
        function C() { C.args = arguments; C.called = true; }
      ];
      return event;
    },
    'should call all registered callbacks for topic': function (event) {
      event.emit('change');
      event._callbacks['change'].forEach(function (callback) {
        assert.isTrue(callback.called);
      });
    },
    'should pass any additional arguments into the callback': function (event) {
      var params = [20, 'hello', {my: 'object'}];
      event.emit.apply(event, ['change'].concat(params));
      event._callbacks['change'].forEach(function (callback) {
        var args = Array.prototype.slice.call(callback.args);
        assert.deepEqual(args, params);
      });
    },
    '.emit("all")': {
      'should emit "all" topic when an event is fired': function (event) {
        function onAll() { onAll.called = true; }
        event.addListener('all', onAll).emit('change');
        assert.isTrue(onAll.called);
      },
      'should provide topic name and arguments to callback': function (event) {
        function onAll() { onAll.args = arguments; }
        event.addListener('all', onAll).emit('change', 'argument', 20);
        assert.equal(onAll.args[0], 'change');
        assert.equal(onAll.args[1], 'argument');
        assert.equal(onAll.args[2], 20);
      },
      'should NOT emit "all" topic if "all" is emited': function (event) {
        function onAll() { onAll.count += 1; }
        onAll.count = 0;
        event.addListener('all', onAll).emit('all');
        assert.equal(onAll.count, 1);
      }
    }
  },    
  '.addListener(topic, callback)': {
    topic: new Broadcast(),
    'should register a callback for a topic': function (event) {
      function A() {}
      event.addListener('change', A);
      assert.include(event._callbacks.change, A);
    }
  },
  '.addListener(callbacks)': {
    topic: new Broadcast(),
    'should register multiple topic/callback pairs': function (event) {
      function A() {}
      function B() {}
      function C() {}

      event.addListener({create: A, update: B, destroy: C});
      assert.include(event._callbacks.create, A);
      assert.include(event._callbacks.update, B);
      assert.include(event._callbacks.destroy, C);
    }
  },
  '.removeListener()': {
    topic: function () {
      var event = new Broadcast();
      event._callbacks = {
        create: [
          function A() {},
          function B() {},
          function C() {}
        ],
        update: [
          function D() {}
        ],
        destroy: [
          function E() {}
        ]
      };
      return event;
    },
    '.removeListener(topic, callback)': {
      'should remove provided callback from topic': function (event) {
        var A = event._callbacks.create[0],
            B = event._callbacks.create[1],
            C = event._callbacks.create[2];

        event.removeListener('create', B);
        assert.deepEqual(event._callbacks.create, [A, C]);
      },
      'should remove multiple occurrences of callback from topic': function (event) {
        var A = event._callbacks.create[0],
            B = event._callbacks.create[1],
            C = event._callbacks.create[2];

        event._callbacks.create = [A, B, C, B];

        event.removeListener('create', B);
        assert.deepEqual(event._callbacks.create, [A, C]);
      },
      'should allow a callback to unbind itself': function (event) {
        function A() { A.count += 1; }
        function B() { B.count += 1; event.removeListener('create', B); }
        function C() { C.count += 1; }

        A.count = B.count = C.count = 0;

        event._callbacks.create = [A, B, C];

        event.emit('create');
        assert.equal(A.count, 1);
        assert.equal(B.count, 1);
        assert.equal(C.count, 1);

        event.emit('create');
        assert.equal(A.count, 2);
        assert.equal(B.count, 1);
        assert.equal(C.count, 2);
      }
    },
    '.removeListener(topic)': {
      'should remove all callbacks for topic': function (event) {
        event.removeListener('create');
      }
    },
    '.removeListener()': {
      'should remove all registered callbacks': function (event) {
        event.removeListener();
        assert.isEmpty(event._callbacks);
      },
    },
    'Broadcast object should also have all methods': function () {
      ['emit', 'addListener', 'removeListener'].forEach(function (method) {
        assert.equal(Broadcast[method], Broadcast.prototype[method]);
      });
    }
  },
  'Broadcast.noConflict()': {
    'should restore previous Broadcast property': function () {
      // Don't think this can be verified using server side testing.
    },
    'should return Broadcast': function () {
      var returned = Broadcast.noConflict();
      assert.equal(returned, Broadcast);
    }
  }
}).export(module);
