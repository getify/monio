"use strict";

const qunit = require("qunit");
const sinon = require("sinon");
const { EMPTY_FUNC, identity, } = MonioUtil;
const {
	INJECT_MONIO,
	inc,
	twice,
	eitherProp,
	safeAwait,
} = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, State, IO, IOx });

qunit.module("async-either");

qunit.test("AsyncEither:Right construction/creation", (assert) => {
	assert.equal(
		AsyncEither(1)._inspect(),
		"AsyncEither(Promise)",
		"should create an AsyncEither:Right monad via constructor"
	);

	assert.equal(
		AsyncEither.of(1)._inspect(),
		"AsyncEither(Promise)",
		"should create an AsyncEither:Right monad via #of"
	);

	assert.equal(
		AsyncEither.pure(1)._inspect(),
		"AsyncEither(Promise)",
		"should create an AsyncEither:Right monad via #pure"
	);

	assert.equal(
		AsyncEither.unit(1)._inspect(),
		"AsyncEither(Promise)",
		"should create an AsyncEither:Right monad via #unit"
	);

	assert.equal(
		AsyncEither.Right(1)._inspect(),
		"AsyncEither(Promise)",
		"should create an AsyncEither:Right via #Right"
	);
});

qunit.test("AsyncEither:Left construction/creation", (assert) => {
	assert.equal(
		AsyncEither.Left(1)._inspect(),
		"AsyncEither(Promise)",
		"should create an AsyncEither:Left monad via constructor"
	);
});

qunit.test("#map", async (assert) => {
	const operation = sinon.fake();

	assert.equal(
		await AsyncEither(1).map(identity).fold(EMPTY_FUNC,identity),
		1,
		"should follow the identity law given an AsyncEither:Right monad"
	);

	assert.equal(
		await AsyncEither(1).map(x => twice(inc(x))).fold(EMPTY_FUNC,identity),
		await AsyncEither(1).map(inc).map(twice).fold(EMPTY_FUNC,identity),
		"should follow the composition law given an AsyncEither:Right monad"
	);

	assert.equal(
		await safeAwait(AsyncEither.Left(1).map(operation).fold(identity,EMPTY_FUNC)),
		await safeAwait(AsyncEither.Left(1).fold(identity,EMPTY_FUNC)),
		"should return an AsyncEither:Left monad given an AsyncEither:Left monad"
	);

	assert.equal(
		operation.called,
		false,
		"should perform no operation given an AsyncEither:Left monad"
	);
});

qunit.test("#chain", async (assert) => {
	const operation = sinon.fake();

	assert.equal(
		await AsyncEither({ name: "john" }).chain(eitherProp("name")).fold(EMPTY_FUNC,identity),
		"john",
		"should return an AsyncEither:Right('john') monad"
	);

	assert.deepEqual(
		await safeAwait(AsyncEither.Left({ name: "john" }).chain(operation).fold(identity,EMPTY_FUNC)),
		{ name: "john" },
		"should return an AsyncEither:Left monad given an AsyncEither:Left monad"
	);

	assert.equal(
		await AsyncEither({ name: "john" }).flatMap(eitherProp("name")).fold(EMPTY_FUNC,identity),
		"john",
		"should return an AsyncEither:Right('john') monad"
	);

	assert.deepEqual(
		await safeAwait(AsyncEither.Left({ name: "john" }).flatMap(operation).fold(identity,EMPTY_FUNC)),
		{ name: "john" },
		"should return an AsyncEither:Left monad given an AsyncEither:Left monad"
	);

	assert.equal(
		await AsyncEither({ name: "john" }).bind(eitherProp("name")).fold(EMPTY_FUNC,identity),
		"john",
		"should return an AsyncEither:Right('john') monad"
	);

	assert.deepEqual(
		await safeAwait(AsyncEither.Left({ name: "john" }).bind(operation).fold(identity,EMPTY_FUNC)),
		{ name: "john" },
		"should return an AsyncEither:Left monad given an AsyncEither:Left monad"
	);

	assert.equal(
		operation.called,
		false,
		"should perform no operation given an AsyncEither:Left monad"
	);
});

