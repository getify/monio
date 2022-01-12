"use strict";

const qunit = require("qunit");
const { identity, inc, twice, ioProp, delayPr, delayIO, } = require("./utils");

qunit.module("io");

qunit.test("#unit", (assert) => {
	assert.equal(
		IO.of(1)._inspect(),
		"IO(anonymous function)",
		"should create an IO functor via #of"
	);

	assert.equal(
		IO.pure(1)._inspect(),
		"IO(anonymous function)",
		"should create an IO functor via #pure"
	);

	assert.equal(
		IO.unit(1)._inspect(),
		"IO(anonymous function)",
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
		IO(() => 1).run(),
		1,
		"should evaluate the function in the IO monad and return its value"
	);

	assert.equal(
		IO.of(1).run(),
		1,
		"should return the value held (by function) in the IO monad"
	);

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

	var r1 = [];
	var r2 = [];
	var r3 = [];
	var io1 = IO.do(one,3);
	var io2 = IO.do(two());
	var io3 = IO.do(three);

	var r4 = io1.run(2);
	var r5 = io2.run();
	var r6 = io3.run();

	// NODE HACK: silence the uncaught exception (since it's caught later)
	r6.catch(() => {});

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
});

qunit.test("IO.doEither", async (assert) => {
	function *one(env,v) {
		r1.push("one 1",10);
		yield delayPr(10);
		r1.push("one 2",11);
		return Promise.resolve(IO.of(Promise.resolve(Either.Right(12))));
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

	function *three() {
		throw "three 1";
	}

	function *four() {
		yield Promise.resolve(Either.Left("four 1"));
	}

	var r1 = [];
	var r2 = [];
	var io1 = IO.doEither(one,3);
	var io2 = IO.doEither(two);
	var io3 = IO.doEither(three);
	var io4 = IO.doEither(four);

	var r3 = io1.run(2);
	var r4 = io2.run();
	var r5 = io3.run();
	var r6 = io4.run();

	// NODE HACK: silence the uncaught exceptions (since it's caught later)
	r4.catch(() => {});
	r5.catch(() => {});
	r6.catch(() => {});

	assert.ok(
		(r3 instanceof Promise) && (r4 instanceof Promise),
		"IO.do() returns a promise"
	);

	r3 = await r3;

	assert.ok(
		Either.Right.is(r3) && r3._inspect() == "Either:Right(12)",
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
		Either.Left.is(r4) && r4._inspect() == "Either:Left(\"two 5\")",
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
		Either.Left.is(r5) && r5._inspect() == "Either:Left(\"three 1\")",
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
		Either.Left.is(r6) && r6._inspect() == "Either:Left(\"four 1\")",
		"do-either routine lifts and throws Promise<Either:Left> as promise rejection"
	);
});
