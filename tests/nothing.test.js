"use strict";

const qunit = require("qunit");
const sinon = require("sinon");
const { identity, } = MonioUtil;
const { INJECT_MONIO, inc, justProp } = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, IO, IOx });

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

qunit.test("#fold", (assert) => {
	assert.equal(
		Nothing().fold(identity),
		undefined,
		"fold(identity) produces undefined"
	);
});

qunit.test("#ap", (assert) => {
	const op1 = sinon.fake();

	assert.equal(
		Nothing.of(v => (op1(),inc(v))).ap(Nothing.of(2))._inspect(),
		Nothing()._inspect(),
		"should perform no operation"
	);

	assert.equal(
		op1.called,
		false,
		"should not call operation on a Maybe:Nothing monad"
	);
});

qunit.test("#concat", (assert) => {
	assert.deepEqual(
		Nothing.of([1, 2]).concat(Nothing.of([3]))._inspect(),
		Nothing()._inspect(),
		"should perform no operation"
	);
});
