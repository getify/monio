"use strict";

const qunit = require("qunit");
const { identity, } = MonioUtil;
const { INJECT_MONIO, inc, twice, justProp, } = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, State, IO, IOx });

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

	assert.equal(
		Just(() => {})._inspect(),
		"Just(anonymous function)",
		"should create a Just holding an anonymous function"
	);

	assert.equal(
		Just([ null, undefined, false, 42 ])._inspect(),
		"Just([null,undefined,false,42])",
		"should create a Just holding an array of values"
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

qunit.test("#fold", (assert) => {
	assert.equal(
		Just(3).fold(identity),
		3,
		"fold(identity) extracts the value"
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

qunit.test("*.pipe", (assert) => {
	assert.equal(
		Just.of(2).map.pipe(inc,twice).fold(identity),
		6,
		"map.pipe()"
	);

	assert.equal(
		Just.of(2).chain.pipe(
			v => Just.of(inc(v)),
			v => Just.of(twice(v))
		).fold(identity),
		6,
		"chain.pipe()"
	);

	assert.equal(
		Just.of(x => y => x + y).ap.pipe(
			Just.of(2),
			Just.of(3)
		).fold(identity),
		5,
		"ap.pipe()"
	);

	assert.deepEqual(
		Just.of([1,2]).concat.pipe(
			Just.of([3,4]),
			Just.of([5,6])
		).fold(identity),
		[1,2,3,4,5,6],
		"concat.pipe()"
	);
});
