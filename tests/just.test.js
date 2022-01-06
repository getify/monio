"use strict";

const qunit = require("qunit");
const { identity, inc, twice, justProp } = require("./utils");

qunit.module("just");

qunit.test("#unit", (assert) => {
	assert.equal(
		Just.of(1)._inspect(),
		"Just(1)",
		"should create a Just functor via #of"
	);

	assert.equal(
		Just.pure(1)._inspect(),
		"Just(1)",
		"should create a Just functor via #pure"
	);

	assert.equal(
		Just.unit(1)._inspect(),
		"Just(1)",
		"should create a Just functor via #unit"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		Just.of(1).map(inc).map(twice)._inspect(),
		Just.of(1).map(x => twice(inc(x)))._inspect(),
		"should follow the composition law"
	);

	assert.equal(
		Just.of(1).map(identity)._inspect(),
		Just.of(1)._inspect(),
		"should follow the identity law"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		Just.is(Just(1)),
		true,
		"should return true if the object passed is a just monad"
	);

	assert.equal(
		Just.is({}),
		false,
		"should return false if the object is not a just monad"
	);
});

qunit.test("#chain", (assert) => {
	assert.equal(
		Just({ name: "john" }).chain(justProp('name'))._inspect(),
		Just("john")._inspect(),
		"should return a just with 'john' as a value"
	);

	assert.equal(
		Just({ name: "john" }).flatMap(justProp('name'))._inspect(),
		Just("john")._inspect(),
		"should return a just with 'john' as value"
	);

	assert.equal(
		Just({ name: "john" }).bind(justProp('name'))._inspect(),
		Just("john")._inspect(),
		"should return a just with 'john' as value"
	);
});

qunit.test("#ap", (assert) => {
	assert.equal(
		Just.of(inc).ap(Just.of(2))._inspect(),
		Just.of(3)._inspect(),
		"should apply the just inc monad to the just 2 monad"
	);
});

qunit.test("#concat", (assert) => {
	assert.equal(
		Just.of([1, 2]).concat(Just.of([3]))._inspect(),
		Just.of([1, 2, 3])._inspect(),
		"should concat two arrays in just monads together into a new monad"
	);
});
