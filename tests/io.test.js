"use strict";

// NOTE: these are to silence spurious
// errors/warnings that Node emits b/c
// it doesn't trust that we know what
// we're doing with catching promise
// rejections
process.on("unhandledRejection",()=>{});
process.on("rejectionHandled",()=>{});
// ***************************************************


const qunit = require("qunit");
const { EMPTY_FUNC, identity, } = MonioUtil;
const {
	INJECT_MONIO,
	inc,
	twice,
	ioProp,
	delayPr,
	delayIO,
	sumArithSeries,
} = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, State, IO, IOx });

qunit.module("io");

qunit.test("#_inspect", (assert) => {
	assert.equal(
		IO(() => {})._inspect(),
		"IO(anonymous function)",
		"should create an IO with anonymous function"
	);

	assert.equal(
		IO(EMPTY_FUNC)._inspect(),
		"IO(EMPTY_FUNC)",
		"should create an IO with named function"
	);

	assert.equal(
		IO(null)._inspect(),
		"IO(null)",
		"should create an IO with (invalid!) null value instead of function"
	);
});

qunit.test("#unit", (assert) => {
	assert.equal(
		IO.of(1).run(),
		1,
		"should create an IO functor via #of"
	);

	assert.equal(
		IO.pure(1).run(),
		1,
		"should create an IO functor via #pure"
	);

	assert.equal(
		IO.unit(1).run(),
		1,
		"should create an IO functor via #unit"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		IO.is(IO.of(1)),
		true,
		"should return true if the object passed is an IO monad"
	);

	assert.equal(
		IO.is({}),
		false,
		"should return false if the object is not an IO monad"
	);
});

qunit.test("#run", (assert) => {
	assert.equal(
		IO(v => v).run(1),
		1,
		"should return the value (carried reader) passed into run"
	);
});

qunit.test("#run:async", async(assert) => {
	var pr = IO.of(Promise.resolve(1)).run();

	assert.ok(
		pr instanceof Promise,
		"should return a promise from the IO monad when run"
	);

	assert.equal(
		await pr,
		1,
		"should evaluate the promise from the IO monad and return its value"
	);
});

qunit.test("#chain", (assert) => {
	assert.equal(
		IO.of({ name: "john" }).chain(ioProp('name')).run(),
		IO.of("john").run(),
		"should return an IO with 'john' as a value"
	);

	assert.equal(
		IO.of({ name: "john" }).flatMap(ioProp('name')).run(),
		IO.of("john").run(),
		"should return an IO with 'john' as value"
	);

	assert.equal(
		IO.of({ name: "john" }).bind(ioProp('name')).run(),
		IO.of("john").run(),
		"should return an IO with 'john' as value"
	);
});

qunit.test("#chain:very-long", (assert) => {
	var io = IO(start => start);

	for (var i = 0; i < 150000; i++) {
		io = io.chain(v => IO.of(v + 1));
	}

	try {
		var res = io.run(1);
	}
	catch (err) {
		var res = err.toString();
	}

	assert.equal(
		res,
		i + 1,
		"chain() call stack ran very long without RangeError"
	);
});

qunit.test("#chain:async", async(assert) => {
	var r1 = await (
		IO.of(Promise.resolve({ name: "john" }))
			.chain(v => Promise.resolve(ioProp('name')(v)))
			.run()
	);
	var r2 = await (
		IO.of({ name: "john" })
			.chain(v => Promise.resolve(ioProp('name')(v)))
			.run()
	);
	var r3 = await (
		IO.of(Promise.resolve({ name: "john" }))
			.chain(v => IO.of(Promise.resolve(v['name'])))
			.run()
	);
	var r4 = await (
		IO.of(Promise.resolve({ name: "john" }))
			.chain(ioProp('name'))
			.run()
	);

	assert.equal(
		r1,
		"john",
		"(1) should return an IO with 'john' as a value"
	);

	assert.equal(
		r2,
		"john",
		"(2) should return an IO with 'john' as a value"
	);

	assert.equal(
		r3,
		"john",
		"(3) should return an IO with 'john' as a value"
	);

	assert.equal(
		r4,
		"john",
		"(4) should return an IO with 'john' as a value"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		IO.of(1).map(inc).map(twice).run(),
		IO.of(1).map(x => twice(inc(x))).run(),
		"should follow the composition law"
	);

	assert.equal(
		IO.of(1).map(identity).run(),
		IO.of(1).run(),
		"should follow the identity law"
	);
});

