#!/usr/bin/env node

"use strict";

var path = require("path");

/* istanbul ignore next */
if (process.env.TEST_PACKAGE) {
	({
		Just: global.Just,
		Nothing: global.Nothing,
		Maybe: global.Maybe,
		Either: global.Either,
		AsyncEither: global.AsyncEither,
		IO: global.IO,
		AnyIO: global.AnyIO,
		AllIO: global.AllIO,
		IOHelpers: global.IOHelpers,
		IOEventStream: global.IOEventStream,
	} = require("../"));
	runTests();
}
/* istanbul ignore next */
else if (process.env.TEST_UMD) {
	({
		Just: global.Just,
		Nothing: global.Nothing,
		Maybe: global.Maybe,
		Either: global.Either,
		AsyncEither: global.AsyncEither,
		IO: global.IO,
		AnyIO: global.AnyIO,
		AllIO: global.AllIO,
		IOHelpers: global.IOHelpers,
		IOEventStream: global.IOEventStream,
	} = require("../dist/umd/bundle.js"));
	runTests();
}
/* istanbul ignore next */
else if (process.env.TEST_ESM) {
	let { spawn, } = require("child_process");
	let child = spawn("node",[ path.join(__dirname,"node-esm-tests.mjs"), ]);
	child.stdout.pipe(process.stdout);
	child.stderr.pipe(process.stderr);
	child.on("exit",function onExit(code){
		process.exit(code);
	});
}
else {
	global.Just = require("../src/just.js");
	global.Nothing = require("../src/nothing.js");
	global.Maybe = require("../src/maybe.js");
	global.Either = require("../src/either.js");
	global.AsyncEither = require("../src/async-either");
	global.IO = require("../src/io/io.js");
	global.AnyIO = require("../src/io/any.js");
	global.AllIO = require("../src/io/all.js");
	global.IOHelpers = require("../src/io/helpers.js");
	global.IOEventStream = require("../src/io/event-stream.js");
	runTests();
}


// ******************************************

function runTests() {
	global.QUnit = require("qunit");

	require(path.join("..","tests","qunit.config.js"));
	require(path.join(__dirname,"load-tests.js"))();

	QUnit.start();
}
