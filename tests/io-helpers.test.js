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
const { INJECT_MONIO, inc, } = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, IO, IOx });

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

qunit.test("waitAll", async (assert) => {
	var vals = [
		IO.of(Promise.resolve(2)),
		IO.of(3),
		4,
		() => 5,
		Just(6),
		function *seven(){ return Promise.resolve(7); },
		(function *eight(){ return 8; })(),
	];

	var res = await IOHelpers.waitAll(...vals).run();

	assert.deepEqual(
		res,
		[ 2, 3, 4, 5, 6, 7, 8 ],
		"lifted and waited for all values"
	);
});

qunit.test("maybeFromIO / eitherFromIO", async (assert) => {
	var io = IO(v => v);

	var res1 = IOHelpers.maybeFromIO(1);
	var res2 = await IOHelpers.maybeFromIO(io,Promise.resolve(2));
	var res3 = IOHelpers.maybeFromIO(io,null);
	var res4 = await IOHelpers.maybeFromIO(io,Promise.resolve(undefined));
	var res5 = IOHelpers.maybeFromIO(Maybe.from(null))

	var res6 = await IOHelpers.eitherFromIO(Just(Promise.resolve(6)));
	var res7 = await IOHelpers.eitherFromIO(io,Promise.resolve(7));
	var res8 = IOHelpers.eitherFromIO(io,null);
	var res9 = await IOHelpers.eitherFromIO(io,Promise.resolve(undefined));
	var res10 = IOHelpers.eitherFromIO(Either.Left(10));

	assert.equal(
		res1._inspect(),
		"Maybe:Just(1)",
		"maybeFromIO number"
	);

	assert.equal(
		res2._inspect(),
		"Maybe:Just(2)",
		"maybeFromIO IO<Promise<number>>"
	);

	assert.equal(
		res3._inspect(),
		"Maybe:Nothing()",
		"maybeFromIO IO<null>"
	);

	assert.equal(
		res4._inspect(),
		"Maybe:Nothing()",
		"maybeFromIO IO<Promise<undefined>>"
	);

	assert.equal(
		res5.map(obj => obj.returned)._inspect(),
		"Maybe:Just(Maybe:Nothing())",
		"maybeFromIO Maybe<null>"
	);

	assert.equal(
		res6._inspect(),
		"Either:Right(6)",
		"eitherFromIO Just<Promise<number>>"
	);

	assert.equal(
		res7._inspect(),
		"Either:Right(7)",
		"eitherFromIO IO<Promise<number>>"
	);

	assert.equal(
		res8._inspect(),
		"Either:Left()",
		"eitherFromIO IO<null>"
	);

	assert.equal(
		res9._inspect(),
		"Either:Left()",
		"eitherFromIO IO<Promise<undefined>>"
	);

	assert.equal(
		res10.map(obj => obj.returned)._inspect(),
		"Either:Right(Either:Left(10))",
		"eitherFromIO Either:Left<number>"
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

qunit.test("listFilterInIO/listFilterOutIO", (assert) => {
	var vals = [ 1, 2, 3, 4, 5 ];

	var res1 = IOHelpers.listFilterInIO(v => IO.of(v % 2 == 0),vals).run();
	var res2 = IOHelpers.listFilterOutIO(v => IO.of(v % 2 == 0),vals).run();

	assert.deepEqual(
		res1,
		[ 2, 4 ],
		"filterIn even numberss"
	);

	assert.deepEqual(
		res2,
		[ 1, 3, 5 ],
		"filterOut even numbers"
	);
});

qunit.test("iif", (assert) => {
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
		]))
	);

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

qunit.test("match", (assert) =>{
	var condEq = v => IO(env => v === env);

	var matches = IOHelpers.matchReturned(
		IOHelpers.match(
			condEq(1), IOHelpers.iReturn(IO.of("one")),
			$=>IOHelpers.iAnd(
				IOHelpers.iOr(
					condEq(2),
					condEq(3),
					condEq(4)
				),
				IOHelpers.iNot(condEq(4))
			), $=>[ IO.of("oops"), IOHelpers.iReturn(IO.of("two/three")), IOHelpers.iReturn(IO.of("oops2")), ],
			$=>[
				IO.of("oops3"),
				IOHelpers.iReturn(IO(v=>v)),
			]
		)
	);

	var res1 = matches.run(1);
	var res2 = matches.run(2);
	var res3 = matches.run(3);
	var res4 = matches.run(4);
	try {
		var res5 = IOHelpers.matchReturned(IOHelpers.match(5));
	}
	catch (err) {
		var res5 = "five";
	}

	assert.equal(
		res1,
		"one",
		"match condition 1"
	);

	assert.equal(
		res2,
		"two/three",
		"match condition 2"
	);

	assert.equal(
		res3,
		"two/three",
		"match condition 2"
	);

	assert.equal(
		res4,
		4,
		"match condition 3"
	);

	assert.equal(
		res5,
		"five",
		"match throws with too few arguments"
	);
});

qunit.test("getPropIO / assignPropIO", async (assert) => {
	var obj = { x: 10, y: 20, z: 30 };

	var res1 = IOHelpers.getPropIO("x",obj).run();
	var res2 = IOHelpers.getPropIO("y",Just(obj)).run();
	var res3 = IOHelpers.getPropIO("z",IO.of(obj)).run();

	var res4 = IOHelpers.assignPropIO("x",obj.x + 5,obj).run();
	var res5 = IOHelpers.assignPropIO("y",obj.y + 5,Just(obj)).run();
	var res6 = IOHelpers.assignPropIO("z",obj.z + 5,IO.of(obj)).run();

	var res7 = IOHelpers.assignPropIO("x",Just(obj.x * 10),obj).run();
	var res8 = IOHelpers.assignPropIO("y",Just(obj.y * 10),Just(obj)).run();
	var res9 = IOHelpers.assignPropIO("z",Just(obj.z * 10),IO.of(obj)).run();

	var res10 = IOHelpers.assignPropIO("x",IOHelpers.getPropIO("x",obj).map(inc),obj).run();
	var res11 = IOHelpers.assignPropIO("y",IOHelpers.getPropIO("y",obj).map(inc),Just(obj)).run();
	var res12 = IOHelpers.assignPropIO("z",IOHelpers.getPropIO("z",obj).map(inc),IO.of(obj)).run();

	assert.equal(
		res1,
		10,
		"get property from object"
	);
	assert.equal(
		res2,
		20,
		"get property from Just<object>"
	);
	assert.equal(
		res3,
		30,
		"get property from IO<object>"
	);

	assert.equal(
		res4,
		15,
		"assign value to property in object"
	);
	assert.equal(
		res5,
		25,
		"assign value to property in Just<object>"
	);
	assert.equal(
		res6,
		35,
		"assign value to property in IO<object>"
	);

	assert.equal(
		res7,
		150,
		"assign Just<value> to property in object"
	);
	assert.equal(
		res8,
		250,
		"assign Just<value> to property in Just<object>"
	);
	assert.equal(
		res9,
		350,
		"assign Just<value> to property in IO<object>"
	);

	assert.equal(
		res10,
		151,
		"assign IO<value> to property in object"
	);
	assert.equal(
		res11,
		251,
		"assign IO<value> to property in Just<object>"
	);
	assert.equal(
		res12,
		351,
		"assign IO<value> to property in IO<object>"
	);
});
