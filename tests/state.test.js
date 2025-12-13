"use strict";

const qunit = require("qunit");
const { EMPTY_FUNC, identity, } = MonioUtil;
const {
	INJECT_MONIO,
	inc,
	twice,
	stateProp,
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

	assert.equal(
		State.of(1)._inspect(),
		"State(anonymous function)",
		"_inspect() value is as expected"
	);

	assert.equal(
		State.of(1).toString(),
		"State(anonymous function)",
		"toString() value is as expected"
	);

	assert.equal(
		"" + State.of(1),
		"State(anonymous function)",
		"toPrimitive value is as expected"
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

qunit.test("#map:very-long", (assert) => {
	var st = State.of(1);

	for (var i = 0; i < 150000; i++) {
		st = st.map(inc);
	}

	try {
		var res = st.evaluate(2);
	}
	catch (err) {
		var res = err.toString();
	}

	assert.deepEqual(
		res,
		{ value: i + 1, state: 2 },
		"map() call stack ran very long without RangeError"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		State.is(State.of(1)),
		true,
		"is() should return true if the object passed is a state monad"
	);

	assert.equal(
		State.of(1) instanceof State,
		true,
		"instanceof should return true if the object is a state monad"
	);

	assert.equal(
		State.is({}),
		false,
		"is() should return false if the object passed is not a state monad"
	);

	assert.equal(
		{} instanceof State,
		false,
		"instanceof should return false if the object is not a state monad"
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

qunit.test("#chain:very-long", (assert) => {
	var st = State.of(1);

	for (var i = 0; i < 150000; i++) {
		st = st.chain(v => State.of(v + 1));
	}

	try {
		var res = st.evaluate(2);
	}
	catch (err) {
		var res = err.toString();
	}

	assert.deepEqual(
		res,
		{ value: i + 1, state: 2 },
		"chain() call stack ran very long without RangeError"
	);
});

qunit.test("#chain:state-change", (assert) => {
	assert.deepEqual(
		State.of("john").chain(v => State(st => ({ value: v, state: st + 1 }))).evaluate(2),
		{ value: "john", state: 3 },
		"should return a state with 'john' as a value and 'state' incremented"
	);
});

qunit.test("#ap", (assert) => {
	assert.deepEqual(
		State.of(inc).ap(State.of(2)).evaluate(2),
		{ value: 3, state: 2 },
		"sync+sync: should apply the state inc monad to the state 2 monad"
	);
});

qunit.test("#ap (equivalence with chain/map)", (assert) => {
	var u = State.of(v => v + 3);
	var v = State.of(4);

	var viaAp = u.ap(v).evaluate(2);
	var viaChainMap = u.chain(f => v.map(f)).evaluate(2);

	assert.deepEqual(viaAp, viaChainMap, "u.ap(v) ≡ u.chain(f => v.map(f))");
});

qunit.test("#ap:very-long", (assert) => {
	function addMany(v1) {
		var total = v1;
		return function next(v){
			if (v === null) return total;
			total += v;
			return next;
		};
	}

	var st = State.of(addMany);

	for (var i = 0; i < 100000; i++) {
		st = st.ap(State.of(1));
	}

	// finalize the adding
	st = st.ap(State.of(null));

	try {
		var res = st.evaluate(2);
	}
	catch (err) {
		var res = err.toString();
	}

	assert.deepEqual(
		res,
		{ value: 100000, state: 2 },
		"ap() call stack ran very long without RangeError"
	);
});

qunit.test("#concat", (assert) => {
	assert.deepEqual(
		State.of([1, 2]).concat(State.of([3])).evaluate(2),
		{ value: [1, 2, 3], state: 2 },
		"should concat two arrays in state monads together into a new monad"
	);
});

qunit.test("#concat (equivalence with chain/map for arrays)", (assert) => {
	var x = State.of([1,2]);
	var y = State.of([3,4]);

	var viaConcat = x.concat(y).evaluate(2);
	var viaChainMap = x.chain(a => y.map(b => a.concat(b))).evaluate(2);

	assert.deepEqual(viaConcat, viaChainMap, "concat threads state and lifts semigroup");
});

qunit.test("#concat:very-long", (assert) => {
	var st = State.of([ 1 ]);

	for (var i = 0; i < 25000; i++) {
		st = st.concat(State.of([ i + 2 ]));
	}

	try {
		var res = st.evaluate(2);
	}
	catch (err) {
		var res = err.toString();
	}

	assert.deepEqual(
		res,
		{ value: Array.from({ length: 25001 }).map((v,i) => i + 1), state: 2 },
		"concat() call stack ran very long without RangeError"
	);
});

qunit.test("State.do (basic sequencing and state threading)", (assert) => {
	var res = State.do(function*(){
		var a = yield State.of(2);          // value: 2
		var s0 = yield State.get();         // initial state
		yield State.put({ n: (s0.n || 0) + a });
		var s1 = yield State.get();
		return s1.n * 3;                      //  (2)*3 = 6
	}).evaluate({ n: 0 });

	assert.deepEqual(
		res,
		{ value: 6, state: { n: 2 } },
		"threads state via yielded State steps and returns final value/state"
	);
});

qunit.test("State.do (yielding plain values passes through (no state touch))", (assert) => {
	var res = State.do(function*(){
		var v = yield 123;        // plain value, not a State
		var s = yield State.get();
		return [v, s];
	}).evaluate({ k: 1 });

	assert.deepEqual(
		res,
		{ value: [123, { k: 1 }], state: { k: 1 } },
		"plain yields bind as values; state unchanged"
	);
});

qunit.test("State.do (returned State at completion is auto-evaluated)", (assert) => {
	var res = State.do(function*(){
		yield State.put({ c: 1 });
		// return a State; driver should evaluate it with current state
		return yield State.do(function*(){
			var s = yield State.get();
			yield State.put({ c: s.c + 1 });
			return "ok";
		});
	}).evaluate({ c: 0 });

	assert.deepEqual(
		res,
		{ value: "ok", state: { c: 2 } },
		"final returned State is evaluated and its state/value are reflected"
	);
});

qunit.test("State.do (get/put ordering is preserved)", (assert) => {
	var res = State.do(function*(){
		var before = yield State.get();
		yield State.put({ x: (before.x || 0) + 5 });
		var after = yield State.get();
		return [before.x || 0, after.x];
	}).evaluate({ x: 1 });

	assert.deepEqual(
		res,
		{ value: [1, 6], state: { x: 6 } },
		"observes correct before/after values and commits final state"
	);
});

qunit.test("State.do (error thrown inside yielded State bubbles - raw)", (assert) => {
	try {
		State.do(function*(){
			yield State(_ => { throw new Error("boom"); });
			return 0;
		}).evaluate({});
		assert.ok(false, "should have thrown");
	}
	catch (e) {
		assert.equal(e.message, "boom", "throws raw error from yielded State");
	}
});

qunit.test("State.do (returned State that throws during evaluation bubbles error)", (assert) => {
	try {
		State.do(function*(){
			// returning a State that will throw when auto-evaluated in 'done'
			return yield State(_ => { throw new Error("eval-fail"); });
		}).evaluate({});
		assert.ok(false, "should have thrown");
	}
	catch (e) {
		assert.equal(e.message, "eval-fail", "error from final State evaluation propagates");
	}
});

qunit.test("State.do (error thrown by generator body bubbles - raw)", (assert) => {
	try {
		State.do(function*(){
			var x = yield State.of(1);
			if (x === 1) throw new Error("bad");
			return 0;
		}).evaluate({});
		assert.ok(false, "should have thrown");
	}
	catch (e) {
		assert.equal(e.message, "bad", "throws raw error from generator");
	}
});

qunit.test("State.do (yielding Either is treated as a plain value - no unwrap/short-circuit)", (assert) => {
	var res = State.do(function*(){
		var e1 = yield Either.Right(10);   // passes through as a plain value
		var e2 = yield Either.Left("x");   // also passes through
		return { e1, e2 };
	}).evaluate({});

	assert.ok(Either.Right.is(res.value.e1), "Right(...) is passed through");
	assert.equal(res.value.e1._inspect(), "Either:Right(10)", "Right payload preserved");
	assert.ok(Either.Left.is(res.value.e2), "Left(...) is passed through");
	assert.equal(res.value.e2._inspect(), "Either:Left(\"x\")", "Left payload preserved");
	assert.deepEqual(res.state, {}, "state unchanged");
});

qunit.test("State.do (nested State.do yielded as a State runs correctly)", (assert) => {
	var inner = State.do(function*(){
		var s = yield State.get();
		return s.y + 1;
	});

	var res = State.do(function*(){
		yield State.put({ y: 2 });
		var v = yield inner;       // inner is a State value
		return v * 10;
	}).evaluate({ y: 0 });

	assert.deepEqual(
		res,
		{ value: 30, state: { y: 2 } },
		"nested program executes and result is used"
	);
});

qunit.test("State.do (map/chain inside do remain consistent)", (assert) => {
	var res = State.do(function*(){
		var a = yield State.of(10).map(x => x + 1);   // 11
		var b = yield State.of(a).chain(x => State(st => ({
			value: x * 2, state: { ...st, n: (st.n||0) + 1 }
		})));
		var s = yield State.get();
		return { a, b, n: s.n };
	}).evaluate({});

	assert.deepEqual(
		res,
		{ value: { a: 11, b: 22, n: 1 }, state: { n: 1 } },
		"functor/monad behavior matches expectations within do"
	);
});

qunit.test("State.do (accepts generator OBJECT, not just function)", (assert) => {
	function* gen(){
		var s = yield State.get();
		return s + 1;
	}
	var g = gen(); // pass iterator directly

	var res = State.do(g).evaluate(2);
	assert.deepEqual(res, { value: 3, state: 2 }, "generator object is supported");
});

qunit.test("State.do:very-long (many plain yields)", (assert) => {
	var N = 150000;

	var prog = State.do(function*(){
		let sum = 0;
		for (let i = 0; i < N; i++) {
			// yield a State each time; do() must not blow the stack
			var v = yield State.of(1);
			sum += v;
		}
		var s = yield State.get();
		return sum + s;                 // expect N + initialState
	});

	var res;
	try {
		res = prog.evaluate(2);
	}
	catch (err) {
		res = err.toString();           // catch RangeError if any
	}

	assert.deepEqual(
		res,
		{ value: N + 2, state: 2 },
		"do() handled a very long sequence of yields without RangeError"
	);
});

qunit.test("State.do:very-long (many state updates)", (assert) => {
	var N = 150000;

	var prog = State.do(function*(){
		for (let i = 0; i < N; i++) {
			let s = yield State.get();
			yield State.put(s + 1);       // increment state each step
		}
		var sf = yield State.get();
		return sf;                      // value == final state
	});

	var res;
	try {
		res = prog.evaluate(2);
	}
	catch (err) {
		res = err.toString();
	}

	assert.deepEqual(
		res,
		{ value: N + 2, state: N + 2 },
		"do() threaded and updated state over a very long sequence without RangeError"
	);
});

qunit.test("State.doEither (basic success returns Right(val))", (assert) => {
	var res = State.doEither(function*(){
		var a = yield Either.Right(2);
		var b = yield State.of(3);
		return a + b;							// 5
	}).evaluate({});

	assert.equal(
		res.value._inspect(),
		"Either:Right(5)",
		"successful program returns Right(val)"
	);
	assert.deepEqual(
		res.state,
		{},
		"state unchanged when not modified"
	);
});

qunit.test("State.doEither (yielding Either.Right binds value; Left throws Left)", (assert) => {
	// Right binds
	var res1 = State.doEither(function*(){
		var x = yield Either.Right(10);
		return x + 1;
	}).evaluate({});

	assert.equal(
		res1.value._inspect(),
		"Either:Right(11)",
		"Either.Right is unwrapped and bound"
	);

	// Left throws Left
	try {
		State.doEither(function*(){
			yield Either.Left("bad");
			return 0;							// never runs
		}).evaluate({});
		assert.ok(false, "should have thrown Left");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "thrown value is an Either.Left");
		assert.equal(e._inspect(), "Either:Left(\"bad\")", "Left payload preserved");
	}
});

qunit.test("State.doEither (yielded State returning Right continues; returning Left throws)", (assert) => {
	var step = function(ok) {
		return State(st => ({
			state: { n: (st.n || 0) + 1 },
			value: ok ? Either.Right("ok") : Either.Left("fail")
		}));
	};

	// success path
	var res1 = State.doEither(function*(){
		var a = yield step(true);				// increments n
		var b = yield State.of(a + "!");		// "ok!"
		return b;
	}).evaluate({ n: 0 });

	assert.equal(res1.value._inspect(), "Either:Right(\"ok!\")", "Right flows through");
	assert.deepEqual(res1.state, { n: 1 }, "state from successful step is committed");

	// failure path (throws Left)
	try {
		State.doEither(function*(){
			yield step(true);					// n := 1
			yield step(false);					// n := 2, then throw Left("fail")
			return "never";
		}).evaluate({ n: 0 });
		assert.ok(false, "should have thrown Left");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "throws Either.Left on failure");
		assert.equal(e._inspect(), "Either:Left(\"fail\")", "failure payload preserved");
		// Note: cannot observe committed state here via evaluate result (contract throws).
	}
});

qunit.test("State.doEither (final returned State is evaluated; preserves Either if present)", (assert) => {
	// returns a State that returns plain value -> wrapped to Right
	var res1 = State.doEither(function*(){
		return yield State(st => ({
			state: { ...st, k: 1 },
			value: "done"
		}));
	}).evaluate({});

	assert.equal(res1.value._inspect(), "Either:Right(\"done\")", "plain final value wrapped Right");
	assert.deepEqual(res1.state, { k: 1 }, "final returned State is evaluated");

	// returns a State that returns Either.Right -> preserved
	var res2 = State.doEither(function*(){
		return yield State(st => ({
			state: { ...st, k: 2 },
			value: Either.Right(99)
		}));
	}).evaluate({});

	assert.equal(res2.value._inspect(), "Either:Right(99)", "final Either.Right preserved");
	assert.deepEqual(res2.state, { k: 2 }, "state updated from final State");

	// returns a State that returns Either.Left -> throws Left
	try {
		State.doEither(function*(){
			return yield State(st => ({
				state: { ...st, k: 3 },
				value: Either.Left("nope")
			}));
		}).evaluate({});
		assert.ok(false, "should have thrown Left");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "throws Either.Left from final returned State");
		assert.equal(e._inspect(), "Either:Left(\"nope\")", "payload preserved");
	}
});

qunit.test("State.doEither (generator throw becomes thrown Left(err))", (assert) => {
	try {
		State.doEither(function*(){
			throw new Error("boom");
		}).evaluate({});
		assert.ok(false, "should have thrown Left(Error)");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "thrown as Either.Left");
		var msg = e.fold(function(err){ return err.message; }, function(){ return null; });
		assert.equal(msg, "boom", "error message preserved");
	}
});

qunit.test("State.doEither (generator throw of Left(err))", (assert) => {
	try {
		State.doEither(function*(){
			throw Either.Left("boom");
		}).evaluate({});
		assert.ok(false, "should have thrown Left(Error)");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "thrown as Either.Left");
		var msg = e.fold(function(err){ return err; }, function(){ return null; });
		assert.equal(msg, "boom", "error message preserved");
	}
});

