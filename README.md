Broadcast.js
============

Broadcast provides simple pub/sub methods for use in your objects. It uses
`.subscribe()`, `.unsubscribe()` and `.publish()` (with `.subscribe()` aliased
to `.on()`).

Usage
-----

```javascript
var events = new Broadcast();

event.subscribe('change', function () {
    console.log('Something changed. No idea what though.');
});
event.publish('change'); // Message is logged to console.

event.unsubscribe('change');
event.publish('change'); // Silence...
```

### Options

Options can be passed into the constructor on creation.

 - `alias`: If `false` will not create the `.on()` alias.

Methods
-------

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

 - 0.2: Allow use of `Broadcast` as a singleton.
 - 0.3: Implement `"all"` topic as in [Backbone][#backbone]
 - 0.4: Implement topic namespaces.

[#backbone]: http://documentcloud.github.com/backbone/

License
-------

Released under the MIT license
