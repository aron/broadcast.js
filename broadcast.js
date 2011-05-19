/*  Broadcast.js - v0.1
 *  Copyright 2011, Aron Carroll
 *  Released under the MIT license
 *  More Information: http://github.com/aron/broadcast.js
 */
(function (exports, undefined) {

  // Retain a reference to the original property.
  var _Broadcast = exports.Broadcast;

  /* Public: Creates an instance of Broadcast.
   *
   * options - An Object literal containing setup options.
   *           alias: If false will not assign the .on() alias.
   *
   * Examples
   *
   *   // In the browser.
   *   var events = new Broadcast();
   *   vents.subscribe('say', function (message) { console.log(message); });
   *   events.publish('say', 'Hello World'); // Logs "Hello World"
   *
   *   // On the server.
   *   var Broadcast = require('broadcast').Broadcast;
   *   var events = new Broadcast();
   *
   * Returns a new instance of Broadcast.
   */
  function Broadcast(options) {
    this._callbacks = {};
    if (!options || options.alias === true) {
      this.on = this.subscribe;
    }
  }

  Broadcast.prototype = {
    /* Redefine the constructor */
    constructor: Broadcast,

    /* Object used to store registered callbacks. An instance specific property
     * is created in the constructor.
     */
    _callbacks: {},

    /* Public: Publishes a topic. Calls all registered callbacks passing in any
     * arguments provided after the topic string.
     *
     * topic      - A topic String to publish.
     * arguments* - All subsequent arguments will be passed into callbacks.
     *
     * Examples
     *
     *   var events = new Broadcast();
     *   events.subscribe('say', function (message) { console.log(message); });
     *   events.publish('say', 'Hello World'); // Logs "Hello World"
     *
     * Returns itself for chaining.
     */
    publish: function (topic /* , arguments... */) {
      var callbacks = this._callbacks[topic] || [],
          index = 0, count = callbacks.length;

      for (; index < count; index += 1) {
        callbacks[index].apply(this, Array.prototype.slice.call(arguments, 1));
      }

      return this;
    },

    /* Public: Subscribe to a specific topic with a callback. This method also
     * accepts a single object containing topic/callback pairs as an argument.
     *
     * topic    - A topic String or Object of topic/callback pairs.
     * callback - Callback Function to call when topic is published.
     *
     * Examples
     *
     *   var events = new Broadcast();
     *
     *   // Register single callback.
     *   events.subscribe('create', function () {});
     *
     *   // Register multiple callbacks.
     *   events.subscribe({
     *     'update', function () {},
     *     'delete', function () {}
     *   );
     *
     * Returns itself for chaining.
     */
    subscribe: function (topic, callback) {
      if (arguments.length === 1) {
        for (var key in topic) {
          if (topic.hasOwnProperty(key)) {
            this.subscribe(key, topic[key]);
          }
        }
      } else {
        if (!this._callbacks[topic]) {
          this._callbacks[topic] = [];
        }
        this._callbacks[topic].push(callback);
      }

      return this;
    },

    /* Public: Unbinds registered listeners for a topic. If no arguments are
     * passed all callbacks are removed. If a topic is provided only callbacks
     * for that topic are removed. If a topic and function are passed all
     * occurrences of that function are removed.
     *
     * topic    - A topic String to unsubscribe (optional).
     * callback - A specific callback Function to remove (optional).
     *
     * Examples
     *
     *   var events = new Broadcast();
     *
     *   function A() {}
     *
     *   events.subscribe({
     *     'create', A,
     *     'create', function B() {},
     *     'create', function C() {},
     *     'update', function D() {},
     *     'delete', function E() {}
     *   );
     *
     *   events.unsubscribe('create', A); // Removes callback A.
     *   events.unsubscribe('create'); // Removes callbacks for 'create' B & C.
     *   events.unsubscribe(); // Removes all callbacks for all topics D & E.
     *
     * Returns itself for chaining.
     */
    unsubscribe: function (topic, callback) {
      var callbacks = (this._callbacks[topic] || []).slice(),
          index, count;

      if (arguments.length) {
        if (callbacks.length && callback) {
          for (index = 0, count = callbacks.length; index < count; index += 1) {
            if (callbacks[index] === callback) {
              callbacks.splice(index, 1);
              this._callbacks[topic] = callbacks;
              this.unsubscribe(topic, callback);
              break;
            }
          }
        } else {
          delete this._callbacks[topic];
        }
      } else {
        this._callbacks = {};
      }

      return this;
    }
  };

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
    exports.Broadcast = _Broadcast;
    return Broadcast;
  };

  // Export the function to either the exports or global object depending
  // on the current environment.
  exports.Broadcast = Broadcast;

})(this.exports || this);