qunit.test("#map:very-long", (assert) => {
	var io = IO(start => start);

	for (var i = 0; i < 150000; i++) {
		io = io.map(inc);
	}

	try {
		var res = io.run(1);
	}
	catch (err) {
		var res = err.toString();
	}

	assert.equal(
		res,
		i + 1,
		"map() call stack ran very long without RangeError"
	);
});

qunit.test("#map:async", async (assert) => {
	var r1 = await (
		IO.of(Promise.resolve(1))
			.map(v => Promise.resolve(inc(v)))
			.map(v => Promise.resolve(twice(v)))
			.run()
	);
	var r2 = await (
		IO.of(Promise.resolve(1))
			.map(x => Promise.resolve(twice(inc(x))))
			.run()
	);
	var r3 = await (
		IO.of(Promise.resolve(1))
			.map(v => Promise.resolve(identity(v)))
			.run()
	);
	var r4 = await (
		IO.of(1)
			.map(v => Promise.resolve(identity(v)))
			.run()
	);
	var r5 = await (
		IO.of(Promise.resolve(1))
			.map(identity)
			.run()
	);

	assert.equal(
		r1,
		4,
		"should map properly"
	);

	assert.equal(
		r1,
		r2,
		"should follow the composition law"
	);

	assert.equal(
		r3,
		1,
		"(1) should follow the identity law"
	);

	assert.equal(
		r4,
		1,
		"(2) should follow the identity law"
	);

	assert.equal(
		r5,
		1,
		"(3) should follow the identity law"
	);
});

qunit.test("#concat", (assert) => {
	assert.equal(
		IO.of("Hello").concat(IO.of(" World!")).run(),
		IO.of("Hello World!").run(),
		"should concat two strings in IO monads together into a new monad"
	);
});

qunit.test("#concat:very-long", (assert) => {
	var io = IO(start => start);

	for (var i = 1; i < 25000; i++) {
		io = io.concat(IO.of([ i + 1 ]));
	}

	try {
		var res = io.run([ 1 ]);
	}
	catch (err) {
		var res = err.toString();
	}

	assert.equal(
		res.length,
		i,
		"concat() call stack ran very long without RangeError"
	);
});

qunit.test("#concat:async", async (assert) => {
	var r1 = await (
		IO.of(Promise.resolve("Hello"))
			.concat(IO.of(Promise.resolve(" World!")))
			.run()
	);
	var r2 = await (
		IO.of("Hello")
			.concat(IO.of(Promise.resolve(" World!")))
			.run()
	);
	var r3 = await (
		IO.of(Promise.resolve("Hello"))
			.concat(IO.of(" World!"))
			.run()
	);

	assert.equal(
		r1,
		"Hello World!",
		"(1) should concat two strings in IO monads together into a new monad"
	);

	assert.equal(
		r2,
		"Hello World!",
		"(2) should concat two strings in IO monads together into a new monad"
	);

	assert.equal(
		r3,
		"Hello World!",
		"(3) should concat two strings in IO monads together into a new monad"
	);
});

