"use strict";

const qunit = require("qunit");
const sinon = require("sinon");
const { identity, inc, twice, eitherProp } = require("./utils");

qunit.module("either");

qunit.test("Either:Right construction/creation", (assert) => {
	assert.equal(
		Either(1)._inspect(),
		"Either:Right(1)",
		"should create an Either:Right monad via constructor"
	);

	assert.equal(
		Either.of(1)._inspect(),
		"Either:Right(1)",
		"should create an Either:Right monad via #of"
	);

	assert.equal(
		Either.pure(1)._inspect(),
		"Either:Right(1)",
		"should create an Either:Right monad via #pure"
	);

	assert.equal(
		Either.unit(1)._inspect(),
		"Either:Right(1)",
		"should create an Either:Right monad via #unit"
	);

	assert.equal(
		Either.Right(1)._inspect(),
		"Either:Right(1)",
		"should create an Either:Right via #Right"
	);
});

qunit.test("Either:Left construction/creation", (assert) => {
	assert.equal(
		Either.Left(1)._inspect(),
		"Either:Left(1)",
		"should create an Either:Left monad via constructor"
	);
});

qunit.test("#Left.is", (assert) => {
	assert.equal(
		Either.Left.is(Either.Left(1)),
		true,
		"should return true when the object provided is an Either:Left monad"
	);

	assert.equal(
		Either.Left.is(Either(1)),
		false,
		"should return false when the object provided is not an Either:Left monad"
	);
});

qunit.test("#Right.is", (assert) => {
	assert.equal(
		Either.Right.is(Either(1)),
		true,
		"should return true when the object provided is an Either:Right monad"
	);

	assert.equal(
		Either.Right.is(Either.Left(1)),
		false,
		"should return false when the object provided is not an Either:Right monad"
	);
});

qunit.test("#map", (assert) => {
	const operation = sinon.fake();

	assert.equal(
		Either(1).map(identity)._inspect(),
		Either(1)._inspect(),
		"should follow the identity law given an Either:Right monad"
	);

	assert.equal(
		Either(1).map(x => twice(inc(x)))._inspect(),
		Either(1).map(inc).map(twice)._inspect(),
		"should follow the composition law given an Either:Right monad"
	);

	assert.equal(
		Either.Left(1).map(operation)._inspect(),
		Either.Left(1)._inspect(),
		"should return an Either:Left monad given an Either:Left monad"
	);

	assert.equal(
		operation.called,
		false,
		"should perform no operation given an Either:Left monad"
	);
});

qunit.test("#chain", (assert) => {
	const operation = sinon.fake();

	assert.equal(
		Either({ name: "john" }).chain(eitherProp("name"))._inspect(),
		Either("john")._inspect(),
		"should return an Either:Right('john') monad"
	);

	assert.equal(
		Either.Left({ name: "john" }).chain(operation)._inspect(),
		Either.Left({ name: "john" })._inspect(),
		"should return an Either:Left monad given an Either:Left monad"
	);

	assert.equal(
		Either({ name: "john" }).flatMap(eitherProp("name"))._inspect(),
		Either("john")._inspect(),
		"should return an Either:Right('john') monad"
	);

	assert.equal(
		Either.Left({ name: "john" }).flatMap(operation)._inspect(),
		Either.Left({ name: "john" })._inspect(),
		"should return an Either:Left monad given an Either:Left monad"
	);

	assert.equal(
		Either({ name: "john" }).bind(eitherProp('name'))._inspect(),
		Either("john")._inspect(),
		"should return an Either:Right('john') monad"
	);

	assert.equal(
		Either.Left({ name: "john" }).bind(operation)._inspect(),
		Either.Left({ name: "john" })._inspect(),
		"should return an Either:Left monad given an Either:Left monad"
	);

	assert.equal(
		operation.called,
		false,
		"should perform no operation given an Either:Left monad"
	);
});

qunit.test("#ap", (assert) => {
	const op1 = sinon.fake();
	const op2 = sinon.fake();

	assert.equal(
		Either(inc).ap(Either(2))._inspect(),
		Either(3)._inspect(),
		"should return an Either:Right(3) monad"
	);

	assert.equal(
		Either(op1).ap(Either.Left(2))._inspect(),
		Either.Left(2)._inspect(),
		"should return an Either:Left(2) monad"
	);

	assert.equal(
		op1.called,
		false,
		"should perform no operation given an Either:Left monad"
	);

	assert.equal(
		Either.Left(op2).ap(Either(2))._inspect(),
		Either.Left(op2)._inspect(),
		"should return an Either:Left(op) monad"
	);

	assert.equal(
		op2.called,
		false,
		"should perform no operation given an Either:Left monad"
	);
});

qunit.test("#concat", (assert) => {
	assert.equal(
		Either([1, 2]).concat(Either([3]))._inspect(),
		Either([1, 2, 3])._inspect(),
		"should return an array given an Either:Right monad and [3]"
	);

	assert.equal(
		Either.Left([1, 2]).concat(Either.Left([3]))._inspect(),
		Either.Left([1, 2])._inspect(),
		"should not perform a concat operation given an Either:Left monad"
	);
});

qunit.test("#fold", (assert) => {
	const op1 = sinon.fake();
	const op2 = sinon.fake();

	assert.equal(
		Either("john").fold(op1,identity),
		"john",
		"should call the right side of the fold on Either:Right"
	);

	assert.equal(
		op1.called,
		false,
		"should not call the left side of the fold on Either:Right"
	);

	assert.equal(
		Either.Left(1).fold(identity,op2),
		1,
		"should call the left side of the fold on Either:Left"
	);

	assert.equal(
		op2.called,
		false,
		"should not call the right side of the fold on Either:Left"
	);
});

qunit.test("#fromFoldable", (assert) => {
	assert.equal(
		Either.fromFoldable(Either(1))._inspect(),
		Either(1)._inspect(),
		"should return an Either:Right monad given an Either:Right monad"
	);

	assert.equal(
		Either.fromFoldable(Either.Left(1))._inspect(),
		Either.Left(1)._inspect(),
		"should return an Either:Left monad from an Either:Left monad"
	);
});
