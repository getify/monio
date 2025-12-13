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
INJECT_MONIO({ Just, Maybe, Either, State, IO, IOx });

qunit.module("io-all");

qunit.test("#_inspect", (assert) => {
	assert.equal(
		AllIO.of(1)._inspect(),
		"AllIO(anonymous function)",
		"should create an AllIO with anonymous function"
	);

	assert.equal(
		AllIO.of(1).toString(),
		"AllIO(anonymous function)",
		"toString() value is as expected"
	);

	assert.equal(
		"" + AllIO.of(1),
		"AllIO(anonymous function)",
		"toPrimitive value is as expected"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		AllIO.is(AllIO.of(1)),
		true,
		"is() should return true if the object passed is an AllIO monad"
	);

	assert.equal(
		IO.is(AllIO.of(1)),
		true,
		"AllIO is() an IO monad"
	);

	assert.equal(
		AllIO.of(1) instanceof IO,
		true,
		"AllIO is instanceof an IO monad"
	);

	assert.equal(
		AllIO.is(IO.of(1)),
		false,
		"IO is() not an AllIO monad"
	);

	assert.equal(
		IO.of(1) instanceof AllIO,
		false,
		"IO is not instanceof an AllIO monad"
	);

	assert.equal(
		AllIO.is({}),
		false,
		"is() should return false if the object is not an AllIO monad"
	);

	assert.equal(
		{} instanceof AllIO,
		false,
		"instanceof should return false if the object is not an AllIO monad"
	);
});

qunit.test("foldMap:very-long", (assert) => {
	var io = AllIO(initV => initV === true);
	var ioList = [ io ];

	for (let i = 0; i < 25000; i++) {
		ioList.push(AllIO.of(true));
	}

	var finalTrue = AllIO.of(true);
	var finalFalse = AllIO.of(false);

	var res1 = foldMap(
		identity,
		ioList.concat(finalTrue),
		AllIO.empty()
	)
	.run(/*initV=*/true);

	assert.ok(
		res1 === true,
		"foldMap with all trues"
	);

	var res2 = foldMap(
		identity,
		ioList.concat(finalTrue)
	)
	.run(/*initV=*/false);

	assert.ok(
		res2 === false,
		"foldMap with only first false"
	);

	var res3 = foldMap(
		identity,
		ioList.concat(finalFalse)
	)
	.run(/*initV=*/true);

	assert.ok(
		res3 === false,
		"foldMap with only last false"
	);
});

qunit.test("*.pipe", async (assert) => {
	const incPr = v => Promise.resolve(inc(v));
	const twicePr = v => Promise.resolve(twice(v));

	assert.equal(
		AllIO.of(2).map.pipe(inc,twice).run(),
		6,
		"map.pipe()"
	);

	assert.equal(
		AllIO.of(2).chain.pipe(
			v => AllIO.of(inc(v)),
			v => AllIO.of(twice(v))
		).run(),
		6,
		"chain.pipe()"
	);

	assert.deepEqual(
		AllIO.of(true).concat.pipe(
			AllIO.of(true),
			AllIO.of(true)
		).run(),
		true,
		"concat.pipe()"
	);

	assert.equal(
		await AllIO.of(Promise.resolve(2)).map.pipe(inc,twicePr,inc).run(),
		7,
		"async: map.pipe()"
	);

	assert.equal(
		await AllIO.of(Promise.resolve(2)).chain.pipe(
			v => AllIO.of(incPr(v)),
			v => AllIO.of(twicePr(v))
		).run(),
		6,
		"async: chain.pipe()"
	);

	assert.deepEqual(
		await AllIO.of(Promise.resolve(true)).concat.pipe(
			AllIO.of(Promise.resolve(true)),
			AllIO.of(Promise.resolve(true))
		).run(),
		true,
		"async: concat.pipe()"
	);
});

qunit.test("*.pipe:very-long", async (assert) => {
	var stackDepth = 10000;

	var incFns = Array(stackDepth).fill(inc);
	var incIOFns = Array(stackDepth).fill(v => AllIO.of(inc(v)));

	assert.equal(
		AllIO.of(0).map.pipe(...incFns).run(),
		stackDepth,
		"map.pipe()"
	);

	assert.equal(
		AllIO.of(0).chain.pipe(...incIOFns).run(),
		stackDepth,
		"chain.pipe()"
	);
});

qunit.test("Symbol.iterator", async (assert) => {
	function *iter() {
		res.push(yield *(AllIO.of(1)));
		res.push(yield *(AllIO.of(2)));
		return yield *(AllIO.of(3));
	}

	var res = [];
	res.push(await IO.do(iter).run());

	assert.deepEqual(
		res,
		[ 1, 2, 3 ],
		"AllIO() is a yield* delegatable iterable"
	);
});
