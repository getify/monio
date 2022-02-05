# Monio

[![Build Status](https://travis-ci.org/getify/monio.svg?branch=master)](https://travis-ci.org/getify/monio)
[![npm Module](https://badge.fury.io/js/monio.svg)](https://www.npmjs.org/package/monio)
[![Coverage Status](https://coveralls.io/repos/github/getify/monio/badge.svg?branch=master)](https://coveralls.io/github/getify/monio?branch=master)
[![Modules](https://img.shields.io/badge/modules-ESM%2BUMD%2BCJS-a1356a)](https://nodejs.org/api/packages.html#dual-commonjses-module-packages)
[![License](https://img.shields.io/badge/license-MIT-a1356a)](LICENSE.txt)

**Monio** (mō'ne-yo) provides an async-capable IO Monad (including "do" style) for JS, with several helpful companion monads (like Maybe and Either) thrown in.

> Monio's IO/IOx is the most powerful IO monad implementation in JS, possibly in any language!

**Note:** This is obviously a marketing claim, not a provable mathematical/scientific assertion. Nevertheless, I believe it's true!

```js
Just("Welcome, Monads")
.concat(Just(" And Friends"))
.map(v => v.toUpperCase())
.fold(Maybe.from)
.map(v => v + "!")
.fold(
    () => IO.of("--empty--"),
    greetings => IO(() => console.log(greetings))
)
.run();
// WELCOME, MONADS AND FRIENDS!
```

## Wait, What's A "Monad"?

If you're already comfortable with Functional Programming (FP), and you're at least familiar with monads, and if the code snippet above doesn't scare you away, [skip to "See Monio In Action"](#see-monio-in-action). Or, if you're just looking for quick code examples of all the monads in **Monio**, [check 'em out here!](MONIO.md)

But if terms like "higher-order function" or "monad" are confusing or intimidating to you, I encourage you to take some time first to build some comfort and familiarity; these are the foundations you need to get the most out of **Monio**.

I don't want you to feel intimidated. This isn't going to require you to speak in mathematical notation or re-learn everything you thought you knew about programming.

Well... to be clear, what I mean is, you don't have to do all that *just to get started*. There are small and comfortable baby steps you can begin taking to kick off the journey. The further you explore down the path, I think the more FP and monads will "hook" you, nudging and tugging you into different ways of thinking about and solving problems.

----
----

**Now, it's time to [dive into FP... and then Monads](MONADS.md#fp--monads).** But if you're already comfortable with FP, and ready to tackle learning monads specifically, you can [jump directly to "Expansive Intro To Monads"](MONADS.md#expansive-intro-to-monads).

Make sure you take your time reading through that guide; it's pretty long and detailed, and there's a lot to digest.

----
----

## See Monio In Action

To see how writing **Monio**-based code looks and feels, especially the use of IO/IOx monads (and all its variations), check out these live demos. There's a variety of different approaches/styles demonstrated, which illustrate the flexibility **Monio**'s monads offer.

* [Cancelable Countdown (demo)](https://codepen.io/getify/pen/abvjRRK?editors=0011)

* [Order Lookup (demo)](https://codepen.io/getify/pen/YzyJqZa?editors=1010)

* [Cached Ajax (demo)](https://codepen.io/getify/pen/VwjyoMY?editors=0010)

* [Event Stream (demo)](https://codepen.io/getify/pen/WNrNYKx?editors=1011)

* [Event Stream: IOx Reactive Monad (demo)](https://codepen.io/getify/pen/Exwapga?editors=1011)

* [IOx Reactive Monad (demo)](https://codepen.io/getify/pen/XWeJxbq?editors=0010)

* [IOx Reactive Monad: Stream Operations (demo)](https://codepen.io/getify/pen/JjrNPdm?editors=0010)

* [IOx Countdown Timer (demo)](https://codepen.io/getify/pen/MWErobj?editors=0012) and [IOx Countdown Timer Alternative (demo)](https://codepen.io/getify/pen/abLKeKy?editors=0012)

----

Check out [**Monio**'s Monads](MONIO.md) for more example code snippets and detailed descriptions.

## Overview

Monio balances the power of monads -- often dismissed by the non-FP programmer as academic and convoluted -- while pragmatically embracing the reality of the vast majority of JS programs: paradigm mixture (some OO, some FP, and probably a lot of imperative procedural code).

The driving inspiration behind Monio is the `IO` monad -- useful for managing side-effects -- that additionally supports "do-style" syntax with JS-ergonomic asynchrony (based on promises) in the style of familiar `async..await` code. IOs are lazy, so their operations are not triggered until the `run(..)` method is called.

Monio's `IO` is a transformer over promises, which means that when promises are produced in an IO, they are automatically unwrapped; of course, that means subsequent IO operations are deferred. If any IO in a chain produces a promise, `run(..)`'s result will be "lifted" to a promise that resolves when the entire IO chain is complete. Otherwise, the IO instance and its `run(..)` call will operate synchronously and immediately produce the result.

Monio intentionally chooses to model asynchrony over promises instead of Future monads, because of its goal of balancing FP with pragmatic and idomatic non-FP JS. However, there's nothing that should prevent you from using a Future monad with Monio if you prefer.

`IO`'s "do-style" syntax is specified with the `do(..)` method (automatically lifts the IO to promise-producing asynchrony), which accepts JS generators (including "async generators": `async function *whatever(){ .. }`). `yield` is used for chaining IOs (which can produce promises to defer), whereas `await` is for explicitly deferring on a promise that's not already wrapped in an IO. The resulting style of code should be more broadly approachable for JS developers, while still benefitting from monads.

`IO`'s `do(..)` is JS-ergonomic for exception handling: uncaught JS exceptions become promise rejections, and IO-produced promise rejections are `try..catch`'able. `IO` also supports modeling exception handling through Either monads: `doEither(..)` transforms uncaught exceptions into *Either:Left* values, and recognizes IO-produced *Either:Left* values as `try..catch`'able exceptions.

Monio's `IO` is also a Reader monad, which carries side-effect read environments alongside IO operations.

### For the FP savvy

Monio's `IO` models a function `e => IO a (Promise b c)`, which is strong enough to capture (optional) environment passing, side effects, async, and error handling without the pain of composing each type separately.

Typically `IO` does not take an argument, but given one, it acts like an effectful `Reader`. In addition, it can model sync or async functions so the inner `Promise` becomes optional.

In that way, you can think of it as `ReaderT (IOT (Promise|Identity a b))` where `Promise` gets swapped for `Identity` if you're not doing async.

Monio's IO is like Scala's [ZIO / RIO](https://zio.dev/), where we have all the functionality we need wrapped up in a single monad kind.

### Monio's Monads

```js
Just("Are you ready for Monio?");
```

Check out [**Monio**'s Monads](MONIO.md) for a bunch of code snippets and detailed descriptions of all the monads (and helpers) provided in this library.

## Using Monio

[![npm Module](https://badge.fury.io/js/monio.svg)](https://www.npmjs.org/package/monio) [![Module Format](https://img.shields.io/badge/modules-ESM%2BUMD%2BCJS-a1356a)](https://nodejs.org/api/packages.html#dual-commonjses-module-packages)

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

[![Module Format](https://img.shields.io/badge/modules-ESM%2BUMD%2BCJS-a1356a)](https://nodejs.org/api/packages.html#dual-commonjses-module-packages)

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

[![License](https://img.shields.io/badge/license-MIT-a1356a)](LICENSE.txt)

All code and documentation are (c) 2022 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/). A copy of the MIT License [is also included](LICENSE.txt).
