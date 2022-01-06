# Monio

[![Build Status](https://travis-ci.org/getify/monio.svg?branch=master)](https://travis-ci.org/getify/monio)
[![npm Module](https://badge.fury.io/js/monio.svg)](https://www.npmjs.org/package/monio)
[![Coverage Status](https://coveralls.io/repos/github/getify/monio/badge.svg?branch=master)](https://coveralls.io/github/getify/monio?branch=master)

Monio (mō'ne-yo) is an async-capable IO Monad (including "do" style) for JS, with several companion monads thrown in.

## See Monio In Action

To see how writing **Monio**-based code looks and feels, especially the use of IO/IOx and all its variations, check out these live demos. There's a variety of different approaches/styles demonstrated, which illustrate the flexibility **Monio**'s monads offer.

* [Cancelable Countdown (demo)](https://codepen.io/getify/pen/abvjRRK?editors=0011)

* [Order Lookup (demo)](https://codepen.io/getify/pen/YzyJqZa?editors=1010)

* [Cached Ajax (demo)](https://codepen.io/getify/pen/VwjyoMY?editors=0010)

* [Event Stream (demo)](https://codepen.io/getify/pen/WNrNYKx?editors=1011)

* [Event Stream: IOx Reactive Monad (demo)](https://codepen.io/getify/pen/Exwapga?editors=1011)

* [IOx Reactive Monad (demo)](https://codepen.io/getify/pen/XWeJxbq?editors=0010)

* [IOx Reactive Monad: Stream Operations (demo)](https://codepen.io/getify/pen/JjrNPdm?editors=0010)

* [IOx Countdown Timer (demo)](https://codepen.io/getify/pen/MWErobj?editors=0012) and [IOx Countdown Timer Alternative (demo)](https://codepen.io/getify/pen/abLKeKy?editors=0012)

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

* `IOx` is a "reactive IO" monad variant, which is both a conforming IO and also similar to a basic observable (or event stream). If an `IOx` (*B*) instance is subscribed to (i.e., observing/listening to) another `IOx` instance (*A*), and *A* updates its value, *B* is automatically notified and re-applied.

    The `IOx(..)` constructor is like the `IO(..)` constructor -- both expect an effect function as the first argument -- except that `IOx(..)` also expects a second argument: an array of dependencies -- typically, one or more IOx instances, but can also be regular IO instances, or even non-IO values like `42` or `Just("ok")`.

    The effect function (for both `IO(..)` and `IOx(..)`) always receives the reader-env value (the value passed to `run(..)`) as its first argument. For IOx instances, the effect function will then also receive, as additional positional arguments, the resolved value(s) of its listed dependencies.

    For example:

    ```js
    var number = IOx.of(3);
    var doubled = number.map(v => v * 2);
    var tripled = number.map(v => v * 3);

    // `log(..)` here is an effect function to pass to the
    // `IOx(..)` constructor; it receives both the
    // reader-env argument and the `v`, which will be the
    // subscribed-to value of the IOx instance's dependency
    var log = (env,v) => console.log(`v: ${v}`);

    // the `IO(..)` constructor here also takes an effect
    // function, which receives only the reader-env argument
    var logIO = v => IO(env => log(env,v));

    // subscribe to the `doubled` IOx
    var logDoubled = IOx(log,[ doubled ]);

    // an alternate way to "subscribe" is to `chain(..)`:
    var logTripled = tripled.chain(logIO);

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

    As shown, successive calls to the IOx instance (itself a function), like `number(7)` above, will "update" the value in the IOx instance, which has the effect of pushing that value out through the stream to any subscribed IOx instances.

    Generally, IO and IOx instances are interchangeable in that most places which expect an IO can receive an IOx, and vice versa. However, there are times when you will need to explicitly convert (aka, lift) from one to the other. These conversions are *natural transformations* in FP-speak.

    For example, you *can* `chain(..)` an IOx instance from an IO (since IOx is a valid IO), but even though this is possible, it probably won't have the desired outcome; the outer resulting chain will still be a single-value IO instance (i.e., whatever the first value eventually is from the IOx). To explicitly convert an IO to an IOx, use `IOx.fromIO(..)`:

    ```js
    var getElementById = id => IO(() => document.getElementById(id));

    var thisIsAnIONotAnIOx =
        getElementById("my-btn")
        .chain(makeSomeIOx);

    var butThisIsAnIOx =
        IOx.fromIO( getElementById("my-btn") )
        .chain(makeSomeIOx);
    ```

    Less often, you need to explicitly convert in the other direction (IOx to IO); use `IO.fromIOx(..)` in those specific cases.

    IOx streams can also be constructed from (i.e., filled with values from) both sync and async iterables, using `IOx.fromIter(..)`. Iterable-based IOx streams are one-time sources of values; once they've been iterated, they won't produce those values again.

    By default, iterable-based IOx streams will close once they've produced their values. However, `fromIter(..)` takes an optional second boolean argument; pass `false` to keep the stream open after its initial iteration is complete. This allows the stream to be updated with additional values later.

    For example:

    ```js
    const log = IOHelpers.log;

    var range = IOx.fromIter( [ 1, 2, 3, 4, 5 ], /*closeOnComplete=*/false );

    range.chain(log).run();
    // 1 2 3 4 5

    range(6);
    // 6

    var asyncOdds = IOx.fromIter(async function *asyncOdds(){
        for (let i = 1; i < 1000; i += 2) {
            yield i;
            await (new Promise(r => setTimeout(r,500)));
        }
    });

    asyncOdds.chain(log).run();
    // 1 .. 3 .. 5 ..... 999
    ```

    **Note:** Generators or async-generators passed as iterable sources to `fromIter(..)` are **not** treated as do-routines the way `IO.do(..)` / `IOx.do(..)` operate. Standard generators are synchronously iterated as sources of `yield`ed values, and async generators are asynchronously iterated as sources of `yield`ed values.

    You can construct an async-iterable (suitable to consume with a `for await..of` loop) from any IOx stream using `toIter(..)`. Note that regardless of what type of IOx instance is provided, the returned iterable is always **async-iterable**, not a normal synchronous iterable; a standard `for..of` loop will fail.

    `toIter(..)` takes any IOx instance as its first argument, and the second (optional) argument should be the reader-env (if any) to provide the IOx (if it hasn't already run):

    ```js
    var counter = 0;
    var numbers = IOx.of.empty();

    var intv = setInterval(function(){
        numbers(++counter);

        // be careful not to run forever, unless
        // that's intentional!
        if (counter === 100) {
            clearInterval(intv);
            numbers.close();
        }
    },100);

    // will run as long as the `numbers` IOx is still
    // open
    for await (let num of toIter(numbers,/*readerEnv=*/undefined)) {
        console.log(`num: ${num}`);
    }
    // num: 1
    // num: 2
    // ...
    // num: 100
    ```

    Be aware that if the IOx stays open, the `for await..of` loop that's consuming the async-iterator will keep waiting forever. To stop the iteration, you'll need to either directly `close()` the subscribed-to IOx instance (as shown above), manually `break` / `return` out of the `for await..of` loop, or forcibly close the async-iterator instance itself by calling `return(..)` on it.

    Timer-based IOx streams can be created with `IOx.onTimer(..)`, such as:

    ```js
    const log = IOHelpers.log;
    const waitFor = IOxHelpers.waitFor;

    var onlyOneSecond = IOx.onTimer( /*timeDelayMs=*/1000, /*countLimint=*/1 );
    // note: if you omit the second argument, the
    // timer will keep running at the specified
    // time-delay interval indefinitely, until
    // the IOx instance is closed

    waitFor(onlyOneSecond)
    .chain(timerTick => log("one second passed!"))
    .run();
    ```

    **Note:** Timer-based IOx instances don't default to waiting for the timer to fire once initiating it, because you may just want to start a timer in the background and not actually wait for it in that same expression (e.g., `onlyOneSecond.run()`). As such, this example additionally illustrates the helpfulness of the IOx-Helper `waitFor(..)`, which wraps the `onlyOneSecond` in another IOx instance that will indeed wait for the timer to fire.

    And for handling typical event streams, manually (from a standard DOM event listener):

    ```js
    var clicksIOx = IOx.of.empty();

    // standard DOM event listener
    btn.addEventListener("click",clicksIOx,false);

    clicksIOx.chain(evt => {
        // .. click event! ..
    })
    .run();
    ```

    **Note:** Unlike the previous `onTimer(..)` example, because `clicksIOx` here is initially an empty IOx, the `chain(..)` call **will** wait for the first value to be pushed through the IOx stream (when the `"click"` event occurs on the button).

    But more preferably/canonically, events can be subscribed as IOx streams using the included `IOx.onEvent(..)` / `IOx.onceEvent(..)` helpers:

    ```js
    const waitFor = IOxHelpers.waitFor;

    var clicksIOx = IOx.onEvent(btn,"click",false);
    // or use `IOx.onceEvent(..)` for single-fire event handling

    waitFor(clicksIOx).chain(evt => {
        // .. click event! ..
    })
    .run();
    ```

    **Note:** As with timer-based IOx instances (described earlier), event-based IOx instances (from `IOx.onEvent(..)` or `IOx.onceEvent(..)`) don't default to waiting for the event they've just subscribed to. The `waitFor(..)` helper is again helpful to wait for the actual event.

    IOx instances are conforming IO instances (with extensions for reactivity). As such, they can be `chain(..)`ed from IOs, or `yield`ed inside `IO.do(..)` do-blocks:

    ```js
    const waitFor = IOxHelpers.waitFor;

    IO.do(function *main({ doc, }){
        // IOx event stream that represents the one-time
        // DOM-ready event
        var DOMReadyIOx = IOx.onceEvent(doc,"DOMContentLoaded",false);

        // listen (and wait!) for this one-time event to fire
        yield waitFor(DOMReadyIOx);

        // ..
    })
    .run({ doc: document });
    ```

    **Note:** `yield DOMReadyIOx` above would be a valid expression in the do-routine, as would `yield`ing any IOx instance. But as previously described, such an expression wouldn't actually wait for the event. Again, the `waitFor(..)` helper waits for the `"DOMContentLoaded"` event to actually fire.

    `IOx.do(..)` is like IO's `IO.do(..)`, except that -- just like the `IOx(..)` constructor -- it expects a second argument: an array of other IOx instances to subscribe to. Since `IOx.do(..)` creates an IOx instance, its do-block will be re-invoked with each value update from any of the subscribed-to IOx instances:

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
        //       evt => IO.do(onClick,evt)
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
    var { log } = IOHelpers;
    var { distinct, distinctUntilChained, filterIn, zip, merge } = IOxHelpers;
    var log = msg => IO(() => console.log(msg));

    IO.do(function *main({ btn, input }){
        // setup some event streams
        var clicksIOx = IOx.onEvent(btn,"click",false);
        var keypressesIOx = IOx.onEvent(input,"keypress",false);

        // use various stream operators
        var lettersIOx =
            keypressesIOx.map(evt => evt.key)
            .chain(
                filterIn(key => /[a-z]/i.test(key))
            );
        var uniqueLettersIOx = lettersIOx.chain( distinct() );
        var nonRepeatLettersIOx =
            lettersIOx.chain( distinctUntilChanged() );

        // zip two streams together
        var clickAndKeyIOx = zip([ clicksIOx, uniqueLettersIOx ]);

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
            merge([ clickAndKeyIOx, nonRepeatLettersIOx ])
            .chain(log)
        );
    })
    .run({
        btn: document.getElementById("my-button"),
        input: document.getElementById("my-input"),
    });
    ```

    IOx reactive instances can temporarily be paused (using `stop()`), or permanently closed and cleaned up (using `close()`). They can also be "frozen" (still open, but no more values allowed) with `freeze()`. `isClosed()` and `isFrozen()` indicate the current status of the IOx stream.

## Using Monio

To use monads/helpers from Monio, `require(..)` or `import ..` them [by name](#importrequire-paths-for-monio-entities):

* CJS programs/modules in Node (requires Node v12+):

    ```js
    var { Maybe, IO } = require("monio");

    // or:
    var Just = require("monio/just");
    ```

* ESM in Node (requires Node v14+):

    ```js
    import { Maybe, IO } from "monio";

    // or:
    import Just from "monio/just";
    ```

    **Note:** As of v0.32.0, the previously deprecated ESM import specifier segment `/esm` in **Monio** `import` paths has been removed, in favor of unified import specifier paths via [Node Conditional Exports](https://nodejs.org/api/packages.html#packages_conditional_exports). For ESM `import` statements, use the specifier style `"monio"` or `"monio/just"`.

* <a name="esm-in-browser">ESM in browser</a> (requires browser with ES6+ support):

    ```js
    import { Maybe, IO } from "/path/to/monio/dist/esm/index.mjs";

    // or:
    import Just from "/path/to/monio/dist/esm/just.mjs";
    ```

    It's clearly unfortunate/inconvenient to have to specify URL paths (including filename extensions!) to `import` Monio entities when using ESM-format in the browser. This is an artifact of how browsers currently support ESM.

    The current best-option work-around is to use an [Import-Map](https://github.com/WICG/import-maps) (*if your [target browser environment supports them](https://caniuse.com/import-maps)*) on your site to create friendlier `import`-path names that the browser then maps to the required URL paths.

    To use an Import-Map, include an inline `<script type="importmap">..</script>` block in each HTML page of your site, with the Import-Map JSON contents inside the block.

    If you'd like to use **Monio** ESM-format in the browser with the same friendly `import` names that are available for Node `import` / `require`, and if Import-Maps [are supported](https://caniuse.com/import-maps) in your target browser environment, you can start with the contents of the provided `dist/esm/import-map-template.json` file

    ```html
    <!-- your HTML page -->

    <script type="importmap">
    {
      "imports": {
        "monio": "/monio/index.mjs",
        "monio/just": "/monio/just.mjs",
        "monio/nothing": "/monio/nothing.mjs",
        // ..
        "monio/util": "/monio/lib/util.mjs"
     }
    }
    </script>

    <!-- your HTML page -->
    ```

    As you can see in the above snippet, the assumed paths in this template file all expect **Monio**'s `dist/esm` directory to be deployed at the root of your site as `/monio/*`. Adjust those paths as necessary to match your site's deployment structure.

    * **Important Note:**

        Whether you use an Import-Map (as just described) or not, since ESM-format files are not bundled together, but loaded separately, the `dist/esm` files internally use relative `import` paths that reference each other. This directory/filename structure *must be preserved* for ESM-format **Monio** to operate in the browser as distributed. As such, make sure the entire contents of the `dist/esm` directory are deployed to your site exactly as provided.

        If that is not possible, you may use an [Import-Map](https://github.com/WICG/import-maps) (*if your [target browser environment supports them](https://caniuse.com/import-maps)*) to adapt the original relative ESM `import` paths to a different deployment structure and/or file-naming. You could also use [Import-Remap](https://github.com/getify/import-remap) to force-rewrite the `import` paths to different values.

* UMD in browser (requires browser with ES5+ support):

   ```html
   <script src="/path/to/monio/dist/umd/bundle.js"></script>

   <!-- or -->
   <script src="/path/to/monio/dist/umd/just.js"></script>
   ```

   The UMD `bundle.js` file alone is sufficient for **Monio** deployment if using the UMD format. Rename that `bundle.js` file (e.g., `monio.js`) and deploy wherever is appropriate in your site. You *could* deploy and load the individual UMD files if you prefer, but it's generally easier and more efficient to use the single bundle file.

Once **Monio** monads are imported into your module/program, instances are created from functions (no `new` constructors necessary):

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

### Import/Require Paths For Monio Entities

**Note:** For ESM-format usage in the browser, URL paths (with filename extensions!) or Import-Maps are required. To use the friendlier ESM-Node/CJS names while in the browser, an Import-Map is required. [See above](#user-content-esm-in-browser) for explanation.

Here are the individual `import` / `require` named-entity paths:

* **Monio** Index/Namespace (includes all named top-level entities): `"monio"`

    ESM (Node): `import * as Monio from "monio"`

    ESM (Node): `import { Just, Maybe, IO } from "monio"`

    ESM (Browser): `import * as Monio from "/path/to/monio/dist/esm/index.mjs"`

    ESM (Browser): `import { Just, Maybe, IO } from "/path/to/monio/dist/esm/index.mjs"`

    CJS: `const Monio = require("monio")`

    CJS: `const { Just, Maybe, IO } = require("monio")`

* `Just`: `"monio/just"`

    ESM (Node): `import Just from "monio/just"`

    ESM (Browser): `import Just from "/path/to/monio/dist/esm/just.mjs"`

    CJS: `const Just = require("monio/just")`

* `Nothing`: `"monio/nothing"`

    ESM (Node): `import Nothing from "monio/nothing"`

    ESM (Browser): `import Nothing from "/path/to/monio/dist/esm/nothing.mjs"`

    CJS: `const Nothing = require("monio/nothing")`

* `Maybe`: `"monio/maybe"`

    ESM (Node): `import Maybe from "monio/maybe"`

    ESM (Node): `import Maybe from "/path/to/monio/dist/esm/maybe.mjs"`

    CJS: `const Maybe = require("monio/maybe")`

* `Either`: `"monio/either"`

    ESM (Node): `import Either from "monio/either"`

    ESM (Node): `import Either from "/path/to/monio/dist/esm/either.mjs"`

    CJS: `const Either = require("monio/either")`

* `AsyncEither`: `"monio/async-either"`

    ESM (Node): `import AsyncEither from "monio/async-either"`

    ESM (Browser): `import AsyncEither from "/path/to/monio/dist/esm/async-either.mjs"`

    CJS: `const AsyncEither = require("monio/async-either")`

* `IO`: `"monio/io"`

    ESM (Node): `import IO from "monio/io"`

    ESM (Browser): `import IO from "/path/to/monio/dist/esm/io/io.mjs"`

    CJS: `const IO = require("monio/io")`

* `IOx`: `"monio/iox"` or `"monio/io/x"`

    ESM (Node): `import IOx from "monio/iox"`

    ESM (Browser): `import IOx from "/path/to/monio/dist/esm/io/iox.mjs"`

    CJS: `const IOx = require("monio/iox")`

* `AnyIO`: `"monio/io/any"`

    ESM (Node): `import AnyIO from "monio/io/any"`

    ESM (Browser): `import AnyIO from "/path/to/monio/dist/esm/io/any.mjs"`

    CJS: `const AnyIO = require("monio/io/any")`

* `AllIO`: `"monio/io/all"`

    ESM (Node): `import AllIO from "monio/io/all"`

    ESM (Browser): `import AllIO from "/path/to/monio/dist/esm/io/all.mjs"`

    CJS: `const AllIO = require("monio/io/ll")`

* `IOHelpers` (named helpers for `IO`): `"monio/io/helpers"`

    ESM (Node): `import * as IOHelpers from "monio/io/helpers"`

    ESM (Node): `import { waitAll, match, applyIO } from "monio/io/helpers"`

    ESM (Browser): `import * as IOHelpers from "/path/to/monio/dist/esm/io/helpers.mjs"`

    ESM (Browser): `import { waitAll, match, applyIO } from "/path/to/monio/dist/esm/io/helpers.mjs"`

    CJS: `const IOHelpers = require("monio/io/helpers")`

    CJS: `const { waitAll, match, applyIO } = require("monio/io/helpers")`

* `IOxHelpers` (named helpers for `IOx`): `"monio/iox/helpers"` or `"monio/io/x-helpers"`

    ESM (Node): `import * as IOxHelpers from "monio/iox/helpers"`

    ESM (Node): `import { filterIn, distinct, waitFor } from "monio/iox/helpers"`

    ESM (Node): `import * as IOxHelpers from "/path/to/monio/dist/esm/io/x-helpers.mjs"`

    ESM (Node): `import { filterIn, distinct, waitFor } from "/path/to/monio/dist/esm/io/x-helpers.mjs"`

    CJS: `const IOHelpers = require("monio/iox/helpers")`

    CJS: `const { filterIn, distinct, waitFor } = require("monio/iox/helpers")`

* `MonioUtil` (helper utils for Monio): `"monio/util"`

    ESM (Node): `import * as MonioUtil from "monio/util"`

    ESM (Node): `import { curry, fold } from "monio/util"`

    ESM (Browser): `import * as MonioUtil from "/path/to/monio/dist/esm/lib/util.mjs"`

    ESM (Browser): `import { curry, fold } from "/path/to/monio/dist/esm/lib/util.mjs"`

    CJS: `const MonioUtil = require("monio/util")`

    CJS: `const { curry, fold } = require("monio/util")`

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

All code and documentation are (c) 2022 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/). A copy of the MIT License [is also included](LICENSE.txt).