qunit.test("State.doEither (error thrown inside yielded State becomes thrown Left(err))", (assert) => {
	try {
		State.doEither(function*(){
			yield State(_ => { throw new Error("bad"); });
			return 0;
		}).evaluate({});
		assert.ok(false, "should have thrown Left(Error)");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "thrown as Either.Left");
		var msg = e.fold(function(err){ return err.message; }, function(){ return null; });
		assert.equal(msg, "bad", "error message preserved");
	}
});

qunit.test("State.doEither (error thrown inside yielded State of Left(err))", (assert) => {
	try {
		State.doEither(function*(){
			yield State(_ => { throw Either.Left("bad"); });
			return 0;
		}).evaluate({});
		assert.ok(false, "should have thrown Left(Error)");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "thrown as Either.Left");
		var msg = e.fold(function(err){ return err; }, function(){ return null; });
		assert.equal(msg, "bad", "error message preserved");
	}
});

qunit.test("State.doEither (yielding non-State non-Either value passes through)", (assert) => {
	var res = State.doEither(function*(){
		var obj = yield { a: 1, b: 2 };		// plain value
		return obj.a + obj.b;
	}).evaluate({});

	assert.equal(res.value._inspect(), "Either:Right(3)", "plain values bind and wrap to Right on completion");
	assert.deepEqual(res.state, {}, "state unchanged");
});

