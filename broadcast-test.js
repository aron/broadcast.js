var broadcast = require('broadcast'),
    Broadcast = broadcast.Broadcast,
    assert = require('assert'),
    vows = require('vows');

vows.describe('Broadcast').addBatch({
  'new Broadcast()': {
    topic: new Broadcast(),
    'should create a new Broadcast instance': function (event) {
      assert.instanceOf(event, Broadcast);
    },
    'should create the _callbacks property': function (event) {
      assert.isObject(event._callbacks);
    },
    'should alias .subscribe() to .on()': function (event) {
      assert.equal(event.on, event.subscribe, true);
    },
    'new Broadcast(options)': {
      topic: new Broadcast({alias: false}),
      'should NOT alias .subscribe() to .on()': function (event) {
        assert.isUndefined(event.on);
      }
    }
  },
  '.publish()': {
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
      event.publish('change');
      event._callbacks['change'].forEach(function (callback) {
        assert.isTrue(callback.called);
      });
    },
    'should pass any additional arguments into the callback': function (event) {
      var params = [20, 'hello', {my: 'object'}];
      event.publish.apply(event, ['change'].concat(params));
      event._callbacks['change'].forEach(function (callback) {
        var args = Array.prototype.slice.call(callback.args);
        assert.deepEqual(args, params);
      });
    }
  },
  '.subscribe()': {
    topic: new Broadcast(),
    '.subscribe(topic, callback)': {
      'should register a callback for a topic': function (event) {
        function A() {}
        event.subscribe('change', A);
        assert.include(event._callbacks.change, A);
      }
    },
    '.subscribe(callbacks)': {
      'should register multiple topic/callback pairs': function (event) {
        function A() {}
        function B() {}
        function C() {}

        event.subscribe({create: A, update: B, destroy: C});
        assert.include(event._callbacks.create, A);
        assert.include(event._callbacks.update, B);
        assert.include(event._callbacks.destroy, C);
      }
    }
  },
  '.unsubscribe()': {
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
    '.unsubscribe(topic, callback)': {
      'should remove provided callback from topic': function (event) {
        var A = event._callbacks.create[0],
            B = event._callbacks.create[1],
            C = event._callbacks.create[2];

        event.unsubscribe('create', B);
        assert.deepEqual(event._callbacks.create, [A, C]);
      },
      'should remove multiple occurrences of callback from topic': function (event) {
        var A = event._callbacks.create[0],
            B = event._callbacks.create[1],
            C = event._callbacks.create[2];

        event._callbacks.create = [A, B, C, B];

        event.unsubscribe('create', B);
        assert.deepEqual(event._callbacks.create, [A, C]);
      },
      'should allow a callback to unbind itself': function (event) {
        function A() { A.count += 1; }
        function B() { B.count += 1; event.unsubscribe('create', B); }
        function C() { C.count += 1; }

        A.count = B.count = C.count = 0;

        event._callbacks.create = [A, B, C];

        event.publish('create');
        assert.equal(A.count, 1);
        assert.equal(B.count, 1);
        assert.equal(C.count, 1);

        event.publish('create');
        assert.equal(A.count, 2);
        assert.equal(B.count, 1);
        assert.equal(C.count, 2);
      }
    },
    '.unsubscribe(topic)': {
      'should remove all callbacks for topic': function (event) {
        event.unsubscribe('create');
      }
    },
    '.unsubscribe(topic)': {
      'should remove all registered callbacks': function (event) {
        event.unsubscribe();
        assert.isEmpty(event._callbacks);
      },
    },
    'Broadcast object should also have all methods': function () {
      ['publish', 'subscribe', 'unsubscribe'].forEach(function (method) {
        assert.equal(Broadcast[method], Broadcast.prototype[method]);
      });
    }
  },
  'Broadcast.noConflict()': {
    'should restore previous Broadcast property': function () {
      var returned = Broadcast.noConflict();
      assert.isUndefined(broadcast.Broadcast);
      assert.equal(returned, Broadcast);
    }
  }
}).export(module);
