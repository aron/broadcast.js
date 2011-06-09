var Broadcast = require('broadcast'),
    assert = require('assert'),
    vows = require('vows');

// Factory for creating event wrappers.
var $ = function eventFactory(callback, namespace) {
  return {callback: callback, namespace: namespace || null};
}

assert.includesCallback = function (wrappers, callback, message) {
  assert.includesCallbackWithNamespace(wrappers, callback, message);
};

assert.includesCallbackWithNamespace = function (wrappers, callback, message, namespace) {
  var ignoreNamespace = arguments.length === 3;
  if (Array.isArray(wrappers) && (function () {
    for (var index = 0, count = wrappers.length; index < count; index += 1) {
      if (wrappers[index].callback === callback && (ignoreNamespace || wrappers[index].namespace === namespace)) {
        return false;
      }
    }
    return true;
  })()) {
    assert.fail(wrappers, callback, message || "expected {actual} to include {expected}", "include", assert.includesCallback);
  }
}

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
    'should alias .emit() to .dispatch()': function (event) {
      assert.equal(event.dispatch, event.emit, true);
    },
    'new Broadcast(options)': {
      topic: new Broadcast({alias: false}),
      'should NOT alias .addListener() to .on()': function (event) {
        assert.isUndefined(event.on);
      },
      'should NOT alias .emit() to .dispatch()': function (event) {
        assert.isUndefined(event.dispatch);
      }
    }
  },
  '.emit()': {
    topic: function () {
      var event = new Broadcast();
      event._callbacks.change = [
        $(function A() { A.args = arguments; A.called = true; }),
        $(function B() { B.args = arguments; B.called = true; }),
        $(function C() { C.args = arguments; C.called = true; })
      ];
      return event;
    },
    'should call all registered callbacks for topic': function (event) {
      event.emit('change');
      event._callbacks['change'].forEach(function (wrapper) {
        assert.isTrue(wrapper.callback.called);
      });
    },
    'should pass any additional arguments into the callback': function (event) {
      var params = [20, 'hello', {my: 'object'}];
      event.emit.apply(event, ['change'].concat(params));
      event._callbacks['change'].forEach(function (wrapper) {
        var args = Array.prototype.slice.call(wrapper.callback.args);
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
      assert.includesCallback(event._callbacks.change, A);
    },
    'should register a callback for many space delimited topics': function (event) {
      function B() {}
      event.addListener('create update delete', B);
      assert.includesCallback(event._callbacks.create, B);
      assert.includesCallback(event._callbacks.update, B);
      assert.includesCallback(event._callbacks.delete, B);
    }
  },
  '.addListener(namespace, callback)': {
    topic: new Broadcast(),
    'should register a callback for a name-spaced topic': function (event) {
      function A() {}
      event.addListener('change.my-namespace', A);

      var callbackList = event._callbacks.change;
      assert.includesCallback(callbackList, A);
      assert.includesCallbackWithNamespace(callbackList, A, '.my-namespace');
    },
    'should register a callback for many space delimited topics': function (event) {
      function B() {}
      event.addListener('create update delete', B);
      assert.includesCallback(event._callbacks.create, B);
      assert.includesCallback(event._callbacks.update, B);
      assert.includesCallback(event._callbacks.delete, B);
    }
  },
  '.addListener(callbacks)': {
    topic: new Broadcast(),
    'should register multiple topic/callback pairs': function (event) {
      function A() {}
      function B() {}
      function C() {}

      event.addListener({create: A, update: B, destroy: C});
      assert.includesCallback(event._callbacks.create, A);
      assert.includesCallback(event._callbacks.update, B);
      assert.includesCallback(event._callbacks.destroy, C);
    }
  },
  '.removeListener()': {
    topic: function () {
      var event = new Broadcast();
      event._reload = function () {
        function Z() {}

        event._callbacks = {
          create: [
            $(function A() {}),
            $(function B() {}),
            $(function C() {})
          ],
          update: [
            $(function D() {})
          ],
          destroy: [
            $(function E() {})
          ],
          custom: [
            $(function F() {}, '.namespaced'),
            $(function G() {}),
            $(function H() {}, '.namespaced'),
            $(Z, '.namespaced')
          ],
          custom2: [
            $(function I() {}, '.namespaced'),
            $(Z, '.namespaced')
          ]
        };
        return this;
      };
      return event._reload();
    },
    '.removeListener(topic, callback)': {
      'should remove provided callback from topic': function (event) {
        event._reload();

        var A = event._callbacks.create[0].callback,
            B = event._callbacks.create[1].callback,
            C = event._callbacks.create[2].callback;

        event.removeListener('create', B);
        assert.deepEqual(event._callbacks.create, [$(A), $(C)]);
      },
      'should remove multiple occurrences of callback from topic': function (event) {
        event._reload();

        var A = event._callbacks.create[0].callback,
            B = event._callbacks.create[1].callback,
            C = event._callbacks.create[2].callback;

        event._callbacks.create = [$(A), $(B), $(C), $(B)];

        event.removeListener('create', B);
        assert.deepEqual(event._callbacks.create, [$(A), $(C)]);
      },
      'should allow a callback to unbind itself': function (event) {
        event._reload();

        function A() { A.count += 1; }
        function B() { B.count += 1; event.removeListener('create', B); }
        function C() { C.count += 1; }

        A.count = B.count = C.count = 0;

        event._callbacks.create = [$(A), $(B), $(C)];

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
        event._reload();
        event.removeListener('create');
        assert.isUndefined(event._callbacks.create);
      }
    },
    '.removeListener()': {
      'should remove all registered callbacks': function (event) {
        event._reload();
        event.removeListener();
        assert.isEmpty(event._callbacks);
      },
    },
    '.removeListener(namespace, callback)': {
      'should remove all occurrences of callback in namespace': function (event) {
        event._reload();

        var F = event._callbacks.custom[0].callback,
            G = event._callbacks.custom[1].callback,
            H = event._callbacks.custom[2].callback,
            Z = event._callbacks.custom[3].callback;

        event.removeListener('.namespaced', F);

        assert.deepEqual(event._callbacks.custom, [$(G), $(H, '.namespaced'), $(Z, '.namespaced')]);
      }
    },
    '.removeListener(namespace)': {
      'should remove all callbacks in namespace': function (event) {
        event._reload();

        var F = event._callbacks.custom[0].callback,
            G = event._callbacks.custom[1].callback;

        event.removeListener('.namespaced');

        assert.deepEqual(event._callbacks.custom, [$(G)]);
        assert.deepEqual(event._callbacks.custom2, []);
      }
    },
    '.removeListener(topicandnamespace, callback)': {
      'should remove callback for topic with namespace': function (event) {
        event._reload();

        var $F = event._callbacks.custom[0],
            $G = event._callbacks.custom[1],
            $H = event._callbacks.custom[2],
            $Z = event._callbacks.custom[3],
            $I = event._callbacks.custom2[0];

        event.removeListener('custom.namespaced', $Z.callback);

        assert.deepEqual(event._callbacks.custom, [$F, $G, $H]);
        assert.deepEqual(event._callbacks.custom2, [$I, $Z]);
      }
    },
    '.removeListener(topicandnamespace)': {
      'should remove all callbacks for topic with namespace': function (event) {
        event._reload();

        var $G = event._callbacks.custom[1],
            $I = event._callbacks.custom2[0],
            $Z = event._callbacks.custom2[1];

        event.removeListener('custom.namespaced');

        assert.deepEqual(event._callbacks.custom, [$G]);
        assert.deepEqual(event._callbacks.custom2, [$I, $Z]);
      }
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
