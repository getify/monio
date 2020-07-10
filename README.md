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

Coming soon.

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
