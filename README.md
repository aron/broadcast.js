Broadcast.js
============

Broadcast provides simple pub/sub methods for use in your objects. It uses
the same event API as Node.js (`.addListener()`, `.removeListener()` and
`.emit()`). Broadcast also aliases `.addListener()` to `.on()` and `.emit()` to
`.fire()` as I prefer them.

Usage
-----

Broadcast is designed to be used as a constructor to create new instances of
itself. However the `.addListener()`, `.removeListener()` and `.emit()`
methods are also available on the `Broadcast` function/object and can be used
as a  single global pub/sub object.

```javascript
var events = new Broadcast();

events.addListener('change', function () {
  console.log('Something changed. No idea what though.');
});
events.emit('change'); // Message is logged to console.

events.removeListener('change');
events.emit('change'); // Silence...
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

_NOTE: The methods `.on()` and `.fire()` are not available on the global object._

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

### .emit(topic [ , arguments... ]) / .fire(topic [ , arguments... ])

Emits a topic. Calls all registered callbacks passing in any
arguments provided after the topic string.

It is also possible to trigger only events bound under a specific
namespace by appending it to the topic name.

 - `topic`: A topic String to emit.
 - `arguments*`: All subsequent arguments will be passed into callbacks.

Returns itself for chaining.

#### Examples

```javascript
var events = new Broadcast();
events.addListener('say', function (message) { console.log(message); });
events.emit('say', 'Hello World'); // Logs "Hello World"

events.addListener('say.ns', function (message) { console.log(message); });
events.emit('say.ns', 'Namespaced'); // Logs only "Namespaced"
```

### .addListener(topic, callback [, context]) / .on(topic, callback [, context])

Subscribe to a specific topic with a callback. A single callback can also
subscribe to many topics by providing a space delimited string of topic names.
Finally the method also accepts a single object containing topic/callback pairs
as an argument. See below for details.

 - `topic`: A topic String or Object of topic/callback pairs.
 - `callback`: Callback Function to call when topic is emitted.
 - `context`: Context (this) to be used when calling the callback.

Returns itself for chaining.

#### Examples

```javascript
var events = new Broadcast();

// Register single callback.
events.addListener('create', function () {});

// Register a callback with a context object.
var context = {a: 1, b: 2, c: 3};
events.addListener('change', function () {
  console.log(this === context); #=> true
}, context);

// Register a single callback to multiple topics.
events.addListener('create update delete', function () {});
```

Events can also be name-spaced ala jQuery to allow easy removal of multiple
callbacks in one call to .removeListener(). To namespace a callback simply
suffix the topic with a period (.) followed by your namespace.

#### Examples

```javascript
var events = new Broadcast();

// Bind some events with a custom namespace.
events.addListener('create.list-view update.list-view', function () {});
events.addListener('delete.list-view', function () {});

// All events under the namespace are now unbound.
events.removeListener('.list-view');
```

There is also a special topic called __"all"__ that will fire when any other
topic is emitted. It provides the name of the topic emitted and any
additional arguments to registered callbacks. This feature was taken from the
JavaScript framework [Backbone.js][#backbone] where it is often used to proxy
calls through other objects.

#### Examples

```javascript
model.events = new Broadcast();
view.events  = new Broadcast();

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

### .addListener(topics [, context]) / .on(topics [, context])

addListener to multiple topics. Returns itself for chaining.

- `topics`: An Object of topic/callback pairs.
- `context`: An optional object to use as the context for all callbacks.

#### Examples

```javascript
var events = new Broadcast();

events.addListener({
  'create update', function () {},
  'delete', function () {}
);

var context = {a: 1, b: 2, c: 3};
events.addListener({
  change: function () {
    console.log(context === this); #=> true
  },
  update: function () {
    console.log(context === this); #=> true
  }
}, context);
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

events.addListener('create', A);
events.addListener('create', function B() {});
events.addListener({
  'create', function C() {},
  'update', function D() {},
  'delete', function E() {}
);
events.addListener('custom.my-namespace', function F() {});

events.removeListener('create', A); // Removes callback (A).
events.removeListener('create'); // Removes callbacks for 'create' (B & C).
events.removeListener('.my-namespace'); // Removes callbacks for '.my-namespace' (F).
events.removeListener(); // Removes all callbacks for all topics (D & E).
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

Use in Other Environments
-------------------------

Usage with Node:

```javascript
var Broadcast  = require('broadcast');
var events     = new Broadcast();
```

Usage with AMD compatible script loader (eg. require.js or curl.js):

```javascript
define(['broadcast'], function (Broadcast) {
  var events = new Broadcast();
});
```

Development
-----------

Tests are managed using the [Vows][#vows] framework for Node.js. It can be
installed by running the following.

    $ npm install -g vows

Tests can then be run with the following command.

    $ vows broadcast-test.js

[#vows]: http://vowsjs.org/

License
-------

Released under the MIT license
