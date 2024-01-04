"use strict";

const qunit = require("qunit");
const { EMPTY_FUNC, identity, } = MonioUtil;
const {
	INJECT_MONIO,
	inc,
	twice,
	stateProp,
	asyncStateProp,
	asyncStateVal,
} = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, State, IO, IOx });

qunit.module("state");

qunit.test("#_inspect", (assert) => {
	assert.ok(
		/^State\(\w+\)$/.test(State()._inspect()),
		"should create a State with a default function"
	);

	assert.equal(
		State(() => {})._inspect(),
		"State(anonymous function)",
		"should create a State with an anonymous function"
	);

	assert.equal(
		State(EMPTY_FUNC)._inspect(),
		"State(EMPTY_FUNC)",
		"should create a State with named function"
	);

	assert.equal(
		State(null)._inspect(),
		"State(null)",
		"should create a State with (invalid!) null value instead of function"
	);
});

qunit.test("#unit", (assert) => {
	assert.deepEqual(
		State.of(1).evaluate(2),
		{ value: 1, state: 2 },
		"should create a State functor via #of"
	);

	assert.deepEqual(
		State.pure(1).evaluate(2),
		{ value: 1, state: 2 },
		"should create a State functor via #pure"
	);

	assert.deepEqual(
		State.unit(1).evaluate(2),
		{ value: 1, state: 2 },
		"should create a State functor via #unit"
	);

	assert.deepEqual(
		State(st => ({ value: 1, state: st })).evaluate(2),
		{ value: 1, state: 2 },
		"should create a State holding an anonymous function"
	);

	assert.deepEqual(
		State().evaluate(2),
		{ value: undefined, state: 2 },
		"should create a State holding the default anonymous function"
	);
});

qunit.test("#map", (assert) => {
	assert.deepEqual(
		State.of(1).map(inc).map(twice).evaluate(2),
		State.of(1).map(x => twice(inc(x))).evaluate(2),
		"should follow the composition law"
	);

	assert.deepEqual(
		State.of(1).map(identity).evaluate(2),
		{ value: 1, state: 2 },
		"should follow the identity law"
	);
});

qunit.test("#map:async", async (assert) => {
	const incPr = v => Promise.resolve(inc(v));
	const twicePr = v => Promise.resolve(twice(v));

	assert.deepEqual(
		await asyncStateVal(1).map(inc).map(twice).evaluate(2),
		{ value: 4, state: 2 },
		"async+sync: should follow the composition law"
	);

	assert.deepEqual(
		await State.of(1).map(incPr).map(twicePr).evaluate(2),
		{ value: 4, state: 2 },
		"sync+async: should follow the composition law"
	);

	assert.deepEqual(
		await asyncStateVal(1).map(incPr).map(twicePr).evaluate(2),
		{ value: 4, state: 2 },
		"async+async: should follow the composition law"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		State.is(State.of(1)),
		true,
		"should return true if the object passed is a state monad"
	);

	assert.equal(
		State.is({}),
		false,
		"should return false if the object is not a state monad"
	);
});

qunit.test("#chain", (assert) => {
	assert.deepEqual(
		State.of({ name: "john" }).chain(stateProp("name")).evaluate(2),
		{ value: "john", state: 2 },
		"should return a state with 'john' as a value (chain)"
	);

	assert.deepEqual(
		State.of({ name: "john" }).flatMap(stateProp("name")).evaluate(2),
		{ value: "john", state: 2 },
		"should return a state with 'john' as value (flatMap)"
	);

	assert.deepEqual(
		State.of({ name: "john" }).bind(stateProp("name")).evaluate(2),
		{ value: "john", state: 2 },
		"should return a state with 'john' as value (bind)"
	);
});

qunit.test("#chain:async", async (assert) => {
	assert.deepEqual(
		await asyncStateVal({ name: "john" }).chain(stateProp("name")).evaluate(2),
		{ value: "john", state: 2 },
		"async+sync: should return a state with 'john' as a value"
	);

	assert.deepEqual(
		await State.of({ name: "john" }).chain(asyncStateProp("name")).evaluate(2),
		{ value: "john", state: 2 },
		"sync+async: should return a state with 'john' as a value"
	);

	assert.deepEqual(
		await asyncStateVal({ name: "john" }).chain(asyncStateProp("name")).evaluate(2),
		{ value: "john", state: 2 },
		"async+async: should return a state with 'john' as a value"
	);

	assert.deepEqual(
		await asyncStateVal({ name: "john" }).chain(v => Promise.resolve(asyncStateProp("name")(v))).evaluate(2),
		{ value: "john", state: 2 },
		"async+async+async: should return a state with 'john' as a value"
	);
});

qunit.test("#chain:state-change", async (assert) => {
	assert.deepEqual(
		await State.of("john").chain(v => State(st => ({ value: v, state: st + 1 }))).evaluate(2),
		{ value: "john", state: 3 },
		"sync+sync: should return a state with 'john' as a value and 'state' incremented"
	);

	assert.deepEqual(
		await asyncStateVal("john").chain(v => State(st => ({ value: v, state: st + 1 }))).evaluate(2),
		{ value: "john", state: 3 },
		"async+sync: should return a state with 'john' as a value and 'state' incremented"
	);

	assert.deepEqual(
		await State.of("john").chain(v => State(st => Promise.resolve({ value: v, state: st + 1 }))).evaluate(2),
		{ value: "john", state: 3 },
		"sync+async: should return a state with 'john' as a value and 'state' incremented"
	);

	assert.deepEqual(
		await asyncStateVal("john").chain(v => State(st => Promise.resolve({ value: v, state: st + 1 }))).evaluate(2),
		{ value: "john", state: 3 },
		"async+async: should return a state with 'john' as a value and 'state' incremented"
	);
});

