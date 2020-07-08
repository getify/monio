const just = require("monio/just");
const qunit = require("qunit");

const identity = x => x;
const inc = x => x + 1;
const twice = x => x * 2;
const justProp = (key) => (obj) => just(obj[key]);

qunit.module("just");

qunit.test("#unit", (assert) => {
	assert.equal(
		just.of(1)._inspect(),
		"Just(1)",
		"should create a Just functor via #of"
	);

	assert.equal(
		just.pure(1)._inspect(),
		"Just(1)",
		"should create a Just functor via #pure"
	);

	assert.equal(
		just.unit(1)._inspect(),
		"Just(1)",
		"should create a Just functor via #unit"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		just.of(1).map(inc).map(twice)._inspect(),
		just.of(1).map(x => twice(inc(x)))._inspect(),
		"should follow the composition law"
	);

	assert.equal(
		just.of(1).map(identity)._inspect(),
		just.of(1)._inspect(),
		"should follow the identity law"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		just.is(just(1)),
		true,
		"should return true if the object passed is a just functor"
	);

	assert.equal(
		just.is({}),
		false,
		"should return false if the object is not a just functor"
	);
});

qunit.test("#chain", (assert) => {
	assert.equal(
		just({ name: "john" }).chain(justProp('name'))._inspect(),
		just("john")._inspect(),
		"should return a just with 'john' as a value"
	)

	assert.equal(
		just({ name: "john" }).flatMap(justProp('name'))._inspect(),
		just("john")._inspect(),
		"should return a just with 'john' as value"
	)

	assert.equal(
		just({ name: "john" }).bind(justProp('name'))._inspect(),
		just("john")._inspect(),
		"should return a just with 'john' as value"
	)
});

qunit.test("#ap", (assert) => {
	assert.equal(
		just.of(inc).ap(just.of(2))._inspect(),
		just.of(3)._inspect(),
		"should apply the just inc functor to the just 2 functor"
	);
});

qunit.test("#concat", (assert) => {
	assert.deepEqual(
		just.of([1, 2]).concat([3]),
		[[1, 2, 3]],
		"should concat a just array to an array"
	);
});
