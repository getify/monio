const qunit = require("qunit");
const sinon = require("sinon");
const asynceither = require("monio/async-either");
const { identity, inc, twice, eitherProp } = require("./utils");

qunit.module("async-either");

// qunit.test("placeholder", (assert) => {});
