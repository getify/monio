const qunit = require("qunit");
const sinon = require("sinon");
const either = require("monio/either");
const { identity, inc, twice, eitherProp } = require("./utils");

qunit.module("either");

qunit.test("Either Right construction/creation", (assert) => {
	assert.equal(
		either(1)._inspect(),
		"Either:Right(1)",
		"should create a Either Right monad via constructor"
	);

	assert.equal(
		either.of(1)._inspect(),
		"Either:Right(1)",
		"should create a Either Right monad via #of"
	);

	assert.equal(
		either.pure(1)._inspect(),
		"Either:Right(1)",
		"should create a Either Right monad via #pure"
	);

	assert.equal(
		either.unit(1)._inspect(),
		"Either:Right(1)",
		"should create a Either Right monad via #unit"
	);

	assert.equal(
		either.Right(1)._inspect(),
		"Either:Right(1)",
		"should create a Either Right via #Right"
	);
});

qunit.test("Either Left construction/creation", (assert) => {
	assert.equal(
		either.Left(1)._inspect(),
		"Either:Left(1)",
		"should create a Either Left monad via constructor"
	);
});

qunit.test("#Left.is", (assert) => {
	assert.equal(
		either.Left.is(either.Left(1)),
		true,
		"should return true when the object provided is a Either Left monad"
	);

	assert.equal(
		either.Left.is(either(1)),
		false,
		"should return false when the object provided is not a Either Left monad"
	);
});

qunit.test("#Right.is", (assert) => {
	assert.equal(
		either.Right.is(either(1)),
		true,
		"should return true when the object provided is a Either Right monad"
	);

	assert.equal(
		either.Right.is(either.Left(1)),
		false,
		"should return false when the object provided is not an Either Right monad"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		either(1).map(identity)._inspect(),
		either(1)._inspect(),
		"should follow the identity law given a Either Right monad"
	);

	assert.equal(
		either(1).map(x => twice(inc(x)))._inspect(),
		either(1).map(inc).map(twice)._inspect(),
		"should follow the composition law given a Either Right monad"
	);

	const operation = sinon.fake();

	assert.equal(
		either.Left(1).map(operation)._inspect(),
		either.Left(1)._inspect(),
		"should return a Either Left monad given a Either Left monad"
	);


	assert.equal(
		operation.called,
		false,
		"should perform no operation given a Either Left monad"
	);
});

qunit.test("#chain", (assert) => {
	assert.equal(
		either({ name: "john" }).chain(eitherProp("name"))._inspect(),
		either("john")._inspect(),
		"should return an Either Right monad with 'john' as value"
	);

	const operation = sinon.fake();

	assert.equal(
		either.Left({ name: "john" }).chain(operation)._inspect(),
		either.Left({ name: "john" })._inspect(),
		"should return an Either Left monad given an Either Left monad"
	);

	assert.equal(
		either({ name: "john" }).flatMap(eitherProp("name"))._inspect(),
		either("john")._inspect(),
		"should return an Either Right monad with 'john' as value"
	);

	assert.equal(
		either.Left({ name: "john" }).flatMap(operation)._inspect(),
		either.Left({ name: "john" })._inspect(),
		"should return an Either Left monad given an Either Left monad"
	);

	assert.equal(
		either({ name: "john" }).bind(eitherProp('name'))._inspect(),
		either("john")._inspect(),
		"should return an Either Right monad with 'john' as value"
	);

	assert.equal(
		either.Left({ name: "john" }).bind(operation)._inspect(),
		either.Left({ name: "john" })._inspect(),
		"should return an Either Left monad given an Either Left monad"
	);

	assert.equal(
		operation.called,
		false,
		"should perform no operation given a Either Left monad"
	);
});

qunit.test("#ap", (assert) => {
	assert.equal(
		either(inc).ap(either(2))._inspect(),
		either(3)._inspect(),
		"should return a Either Right 4 monad given an Either Right inc monad and an Either Right 2 monad"
	);

	const operation = sinon.fake();

	assert.equal(
		either(operation).ap(either.Left(2))._inspect(),
		either.Left(2)._inspect(),
		"should return a Either Left 2 monad given an Either Right op monad and an Either Left 2 monad"
	);

	assert.equal(
		either.Left(operation).ap(either(2))._inspect(),
		either.Left(operation)._inspect(),
		"should return a Either Left op monad given an Either Left op monad and an Either Left 2 monad"
	);

	assert.equal(
		operation.called,
		false,
		"should perform no operation given a Either Left monad"
	);
});

qunit.test("#concat", (assert) => {
	assert.deepEqual(
		either([1, 2]).concat([3]),
		[[1, 2, 3]],
		"should return an array given a Either Right monad and [3]"
	);

	assert.equal(
		either.Left([1, 2, 3]).concat([3])._inspect(),
		either.Left([1, 2, 3])._inspect(),
		"should not perform a concat operation given a Either Left monad"
	);
});

qunit.test("#fold", (assert) => {
	assert.equal(
		either("john").fold(() => {}, identity),
		"john",
		"should invoke the second function given an Either Right monad"
	);

	assert.equal(
		either.Left(1).fold(identity, () => {}),
		1,
		"should invoke the first function given an Either Left monad"
	);
});

qunit.test("#fromFoldable", (assert) => {
	assert.equal(
		either.fromFoldable(either(1))._inspect(),
		either(1)._inspect(),
		"should return an Either Right monad given an Either Right monad"
	);

	assert.equal(
		either.fromFoldable(either.Left(1))._inspect(),
		either.Left(1)._inspect(),
		"should return an Either Left monad from an Either Left monad"
	);
});
