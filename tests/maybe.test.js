"use strict";

const qunit = require("qunit");
const sinon = require("sinon");
const { identity, } = MonioUtil;
const { INJECT_MONIO, inc, twice, maybeProp, } = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, State, IO, IOx });

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
	const operation = sinon.fake();

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

	assert.equal(
		Maybe.Nothing().map(operation)._inspect(),
		Maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		operation.called,
		false,
		"should not call operation on a Maybe:Nothing monad"
	);
});

qunit.test("#chain", (assert) => {
	const op1 = sinon.fake();
	const op2 = sinon.fake();
	const op3 = sinon.fake();

	assert.equal(
		Maybe({ name: "john" }).chain(maybeProp("name"))._inspect(),
		Maybe.Just("john")._inspect(),
		"should return a Maybe:Just('john') monad"
	);

	assert.equal(
		Maybe.Nothing().chain(op1)._inspect(),
		Maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		op1.called,
		false,
		"should not call operation on a Maybe:Nothing monad"
	);

	assert.equal(
		Maybe({ name: "john" }).flatMap(maybeProp("name"))._inspect(),
		Maybe.Just("john")._inspect(),
		"should return a Maybe:Just('john') monad"
	);

	assert.equal(
		Maybe.Nothing().flatMap(op2)._inspect(),
		Maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		op2.called,
		false,
		"should not call operation on a Maybe:Nothing monad"
	);

	assert.equal(
		Maybe({ name: "john" }).bind(maybeProp("name"))._inspect(),
		Maybe.Just("john")._inspect(),
		"should return a Maybe:Just('john') monad"
	);

	assert.equal(
		Maybe.Nothing().bind(op3)._inspect(),
		Maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		op3.called,
		false,
		"should not call operation on a Maybe:Nothing monad"
	);
});

qunit.test("#ap", (assert) => {
	const operation = sinon.fake();

	assert.equal(
		Maybe.of(inc).ap(Maybe.Just(2))._inspect(),
		Maybe.Just(3)._inspect(),
		"should return a Maybe:Just(3) monad"
	);

	assert.equal(
		Maybe.Nothing().ap(operation)._inspect(),
		Maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);

	assert.equal(
		operation.called,
		false,
		"should not call operation on a Maybe:Nothing monad"
	);
});

qunit.test("#concat", (assert) => {
	assert.equal(
		Maybe.of([1, 2]).concat(Maybe.of([3]))._inspect(),
		Maybe.of([1, 2, 3])._inspect(),
		"should concat two arrays in Maybe:Just monads together into a new monad"
	);

	assert.equal(
		Maybe.Nothing().concat(Maybe.of([3]))._inspect(),
		Maybe.Nothing()._inspect(),
		"should perform no operation on a Maybe:Nothing monad"
	);
});

qunit.test("#fold", (assert) => {
	const op1 = sinon.fake();
	const op2 = sinon.fake();

	assert.equal(
		Maybe.Just("john").fold(op1,identity),
		"john",
		"should call the right side of the fold on Maybe:Just"
	);

	assert.equal(
		op1.called,
		false,
		"should not call the left side of the fold on Maybe:Just"
	);

	assert.equal(
		Maybe.Nothing().fold(() => "no-value",op2),
		"no-value",
		"should call the left side of the fold on Maybe:Nothing"
	);

	assert.equal(
		op2.called,
		false,
		"should not call the right side of the fold on Maybe:Nothing"
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

qunit.test("*.pipe", (assert) => {
	assert.equal(
		Maybe.of(2).map.pipe(inc,twice).fold(identity,identity),
		6,
		"map.pipe()"
	);

	assert.equal(
		Maybe.of(2).chain.pipe(
			v => Maybe.of(inc(v)),
			v => Maybe.of(twice(v))
		).fold(identity,identity),
		6,
		"chain.pipe()"
	);

	assert.equal(
		Maybe.of(x => y => x + y).ap.pipe(
			Maybe.of(2),
			Maybe.of(3)
		).fold(identity,identity),
		5,
		"ap.pipe()"
	);

	assert.deepEqual(
		Maybe.of([1,2]).concat.pipe(
			Maybe.of([3,4]),
			Maybe.of([5,6])
		).fold(identity,identity),
		[1,2,3,4,5,6],
		"concat.pipe()"
	);
});
