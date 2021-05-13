const qunit = require("qunit");
const sinon = require("sinon");
const ioeventstream = require("monio/io/event-stream");
const { identity, inc, twice, eitherProp } = require("./utils");

qunit.module("io-event-stream");

// qunit.test("placeholder", (assert) => {});
