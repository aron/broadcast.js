Broadcast.js
============

Broadcast provides simple pub/sub methods for use in your objects. It uses
the same event API as Node.js (`.addListener()`, `.removeListener()` and
`.emit()`). Broadcast also aliases `.addListener()` to `.on()` and `.emit()` to
`.trigger()` as I prefer them.

Usage
-----

Broadcast is designed to be used as a constructor to create new instances of
itself. However the `.addListener()`, `.removeListener()` and `.emit()`
methods are also available on the `Broadcast` function/object and can be used
as a  single global pub/sub object.

```javascript
var events = new Broadcast();

event.addListener('change', function () {
  console.log('Something changed. No idea what though.');
});
event.emit('change'); // Message is logged to console.

event.removeListener('change');
event.emit('change'); // Silence...
```

Or alternatively using a single global object…

```javascript
Broadcast.addListener('change', function () {
  console.log('Something changed. No idea what though.');
});
Broadcast.emit('change'); // Message is logged to console.

Broadcast.removeListener('change');
Broadcast.emit('change'); // Silence...
```

_NOTE: The methods `.on()` and `.trigger()` are not available on the global object._

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
// .removeListener() to reset your new object.
myObject.removeListener();
```

A nicer alternative is to use JavaScripts prototypal inheritance.

```javascript
function MyObject() {
  // Call Broadcasts constructor.
  Broadcast.apply(this, arguments);
}

// Set your constructors prototype.
MyObject.prototype = new Broadcast();

// Redefine the overwritten constructor property.
MyObject.prototype.construtor = MyObject;
```

API
---

### .emit(topic [ , arguments... ]) / .trigger(topic [ , arguments... ])

emites a topic. Calls all registered callbacks passing in any
arguments provided after the topic string.

 - `topic`: A topic String to emit.
 - `arguments*`: All subsequent arguments will be passed into callbacks.

Returns itself for chaining.

#### Examples

```javascript
var events = new Broadcast();
events.addListener('say', function (message) { console.log(message); });
events.emit('say', 'Hello World'); // Logs "Hello World"
```

### .addListener(topic, callback) / .on(topic, callback)

addListener to a specific topic with a callback.

 - `topic`: A topic String or Object of topic/callback pairs.
 - `callback`: Callback Function to call when topic is emited.

Returns itself for chaining.

#### Examples

```javascript
events.addListener('create', function () {});
```

There is also a special topic called __"all"__ that will fire when any other
topic is emited. It provides the name of the topic emited and any
additional arguments to registered callbacks. This feature was taken from the
JavaScript framework [Backbone.js][#backbone] where it is often used to proxy
calls through other objects.

#### Examples

```javascript
var model.events = new Broadcast();
var view.events  = new Broadcast();

view.events.addListener('changed', function (properties) {
  updateView(properties);
});

// Subscribe to the special "all" topic and rebroadcast through view.events.
model.events.addListener('all', function (topic) {
  view.events.emit.apply(view.events, arguments);
});
model.events.emit('changed', {name: 'Bill'});
```

[#backbone]: http://documentcloud.github.com/backbone/

### .addListener(topics) / .on(topics)

addListener to multiple topics. Returns itself for chaining.

- `topics`: An Object of topic/callback pairs.

#### Examples

```javascript
events.addListener({
  'update', function () {},
  'delete', function () {}
);
```

### .removeListener(topic [ , callback ])

Unbinds registered listeners for a topic. If no arguments are
passed all callbacks are removed. If a topic is provided only callbacks
for that topic are removed. If a topic and function are passed all
occurrences of that function are removed. Returns itself for chaining.

 - `topic`: A topic String to removeListener (optional).
 - `callback`: A specific callback Function to remove (optional).

#### Examples

```javascript
var events = new Broadcast();

function A() {}

events.addListener({
  'create', A,
  'create', function B() {},
  'create', function C() {},
  'update', function D() {},
  'delete', function E() {}
);

events.removeListener('create', A); // Removes callback A.
events.removeListener('create'); // Removes callbacks for 'create' B & C.
events.removeListener(); // Removes all callbacks for all topics D & E.
```

### Broadcast.noConflict()

Removes Broadcast from the global scope (only applies to web
browsers). Useful if you want to implement Broadcast under another
libraries namespace. Returns the Broadcast function.

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

 - 0.5: Implement topic namespaces.

License
-------

Released under the MIT license
