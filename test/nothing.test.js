const nothing = require("monio/nothing");
const qunit = require("qunit");
const { inc, justProp } = require("./utils");

qunit.module("nothing");

qunit.test("#unit", (assert) => {
	assert.equal(
		nothing.of(1)._inspect(),
		"Nothing()",
		"should create a Nothing functor via #of"
	);

	assert.equal(
		nothing.pure(1)._inspect(),
		"Nothing()",
		"should create a Nothing functor via #pure"
	);

	assert.equal(
		nothing.unit(1)._inspect(),
		"Nothing()",
		"should create a Nothing functor via #unit"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		nothing.of(1).map(inc)._inspect(),
		nothing()._inspect(),
		"should perform no operation"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		nothing.is(nothing()),
		true,
		"should return true if the object passed is a Nothing functor"
	);

	assert.equal(
		nothing.is({}),
		false,
		"should return false if the object is not a Nothing functor"
	);
});

qunit.test("#chain", (assert) => {
	assert.equal(
		nothing.of({ name: "john" }).chain(justProp('name'))._inspect(),
		nothing()._inspect(),
		"should perform no operation"
	);

	assert.equal(
		nothing.of({ name: "john" }).flatMap(justProp('name'))._inspect(),
		nothing()._inspect(),
		"should perform no operation"
	);

	assert.equal(
		nothing.of({ name: "john" }).bind(justProp('name'))._inspect(),
		nothing.of("john")._inspect(),
		"should perform no operation"
	);
});

qunit.test("#ap", (assert) => {
	assert.equal(
		nothing.of(inc).ap(nothing.of(2))._inspect(),
		nothing()._inspect(),
		"should perform no operation"
	);
});

qunit.test("#concat", (assert) => {
	assert.deepEqual(
		nothing.of([1, 2]).concat([3])._inspect(),
		nothing()._inspect(),
		"should perform no operation"
	);
});