qunit.test("State.doEither (Either.Right(State) is NOT auto-run - treated as plain Right value)", (assert) => {
	var inner = State.of(5);
	var res = State.doEither(function*(){
		// Right(State) unwraps to the State instance as a *value*,
		// not automatically evaluated by doEither at this point.
		var sVal = yield Either.Right(inner);
		// Ensure it's actually a State by yielding it next:
		var v = yield sVal;
		return v + 1;							// 6
	}).evaluate({});

	assert.equal(res.value._inspect(), "Either:Right(6)", "Right(State) treated as value, then run when yielded as State");
});

qunit.test("State.doEither (unwraps falsy Right values correctly)", (assert) => {
	var res0 = State.doEither(function*(){ var x = yield Either.Right(0); return x; }).evaluate({});
	var resEmpty = State.doEither(function*(){ var x = yield Either.Right(""); return x; }).evaluate({});

	assert.equal(res0.value._inspect(), "Either:Right(0)", "Right(0) binds");
	assert.equal(resEmpty.value._inspect(), 'Either:Right("")', 'Right("") binds');
});

qunit.test("State.doEither (returning plain Either.Left at done throws Left)", (assert) => {
	try {
		State.doEither(function*(){
			// normal completion returning a Left value → per contract, throw Left
			return Either.Left("end");
		}).evaluate({});
		assert.ok(false, "should have thrown Left");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "thrown value is an Either.Left");
		assert.equal(e._inspect(), 'Either:Left("end")', "payload preserved on throw");
	}
});

