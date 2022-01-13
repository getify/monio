"use strict";

// NOTE: these are to silence spurious
// errors/warnings that Node emits b/c
// it doesn't trust that we know what
// we're doing with catching promise
// rejections
process.on("unhandledRejection",()=>{});
process.on("rejectionHandled",()=>{});
// ***************************************************


const qunit = require("qunit");
const { identity, inc, twice, eitherProp } = require("./utils");

qunit.module("io-helpers");

qunit.test("log", (assert) => {
	var res;
	var _log = console.log;

	// temporarily override console.log(..)
	console.log = (msg) => (res = msg);
	IO.of(42).chain(IOHelpers.log).run();
	// restore console.log(..)
	console.log = _log;

	assert.equal(
		res,
		42,
		"log() should call console.log()"
	);
});

qunit.test("getReader", (assert) => {
	var env = {};
	var res = IOHelpers.getReader().run(env);

	assert.equal(
		res,
		env,
		"getReader() should extract the reader-env"
	);
});

qunit.test("applyIO", (assert) => {
	var env = {};
	var res = IOHelpers.applyIO(IO(v => v),env).run();

	assert.equal(
		res,
		env,
		"applyIO() should force-apply a reader-env"
	);
});

qunit.test("doIOBind", async (assert) => {
	function *one(aEnv,arg1,arg2,arg3) {
		return aEnv * arg1 * arg2 * arg3;
	}

	function *two(aEnv,arg1,arg2,arg3) {
		throw (aEnv * arg1 * arg2 * arg3);
	}

	var fn1 = IOHelpers.doIOBind(one,10);
	var fn2 = IOHelpers.doIOBind(two,10);

	var res1 = await fn1(2,3,4).run(20);
	try {
		var res2 = await fn2(2,3,4).run(30);
	}
	catch (err) {
		res2 = err;
	}

	assert.equal(
		res1,
		240,
		"doIOBind() should create a function that accepts additional arguments, which then invokes a reader-env-bound do-IO routine with them"
	);

	assert.equal(
		res2,
		240,
		"do-routine thrown error should come out as promise rejection"
	);
});

qunit.test("doEIOBind", async (assert) => {
	function *one(aEnv,arg1,arg2,arg3) {
		return aEnv * arg1 * arg2 * arg3;
	}

	function *two(aEnv,arg1,arg2,arg3) {
		return Either.Left(aEnv * arg1 * arg2 * arg3);
	}

	var fn1 = IOHelpers.doEIOBind(one,10);
	var fn2 = IOHelpers.doEIOBind(two,10);

	var res1 = await fn1(2,3,4).run(20);
	try {
		var res2 = await fn2(2,3,4).run(30);
	}
	catch (err) {
		res2 = err;
	}

	assert.equal(
		res1._inspect(),
		"Either:Right(240)",
		"doIOBind() should create a function that accepts additional arguments, which then invokes a reader-env-bound do-IO routine with them"
	);

	assert.equal(
		res2._inspect(),
		"Either:Left(240)",
		"do-routine returned Either:Left should come out as promise rejection"
	);
});


qunit.test("iif", async (assert) => {
	var condEq = v => IO(env => v === env);

	var ifs = IOHelpers.ifReturned(
		IOHelpers.iif(
			condEq(1), IOHelpers.iReturn(IO.of("one")),
			IOHelpers.elif(
				$=>IOHelpers.iAnd(
					IOHelpers.iOr(
						condEq(2),
						condEq(3),
						condEq(4)
					),
					IOHelpers.iNot(condEq(4))
				), $=>[ IO.of("oops"), IOHelpers.iReturn(IO.of("two/three")), IOHelpers.iReturn(IO.of("oops2")), ],
			),
			IOHelpers.els($=>[
				IO.of("oops3"),
				IOHelpers.iReturn(IO(v=>v)),
			])
	));

	var res1 = ifs.run(1);
	var res2 = ifs.run(2);
	var res3 = ifs.run(3);
	var res4 = ifs.run(4);

	assert.equal(
		res1,
		"one",
		"if condition 1"
	);

	assert.equal(
		res2,
		"two/three",
		"if condition 2"
	);

	assert.equal(
		res3,
		"two/three",
		"if condition 2"
	);

	assert.equal(
		res4,
		4,
		"if condition 3"
	);

});
