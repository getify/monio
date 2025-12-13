"use strict";

const qunit = require("qunit");
const sinon = require("sinon");
const { identity, } = MonioUtil;
const { INJECT_MONIO, inc, twice, justProp, } = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, State, IO, IOx });

qunit.module("nothing");

qunit.test("#_inspect", (assert) => {
	assert.equal(
		Nothing.of(1)._inspect(),
		"Nothing()",
		"_inspect() value is as expected"
	);

	assert.equal(
		Nothing.of(1).toString(),
		"Nothing()",
		"toString() value is as expected"
	);

	assert.equal(
		"" + Nothing.of(1),
		"Nothing()",
		"toPrimitive value is as expected"
	);
});

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
		"is() should return true if the object passed is a Nothing functor"
	);

	assert.equal(
		Nothing() instanceof Nothing,
		true,
		"instanceof should return true if the object is a Nothing functor"
	);

	assert.equal(
		Nothing.is({}),
		false,
		"is() should return false if the object is not a Nothing functor"
	);

	assert.equal(
		{} instanceof Nothing,
		false,
		"instanceof should return false if the object is not a Nothing functor"
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

qunit.test("*.pipe", (assert) => {
	assert.equal(
		Nothing.of(2).map.pipe(inc,twice)._inspect(),
		Nothing()._inspect(),
		"map.pipe()"
	);

	assert.equal(
		Nothing.of(2).chain.pipe(
			v => Nothing.of(inc(v)),
			v => Nothing.of(twice(v))
		)._inspect(),
		Nothing()._inspect(),
		"chain.pipe()"
	);

	assert.equal(
		Nothing.of(x => y => x + y).ap.pipe(
			Nothing.of(2),
			Nothing.of(3)
		)._inspect(),
		Nothing()._inspect(),
		"ap.pipe()"
	);

	assert.equal(
		Nothing.of([1,2]).concat.pipe(
			Nothing.of([3,4]),
			Nothing.of([5,6])
		)._inspect(),
		Nothing()._inspect(),
		"concat.pipe()"
	);
});

qunit.test("Symbol.iterator", (assert) => {
	function *iter() {
		yield *(Nothing(1));
		yield *(Nothing(2));
		return yield *(Nothing(3));
	}

	var res = [ ...iter() ].map(v => v.toString());

	assert.deepEqual(
		res,
		[ "Nothing()", "Nothing()", "Nothing()", ],
		"Nothing() is a yield* delegatable iterable"
	);
});