qunit.test("State.doEither (returning State that synchronously throws plain error)", (assert) => {
	try {
		State.doEither(function*(){
			return yield State(() => { throw new Error("end"); });
		}).evaluate({});
		assert.ok(false, "should have thrown Left");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "thrown value is an Either.Left");
		assert.equal(e._inspect(), 'Either:Left(Error: end)', "payload preserved on throw");
	}
});

qunit.test("State.doEither:very-long (many Right yields, no state changes)", (assert) => {
	var N = 150000;

	var prog = State.doEither(function*(){
		var sum = 0;
		for (let i = 0; i < N; i++) {
			var v = yield Either.Right(1);
			sum += v;
		}
		return sum;							// Right(N)
	});

	var res;
	try {
		res = prog.evaluate(2);
	}
	catch (err) {
		res = err.toString();				// if RangeError, will be a string
	}

	assert.deepEqual(
		{ value: res.value._inspect(), state: res.state },
		{ value: "Either:Right(150000)", state: 2 },
		"doEither handled a very long sequence of Right yields without RangeError"
	);
});

qunit.test("State.doEither:very-long (many state updates that each return Right)", (assert) => {
	var N = 150000;

	var step = function() {
		return State(st => ({
			state: st + 1,
			value: Either.Right(1)
		}));
	};

	var prog = State.doEither(function*(){
		var acc = 0;
		for (let i = 0; i < N; i++) {
			var x = yield step();			// increments state, returns Right(1)
			acc += x;
		}
		// acc == N, state == initial + N
		return acc;
	});

	var res;
	try {
		res = prog.evaluate(2);
	}
	catch (err) {
		res = err.toString();
	}

	// Build expected Either.Right(N) without touching internal fields
	var ok = Either.Right(150000);

	assert.equal(
		res.value._inspect(),
		ok._inspect(),
		"accumulated Right(N) without stack overflow"
	);
	assert.deepEqual(
		res.state,
		150002,
		"state incremented N times without stack overflow"
	);
});

