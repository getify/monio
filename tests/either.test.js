const qunit = require("qunit");
const sinon = require("sinon");
const { identity, inc, twice, eitherProp } = require("./utils");

qunit.module("either");

qunit.test("Either:Right construction/creation", (assert) => {
	assert.equal(
		Either(1)._inspect(),
		"Either:Right(1)",
		"should create a Either:Right monad via constructor"
	);

	assert.equal(
		Either.of(1)._inspect(),
		"Either:Right(1)",
		"should create a Either:Right monad via #of"
	);

	assert.equal(
		Either.pure(1)._inspect(),
		"Either:Right(1)",
		"should create a Either:Right monad via #pure"
	);

	assert.equal(
		Either.unit(1)._inspect(),
		"Either:Right(1)",
		"should create a Either:Right monad via #unit"
	);

	assert.equal(
		Either.Right(1)._inspect(),
		"Either:Right(1)",
		"should create a Either:Right via #Right"
	);
});

qunit.test("Either:Left construction/creation", (assert) => {
	assert.equal(
		Either.Left(1)._inspect(),
		"Either:Left(1)",
		"should create a Either:Left monad via constructor"
	);
});

qunit.test("#Left.is", (assert) => {
	assert.equal(
		Either.Left.is(Either.Left(1)),
		true,
		"should return true when the object provided is a Either:Left monad"
	);

	assert.equal(
		Either.Left.is(Either(1)),
		false,
		"should return false when the object provided is not a Either:Left monad"
	);
});

qunit.test("#Right.is", (assert) => {
	assert.equal(
		Either.Right.is(Either(1)),
		true,
		"should return true when the object provided is a Either:Right monad"
	);

	assert.equal(
		Either.Right.is(Either.Left(1)),
		false,
		"should return false when the object provided is not an Either:Right monad"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		Either(1).map(identity)._inspect(),
		Either(1)._inspect(),
		"should follow the identity law given a Either:Right monad"
	);

	assert.equal(
		Either(1).map(x => twice(inc(x)))._inspect(),
		Either(1).map(inc).map(twice)._inspect(),
		"should follow the composition law given a Either:Right monad"
	);

	const operation = sinon.fake();

	assert.equal(
		Either.Left(1).map(operation)._inspect(),
		Either.Left(1)._inspect(),
		"should return a Either:Left monad given a Either:Left monad"
	);


	assert.equal(
		operation.called,
		false,
		"should perform no operation given a Either:Left monad"
	);
});

qunit.test("#chain", (assert) => {
	assert.equal(
		Either({ name: "john" }).chain(eitherProp("name"))._inspect(),
		Either("john")._inspect(),
		"should return an Either:Right('john') monad"
	);

	const operation = sinon.fake();

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
		"should perform no operation given a Either:Left monad"
	);
});

qunit.test("#ap", (assert) => {
	assert.equal(
		Either(inc).ap(Either(2))._inspect(),
		Either(3)._inspect(),
		"should return a Either:Right(3) monad"
	);

	const operation = sinon.fake();

	assert.equal(
		Either(operation).ap(Either.Left(2))._inspect(),
		Either.Left(2)._inspect(),
		"should return a Either:Left(2) monad"
	);

	assert.equal(
		Either.Left(operation).ap(Either(2))._inspect(),
		Either.Left(operation)._inspect(),
		"should return a Either:Left(op) monad"
	);

	assert.equal(
		operation.called,
		false,
		"should perform no operation given a Either:Left monad"
	);
});

qunit.test("#concat", (assert) => {
	assert.deepEqual(
		Either([1, 2]).concat([3]),
		[[1, 2, 3]],
		"should return an array given a Either:Right monad and [3]"
	);

	assert.equal(
		Either.Left([1, 2, 3]).concat([3])._inspect(),
		Either.Left([1, 2, 3])._inspect(),
		"should not perform a concat operation given a Either:Left monad"
	);
});

qunit.test("#fold", (assert) => {
	assert.equal(
		Either("john").fold(() => {}, identity),
		"john",
		"should invoke the second function given an Either:Right monad"
	);

	assert.equal(
		Either.Left(1).fold(identity, () => {}),
		1,
		"should invoke the first function given an Either:Left monad"
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
