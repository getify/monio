# Monio

[![Build Status](https://travis-ci.org/getify/monio.svg?branch=master)](https://travis-ci.org/getify/monio)
[![npm Module](https://badge.fury.io/js/monio.svg)](https://www.npmjs.org/package/monio)
[![Dependencies](https://david-dm.org/getify/monio.svg)](https://david-dm.org/getify/monio)
[![devDependencies](https://david-dm.org/getify/monio/dev-status.svg)](https://david-dm.org/getify/monio?type=dev)
[![Coverage Status](https://coveralls.io/repos/github/getify/monio/badge.svg?branch=master)](https://coveralls.io/github/getify/monio?branch=master)

Monio ('mo-neo') is an async-capable IO Monad (including "do" style) for JS, with several companion monads thrown in.

## See It In Action

* [Cancelable Countdown (demo)](https://codepen.io/getify/pen/abvjRRK?editors=0011)

* [Order Lookup (demo)](https://codepen.io/getify/pen/YzyJqZa?editors=1011)

* [Event Stream (demo)](https://codepen.io/getify/pen/WNrNYKx?editors=1011)

## Overview

Monio balances the power of monads -- often dismissed by the non-FP programmer as academic and convoluted -- while pragmatically embracing the reality of the vast majority of JS programs: paradigm mixture (some OO, some FP, and probably a lot of imperative procedural code).

The driving inspiration behind Monio is an IO monad -- useful for managing side-effects -- that additionally supports "do-style" syntax with JS-ergonomic asynchrony (based on promises) in the style of familiar `async..await` code. IOs are lazy, so their operations are not triggered until the `run(..)` method is called.

Monio's IO is a transformer over promises, which means that when promises are produced in an IO, they are automatically unwrapped; of course, that means subsequent IO operations are deferred. If any IO in a chain produces a promise, `run(..)`'s result will be "lifted" to a promise that resolves when the entire IO chain is complete. Otherwise, the IO instance and its `run(..)` call will operate synchronously and immediately produce the result.

Monio intentionally chooses to model asynchrony over promises instead of Task monads, because of its goal of balancing FP with pragmatic and idomatic non-FP JS. However, there's nothing that should prevent you from using a Task monad with Monio if you prefer.

IO "do-style" syntax is specified with the `do(..)` method (automatically lifts the IO to promise-producing asynchrony), which accepts JS generators (including "async generators": `async function *whatever(){ .. }`). `yield` is used for chaining IOs (which can produce promises to defer), whereas `await` is for explicitly deferring on a promise that's not already wrapped in an IO. The resulting style of code should be more broadly approachable for JS developers, while still benefitting from monads.

IO's `do(..)` is also JS-ergonomic for exception handling. Uncaught JS exceptions become promise rejections, and IO-produced promise rejections are `try..catch`'able. Monio also supports modeling exception handling through Either monads: `doEither(..)` transforms uncaught exceptions into *Either:Left* values, and recognizes IO-produced *Either:Left* values as `try..catch`'able exceptions.

Monio's IO is also a Reader monad, which carries side-effect read environments alongside IO operations.

Monio also includes several supporting monads/helpers in addition to `IO`:

* `Maybe` (including `Just` and `Nothing`)

* `Either`

* Monio-specific `AsyncEither` (same promise-transforming behavior as IO)

* `IOEventStream(..)`: creates an IO instance that produces an "event stream" -- an async-iterable consumable with a `for await..of` loop -- from an event emitter (ie, a DOM element, or a Node EventEmitter instance)

## For the FP savvy
Monio models a function `e => IO (Promise a b)`, which is strong enough to capture (optional) environment passing, side effects, async, and error handling without the pain of composing each type separately.

You can think of it as `ReaderT (IOT (Promise|Identity a b))` where `Promise` gets swapped for `Identity` if you're not doing async.

This project is like a JS-style ZIO/RIO where we have all the functionality we need wrapped up in 1 monad.


## Tests

A test suite is included in this repository, as well as the npm package distribution. The default test behavior runs the test suite using the files in `src/`.

1. The tests are run with QUnit.

2. To run the test utility with npm:

    ```
    npm test
    ```

3. To run the test utility directly without npm:

    ```
    qunit
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

All code and documentation are (c) 2020 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/). A copy of the MIT License [is also included](LICENSE.txt).