qunit.test("State.doEither:very-long (throws Left somewhere; ensure no stack overflow on throw path)", (assert) => {
	var N = 150000;

	var step = function(i, failAt) {
		return State(st => ({
			state: st + 1,
			value: (i === failAt ? Either.Left("fail") : Either.Right(1))
		}));
	};

	try {
		State.doEither(function*(){
			var acc = 0;
			for (let i = 0; i < N; i++) {
				var x = yield step(i, N - 1);	// last step returns Left("fail")
				acc += x;
			}
			return acc;						// never reached
		}).evaluate(0);
		assert.ok(false, "should have thrown Left at the failure step");
	}
	catch (e) {
		assert.ok(Either.Left.is(e), "throws Left on failure");
		assert.equal(e._inspect(), "Either:Left(\"fail\")", "correct failure payload");
		// Note: state commit at the failing step cannot be observed via evaluate (throws by contract).
	}
});

qunit.test("State.do/doEither: yield* delegation", async (assert) => {
	function *one(r) {
		r.push(yield State.of("one 1"));
		r.push(
			yield *((function*(){
				r.push(yield State.of("one 2"));
				r.push(yield State.of("one 3"));
				return yield State.of("one 4");
			})())
		);
		r.push(yield State.of("one 5"));
		return yield State(() => {
			r.push("one 6");
			return {
				value: "one 7",
				state: null,
			};
		});
	}

	function *two(r) {
		return (
			yield *((function*(){
				r.push(yield State.of("two 1"));
				r.push(yield State.of("two 2"));
				return yield State.of("two 3");
			})())
		);
	}

	function *three() {
		return (
			yield *((function*(){
				throw "three 1";
			})())
		);
	}

	function *four() {
		return (
			yield *((function*(){
				return yield State(() => { throw "four 1"; });
			})())
		);
	}

	var r1 = [];
	var r2 = [];
	var r3;
	var r4;
	var r5 = [];
	var r6 = [];
	var r7;
	var r8;
	var st1 = State.do(one(r1));
	var st2 = State.do(two(r2));
	var st3 = State.do(three());
	var st4 = State.do(four());
	var st5 = State.doEither(one(r5));
	var st6 = State.doEither(two(r6));
	var st7 = State.doEither(three());
	var st8 = State.doEither(four());

	try {
		r1.push((await st1.evaluate()).value);
	}
	catch (err) {
		r1 = `oops: ${err._inspect ? err._inspect() : err}`;
	}

	assert.deepEqual(
		r1,
		[ "one 1", "one 2", "one 3", "one 4", "one 5", "one 6", "one 7", ],
		"do routine with yield* delegation to do routine"
	);

	try {
		r2.push((await st2.evaluate()).value);
	}
	catch (err) {
		r2 = `oops: ${err._inspect ? err._inspect() : err}`;
	}

	assert.deepEqual(
		r2,
		[ "two 1", "two 2", "two 3", ],
		"do routine with return yield* delegation to do routine"
	);

	try {
		r3 = `oops: ${await st3.evaluate()}`;
	}
	catch (err) {
		r3 = err;
	}

	assert.deepEqual(
		r3,
		"three 1",
		"do routine with return yield* delegation to do routine that throws"
	);

	try {
		r4 = `oops: ${await st4.evaluate()}`;
	}
	catch (err) {
		r4 = err;
	}

	assert.deepEqual(
		r4,
		"four 1",
		"do routine with return yield* delegation to do routine that returns a State that throws"
	);

	try {
		let ev = await st5.evaluate();
		r5.push(
			ev.value.fold(
				err => `oops(1): ${err}`,
				identity
			)
		);
	}
	catch (err) {
		r5 = `oops(2): ${err._inspect ? err._inspect() : err}`;
	}

	assert.deepEqual(
		r5,
		[ "one 1", "one 2", "one 3", "one 4", "one 5", "one 6", "one 7", ],
		"do-either routine with yield* delegation to do-either routine"
	);

	try {
		let ev = await st6.evaluate();
		r6.push(
			ev.value.fold(
				err => `oops(1): ${err}`,
				identity
			)
		);
	}
	catch (err) {
		r6 = `oops(2): ${err._inspect ? err._inspect() : err}`;
	}

	assert.deepEqual(
		r6,
		[ "two 1", "two 2", "two 3", ],
		"do-either routine with return yield* delegation to do-either routine"
	);

	try {
		r7 = `oops(1): ${await st7.evaluate()}`;
	}
	catch (err) {
		r7 = err.fold(
			identity,
			v => `oops(2): ${v}`
		);
	}

	assert.deepEqual(
		r7,
		"three 1",
		"do-either routine with return yield* delegation to do-either routine that throws"
	);

	try {
		r8 = `oops(1): ${await st8.evaluate()}`;
	}
	catch (err) {
		r8 = err.fold(
			identity,
			v => `oops(2): ${v}`
		);
	}

	assert.deepEqual(
		r8,
		"four 1",
		"do-either routine with return yield* delegation to do-either routine that returns a State that throws"
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
		State.of(x => y => x + y).ap.pipe(
			State.of(3),
			State.of(4)
		).evaluate(2),
		{ value: 7, state: 2 },
		"ap.pipe()"
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

qunit.test("*.pipe:very-long", (assert) => {
	function addMany(v1) {
		var total = v1;
		return function next(v){
			if (v === null) return total;
			total += v;
			return next;
		};
	}

	var stackDepth = 10000;

	var incFns = Array(stackDepth).fill(inc);
	var incStateFns = Array(stackDepth).fill(v => State.of(inc(v)));
	var oneStates = Array(stackDepth).fill(State.of(1));
	var arrayVStates = Array.from({ length: stackDepth }).map((v,i) => State.of([ i + 2 ]))

	assert.deepEqual(
		State.of(0).map.pipe(...incFns).evaluate(2),
		{ value: stackDepth, state: 2 },
		"map.pipe() ran very long without RangeError"
	);

	assert.deepEqual(
		State.of(0).chain.pipe(...incStateFns).evaluate(2),
		{ value: stackDepth, state: 2 },
		"chain.pipe() ran very long without RangeError"
	);

	assert.deepEqual(
		State.of(addMany).ap.pipe(...oneStates, State.of(null)).evaluate(2),
		{ value: stackDepth, state: 2 },
		"ap.pipe() ran very long without RangeError"
	);

	assert.deepEqual(
		State.of([ 1 ]).concat.pipe(...arrayVStates).evaluate(2),
		{ value: Array.from({ length: stackDepth + 1 }).map((v,i) => i + 1), state: 2 },
		"concat.pipe() ran very long without RangeError"
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

qunit.test("State.gets", (assert) => {
	// returns projection; does not change state
	assert.deepEqual(
		State.gets(s => s + 1).evaluate(2),
		{ value: 3, state: 2 },
		"projects from state, leaves state untouched"
	);

	// equivalent to get().map(f)
	assert.deepEqual(
		State.get().map(s => s * 2).evaluate(5),
		State.gets(s => s * 2).evaluate(5),
		"gets(f) ≡ get().map(f)"
	);

	// works inside chain; state still untouched unless an inner State changes it
	assert.deepEqual(
		State.gets(s => s.x).chain(x => State.of(x + 10)).evaluate({ x: 1 }),
		{ value: 11, state: { x: 1 } },
		"gets used in chain; no state change"
	);

	// composing projections
	var f = s => s.a;
	var g = a => a + 3;
	assert.deepEqual(
		State.gets(f).map(g).evaluate({ a: 4 }),
		State.gets(s => g(f(s))).evaluate({ a: 4 }),
		"functor composition via gets"
	);

	// arbitrary object projection
	assert.deepEqual(
		State.gets(s => ({ k: s.k, plus: s.k + 1 })).evaluate({ k: 7 }),
		{ value: { k: 7, plus: 8 }, state: { k: 7 } },
		"can project structured values"
	);
});

qunit.test("State.gets (projection called exactly once)", (assert) => {
	var calls = 0;
	var proj = function(s){ calls++; return s.x; };

	var res = State.gets(proj).evaluate({ x: 7 });

	assert.deepEqual(res, { value: 7, state: { x: 7 } }, "projection result correct");
	assert.equal(calls, 1, "projection function called once");
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

qunit.test("State.modify", (assert) => {
	// single modify updates state, returns undefined
	assert.deepEqual(
		State.modify(s => s + 1).evaluate(2),
		{ value: undefined, state: 3 },
		"updates state; value is undefined"
	);

	// multiple modifies compose left→right
	assert.deepEqual(
		State.modify(s => s + 1)
			.chain(() => State.modify(s => s * 10))
			.evaluate(2),
		{ value: undefined, state: 30 },
		"sequences state updates left→right"
	);

	// modify with object state
	assert.deepEqual(
		State.modify(s => ({ ...s, count: (s.count || 0) + 1 }))
			.chain(() => State.get())
			.evaluate({ count: 0 }),
		{ value: { count: 1 }, state: { count: 1 } },
		"object update increments field"
	);

	// modify does not alter the *value* channel unless you set it later
	assert.deepEqual(
		State.modify(s => s + 1)
			.chain(() => State.of("ok"))
			.evaluate(10),
		{ value: "ok", state: 11 },
		"value channel remains controlled by subsequent steps"
	);

	// modify followed by gets: verify new state is visible
	assert.deepEqual(
		State.modify(s => ({ ...s, n: (s.n || 0) + 2 }))
			.chain(() => State.gets(s => s.n))
			.evaluate({ n: 3 }),
		{ value: 5, state: { n: 5 } },
		"gets sees the updated state"
	);

	// modify is identity when updater returns the same state
	assert.deepEqual(
		State.modify(s => s).evaluate({ a: 1 }),
		{ value: undefined, state: { a: 1 } },
		"no-op modify leaves state unchanged"
	);
});

qunit.test("Symbol.iterator", async (assert) => {
	function *iter() {
		res.push(yield *(State.of(1)));
		res.push(yield *(State.of(2)));
		return yield *(State.of(3));
	}

	var res = [];
	res.push(await State.do(iter).evaluate({ foo: 1, }));

	assert.deepEqual(
		res,
		[ 1, 2, { value: 3, state: { foo: 1, }, }, ],
		"State() is a yield* delegatable iterable"
	);
});
