const maybe = require("monio/maybe");
const just = require("monio/just");
const qunit = require("qunit");
const { identity, inc, twice, maybeProp } = require("./utils");
const sinon = require("sinon");

qunit.module("maybe");

qunit.test("#unit", (assert) => {
	assert.equal(
		maybe(1)._inspect(),
		"Maybe:Just(1)",
		"should create a Maybe:Just monad via constructor"
	);

	assert.equal(
		maybe.of(1)._inspect(),
		"Maybe:Just(1)",
		"should create a Maybe:Just monad via #of"
	);

	assert.equal(
		maybe.pure(1)._inspect(),
		"Maybe:Just(1)",
		"should create a Maybe:Just monad via #pure"
	);

	assert.equal(
		maybe.unit(1)._inspect(),
		"Maybe:Just(1)",
		"should create a Maybe:Just monad via #unit"
	);

	assert.equal(
		maybe.Just(1)._inspect(),
		maybe(1)._inspect(),
		"should create a Maybe:Just monad via #Just"
	);

	assert.equal(
		maybe.of(just.of(1))._inspect(),
		maybe.of(1)._inspect(),
		"should create a Maybe:Just monad from a Just value"
	);
});

qunit.test("#Nothing", (assert) => {
	assert.equal(
		maybe.Nothing()._inspect(),
		"Maybe:Nothing()",
		"should create a Maybe:Nothing monad"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		maybe.of(1).map(identity)._inspect(),
		maybe.of(1)._inspect(),
		"should follow the identity law for a Maybe:Just monad"
	);

	assert.equal(
		maybe.of(1).map(inc).map(twice)._inspect(),
		maybe.of(1).map(val => twice(inc(val)))._inspect(),
		"should follow the composition law for a Maybe:Just monad"
	);

	const operation = sinon.fake();

	assert.equal(
		maybe.Nothing().map(operation)._inspect(),
		maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		operation.called,
		false,
		"should not call operation on an Maybe:Nothing monad"
	);
});

qunit.test("#chain", (assert) => {
	assert.equal(
		maybe({ name: "john" }).chain(maybeProp("name"))._inspect(),
		maybe.Just("john")._inspect(),
		"should return a Maybe:Just('john') monad"
	);

	const operation = sinon.fake();

	assert.equal(
		maybe.Nothing().chain(operation)._inspect(),
		maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		maybe({ name: "john" }).flatMap(maybeProp("name"))._inspect(),
		maybe.Just("john")._inspect(),
		"should return a Maybe:Just('john') monad"
	);

	assert.equal(
		maybe.Nothing().flatMap(operation)._inspect(),
		maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		maybe({ name: "john" }).bind(maybeProp("name"))._inspect(),
		maybe.Just("john")._inspect(),
		"should return a Maybe:Just('john') monad"
	);

	assert.equal(
		maybe.Nothing().bind(operation)._inspect(),
		maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		operation.called,
		false,
		"should not call operation on an Maybe:Nothing monad"
	);
});

qunit.test("#ap", (assert) => {
	assert.equal(
		maybe.of(inc).ap(maybe.Just(2))._inspect(),
		maybe.Just(3)._inspect(),
		"should return a Maybe:Just(3) monad"
	);

	const operation = sinon.fake();

	assert.equal(
		maybe.Nothing().ap(operation)._inspect(),
		maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		operation.called,
		false,
		"should not call operation on an Maybe:Nothing monad"
	);
});

qunit.test("#concat", (assert) => {
	assert.deepEqual(
		maybe.of([1, 2]).concat([3]),
		[[1, 2, 3]],
		"should concat a Maybe:Just array to an array"
	);

	assert.equal(
		maybe.Nothing().concat([3])._inspect(),
		maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);
});

qunit.test("#fold", (assert) => {
	assert.equal(
		maybe.Just("john").fold(() => {}, identity),
		"john",
		"should treat it as a Maybe:Just monad"
	);

	assert.equal(
		maybe.Nothing().fold(identity, () => {}),
		undefined,
		"should treat it as a Maybe:Nothing monad"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		maybe.is(maybe.Just(1)),
		true,
		"should return true if a Maybe:Just monad is passed as argument"
	);

	assert.equal(
		maybe.is(maybe.Nothing()),
		true,
		"should return true if a Maybe:Nothing monad is passed as argument"
	);

	assert.equal(
		maybe.is({}),
		false,
		"should return false if a Maybe monad is not passed as argument"
	);
});

qunit.test("#from", (assert) => {
	assert.equal(
		maybe.from(1)._inspect(),
		maybe.Just(1)._inspect(),
		"should create a Maybe:Just monad from a value"
	);

	assert.equal(
		maybe.from(null)._inspect(),
		maybe.Nothing()._inspect(),
		"should create a Maybe:Nothing monad from an empty value"
	);
});