qunit.test("fromIOx", async (assert) => {
	var r1 = [];
	var r2 = [];

	var x = IOx((env,v) => { r1.push("x",env * v); return env * v; },[ 2 ]);
	var y = IOx((env,v) => { r2.push("y",env * v); return Promise.resolve(env * v); },[ 3 ]);

	var z = IO.fromIOx(x);
	var w = IO.fromIOx(y);

	var r3 = z.run(10);

	assert.equal(
		r3,
		20,
		"sync IOx flows through to IO immediately"
	);

	assert.deepEqual(
		r1,
		[ "x", 20 ],
		"sync IOx evaluated once for IO evaluation"
	);

	r3 = z.run(10);

	assert.equal(
		r3,
		20,
		"sync IOx flows through to IO immediately, again"
	);

	assert.deepEqual(
		r1,
		[ "x", 20, "x", 20 ],
		"sync IOx evaluated again for second IO evaluation"
	);

	r3 = w.run(10);

	assert.ok(
		r3 instanceof Promise,
		"async IOx produces promise from IO"
	);

	r3 = await r3;

	assert.equal(
		r3,
		30,
		"async IOx to IO flows through asynchronously"
	);

	assert.deepEqual(
		r2,
		[ "y", 30 ],
		"async IOx executed once for IO evaluation"
	);

	r3 = await w.run(10);

	assert.equal(
		r3,
		30,
		"async IOx to IO flows through asynchronously, again"
	);

	assert.deepEqual(
		r2,
		[ "y", 30, "y", 30 ],
		"async IOx executed again for second IO evaluation"
	);
});

qunit.test("IO.do", async (assert) => {
	function *one(env,v) {
		yield delayPr(10);
		r1.push("one 1",env);
		var g = yield delayIO(v,10);

		r1.push("one 2", yield Just(g) );

		yield Maybe.from(null);

		r1.push("one 3, oops!!");
	}

	function *two() {
		r2.push("two 1",10);
		yield delayPr(10);
		r2.push("two 2",11);
		return IO.of(Promise.resolve(12));
	}

	function *three() {
		yield delayPr(10);
		r3.push("three 1");

		try {
			yield IO(() => { throw new Error("three 2"); });
		}
		catch (err) {
			r3.push(err.toString());
		}

		try {
			yield Promise.reject("three 3");
		}
		catch (err) {
			r3.push(err);
		}

		throw new Error("three 4");
	}

	async function *four() {
		throw "four 1";
	}

	function *five() {
		return IO(() => { throw "five 1"; });
	}

	function *six() {
		yield IO(() => { throw "six 1"; });
	}

	function *seven() {
		yield IO(() => Promise.reject("seven 1"));
	}

	var r1 = [];
	var r2 = [];
	var r3 = [];
	var io1 = IO.do(one,3);
	var io2 = IO.do(two());
	var io3 = IO.do(three);
	var io4 = IO.do(four);
	var io5 = IO.do(five);
	var io6 = IO.do(six);
	var io7 = IO.do(seven);

	var r4 = io1.run(2);
	var r5 = io2.run();
	var r6 = io3.run();
	var r7 = io4.run();
	var r8 = io5.run();
	var r9 = io6.run();
	var r10 = io7.run();

	assert.ok(
		(r4 instanceof Promise) && (r5 instanceof Promise) && (r6 instanceof Promise),
		"IO.do() returns a promise"
	);

	await r4;

	assert.deepEqual(
		r1,
		[ "one 1", 2, "one 2", 3 ],
		"do routine proceeds async, but short-circuits out at a Nothing"
	);

	r2.push(await r5);

	assert.deepEqual(
		r2,
		[ "two 1", 10, "two 2", 11, 12 ],
		"do routine proceeds, and returns a value"
	);

	try {
		await r6;
	}
	catch (err) {
		r3.push(err.toString());
	}

	assert.deepEqual(
		r3,
		[ "three 1", "Error: three 2", "three 3", "Error: three 4" ],
		"do routine catches and throws exceptions"
	);

	try {
		await r7;
	}
	catch (err) {
		r7 = err;
	}

	assert.equal(
		r7,
		"four 1",
		"do routine returns promise rejection from throw"
	);

	try {
		await r8;
	}
	catch (err) {
		r8 = err;
	}

	assert.equal(
		r8,
		"five 1",
		"do routine returns promise rejection from returned IO that throws"
	);

	try {
		await r9;
	}
	catch (err) {
		r9 = err;
	}

	assert.equal(
		r9,
		"six 1",
		"do routine returns promise rejection from return IO that throws"
	);

	try {
		await r10;
	}
	catch (err) {
		r10 = err;
	}

	assert.equal(
		r10,
		"seven 1",
		"do routine returns promise rejection from yielded IO holding rejected promise"
	);
});