qunit.test("#concat", async (assert) => {
	assert.deepEqual(
		State.of([1, 2]).concat(State.of([3])).evaluate(2),
		{ value: [1, 2, 3], state: 2 },
		"sync+sync: should concat two arrays in state monads together into a new monad"
	);

	assert.deepEqual(
		await asyncStateVal([1, 2]).concat(State.of([3])).evaluate(2),
		{ value: [1, 2, 3], state: 2 },
		"async+sync: should concat two arrays in state monads together into a new monad"
	);

	assert.deepEqual(
		await State.of([1, 2]).concat(asyncStateVal([3])).evaluate(2),
		{ value: [1, 2, 3], state: 2 },
		"sync+async: should concat two arrays in state monads together into a new monad"
	);

	assert.deepEqual(
		await asyncStateVal([1, 2]).concat(asyncStateVal([3])).evaluate(2),
		{ value: [1, 2, 3], state: 2 },
		"async+async: should concat two arrays in state monads together into a new monad"
	);
});

qunit.test("*.pipe", (assert) => {
	assert.deepEqual(
		State.of(2).map.pipe(inc,twice).evaluate(2),
		{ value: 6, state: 2 },
		"map.pipe()"
	);

	assert.deepEqual(
		State.of(2).chain.pipe(
			v => State.of(inc(v)),
			v => State.of(twice(v))
		).evaluate(2),
		{ value: 6, state: 2 },
		"chain.pipe()"
	);

	assert.deepEqual(
		State.of([1,2]).concat.pipe(
			State.of([3,4]),
			State.of([5,6])
		).evaluate(2),
		{ value: [1,2,3,4,5,6], state: 2 },
		"concat.pipe()"
	);
});

qunit.test("*.pipe:async", async (assert) => {
	const incPr = v => Promise.resolve(inc(v));
	const twicePr = v => Promise.resolve(twice(v));

	assert.deepEqual(
		await State.of(2).map.pipe(inc,twicePr,inc).evaluate(2),
		{ value: 7, state: 2 },
		"sync+async: map.pipe()"
	);

	assert.deepEqual(
		await asyncStateVal(2).map.pipe(inc,twice,inc).evaluate(2),
		{ value: 7, state: 2 },
		"async+sync: map.pipe()"
	);

	assert.deepEqual(
		await asyncStateVal(2).map.pipe(inc,twicePr,inc).evaluate(2),
		{ value: 7, state: 2 },
		"async+async: map.pipe()"
	);

	assert.deepEqual(
		await (asyncStateVal(2)
			.chain.pipe(
				v => State.of(inc(v)),
				v => State.of(twice(v))
			).evaluate(2)
		),
		{ value: 6, state: 2 },
		"async+sync: chain.pipe()"
	);

	assert.deepEqual(
		await (State.of(2)
			.chain.pipe(
				v => asyncStateVal(inc(v)),
				v => asyncStateVal(twice(v))
			).evaluate(2)
		),
		{ value: 6, state: 2 },
		"sync+async: chain.pipe()"
	);

	assert.deepEqual(
		await (asyncStateVal(2)
			.chain.pipe(
				v => asyncStateVal(inc(v)),
				v => asyncStateVal(twice(v))
			).evaluate(2)
		),
		{ value: 6, state: 2 },
		"async+async: chain.pipe()"
	);

	assert.deepEqual(
		await (asyncStateVal([1,2])
			.concat.pipe(
				State.of([3,4]),
				State.of([5,6])
			).evaluate(2)
		),
		{ value: [1,2,3,4,5,6], state: 2 },
		"async+sync: concat.pipe()"
	);

	assert.deepEqual(
		await (State.of([1,2])
			.concat.pipe(
				asyncStateVal([3,4]),
				asyncStateVal([5,6])
			).evaluate(2)
		),
		{ value: [1,2,3,4,5,6], state: 2 },
		"sync+async: concat.pipe()"
	);

	assert.deepEqual(
		await (asyncStateVal([1,2])
			.concat.pipe(
				asyncStateVal([3,4]),
				asyncStateVal([5,6])
			).evaluate(2)
		),
		{ value: [1,2,3,4,5,6], state: 2 },
		"async+async: concat.pipe()"
	);
});

qunit.test("State.get", (assert) => {
	assert.deepEqual(
		State.get().evaluate(2),
		{ value: 2, state: 2 },
		"marshals state into value"
	);

	assert.deepEqual(
		State.get().chain(st => State.of(st + 1)).evaluate(2),
		{ value: 3, state: 2 },
		"marshals state into value, updates value (but not state)"
	);

	assert.deepEqual(
		State.get().chain(st => State(st2 => ({ value: st + 1, state: st2 + 1 }))).evaluate(2),
		{ value: 3, state: 3 },
		"marshals state into value, updates value *and* state"
	);

	assert.deepEqual(
		State.of(1).chain(v => State.get()).evaluate(2),
		{ value: 2, state: 2 },
		"override value with state"
	);
});

qunit.test("State.put", (assert) => {
	assert.deepEqual(
		State.put(3).evaluate(2),
		{ value: undefined, state: 3 },
		"force state"
	);

	assert.deepEqual(
		State.of(1).chain(v => State.put(3)).evaluate(2),
		{ value: undefined, state: 3 },
		"force override value and state"
	);
});
