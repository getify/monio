const qunit = require("qunit");
const sinon = require("sinon");
const { identity, inc, twice, maybeProp } = require("./utils");

qunit.module("maybe");

qunit.test("#unit", (assert) => {
	assert.equal(
		Maybe(1)._inspect(),
		"Maybe:Just(1)",
		"should create a Maybe:Just monad via constructor"
	);

	assert.equal(
		Maybe.of(1)._inspect(),
		"Maybe:Just(1)",
		"should create a Maybe:Just monad via #of"
	);

	assert.equal(
		Maybe.pure(1)._inspect(),
		"Maybe:Just(1)",
		"should create a Maybe:Just monad via #pure"
	);

	assert.equal(
		Maybe.unit(1)._inspect(),
		"Maybe:Just(1)",
		"should create a Maybe:Just monad via #unit"
	);

	assert.equal(
		Maybe.Just(1)._inspect(),
		Maybe(1)._inspect(),
		"should create a Maybe:Just monad via #Just"
	);

	assert.equal(
		Maybe.of(Just.of(1))._inspect(),
		Maybe.of(1)._inspect(),
		"should create a Maybe:Just monad from a Just value"
	);

	assert.equal(
		Maybe.of(Maybe.of(1))._inspect(),
		"Maybe:Just(Maybe:Just(1))",
		"should create a Maybe:Just(Maybe:Just) monad from a Maybe:Just value"
	);

});

qunit.test("#Nothing", (assert) => {
	assert.equal(
		Maybe.Nothing()._inspect(),
		"Maybe:Nothing()",
		"should create a Maybe:Nothing monad"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		Maybe.of(1).map(identity)._inspect(),
		Maybe.of(1)._inspect(),
		"should follow the identity law for a Maybe:Just monad"
	);

	assert.equal(
		Maybe.of(1).map(inc).map(twice)._inspect(),
		Maybe.of(1).map(val => twice(inc(val)))._inspect(),
		"should follow the composition law for a Maybe:Just monad"
	);

	const operation = sinon.fake();

	assert.equal(
		Maybe.Nothing().map(operation)._inspect(),
		Maybe.Nothing()._inspect(),
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
		Maybe({ name: "john" }).chain(maybeProp("name"))._inspect(),
		Maybe.Just("john")._inspect(),
		"should return a Maybe:Just('john') monad"
	);

	const operation = sinon.fake();

	assert.equal(
		Maybe.Nothing().chain(operation)._inspect(),
		Maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		Maybe({ name: "john" }).flatMap(maybeProp("name"))._inspect(),
		Maybe.Just("john")._inspect(),
		"should return a Maybe:Just('john') monad"
	);

	assert.equal(
		Maybe.Nothing().flatMap(operation)._inspect(),
		Maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		Maybe({ name: "john" }).bind(maybeProp("name"))._inspect(),
		Maybe.Just("john")._inspect(),
		"should return a Maybe:Just('john') monad"
	);

	assert.equal(
		Maybe.Nothing().bind(operation)._inspect(),
		Maybe.Nothing()._inspect(),
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
		Maybe.of(inc).ap(Maybe.Just(2))._inspect(),
		Maybe.Just(3)._inspect(),
		"should return a Maybe:Just(3) monad"
	);

	const operation = sinon.fake();

	assert.equal(
		Maybe.Nothing().ap(operation)._inspect(),
		Maybe.Nothing()._inspect(),
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
		Maybe.of([1, 2]).concat([3]),
		[[1, 2, 3]],
		"should concat a Maybe:Just array to an array"
	);

	assert.equal(
		Maybe.Nothing().concat([3])._inspect(),
		Maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);
});

qunit.test("#fold", (assert) => {
	assert.equal(
		Maybe.Just("john").fold(() => {}, identity),
		"john",
		"should treat it as a Maybe:Just monad"
	);

	assert.equal(
		Maybe.Nothing().fold(identity, () => {}),
		undefined,
		"should treat it as a Maybe:Nothing monad"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		Maybe.is(Maybe.Just(1)),
		true,
		"should return true if a Maybe:Just monad is passed as argument"
	);

	assert.equal(
		Maybe.is(Maybe.Nothing()),
		true,
		"should return true if a Maybe:Nothing monad is passed as argument"
	);

	assert.equal(
		Maybe.is({}),
		false,
		"should return false if a Maybe monad is not passed as argument"
	);
});

qunit.test("#from", (assert) => {
	assert.equal(
		Maybe.from(1)._inspect(),
		Maybe.Just(1)._inspect(),
		"should create a Maybe:Just monad from a value"
	);

	assert.equal(
		Maybe.from(null)._inspect(),
		Maybe.Nothing()._inspect(),
		"should create a Maybe:Nothing monad from an empty value"
	);
});