qunit.test("IO.do:very-long", async (assert) => {
	function *one(max) {
		var sum = 0;
		for (let i = 0; i < max; i++) {
			sum += yield IO.of(i);
		}
		return sum;
	}

	function *two(max) {
		var sum = 0;
		for (let i = 0; i < max; i++) {
			sum += yield IO.of(i - 1).map(inc);
		}
		return sum;
	}

	function *three(max) {
		var list = [];
		for (let i = 0; i < max; i++) {
			list = yield IO.of(list).concat(IO.of([ i ]));
		}
		var sum = 0;
		for (let v of list) {
			sum += v;
		}
		return sum;
	}

	var io1 = IO.do(one);
	var io2 = IO.do(two);
	var io3 = IO.do(three);

	var stackDepth = 25000;
	var res1 = await io1.run(stackDepth);

	assert.equal(
		res1,
		sumArithSeries(stackDepth),
		"IO.do() call stack ran very long without RangeError"
	);

	stackDepth -= 5000;
	var res2 = await io2.run(stackDepth);

	assert.equal(
		res2,
		sumArithSeries(stackDepth),
		"IO.do():map call stack ran very long without RangeError"
	);

	stackDepth -= 5000;
	var res3 = await io3.run(stackDepth);

	assert.equal(
		res3,
		sumArithSeries(stackDepth),
		"IO.do():concat call stack ran very long without RangeError"
	);
});

qunit.test("IO.doEither", async (assert) => {
	function *one(env,v) {
		r1.push("one 1",10);
		yield delayPr(10);
		r1.push("one 2",11);
		return Promise.resolve(Either.Right(12));
	}

	function *two() {
		yield delayPr(10);
		r2.push("two 1");

		try {
			yield IO(() => { throw new Error("two 2"); });
			r2.push("two 2 oops");
		}
		catch (err) {
			r2.push(err.toString());
		}

		try {
			yield Either.Left("two 3");
			r2.push("two 3 oops");
		}
		catch (err) {
			r2.push(err);
		}

		try {
			yield Promise.reject("two 4");
			r2.push("two 4 oops");
		}
		catch (err) {
			r2.push(err);
		}

		return Either.Left("two 5");
	}

	async function *three() {
		throw "three 1";
	}

	function *four() {
		yield Promise.resolve(Either.Left("four 1"));
	}

	function *five() {
		return IO(() => { throw "five 1"; });
	}

	function *six() {
		yield IO(() => { throw "six 1"; });
	}

	function *seven() {
		yield IO(() => Promise.reject("seven 1"));
	}

	var r1 = [];
	var r2 = [];
	var io1 = IO.doEither(one,3);
	var io2 = IO.doEither(two);
	var io3 = IO.doEither(three);
	var io4 = IO.doEither(four);
	var io5 = IO.doEither(five);
	var io6 = IO.doEither(six);
	var io7 = IO.doEither(seven);

	var r3 = io1.run(2);
	var r4 = io2.run();
	var r5 = io3.run();
	var r6 = io4.run();
	var r7 = io5.run();
	var r8 = io6.run();
	var r9 = io7.run();

	assert.ok(
		(r3 instanceof Promise) && (r4 instanceof Promise),
		"IO.do() returns a promise"
	);

	r3 = await r3;

	assert.ok(
		Either.Right.is(r3) && r3.fold(EMPTY_FUNC,identity) === 12,
		"do-either routine returns an Either:Right on success"
	);

	assert.deepEqual(
		r1,
		[ "one 1", 10, "one 2", 11 ],
		"do-either routine proceeds async"
	);

	try {
		await r4;
		r4 = "oops";
	}
	catch (err) {
		r4 = err;
	}

	assert.ok(
		Either.Left.is(r4) && r4.fold(identity,EMPTY_FUNC) === "two 5",
		"do-either routine treats returned Either:Left as promise rejection"
	);

	assert.deepEqual(
		r2,
		[ "two 1", "Error: two 2", "two 3", "two 4" ],
		"do-either routine proceeds, and returns a value"
	);

	try {
		await r5;
		r5 = "oops";
	}
	catch (err) {
		r5 = err;
	}

	assert.ok(
		Either.Left.is(r5) && r5.fold(identity,EMPTY_FUNC) === "three 1",
		"do-either routine lifts uncaught exception into Either:Left as promise rejection"
	);

	try {
		await r6;
		r6 = "oops";
	}
	catch (err) {
		r6 = err;
	}

	assert.ok(
		Either.Left.is(r6) && r6.fold(identity,EMPTY_FUNC) === "four 1",
		"do-either routine lifts and throws Promise<Either:Left> as promise rejection"
	);
	try {
		await r7;
	}
	catch (err) {
		r7 = err;
	}

	assert.ok(
		Either.Left.is(r7) && r7.fold(identity,EMPTY_FUNC) === "five 1",
		"do-either routine returns promise rejection from returned IO that throws"
	);

	try {
		await r8;
	}
	catch (err) {
		r8 = err;
	}

	assert.ok(
		Either.Left.is(r8) && r8.fold(identity,EMPTY_FUNC) === "six 1",
		"do-either routine returns promise rejection from return IO that throws"
	);

	try {
		await r9;
	}
	catch (err) {
		r9 = err;
	}

	assert.ok(
		Either.Left.is(r9) && r9.fold(identity,EMPTY_FUNC) === "seven 1",
		"do-either routine returns promise rejection from yielded IO holding rejected promise"
	);
});

