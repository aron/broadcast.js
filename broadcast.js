/*  Broadcast.js - v0.6.0
 *  Copyright 2011, Aron Carroll
 *  Released under the MIT license
 *  More Information: http://github.com/aron/broadcast.js
 */
(function (module, undefined) {

  // Retain a reference to the original property.
  var _Broadcast = module.Broadcast,
      hasOwnProp = Object.prototype.hasOwnProperty;

  /* Extends an object with properties from another
   *
   * target - The Object that is to be extended.
   * obejct - An Object containing properties.
   *
   * Examples
   *
   *   extend({type: 'person'}, {name: 'bill', age: 20});
   *   //=> {type: 'person', name: 'bill', age: 20}
   *
   * Returns the extended object.
   */
  function extend(target, object) {
    for (var key in object) {
      if (hasOwnProp.call(object, key)) {
        target[key] = object[key];
      }
    }
    return target;
  }

  /* Parses a topic string returning an object with topic and namespace
   * properties.
   *
   * topic - A user provided topic string.
   *
   * Examples
   *
   *   parseTopic('all'); //=> {topic: "all", namespace: null}
   *   parseTopic('custom.plugin'); //=> {topic: "custom", namespace: "plugin"}
   *
   * Returns an object.
   */
  function parseTopic(topic) {
    var namespaceIndex = topic.lastIndexOf('.'),
        namespace = null;

    if (namespaceIndex > -1) {
      namespace = topic.slice(namespaceIndex);
      topic = topic.slice(0, namespaceIndex);
    }

    return {topic: topic, namespace: namespace};
  }

  /* Splits a topic string on spaces and provides each new topic to the
   * callback function along with its parsed representation.
   *
   * topic    - A user provided topic string.
   * callback - A callback that recieves the parsed topic and original string.
   *
   * Examples
   *
   *   // register() is called with "create" and "update"
   *   parseTopic('create update', register);
   *
   * Returns nothing.
   */
  function iterateTopic(topic, callback) {
    var topics = topic.split(' '), index = 0, count = topics.length;

    for (;index < count; index += 1) {
      callback.call(this, parseTopic(topics[index]), topics[index]);
    }
  }

  /* Public: Creates an instance of Broadcast.
   *
   * options - An Object literal containing setup options.
   *           alias: If false will not assign the .on() alias.
   *
   * Examples
   *
   *   // In the browser.
   *   var events = new Broadcast();
   *   events.addListener('say', function (message) { console.log(message); });
   *   events.emit('say', 'Hello World'); // Logs "Hello World"
   *
   *   // On the server.
   *   var Broadcast = require('broadcast');
   *   var events = new Broadcast();
   *
   * Returns a new instance of Broadcast.
   */
  function Broadcast(options) {
    this._callbacks = {};
    if (!options || options.alias === true) {
      this.on   = this.addListener;
      this.fire = this.emit;
    }
  }

  /* Public: Allows Broadcast to be used simply as a global pub/sub
   * implementation without creating new instances.
   *
   * Examples
   *
   *   Broadcast.addListener('say', function (message) { console.log(message); });
   *   Broadcast.emit('say', 'Hello World'); // Logs "Hello World"
   *   Broadcast.removeListener('say');
   */
  extend(Broadcast, {

    /* Object used to store registered callbacks. An instance specific property
     * is created in the constructor.
     */
    _callbacks: {},

    /* Public: emits a topic. Calls all registered callbacks passing in any
     * arguments provided after the topic string.
     *
     * It is also possible to trigger only events bound under a specific
     * namespace by appending it to the topic name.
     *
     * There is also a special topic called "all" that will fire when any other
     * topic is emited providing the topic emited and any additional
     * arguments to all callbacks.
     *
     * topic      - A topic String to emit.
     * arguments* - All subsequent arguments will be passed into callbacks.
     *
     * Examples
     *
     *   var events = new Broadcast();
     *   events.addListener('say', function (message) { console.log(message); });
     *   events.emit('say', 'Hello World'); // Logs "Hello World"
     *
     *   events.addListener('say.ns', function (message) { console.log(message); });
     *   events.emit('say.ns', 'Namespaced'); // Logs only "Namespaced"
     *
     *   // addListener to the special "all" topic.
     *   events.addListener('all', function (topic) {
     *     console.log(topic, arguments[1]);
     *   });
     *   events.emit('say', 'Hello Again'); // Logs "say Hello World"
     *
     * Returns itself for chaining.
     */
    emit: function (topic /* , arguments... */) {
      var parsed    = parseTopic(topic),
          namespace = parsed.namespace,
          callbacks = this._callbacks[parsed.topic] || [],
          slice = Array.prototype.slice,
          index = 0, count = callbacks.length, handler;

      topic = parsed.topic;
      for (; index < count; index += 1) {
        handler = callbacks[index];
        if (!namespace || handler.namespace === namespace) {
          handler.callback.apply(handler.context, slice.call(arguments, 1));
        }
      }

      if (topic !== 'all') {
        this.emit.apply(this, ['all', topic].concat(slice.call(arguments, 1)));
      }

      return this;
    },

    /* Public: Subscribe to a specific topic with a callback. A single
     * callback can also subscribe to many topics by providing a space
     * delimited string of topic names. Finally the method also accepts a
     * single object containing topic/callback pairs as an argument.
     *
     * Events can also be name-spaced ala jQuery to allow easy removal of
     * muliple callbacks in one call to .removeListener(). To namespace a
     * callback simply suffix the topic with a period (.) followed by your
     * namespace.
     *
     * topic    - A topic String or Object of topic/callback pairs.
     * callback - Callback Function to call when topic is emited.
     * context  - Optional callback context can be provided (default: null).
     *
     * Examples
     *
     *   var events = new Broadcast();
     *
     *   // Register single callback.
     *   events.addListener('create', function () {});
     *
     *   // Register a single callback to multiple topics.
     *   events.addListener('create update delete', function () {});
     *
     *   // Register multiple callbacks.
     *   events.addListener({
     *     'update', function () {},
     *     'delete', function () {}
     *   );
     *
     *   // Register a callback with a namespace.
     *   events.addListener('create.my-namespace', function () {});
     *   events.addListener('update.my-namespace', function () {});
     *
     *   // No longer requires a callback to be passed to unbind.
     *   events.removeListener('.my-namespace', function () {});
     *
     *   // Provide a context (scope) for the callback.
     *   var context = {a: 1};
     *   events.addListener('change', function () {
     *     console.log(this.a); //=> Will be 1.
     *   }, context);
     *
     * Returns itself for chaining.
     */
    addListener: function (topic, callback, context) {
      if (typeof topic !== 'string') {
        for (var key in topic) {
          if (hasOwnProp.call(topic, key)) {
            this.addListener(key, topic[key], callback);
          }
        }
      } else {
        context = arguments.length === 3 ? context : null;
        iterateTopic.call(this, topic, function register(parsed) {
          var topic  = parsed.topic;

          if (!this._callbacks[topic]) {
            this._callbacks[topic] = [];
          }
          this._callbacks[topic].push({
            context:   context, 
            callback:  callback,
            namespace: parsed.namespace
          });
        });
      }

      return this;
    },

    /* Public: Unbinds registered listeners for a topic. If no arguments are
     * passed all callbacks are removed. If a topic is provided only callbacks
     * for that topic are removed. If a topic and function are passed all
     * occurrences of that function are removed.
     *
     * topic    - A topic String to removeListener (optional).
     * callback - A specific callback Function to remove (optional).
     *
     * Examples
     *
     *   function A() {}
     *
     *   events.addListener('create', A);
     *   events.addListener('create', function B() {});
     *   events.addListener({
     *     'create', function C() {},
     *     'update', function D() {},
     *     'delete', function E() {}
     *   );
     *   events.addListener('custom.my-namespace', function F() {});
     *
     *   // Removes callback (A).
     *   events.removeListener('create', A);
     *
     *   // Removes callbacks for topic 'create' (B & C).
     *   events.removeListener('create');
     *
     *   // Removes callbacks for namespace '.my-namespace' (F).
     *   events.removeListener('.my-namespace');
     *
     *   // Removes all callbacks for all topics (D & E).
     *   events.removeListener();
     *
     * Returns itself for chaining.
     */
    removeListener: function (topic, callback) {
      var callbacks = {};

      if (arguments.length) {
        iterateTopic.call(this, topic, function unregister(parsed, original) {
          var topic     = parsed.topic,
              namespace = parsed.namespace,
              wrappers  = callbacks[topic] || [],
              key, index, count;

          callbacks[topic] = wrappers;

          if (wrappers.length || callback || namespace) {

            callbacks = wrappers.length ? callbacks : this._callbacks;
            for (key in callbacks) {

              wrappers = callbacks[key].slice();
              for (index = 0, count = wrappers.length; index < count; index += 1) {

                if ((!topic     || key === topic) &&
                    (!callback  || wrappers[index].callback  === callback) &&
                    (!namespace || wrappers[index].namespace === namespace)) {

                  wrappers.splice(index, 1);
                  this._callbacks[key] = wrappers;
                  this.removeListener(original, callback);

                  break;
                }
              }
            }
          } else {
            delete this._callbacks[topic];
          }
        });
      } else {
        this._callbacks = {};
      }

      return this;
    }
  });

  /* Extend the constructors prototype with the same methods. */
  extend(Broadcast.prototype, Broadcast);

  /* Public: Removes Broadcast from the global scope (only applies to web
   * browsers). Useful if you want to implement Broadcast under another
   * libraries namespace.
   *
   * Examples
   *
   *   var MyFramework = {};
   *   MyFramework.Events = Broadcast.noConflict();
   *
   *   var events = new MyFramework.Events();
   *
   * Returns the Broadcast function.
   */
  Broadcast.noConflict = function () {
    module.Broadcast = _Broadcast;
    return Broadcast;
  };

  // Export the function to either the exports or global object depending
  // on the current environment.
  if (typeof module.define === 'function' && module.define.amd) {
    module.define('broadcast', function () {
      return Broadcast;
    });
  } else if (module.exports) {
    module.exports = Broadcast;
  } else {
    module.Broadcast = Broadcast;
  }

})(typeof module === 'object' ? module : this);
