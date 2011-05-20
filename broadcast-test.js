var Broadcast = require('broadcast'),
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
    },
    '.publish("all")': {
      'should publish "all" topic when an event is fired': function (event) {
        function onAll() { onAll.called = true; }
        event.subscribe('all', onAll).publish('change');
        assert.isTrue(onAll.called);
      },
      'should provide topic name and arguments to callback': function (event) {
        function onAll() { onAll.args = arguments; }
        event.subscribe('all', onAll).publish('change', 'argument', 20);
        assert.equal(onAll.args[0], 'change');
        assert.equal(onAll.args[1], 'argument');
        assert.equal(onAll.args[2], 20);
      },
      'should NOT publish "all" topic if "all" is published': function (event) {
        function onAll() { onAll.count += 1; }
        onAll.count = 0;
        event.subscribe('all', onAll).publish('all');
        assert.equal(onAll.count, 1);
      }
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
      // Don't think this can be verified using server side testing.
    },
    'should return Broadcast': function () {
      var returned = Broadcast.noConflict();
      assert.equal(returned, Broadcast);
    }
  }
}).export(module);
