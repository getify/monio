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
const { identity, foldMap, } = MonioUtil;
const {
	INJECT_MONIO,
	inc,
	twice,
} = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, IO, IOx });

qunit.module("io-any");

qunit.test("#unit", (assert) => {
	assert.equal(
		AnyIO.of(1)._inspect(),
		"AnyIO(anonymous function)",
		"should create an AnyIO instance via #of"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		AnyIO.is(AnyIO.of(1)),
		true,
		"should return true if the object passed is an AnyIO monad"
	);

	assert.equal(
		IO.is(AnyIO.of(1)),
		true,
		"AnyIO is an IO monad"
	);

	assert.equal(
		AnyIO.is(IO.of(1)),
		false,
		"IO is not an AnyIO monad"
	);

	assert.equal(
		AnyIO.is({}),
		false,
		"should return false if the object is not an AnyIO monad"
	);
});

qunit.test("foldMap:very-long", (assert) => {
	var io = AnyIO(initV => initV !== false);
	var ioList = [ io ];

	for (let i = 0; i < 25000; i++) {
		ioList.push(AnyIO.of(false));
	}

	var finalTrue = AnyIO.of(true);
	var finalFalse = AnyIO.empty();

	var res1 = foldMap(
		identity,
		ioList.concat(finalFalse)
	)
	.run(/*initV=*/false);

	assert.ok(
		res1 === false,
		"foldMap with all falses"
	);

	var res2 = foldMap(
		identity,
		ioList.concat(finalFalse)
	)
	.run(/*initV=*/true);

	assert.ok(
		res2 === true,
		"foldMap with only first true"
	);

	var res3 = foldMap(
		identity,
		ioList.concat(finalTrue)
	)
	.run(/*initV=*/false);

	assert.ok(
		res3 === true,
		"foldMap with only last true"
	);
});

qunit.test("*.pipe", async (assert) => {
	const incPr = v => Promise.resolve(inc(v));
	const twicePr = v => Promise.resolve(twice(v));

	assert.equal(
		AnyIO.of(2).map.pipe(inc,twice).run(),
		6,
		"map.pipe()"
	);

	assert.equal(
		AnyIO.of(2).chain.pipe(
			v => AnyIO.of(inc(v)),
			v => AnyIO.of(twice(v))
		).run(),
		6,
		"chain.pipe()"
	);

	assert.deepEqual(
		AnyIO.of(false).concat.pipe(
			AnyIO.of(false),
			AnyIO.of(true)
		).run(),
		true,
		"concat.pipe()"
	);

	assert.equal(
		await AnyIO.of(Promise.resolve(2)).map.pipe(inc,twicePr,inc).run(),
		7,
		"async: map.pipe()"
	);

	assert.equal(
		await AnyIO.of(Promise.resolve(2)).chain.pipe(
			v => AnyIO.of(incPr(v)),
			v => AnyIO.of(twicePr(v))
		).run(),
		6,
		"async: chain.pipe()"
	);

	assert.deepEqual(
		await AnyIO.of(Promise.resolve(false)).concat.pipe(
			AnyIO.of(Promise.resolve(false)),
			AnyIO.of(Promise.resolve(true))
		).run(),
		true,
		"async: concat.pipe()"
	);
});

qunit.test("*.pipe:very-long", async (assert) => {
	var stackDepth = 10000;

	var incFns = Array(stackDepth).fill(inc);
	var incIOFns = Array(stackDepth).fill(v => AnyIO.of(inc(v)));

	assert.equal(
		AnyIO.of(0).map.pipe(...incFns).run(),
		stackDepth,
		"map.pipe()"
	);

	assert.equal(
		AnyIO.of(0).chain.pipe(...incIOFns).run(),
		stackDepth,
		"chain.pipe()"
	);
});
