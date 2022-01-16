"use strict";

const qunit = require("qunit");
const sinon = require("sinon");
const { identity, } = MonioUtil;
const {
	INJECT_MONIO,
	inc,
	twice,
	eitherProp,
	safeAwait,
} = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, IO, IOx });

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

qunit.test("#map", (assert) => {
	const operation = sinon.fake();

	assert.equal(
		AsyncEither(1).map(identity)._inspect(),
		AsyncEither(1)._inspect(),
		"should follow the identity law given an AsyncEither:Right monad"
	);

	assert.equal(
		AsyncEither(1).map(x => twice(inc(x)))._inspect(),
		AsyncEither(1).map(inc).map(twice)._inspect(),
		"should follow the composition law given an AsyncEither:Right monad"
	);

	assert.equal(
		AsyncEither.Left(1).map(operation)._inspect(),
		AsyncEither.Left(1)._inspect(),
		"should return an AsyncEither:Left monad given an AsyncEither:Left monad"
	);

	assert.equal(
		operation.called,
		false,
		"should perform no operation given an AsyncEither:Left monad"
	);
});

qunit.test("#chain", (assert) => {
	const operation = sinon.fake();

	assert.equal(
		AsyncEither({ name: "john" }).chain(eitherProp("name"))._inspect(),
		AsyncEither("john")._inspect(),
		"should return an AsyncEither:Right('john') monad"
	);

	assert.equal(
		AsyncEither.Left({ name: "john" }).chain(operation)._inspect(),
		AsyncEither.Left({ name: "john" })._inspect(),
		"should return an AsyncEither:Left monad given an AsyncEither:Left monad"
	);

	assert.equal(
		AsyncEither({ name: "john" }).flatMap(eitherProp("name"))._inspect(),
		AsyncEither("john")._inspect(),
		"should return an AsyncEither:Right('john') monad"
	);

	assert.equal(
		AsyncEither.Left({ name: "john" }).flatMap(operation)._inspect(),
		AsyncEither.Left({ name: "john" })._inspect(),
		"should return an AsyncEither:Left monad given an AsyncEither:Left monad"
	);

	assert.equal(
		AsyncEither({ name: "john" }).bind(eitherProp('name'))._inspect(),
		AsyncEither("john")._inspect(),
		"should return an AsyncEither:Right('john') monad"
	);

	assert.equal(
		AsyncEither.Left({ name: "john" }).bind(operation)._inspect(),
		AsyncEither.Left({ name: "john" })._inspect(),
		"should return an AsyncEither:Left monad given an AsyncEither:Left monad"
	);

	assert.equal(
		operation.called,
		false,
		"should perform no operation given an AsyncEither:Left monad"
	);
});

qunit.test("#ap", (assert) => {
	const op1 = sinon.fake();
	const op2 = sinon.fake();

	assert.equal(
		AsyncEither(inc).ap(AsyncEither(2))._inspect(),
		AsyncEither(3)._inspect(),
		"should return an AsyncEither:Right(3) monad"
	);

	assert.equal(
		AsyncEither(op1).ap(AsyncEither.Left(2))._inspect(),
		AsyncEither.Left(2)._inspect(),
		"should return an AsyncEither:Left(2) monad"
	);

	assert.equal(
		op1.called,
		false,
		"should perform no operation given an AsyncEither:Left monad"
	);

	assert.equal(
		AsyncEither.Left(op2).ap(AsyncEither(2))._inspect(),
		AsyncEither.Left(op2)._inspect(),
		"should return an AsyncEither:Left(op) monad"
	);

	assert.equal(
		op2.called,
		false,
		"should perform no operation given an AsyncEither:Left monad"
	);
});

qunit.test("#concat", (assert) => {
	assert.equal(
		AsyncEither([1, 2]).concat(AsyncEither([3]))._inspect(),
		AsyncEither([1, 2, 3])._inspect(),
		"should return an array given an AsyncEither:Right monad and [3]"
	);

	assert.equal(
		AsyncEither.Left([1, 2]).concat(AsyncEither.Left([3]))._inspect(),
		AsyncEither.Left([1, 2])._inspect(),
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
		(await safeAwait(
			AsyncEither.fromFoldable(AsyncEither(1))
		))._inspect(),
		AsyncEither(1)._inspect(),
		"should return an AsyncEither:Right monad given an AsyncEither:Right monad"
	);

	assert.equal(
		(await safeAwait(
			AsyncEither.fromFoldable(AsyncEither.Left(1))
		))._inspect(),
		(await AsyncEither.Left(1))._inspect(),
		"should return an AsyncEither:Left monad from an AsyncEither:Left monad"
	);
});
