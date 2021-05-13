const qunit = require("qunit");
const { inc, justProp } = require("./utils");

qunit.module("nothing");

qunit.test("#unit", (assert) => {
	assert.equal(
		Nothing.of(1)._inspect(),
		"Nothing()",
		"should create a Nothing functor via #of"
	);

	assert.equal(
		Nothing.pure(1)._inspect(),
		"Nothing()",
		"should create a Nothing functor via #pure"
	);

	assert.equal(
		Nothing.unit(1)._inspect(),
		"Nothing()",
		"should create a Nothing functor via #unit"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		Nothing.of(1).map(inc)._inspect(),
		Nothing()._inspect(),
		"should perform no operation"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		Nothing.is(Nothing()),
		true,
		"should return true if the object passed is a Nothing functor"
	);

	assert.equal(
		Nothing.is({}),
		false,
		"should return false if the object is not a Nothing functor"
	);
});

qunit.test("#chain", (assert) => {
	assert.equal(
		Nothing.of({ name: "john" }).chain(justProp('name'))._inspect(),
		Nothing()._inspect(),
		"should perform no operation"
	);

	assert.equal(
		Nothing.of({ name: "john" }).flatMap(justProp('name'))._inspect(),
		Nothing()._inspect(),
		"should perform no operation"
	);

	assert.equal(
		Nothing.of({ name: "john" }).bind(justProp('name'))._inspect(),
		Nothing.of("john")._inspect(),
		"should perform no operation"
	);
});

qunit.test("#ap", (assert) => {
	assert.equal(
		Nothing.of(inc).ap(Nothing.of(2))._inspect(),
		Nothing()._inspect(),
		"should perform no operation"
	);
});

qunit.test("#concat", (assert) => {
	assert.deepEqual(
		Nothing.of([1, 2]).concat([3])._inspect(),
		Nothing()._inspect(),
		"should perform no operation"
	);
});
