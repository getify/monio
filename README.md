# Monio

[![Build Status](https://travis-ci.org/getify/monio.svg?branch=master)](https://travis-ci.org/getify/monio)
[![npm Module](https://badge.fury.io/js/monio.svg)](https://www.npmjs.org/package/monio)
[![Coverage Status](https://coveralls.io/repos/github/getify/monio/badge.svg?branch=master)](https://coveralls.io/github/getify/monio?branch=master)

Monio (mō'ne-yo) is an async-capable IO Monad (including "do" style) for JS, with several companion monads thrown in.

## See Monio In Action

* [Cancelable Countdown (demo)](https://codepen.io/getify/pen/abvjRRK?editors=0011)

* [Order Lookup (demo)](https://codepen.io/getify/pen/YzyJqZa?editors=1010)

* [Cached Ajax (demo)](https://codepen.io/getify/pen/VwjyoMY?editors=0010)

* [Event Stream (demo)](https://codepen.io/getify/pen/WNrNYKx?editors=1011)

* [Event Stream: IOx Reactive Monad (demo)](https://codepen.io/getify/pen/Exwapga?editors=1011)

* [IOx Reactive Monad (demo)](https://codepen.io/getify/pen/XWeJxbq?editors=0010)

* [IOx Reactive Monad: Stream Operations (demo)](https://codepen.io/getify/pen/JjrNPdm?editors=0010)

## Overview

Monio balances the power of monads -- often dismissed by the non-FP programmer as academic and convoluted -- while pragmatically embracing the reality of the vast majority of JS programs: paradigm mixture (some OO, some FP, and probably a lot of imperative procedural code).

The driving inspiration behind Monio is the `IO` monad -- useful for managing side-effects -- that additionally supports "do-style" syntax with JS-ergonomic asynchrony (based on promises) in the style of familiar `async..await` code. IOs are lazy, so their operations are not triggered until the `run(..)` method is called.

Monio's `IO` is a transformer over promises, which means that when promises are produced in an IO, they are automatically unwrapped; of course, that means subsequent IO operations are deferred. If any IO in a chain produces a promise, `run(..)`'s result will be "lifted" to a promise that resolves when the entire IO chain is complete. Otherwise, the IO instance and its `run(..)` call will operate synchronously and immediately produce the result.

Monio intentionally chooses to model asynchrony over promises instead of Task monads, because of its goal of balancing FP with pragmatic and idomatic non-FP JS. However, there's nothing that should prevent you from using a Task monad with Monio if you prefer.

`IO`'s "do-style" syntax is specified with the `do(..)` method (automatically lifts the IO to promise-producing asynchrony), which accepts JS generators (including "async generators": `async function *whatever(){ .. }`). `yield` is used for chaining IOs (which can produce promises to defer), whereas `await` is for explicitly deferring on a promise that's not already wrapped in an IO. The resulting style of code should be more broadly approachable for JS developers, while still benefitting from monads.

`IO`'s `do(..)` is JS-ergonomic for exception handling. Uncaught JS exceptions become promise rejections, and IO-produced promise rejections are `try..catch`'able. `IO` also supports modeling exception handling through Either monads: `doEither(..)` transforms uncaught exceptions into *Either:Left* values, and recognizes IO-produced *Either:Left* values as `try..catch`'able exceptions.

Monio's `IO` is also a Reader monad, which carries side-effect read environments alongside IO operations.

### For the FP savvy

Monio's `IO` models a function `e => IO a (Promise b c)`, which is strong enough to capture (optional) environment passing, side effects, async, and error handling without the pain of composing each type separately.

Typically `IO` does not take an argument, but given one, it acts like an effectful `Reader`. In addition, it can model sync or async functions so the inner `Promise` becomes optional.

In that way, you can think of it as `ReaderT (IOT (Promise|Identity a b))` where `Promise` gets swapped for `Identity` if you're not doing async.

Monio's IO is like a JS-style ZIO/RIO where we have all the functionality we need wrapped up in 1 monad.

### Monio's Monads

Using an identity (`Just`) monad:

```js
var twentyOne = Just(21);

twentyOne
.chain(v => Just(v * 2))
._inspect();
// Just(42)
```

Using a `Maybe` monad:

```js
// `responseData` is an object

Maybe.from(responseData.message)

// this step is "safe" in that it's skipped
// if the `responseData.message` property
// is missing/empty and thus results in a
// Maybe:Nothing monad
.map(msg => msg.toUpperCase())

// using "foldable" behavior mixed in with
// the Maybe monad
.fold(
    () => console.log("Message missing!"),
    msg => console.log(`Message: ${msg}`)
);
```

IO represents monadic side effects wrapped as functions:

```js
var log = msg => IO(() => console.log(msg));
var uppercase = str => str.toUpperCase();
var greeting = msg => IO.of(msg);

// setup:
var HELLO = greeting("Hello!").map(uppercase);

// later:
HELLO
.chain(log)
.run();       // HELLO!
```

As opposed to manually `chain`ing IOs together, IO's friendlier "do-style" is expressed with `IO.do(..)`:

```js
var getData = url => IO(() => fetch(url).then(r => r.json()));
var renderMessage = msg => IO(() => (
    document.body.innerText = msg
));

// `IO.do(..)` accepts a generator to express "do-style"
// IO chains
IO.do(function *main(){
    // `yield` of an IO instance (like `await` with
    // promises in an `async..await` function) will
    // chain/unwrap the IO, asynchronously if neccessary
    var resp = yield getData("/some/data");

    yield renderMessage(resp.msg);

    // ..
})
.run();
```

IO supports carrying a reader environment through all IO chains (or do-blocks) by passing an argument to `run(..)`:

```js
var renderMessage = msg => IO(readerEnv => (
    readerEnv.messageEl.innerText = msg
));

IO.do(function *main(readerEnv){
    yield renderMessage("Hello, friend!");

    // ..
})
.run(/*readerEnv=*/{
    messageEl: document.getElementById("welcome-message")
});
```

Monio includes several other supporting monads/helpers in addition to `IO`:

* `Either`, as well as `AsyncEither` (basically, a `Future` monad, with the same promise-transforming behavior as IO)

* `AllIO` and `AnyIO` are IO monad variants -- specifically, concatable monoids -- whose `concat(..)` method makes them suitable to perform (short-circuited) `&&` and `||` operations, respectively, over the eventually-resolved values in the IO instances. For additional convenience, common FP utilities like `fold(..)` and `foldMap(..)` (included in Monio's `Util` module) abstract the `concat(..)` calls across such concatable moniod instances.

    For example:

    ```js
    var a = AllIO(() => true);
    var b = AllIO(() => true);
    var c = AllIO(() => false);

    a.concat(b).run();                    // true
    fold(a,b).run();                      // true

    a.concat(b).concat(c).run();          // false
    foldMap(v => v,[ a, b, c ]).run();    // false

    var d = AnyIO(() => true);
    var e = AnyIO(() => true);
    var f = AnyIO(() => false);

    d.concat(e).run();                    // true
    d.concat(e).concat(f).run();          // true
    ```

* `IOEventStream(..)`: creates an IO instance that produces an "event stream" -- an async-iterable that's consumable with a `for await..of` loop -- from an event emitter (ie, a DOM element, or a Node EventEmitter instance)

    For example:

    ```js
    var clicksIO = IOEventStream(btn,"click");

    clicksIO.chain(clicks => IO.do(async function *main(){
        // `clicks`` is a lazily-subscribed ES2018
        // async-iterator that will produce event
        // objects for each DOM click event on the
        // the button
        for await (let evt of clicks) {
            // ..
        }
    }))
    .run();
    ```

* `IOx` is a "reactive IO" monad variant, similar to a basic observable (or event stream). If an `IOx` (*B*) instance is subscribed to (i.e., observing/listening to) another `IOx` instance (*A*), and *A* updates its value, *B* is automatically notified and re-applied.

    For example:

    ```js
    var number = IOx.of(3);
    var doubled = number.map(v => v * 2);
    var tripled = number.map(v => v * 3);

    var log = (env,v) => console.log(`v: ${v}`);

    // subscribe to the `doubled` IOx
    var logDoubled = IOx(log,[ doubled ]);
    // subscribe to the `tripled` IOx
    var logTripled = IOx(log,[ tripled ]);

    // activate only the `logDoubled` IOx
    logDoubled.run();
    // v: 6

    // assign a different value into the `number` IOx
    number(7);
    // v: 14

    // now activate the `logTripled` IOx
    logTripled.run();
    // v: 21

    // assign another value into the `number` IOx
    number(10);
    // v: 20
    // v: 30
    ```

    And for handling typical event streams manually:

    ```js
    var clicksIOx = IOx.of.empty();

    // standard DOM event listener
    btn.addEventListener("click",evt => clicksIOx(evt),false);

    clicksIOx.chain(evt => {
        // .. click event! ..
    })
    .run();
    ```

    More preferably, using the included `IOx.onEvent(..)` helper:

    ```js
    var clicksIOx = IOx.onEvent(btn,"click",false);
    // or use `IOx.onceEvent(..)` for single-fire event handling

    clicksIOx.chain(evt => {
        // .. click event! ..
    })
    .run();
    ```

    IOx instances are IO instances (with extensions for reactivity). As such, they can be `yield`ed inside `IO.do(..)` do-blocks:

    ```js
    IO.do(function *main({ doc, }){
        // IOx event stream that represents the one-time
        // DOM-ready event
        var DOMReadyIOx = IOx.onceEvent(doc,"DOMContentLoaded",false);

        // listen (and wait!) for this one-time event to fire
        yield DOMReadyIOx;

        // ..
    })
    .run({ doc: document });
    ```

    `IOx.do(..)` is like `IO.do(..)`, except that it also accepts an optional second argument, an array of other IOx instances to subscribe to. The do-block will be re-invoked with each value update from any of the subscribed-to IOx instances:

    ```js
    var delay = ms => IO(() => new Promise(r => setTimeout(r,ms)));
    var toggleEl = el => IO(() => el.disabled = !el.disabled);
    var renderMessage = msg => IO(({ messageEl }) => (
        messageEl.innerText = msg
    ));

    function *onClick({ btn, },evt) {
        // disable button
        yield toggleEl(btn);

        // render a message
        yield renderMessage("Button clicked!");

        // wait a second
        yield delay(1000);

        // clear the message
        yield renderMessage("");

        // re-enable button
        yield toggleEl(btn);
    }

    IO.do(function *main({ btn, }){
        // lazily prepare to subscribe to click events
        //
        // (this IOx instance is not yet active unti`l
        // it's manually run, or subscribed to by another
        // IOx instance that *is* activated)
        var clicksIOx = IOx.onEvent(btn,"click",false);

        // for each click, re-evaluate the reactive do-block,
        // and pass along the received DOM event object as an
        // argument to the do-block
        //
        // (still not activated yet!)
        var handleClicksIOx = IOx.do(onClick,[ clicksIOx ]);
        // or:
        //    var handleClicksIOx = clicksIOx.chain(
        //       evt => IOx.do(onClick,[],evt)
        //    );

        // actually activates the click handling and the DOM
        // event subscription
        yield handleClicksIOx;
    })
    .run({
        messageEl: document.getElementById("my-message"),
        btn: document.getElementById("my-button")
    });
    ```

    Similar to RxJS observables, some basic stream operators/combinators are provided with IOx. Operators (`filterIn(..)`, `filterOut(..)`, `distinct(..)`, and `distinctUntilChanged(..)`) are passed to an IOx's `chain(..)` method. Combinators (`merge(..)` and `zip(..)`) are called standalone with an array of IOx instances to combine.

    For example:

    ```js
    var log = msg => IO(() => console.log(msg));

    IO.do(function *main({ btn, input }){
        // setup some event streams
        var clicksIOx = IOx.onEvent(btn,"click",false);
        var keypressesIOx = IOx.onEvent(input,"keypress",false);

        // use various stream operators
        var lettersIOx =
            keypressesIOx.map(evt => evt.key)
            .chain(
                IOx.filterIn(key => /[a-z]/i.test(key))
            );
        var uniqueLettersIOx = lettersIOx.chain( IOx.distinct() );
        var nonRepeatLettersIOx =
            lettersIOx.chain( IOx.distinctUntilChanged() );

        // zip two streams together
        var clickAndKeyIOx = IOx.zip([ clicksIOx, uniqueLettersIOx ]);

        // NOTE:
        // it's important to realize that everything up to this
        // point has just been lazily defined, with nothing
        // yet executed. the following statement actually
        // `yield`s to activate the ultimate IOx, which has the
        // cascading effect of activating all the above defined
        // IOx instances.

        // merge two streams together, and print whatever comes
        // through to the console
        yield (
            IOx
            .merge([ clickAndKeyIOx, nonRepeatLettersIOx ])
            .chain(log)
        );
    })
    .run({
        btn: document.getElementById("my-button"),
        input: document.getElementById("my-input"),
    });
    ```

    IOx reactive instances can temporarily be paused (using `stop()`), or permanently closed and cleaned up (using `close()`).

## Using Monio

To use monads/helpers from Monio, first import them:

* CJS programs/modules in Node:

   ```js
   var { Maybe, IO } = require("monio");

   // or:
   var Just = require("monio/just");
   ```

* ESM in Node:

   ```js
   import { Maybe, IO } from "monio";

   // or:
   import Just from "monio/just";
   ```

   **Note:** As of v0.20.0, the previously required ESM import specifier segment `/esm` in **Monio** `import` paths has been deprecated (and will eventually be removed), in favor of unified import specifier paths via [Node Conditional Exports](https://nodejs.org/api/packages.html#packages_conditional_exports). For ESM `import` statements, always use the specifier style `"monio"` or `"monio/just"`, instead of `"monio/esm"` and `"monio/esm/just"`, respectively.

* ESM in browser:

   ```js
   import { Maybe, IO } from "/path/to/monio/dist/esm/index.mjs";

   // or:
   import Just from "/path/to/monio/dist/esm/just.mjs";
   ```

* UMD in browser:

   ```html
   <script src="/path/to/monio/dist/umd/bundle.js"></script>

   <!-- or -->
   <script src="/path/to/monio/dist/umd/just.js"></script>
   ```

Once the monads are imported into your module/program, instances are created from functions (no `new` constructors necessary):

```js
var helloWorld = Just("Hello World");

helloWorld._inspect();
// Just("Hello World")

Just.is(helloWorld);
// true
```

Monio's monads can of course be used together in various expected ways:

```js
var helloWorld = Just("Hello World");
var greeting = Maybe(helloWorld);
var log = str => IO(() => console.log(str));

var main = IO.do(function *main(){
    var msg = greeting.map(m => `${ m }!!`);

    // Uncomment this line to swap in an empty maybe
    // msg = Maybe.from(null);

    yield msg.fold(IO.of,log);
});

main.run();
// Hello World!!
```

## Tests

A test suite is included in this repository, as well as the npm package distribution. The default test behavior runs the test suite using the files in `src/`.

1. The tests are run with QUnit.

2. To run the test utility with npm:

    ```
    npm test
    ```

### Test Coverage

[![Coverage Status](https://coveralls.io/repos/github/getify/monio/badge.svg?branch=master)](https://coveralls.io/github/getify/monio?branch=master)

If you have [NYC (Istanbul)](https://github.com/istanbuljs/nyc) already installed on your system (requires v14.1+), you can use it to check the test coverage:

```
npm run coverage
```

Then open up `coverage/lcov-report/index.html` in a browser to view the report.

**Note:** The npm script `coverage:report` is only intended for use by project maintainers. It sends coverage reports to [Coveralls](https://coveralls.io/).

## License

All code and documentation are (c) 2021 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/). A copy of the MIT License [is also included](LICENSE.txt).