qunit.test("IO.doEither:very-long", async (assert) => {
	function *one(max) {
		var sum = 0;
		for (let i = 0; i < max; i++) {
			sum += yield IO.of(i);
		}
		return sum;
	}

	var io = IO.doEither(one);

	var stackDepth = 25000;
	var res = await io.run(stackDepth);

	assert.ok(
		Either.Right.is(res),
		"IO.doEither returns an Either:Right"
	);

	assert.equal(
		res.fold(EMPTY_FUNC,identity),
		sumArithSeries(stackDepth),
		"IO.doEither() call stack ran very long without RangeError"
	);
});

qunit.test("*.pipe", async (assert) => {
	const incPr = v => Promise.resolve(inc(v));
	const twicePr = v => Promise.resolve(twice(v));

	assert.equal(
		IO.of(2).map.pipe().run(),
		2,
		"map.pipe() -- empty"
	);

	assert.equal(
		IO.of(2).map.pipe(inc,twice).run(),
		6,
		"map.pipe()"
	);

	assert.equal(
		IO.of(2).chain.pipe(
			v => IO.of(inc(v)),
			v => IO.of(twice(v))
		).run(),
		6,
		"chain.pipe()"
	);

	assert.deepEqual(
		IO.of([1,2]).concat.pipe(
			IO.of([3,4]),
			IO.of([5,6])
		).run(),
		[1,2,3,4,5,6],
		"concat.pipe()"
	);

	assert.equal(
		await IO.of(Promise.resolve(2)).map.pipe(inc,twicePr,inc).run(),
		7,
		"async: map.pipe()"
	);

	assert.equal(
		await IO.of(Promise.resolve(2)).chain.pipe(
			v => IO.of(incPr(v)),
			v => IO.of(twicePr(v))
		).run(),
		6,
		"async: chain.pipe()"
	);

	assert.deepEqual(
		await IO.of(Promise.resolve([1,2])).concat.pipe(
			IO.of(Promise.resolve([3,4])),
			IO.of(Promise.resolve([5,6]))
		).run(),
		[1,2,3,4,5,6],
		"async: concat.pipe()"
	);
});

qunit.test("*.pipe:very-long", async (assert) => {
	var stackDepth = 10000;

	var incFns = Array(stackDepth).fill(inc);
	var incIOFns = Array(stackDepth).fill(v => IO.of(inc(v)));

	assert.equal(
		IO.of(0).map.pipe(...incFns).run(),
		stackDepth,
		"map.pipe()"
	);

	assert.equal(
		IO.of(0).chain.pipe(...incIOFns).run(),
		stackDepth,
		"chain.pipe()"
	);
});
