# Monio's Monads

## Base Monads

**[More background information on the `Just` monad](MONADS.md#building-up-monads)**

Using an identity (`Just`) monad:

```js
var twentyOne = Just(21);

twentyOne
.chain(v => Just(v * 2))
._inspect();
// Just(42)
```

**[More background information on the `Maybe` monad](MONADS.md#maybe-something-more)**

Using a `Maybe` monad, which can either represent a `Just` or a `Nothing` depending on if the value is "empty"; by default, JS primitives `null` and `undefined` are defined as "empty", but this can be configured.

For example:

```js
// `responseData` is an object (from somewhere!)

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

The `Either` monad type is similar to `Maybe`, in that it has two possible representations: `Left` and `Right`. `Either` is typically used for modeling exception handling, where the `Left` representation is an exception, and `Right` represents a succesful operation/value. This sort of exception/success duality may be familiar to those who understand JS promises.

For example:

```js
// note: like Maybe, the Either monad is also "foldable"
var msg = Either.fromFoldable(
    Maybe.from(responseData.message)
);

msg.fold(
    emptyVal => console.log("Error: ")
);
```

In addition to `Either`, **Monio** provides `AsyncEither`, which is basically, a `Future` monad, with the same opaque promise-transforming behavior as [IO](#io-monad-one-monad-to-rule-them-all).

### `pipe(..)`

All monads in **Monio** have a `.pipe(..)` method exposed as a sub-property method on some of their API methods; these `.pipe(..)` helpers provide convenience (and optimization) over making equivalent multiple subsequent top-level method calls.

Here's an illustration of `map.pipe(..)`:

```js
const inc = v => v + 1;
const multBy2 = v => v * 2;
const multBy3 = v => v * 3;

// instead of:
var answer =
    Just(6)
    .map(inc)
    .map(multBy2)
    .map(multBy3);      // Just(42)

// you can do:
var answer =
    Just(6)
    .map.pipe(
        inc,
        multBy2,
        multBy3
    );                  // Just(42)
```

And here's `chain.pipe(..)` in action:

```js
const safeProp = propName => obj => Maybe.from(obj[propName]);

// instead of:
var cityM =
    Maybe.from(someData)
    .chain( safeProp("shipping") )
    .chain( safeProp("address") )
    .chain( safeProp("city") );

// you can do:
var cityM =
    Maybe.from(someData)
    .chain.pipe(
        safeProp("shipping"),
        safeProp("address"),
        safeProp("city")
    );
```

In addition to all of **Monio**'s monads providing `map.pipe(..)` and `chain.pipe(..)`, the monads that support `ap(..)` provide `ap.pipe(..)`, and those with `concat(..)` provide `concat.pipe(..)`.

## State Monad

**[More background information on the `State` monad](MONADS.md#statefully-monadic)**

State represents operations that each take a starting state, and compute a new state as well as (optionally) an output value. The `State(..)` constructor takes a function that, when executed, returns an object (pair) with `value` (if any) and `state` (if any). For example:

```js
var info = State(st => ({
    value: "author",
    state: { ...st, lastName: "Simpson" }
}));
```

The state carried in a single State instance is (treated as) *immutable*. But a chain of two or more State instances represents step-by-step transformation of state in your program.

A State monadic value is *lazy*, meaning it's not computed until its `evaluate(..)` function is invoked, with its only (optional) argument being the initial state for the evaluation:

```js
info.evaluate({ firstName: "Kyle" });
// {
//   value: "author",
//   state: {
//     firstName: "Kyle",
//     lastName: "Simpson"
//   }
// }
```

Notice that State can be used in a very limited sense somewhat like the `Just` identity monad, by ignoring the implicitly carried state (via the `State.of(..)` convenience unit constructor):

```js
State.of(21)
.map(v => v * 2)
.evaluate()
// {
//   value: 42,
//   state: undefined
// }
```

However, the implicitly carried state is the main *point* of State, so you'll usually want to use it! In fact, the carried state is often *all* you need, and the value slot might be ignored.

**Note:** Implicitly carrying *state* is essentially the [Reader monad](MONADS.md#reader-monad) behavior of implicitly carrying its *environment* value. Though **Monio** does NOT provide an explicit `Reader` monad, `State` and `IO` include its behavior.

The following example shows using both the *state* and the *output value* of State, by tracking the score of two teams (*home* and *away*) as they score points in a *game*. The carried state object holds the individual team scores, while the output value from each operation (`scoreLog` below) is concatenated to hold a running log (list) of the scoring history of the game:

```js
const homeScore = pointsScored => scoreLog => State(st => {
    return {
        value: [ ...scoreLog, `home: ${pointsScored}` ],
        state: {
            ...st,
            homeTeam: st.homeTeam + pointsScored
        }
    };
});
const awayScore = pointsScored => scoreLog => State(st => {
    return {
        value: [ ...scoreLog, `away: ${pointsScored}` ],
        state: {
            ...st,
            awayTeam: st.awayTeam + pointsScored
        }
    };
});

var game = (
    // initial empty-list for scoring history (`scoreLog`)
    State.of([])
    .chain(homeScore(2))
    .chain(awayScore(3))
    .chain(homeScore(2))
    .chain(homeScore(3))
    .chain(awayScore(3))
);

game.evaluate({
    homeTeam: 0,
    awayTeam: 0,
});
// {
//   value: [ "home: 2", "away: 3", "home: 2", "home: 3", "away: 3" ],
//   state: {
//     homeTeam: 7,
//     awayTeam: 6
//   }
// }
```

**Note:** The `scoreLog` tracking could have been stored in the carried state; it was an arbitrary choice (for illustration purposes) to use the *output value* position.

With `chain(..)` (and `map(..)`), only the output *value* produced by the State instance (`scoreLog` in the above snippet) is directly provided to each step, whereas the state is *carried* through implicitly. And with `chain(..)`, the State instance you return is evaluated in this same *state* (i.e., the `...st` copying in the above snippet).

As shown above, `State.of(..)` is a static (non-instance) utility, a unit constructor that initializes an instance with an *output value*. It's a convenience utiltity instead of an explicit `State(..)` constructor passed a function that returns that value (and carries its implied state).

```js
var two = State.of(2);
two.evaluate("hello");
// {
//   value: 2,
//   state: "hello"
// }

// vs

var three = State(st => ({ value: 3, state: st }));
three.evaluate("world");
// {
//   value: 3,
//   state: "world"
// }
```

By contrast, `State.put(..)` is a unit constructor that initializes an instance with a *state*, somewhat as if the `evaluate(..)` had been partially-applied ahead of time, to ensure that state. This means the instance will evaluate to the *put* state regardless of what is or is not passed to the `evaluate(..)` invocation later:

```js
var initial = State.put({ counter: 10 });

initial.evaluate();
// {
//   value: undefined,
//   state: { counter: 10 }
// }

initial.evaluate({ counter: 3 });
// {
//   value: undefined,
//   state: { counter: 10 }
// }
```

Finally, `State.get(..)` produces a state instance that marshals (copies) the carried *state* value over into the *value* slot of that same instance; this is useful in times when you need to access the carried *state* directly without explicitly chaining an explicit `State(..)` constructor.

```js
var info = State.get();

// state (`st`) has been marshalled into the value slot here
info
.map(st => ({ counter: st.counter + 1 }))
.evaluate({ counter: 2 });
// {
//   value: { counter: 3 },
//   state: { counter: 2 }
// }
```

Notice that the `map(..)` step computed an output *value* slot that *happens* to be derived from the then-current *state* of the instance, but does not affect/update the state itself; `state` has `counter: 2` whereas the output value is has `counter: 3`.

This could then be paired with `State.put(..)` (and `chain(..)`) to push the updated state back into the carried context:

```js
var info = State.get();

info
.chain(st => State.put({ counter: st.counter + 1 }))
.evaluate({ counter: 2 });
// {
//   value: undefined,
//   state: { counter: 3 }
// }
```

Now the state has been updated to have `counter: 3`, and the value slot has been emptied (by `State.put(..)`).

----

`State` is also a [Concatable/Semigroup](MONADS.md#concatable-semigroup):

```js
State.of([ "a", "b" ])
.concat(State.of([ "c", "d" ]))
.evaluate(42);
// {
//   value: [ "a, "b", "c", "d" ],
//   state: 42
// }
```

The `concat(..)` method on `State` expects another `State` instance, both of which should themselves be holding Concatable/Semigroup values (e.g., strings, arrays, or even other semigroup-conforming monads, like `Just` or `State`).

----

**Monio**'s `State` is technically a monadic transformer over the standard State monad type; it automatically and opaquely unwraps/transforms JS promises.

That means if any state computation step is asynchronous (via JS promise), the State evaluation will be lifted to an asynchronously completing promise:

```js
// normal synchronous adder
const add = x => y => x + y;
// silly asynchronous multiplication (with State)
const asyncMultS = x => async y => State.of(x * y);
// silly asynchronous decrement (with State)
const asyncDecS = v => State(async st => ({
    value: v - 1,
    state: st
}));

State.of(1)
.map(add(2))
.chain(asyncMultS(5))
.chain(asyncDecS)
.evaluate();
// Promise<{ value: 14, state: undefined }>
```

In this snippet, the first `map(..)` step completes synchronously, but then the next `chain(..)` step completes asynchronously (with a promise). Thus, the rest of the state evaluation is lifted to operate asynchronously, and returns a promise for the final result.

## IO Monad ("one monad to rule them all")

**[More background information on the `IO` monad](MONADS.md#i-know-io)**

IO represents monadic side effects wrapped in/as functions.

Similar to the [the State monad](#state-monad), the `IO(..)` constructor takes a single function (aka "effect"), which it will apply when the IO is evaluated. This effect function can optionally be passed an argument (see discussion of "reader environment" below).

```js
const log = msg => IO(() => console.log(msg));
const uppercase = str => str.toUpperCase();
const greeting = msg => IO.of(msg);

// setup:
var HELLO = greeting("Hello!").map(uppercase);

// later:
HELLO
.chain(log)
.run();       // HELLO!
```

**Note:** The IO-wrapped `log(..)` function shown above is an commonly-needed utility in JS development. As such, it's provided in the `IOHelpers` module of this package, as `IOHelpers.log`. You can put `log = IOHelpers.log` in your app, and then use `log(..)` anywhere in your IO code that you would normally use `console.log(..)`. Just remember, `log(..)` returns an IO, it doesn't automatically produce the logging (side effects!). You have to `chain(..)` (or `yield` in a do-routine) the IO-wrapped `log(..)` to actually cause the effect to happen!

Instead of manually `chain`ing IOs together, you can opt for a friendlier, more familiar, more imperative "do-style" -- which resembles what JS developers will recognize as `async..await` style code -- by using `IO.do(..)` and a generator:

```js
const getData = url => IO(() => fetch(url).then(r => r.json()));
const renderMessage = msg => IO(() => (
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
// Promise<..>
```

Like `State`, `IO` is technically a monadic transformer over the IO type; it automatically and opaquely unwraps/transforms JS promises, encountered via `chain(..)` or `do(..)` operations. The result of `do(..)` is automatically lifted to this asynchronous (promise) type, similar to how `async function` functions are always promise-returning.

That also means the `yield getData(..)` expression above acts like a familiar `await promiseVal` expression, in that it locally pauses to resolve the eventual value (from the `fetch(..)` call in this case).

The same promise-transforming behavior shown above in the do-routine (via `yield`) also applies in regular IO `chain(..)` calls. The outcome is that any IO chain which encounters a promise ends up lifting the return value from the `run(..)` call to a promise for the eventual resolution of the IO evaluation.

Asynchrony is the ultimate (most complex) side effect in any program. As such, all asynchrony in your programs -- Ajax calls, timers, animations, etc -- can and should be modeled as IO expressions, so that asynchrony as a side effect is managed along with any other side effects.

----

Similar to how [State](#state-monad) is evaluated with an initial-state passed to its `evaluate(..)` method that's then carried through its computation(s), IO also has `Reader` monad capability rolled in, meaning it supports carrying a reader environment through all IO chains (or do-blocks) by passing an (optional) argument to `run(..)`. This value is passed as the first argument to the effect function, as well as the do-routine generator.

Passing a reader-env into an IO chain via the `run(..)` argument is key to how IO is lazy, and runs in an isolated "universe" rather than relying on implicit side effects such as accessing the DOM in a browser application. Think of the reader-env value (whatever it is) you pass in as the "global" object that an IO will run in the context of.

**Note:** Unlike State, which returns the computed state from the `evaluate(..)` method, IO impliictly carries its reader-env but never explicitly returns it from the `run(..)` call.

For example:

```js
// NOTE: the `readerEnv` here is automatically carried
// through to this IO
const renderMessage = msg => IO(readerEnv => (
    readerEnv.messageEl.innerText = msg
));

IO.do(function *main(readerEnv){
    // NOTE: we don't have to pass the `readerEnv` manually,
    // since it's automatically carried through all chained
    // IOs
    yield renderMessage("Hello, friend!");

    // ..
})
.run(/*readerEnv=*/{
    messageEl: document.getElementById("welcome-message")
});
```

Notice how `readerEnv` was automatically carried through from `main(..)` to the `renderMessage(..)` IO because of the `yield` expression (essentially an IO `chain(..)` call under the covers), without needing to be manually passed.

The outermost `run(..)` call will carry the same reader-env value through any and all of its chained IOs. However, there are helpers provided in `IOHelpers`, like `applyIO(..)` and `doBindIO(..)`, that can alter/narrow the reader-env by manually applying a specific reader-env to a specific IO.

For example:

```js
const applyIO = IOHelpers.applyIO;

const getElementById = id => IO(doc => doc.getElementById(id));
const renderMessage = msg => IO(({ messageEl }) => (
    messageEl.innerText = msg
));

IO.do(function *main(doc){
    // `doc` here is the DOM `document` object

    var altReaderEnv = {
        messageEl: yield getElementById("welcome-message")
    };

    yield applyIO(
        renderMessage("Hello, friend!"),
        altReaderEnv
    );

    // ..
})
.run(/*readerEnv=*/document);
```

Carefully managing the reader-env values passed to your program's various IOs is key to unlocking the real power of IO monads!

The `IO.doEither(..)` constructor is very similar to `IO.do(..)`. The difference is that do-routines processed by `IO.doEither(..)` will treat `Either:Left` values as throwing/catchable exceptions, and it will lift any uncaught standard JS exceptions into `Either:Left` values.

This do-routine variant is particularly helpful if you prefer to use `Either` for custom exception handling in your app logic rather than JS exceptions, while still wanting to take advantage of the `try..catch` exception-flow-control constructs in your imperative do-style code.

## IOx (aka Reactive IO) (aka Observable IO)

`IOx` is a "reactive IO" monad variant, which is both a conforming IO and also similar to a basic observable (or event stream). If an `IOx` (*B*) instance is subscribed to (i.e., observing/listening to) another `IOx` instance (*A*), and *A* updates its value, *B* is automatically notified and re-applied.

The `IOx(..)` constructor is like the `IO(..)` constructor -- both expect an effect function as the first argument -- except that `IOx(..)` also expects a second argument: an array of dependencies -- typically, one or more IOx instances, but can also be regular IO instances, or even non-IO values like `42` or `Just("ok")`.

The effect function (for both `IO(..)` and `IOx(..)`) always receives the reader-env value (the value passed to `run(..)`) as its first argument. For IOx instances, the effect function will then also receive, as additional positional arguments, the resolved value(s) of its listed dependencies.

For example:

```js
var number = IOx.of(3);
var doubled = number.map(v => v * 2);
var tripled = number.map(v => v * 3);

// `print(..)` here is an effect function to pass to the
// `IOx(..)` constructor; it receives both the
// reader-env argument and the `v`, which will be the
// subscribed-to value of the IOx instance's dependency
const print = (readerEnv,v) => console.log(`v: ${v}`);

// the `IO(..)` constructor here also takes an effect
// function, which receives only the reader-env argument
const printIO = v => IO(readerEnv => print(readerEnv,v));

// subscribe to the `doubled` IOx
var printDoubled = IOx(print,[ doubled ]);

// an alternate way to "subscribe" is to `chain(..)`:
var printTripled = tripled.chain(printIO);

// activate only the `printDoubled` IOx
printDoubled.run();
// v: 6

// assign a different value into the `number` IOx
number(7);
// v: 14

// now activate the `printTripled` IOx
printTripled.run();
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
const getElementById = id => IO(() => document.getElementById(id));

var thisIsAnIONotAnIOx =
    getElementById("my-btn")
    .chain(makeSomeIOx);

var butThisIsAnIOx =
    IOx.fromIO( getElementById("my-btn") )
    .chain(makeSomeIOx);
```

Less often, you need to explicitly convert in the other direction (IOx to IO); use `IO.fromIOx(..)` in those specific cases.

IOx streams can also be constructed from (i.e., filled with values from) both sync and async iterables, using `IOx.fromIter(..)`. Iterable-based IOx streams are one-time sources of values; once they've been iterated, they won't produce those values again.

By default, iterable-based IOx streams will close once they've produced their values. However, `fromIter(..)` takes an optional second boolean argument: pass `false` to keep the stream open after its initial iteration is complete. This allows the stream to be updated with additional values later.

For example:

```js
const log = IOHelpers.log;

var range = IOx.fromIter( [ 1, 2, 3, 4, 5 ], /*closeOnComplete=*/false );

range.chain(log).run();
// 1 2 3 4 5

// send another value through the IOx stream
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

`toIter(..)` takes any IOx instance as its first argument, and the second (optional) argument should be the reader-env (if any) to run the IOx with (if it hasn't already run):

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
for await (let num of IOx.toIter(numbers,/*readerEnv=*/undefined)) {
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

## Other Helpful IO/IOx Variants

**Monio** also includes some other variants and helpers of `IO` / `IOx`:

* `AllIO` and `AnyIO` are IO monad variants that are suitable -- as monoids, both have an "empty" boolean-holding IO value (`AllIO.empty()` and `AnyIO.empty()`) and a `concat(..)` method -- to perform short-circuited `&&` and `||` operations, respectively, over the eventually-resolved values in the IO instances. For additional convenience, common FP utilities like `fold(..)` and `foldMap(..)` (included in **Monio**'s `Util` module) abstract the `concat(..)` calls across such concatable moniod instances.

    For example:

    ```js
    var a = AllIO.of(true);
    var b = AllIO(() => true);
    var c = AllIO.of(false);

    a.concat(b).run();                    // true
    fold(a,b).run();                      // true

    a.concat(b).concat(c).run();          // false
    foldMap(v => v,[ a, b, c ]).run();    // false

    var d = AnyIO(() => true);
    var e = AnyIO.of(true);
    var f = AnyIO.of(false);

    d.concat(e).run();                    // true
    d.concat(e).concat(f).run();          // true
    ```

* `IOxHelpers.eventPullStream(..)` produces a pull-stream (via `toIter(..)`) -- aka, ES2018 async iterator, consumable with a `for await..of` loop -- subscribed to an event emitter (via `onEvent(..)`). This simple helper is equivalent to manually calling `IOxHelpers.toIter( IOxHelpers.onEvent(..) )`.

    For example:

    ```js
    for await (let click of IOxHelpers.eventPullStream(btn,"click")) {
        // ..
    }
    ```