qunit.test("#ap", async (assert) => {
	const op1 = sinon.fake();
	const op2 = sinon.fake();

	assert.equal(
		await AsyncEither(inc).ap(AsyncEither(2)).fold(EMPTY_FUNC,identity),
		3,
		"should return an AsyncEither:Right(3) monad"
	);

	assert.equal(
		await safeAwait(AsyncEither(op1).ap(AsyncEither.Left(2)).fold(identity,EMPTY_FUNC)),
		2,
		"should return an AsyncEither:Left(2) monad"
	);

	assert.equal(
		op1.called,
		false,
		"should perform no operation given an AsyncEither:Left monad"
	);

	assert.equal(
		await safeAwait(AsyncEither.Left(op2).ap(AsyncEither(2)).fold(identity,EMPTY_FUNC)),
		op2,
		"should return an AsyncEither:Left(op) monad"
	);

	assert.equal(
		op2.called,
		false,
		"should perform no operation given an AsyncEither:Left monad"
	);
});

qunit.test("#concat", async (assert) => {
	assert.deepEqual(
		await AsyncEither([1,2]).concat(AsyncEither([3])).fold(EMPTY_FUNC,identity),
		[1,2,3],
		"should return an array given an AsyncEither:Right monad and [3]"
	);

	assert.deepEqual(
		await safeAwait(AsyncEither.Left([1,2]).concat(AsyncEither.Left([3])).fold(identity,EMPTY_FUNC)),
		[1,2],
		"should not perform a concat operation given an AsyncEither:Left monad"
	);
});

qunit.test("#fold", async (assert) => {
	const op1 = sinon.fake();
	const op2 = sinon.fake();

	assert.equal(
		await safeAwait(AsyncEither("john").fold(op1,identity)),
		"john",
		"should call the right side of the fold on AsyncEither:Right"
	);

	assert.equal(
		op1.called,
		false,
		"should not call the left side of the fold on AsyncEither:Right"
	);

	assert.equal(
		await safeAwait(AsyncEither.Left(1).fold(identity,op2)),
		1,
		"should call the left side of the fold on AsyncEither:Left"
	);

	assert.equal(
		op2.called,
		false,
		"should not call the right side of the fold on AsyncEither:Left"
	);
});

qunit.test("#fromFoldable", async (assert) => {
	assert.equal(
		await AsyncEither.fromFoldable(Either(1)).fold(EMPTY_FUNC,identity),
		1,
		"should return an AsyncEither:Right monad given an AsyncEither:Right monad"
	);

	assert.equal(
		await safeAwait(AsyncEither.fromFoldable(Either.Left(1)).fold(identity,EMPTY_FUNC)),
		1,
		"should return an AsyncEither:Left monad from an AsyncEither:Left monad"
	);
});

qunit.test("*.pipe", async (assert) => {
	const incPr = v => Promise.resolve(inc(v));
	const twicePr = v => Promise.resolve(twice(v));

	assert.equal(
		await AsyncEither(2).map.pipe(inc,twice).fold(EMPTY_FUNC,identity),
		6,
		"map.pipe()"
	);

	assert.equal(
		await AsyncEither(2).chain.pipe(
			v => AsyncEither(inc(v)),
			v => AsyncEither(twice(v))
		).fold(EMPTY_FUNC,identity),
		6,
		"chain.pipe()"
	);

	assert.equal(
		await AsyncEither(x => y => x + y).ap.pipe(
			AsyncEither(2),
			AsyncEither(3)
		).fold(EMPTY_FUNC,identity),
		5,
		"ap.pipe()"
	);

	assert.deepEqual(
		await AsyncEither([1,2]).concat.pipe(
			AsyncEither([3,4]),
			AsyncEither([5,6])
		).fold(EMPTY_FUNC,identity),
		[1,2,3,4,5,6],
		"concat.pipe()"
	);

	assert.equal(
		await AsyncEither(Promise.resolve(2))
			.map.pipe(inc,twicePr)
			.fold(EMPTY_FUNC,identity),
		6,
		"async: map.pipe()"
	);

	assert.equal(
		await AsyncEither(Promise.resolve(2)).chain.pipe(
			v => AsyncEither(incPr(v)),
			v => AsyncEither(twicePr(v))
		).fold(EMPTY_FUNC,identity),
		6,
		"async: chain.pipe()"
	);

	assert.equal(
		await AsyncEither(x => y => x + y).ap.pipe(
			AsyncEither(Promise.resolve(2)),
			AsyncEither(Promise.resolve(3))
		).fold(EMPTY_FUNC,identity),
		5,
		"async: ap.pipe()"
	);

	assert.deepEqual(
		await AsyncEither(Promise.resolve([1,2])).concat.pipe(
			AsyncEither(Promise.resolve([3,4])),
			AsyncEither(Promise.resolve([5,6]))
		).fold(EMPTY_FUNC,identity),
		[1,2,3,4,5,6],
		"async: concat.pipe()"
	);
});
