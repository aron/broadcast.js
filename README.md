Broadcast.js
============

Broadcast provides simple pub/sub methods for use in your objects. It uses
`.subscribe()`, `.unsubscribe()` and `.publish()` (with `.subscribe()` aliased
to `.on()`).

Usage
-----

Broadcast is designed to be used as a constructor to create new instances of
the object. However the `.subscribe()`, `.unsubscribe()` and `.publish()`
methods are available on the `Broadcast` object itself and can be used as a 
single global pub/sub object.

```javascript
var events = new Broadcast();

event.subscribe('change', function () {
  console.log('Something changed. No idea what though.');
});
event.publish('change'); // Message is logged to console.

event.unsubscribe('change');
event.publish('change'); // Silence...
```

Or alternatively using a single global object…

```javascript
Broadcast.subscribe('change', function () {
  console.log('Something changed. No idea what though.');
});
Broadcast.publish('change'); // Message is logged to console.

Broadcast.unsubscribe('change');
Broadcast.publish('change'); // Silence...
```

_NOTE: The method `.on()` is not available on the global object._

### Options

Options can be passed into the constructor on creation.

 - `alias`: If `false` will not create the `.on()` alias.

### Extending your own objects.

The simplest way to add Broadcast's methods to your objects is to extend them.

```javascript
var myObject = {};
for (var key in Broadcast) {
  if (Broadcast.hasOwnProperty(key)) {
    myObject[key] = Broadcast[key];
  }
}

// If you've been using Broadcast as a global object be sure to call
// .unsubscribe() to reset your new object.
myObject.unsubscribe();
```

A nicer if not more convoluted method is to use JavaScripts prototypal
inheritance.

```javascript
function MyObject() {
  // Call Broadcasts constructor.
  Broadcast.apply(this, arguments);
}

// Set your constructors prototype.
MyObject.prototype = new Broadcast();

// Redefine the overwritten construtor property.
MyObject.prototype.construtor = MyObject;
```

API
---

### .publish(topic [ , arguments... ])

Publishes a topic. Calls all registered callbacks passing in any
arguments provided after the topic string.

 - `topic`: A topic String to publish.
 - `arguments*`: All subsequent arguments will be passed into callbacks.

Returns itself for chaining.

#### Examples

```javascript
var events = new Broadcast();
events.subscribe('say', function (message) { console.log(message); });
events.publish('say', 'Hello World'); // Logs "Hello World"
```

### .subscribe(topic, callback) / .on(topic, callback)

Subscribe to a specific topic with a callback.

 - `topic`: A topic String or Object of topic/callback pairs.
 - `callback`: Callback Function to call when topic is published.

Returns itself for chaining.

#### Examples

```javascript
events.subscribe('create', function () {});
```

### .subscribe(topics) / .on(topics)

Subscribe to multiple topics.

- `topics`: An Object of topic/callback pairs.

Returns itself for chaining.

#### Examples

```javascript
events.subscribe({
  'update', function () {},
  'delete', function () {}
);
```

### .unsubscribe(topic [ , callback ])

Unbinds registered listeners for a topic. If no arguments are
passed all callbacks are removed. If a topic is provided only callbacks
for that topic are removed. If a topic and function are passed all
occurrences of that function are removed.

 - `topic`: A topic String to unsubscribe (optional).
 - `callback`: A specific callback Function to remove (optional).

Returns itself for chaining.

#### Examples

```javascript
var events = new Broadcast();

function A() {}

events.subscribe({
'create', A,
'create', function B() {},
'create', function C() {},
'update', function D() {},
'delete', function E() {}
);

events.unsubscribe('create', A); // Removes callback A.
events.unsubscribe('create'); // Removes callbacks for 'create' B & C.
events.unsubscribe(); // Removes all callbacks for all topics D & E.
```

### Broadcast.noConflict()

Removes Broadcast from the global scope (only applies to web
browsers). Useful if you want to implement Broadcast under another
libraries namespace.

Returns the Broadcast function.

#### Examples

```javascript
var MyFramework = {};
MyFramework.Events = Broadcast.noConflict();

var events = new MyFramework.Events();
```

Development
-----------

Tests are managed using the [Vows][#vows] framework for Node.js. It can be
installed by running the following.

    $ npm install -g vows

Tests can then be run with the following command.

    $ vows broadcast-test.js

[#vows]: http://vowsjs.org/

Roadmap
-------

 - 0.3: Implement `"all"` topic as in [Backbone][#backbone]
 - 0.4: Implement topic namespaces.

[#backbone]: http://documentcloud.github.com/backbone/

License
-------

Released under the MIT license
