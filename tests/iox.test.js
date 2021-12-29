const EventEmitter = require("events");
const qunit = require("qunit");
const { identity, inc, twice, ioProp, delayPr, delayIOx, } = require("./utils");

qunit.module("iox");

qunit.test("#unit", (assert) => {
	assert.equal(
		IOx.of(1).toString(),
		"[function IOx]",
		"toString value is as expected"
	);

	assert.equal(
		IOx.of(1)._inspect(),
		"IOx(anonymous function)",
		"should create an IOx functor via #of"
	);

	assert.equal(
		IOx.pure(1)._inspect(),
		"IOx(anonymous function)",
		"should create an IOx functor via #pure"
	);

	assert.equal(
		IOx.unit(1)._inspect(),
		"IOx(anonymous function)",
		"should create an IOx functor via #unit"
	);
});

qunit.test("#is", (assert) => {
	assert.equal(
		IOx.is(IOx.of(1)),
		true,
		"should return true if the object passed is an IOx monad"
	);

	assert.equal(
		IOx.is({}),
		false,
		"should return false if the object is not an IOx monad"
	);
});

qunit.test("#run", (assert) => {
	assert.equal(
		IOx(() => 1,[]).run(),
		1,
		"should evaluate the function in the IOx monad and return its value"
	);

	assert.equal(
		IOx.of(1).run(),
		1,
		"should return the value held (by function) in the IOx monad"
	);

	assert.equal(
		IOx(v => v,[]).run(1),
		1,
		"should return the value (carried reader) passed into run"
	);
});

qunit.test("#run:async", async(assert) => {
	var pr = IOx.of(Promise.resolve(1)).run();

	assert.ok(
		pr instanceof Promise,
		"should return a promise from the IOx monad when run"
	);

	assert.equal(
		await pr,
		1,
		"should evaluate the promise from the IOx monad and return its value"
	);
});

qunit.test("#chain", (assert) => {
	assert.equal(
		IOx.of({ name: "john" }).chain(ioProp('name')).run(),
		IOx.of("john").run(),
		"should return an IOx with 'john' as a value"
	);

	assert.equal(
		IOx.of({ name: "john" }).flatMap(ioProp('name')).run(),
		IOx.of("john").run(),
		"should return an IOx with 'john' as value"
	);

	assert.equal(
		IOx.of({ name: "john" }).bind(ioProp('name')).run(),
		IOx.of("john").run(),
		"should return an IOx with 'john' as value"
	);
});

qunit.test("#chain:async", async(assert) => {
	var r1 = await (
		IOx.of(Promise.resolve({ name: "john" }))
			.chain(v => Promise.resolve(ioProp('name')(v)))
			.run()
	);
	var r2 = await (
		IOx.of({ name: "john" })
			.chain(v => Promise.resolve(ioProp('name')(v)))
			.run()
	);
	var r3 = await (
		IOx.of(Promise.resolve({ name: "john" }))
			.chain(v => IOx.of(Promise.resolve(v['name'])))
			.run()
	);
	var r4 = await (
		IOx.of(Promise.resolve({ name: "john" }))
			.chain(ioProp('name'))
			.run()
	);

	assert.equal(
		r1,
		"john",
		"(1) should return an IOx with 'john' as a value"
	);

	assert.equal(
		r2,
		"john",
		"(2) should return an IOx with 'john' as a value"
	);

	assert.equal(
		r3,
		"john",
		"(3) should return an IOx with 'john' as a value"
	);

	assert.equal(
		r4,
		"john",
		"(4) should return an IOx with 'john' as a value"
	);

});

qunit.test("#chain:return sync IO", async(assert) => {
	var res1 = [];
	var x = IO(() => {
		res1.push("x");
		return 2;
	});
	var y = IOx.of(10);

	var z = y.chain(v => { res1.push(v); return x; });
	var w = z.chain(v => { res1.push(v); return IO.of(v); });

	var res2 = w.run();

	assert.equal(
		res2,
		2,
		"chaining sync IO from IOx"
	);

	assert.deepEqual(
		res1,
		[ 10, "x", 2 ],
		"chain and IO both execute"
	);

	res2 = z.run();

	assert.equal(
		res2,
		2,
		"re-executing sync IO by re-running IOx"
	);

	assert.deepEqual(
		res1,
		[ 10, "x", 2, 10, "x", 2 ],
		"(1) chain and IO both re-execute"
	);

	y(20);

	assert.deepEqual(
		res1,
		[ 10, "x", 2, 10, "x", 2, 20, "x", 2 ],
		"(2) chain and IO both re-execute"
	);

	y(Promise.resolve(30));

	await delayPr(50);

	assert.deepEqual(
		res1,
		[ 10, "x", 2, 10, "x", 2, 20, "x", 2, 30, "x", 2 ],
		"(3) chain and IO both re-execute"
	);
});

qunit.test("#chain:return async IO", async(assert) => {
	var res1 = [];
	var x = IO(() => {
		res1.push("x");
		return Promise.resolve(3);
	});
	var y = IOx.of(11);

	var z = y.chain(v => { res1.push(v); return x; });
	var w = z.chain(v => { res1.push(v); return IO.of(Promise.resolve(v)); });

	var res2 = w.run();

	assert.ok(
		res2 instanceof Promise,
		"async IO results in promise"
	);

	res2 = await res2;

	assert.equal(
		res2,
		3,
		"chaining async IO from IOx"
	);

	assert.deepEqual(
		res1,
		[ 11, "x", 3 ],
		"chain and IO both execute"
	);

	res2 = await z.run();

	assert.equal(
		res2,
		3,
		"re-executing async IO by re-running IOx"
	);

	assert.deepEqual(
		res1,
		[ 11, "x", 3, 11, "x", 3 ],
		"(1) chain and IO both re-execute"
	);

	y(21);

	await delayPr(50);

	assert.deepEqual(
		res1,
		[ 11, "x", 3, 11, "x", 3, 21, "x", 3 ],
		"(2) chain and IO both re-execute"
	);

	y(Promise.resolve(31));

	await delayPr(50);

	assert.deepEqual(
		res1,
		[ 11, "x", 3, 11, "x", 3, 21, "x", 3, 31, "x", 3 ],
		"(3) chain and IO both re-execute"
	);
});

qunit.test("#map", (assert) => {
	assert.equal(
		IOx.of(1).map(inc).map(twice).run(),
		IOx.of(1).map(x => twice(inc(x))).run(),
		"should follow the composition law"
	);

	assert.equal(
		IOx.of(1).map(identity).run(),
		IOx.of(1).run(),
		"should follow the identity law"
	);
});

qunit.test("#map:async", async (assert) => {
	var r1 = await (
		IOx.of(Promise.resolve(1))
			.map(v => Promise.resolve(inc(v)))
			.map(v => Promise.resolve(twice(v)))
			.run()
	);
	var r2 = await (
		IOx.of(Promise.resolve(1))
			.map(x => Promise.resolve(twice(inc(x))))
			.run()
	);
	var r3 = await (
		IOx.of(Promise.resolve(1))
			.map(v => Promise.resolve(identity(v)))
			.run()
	);
	var r4 = await (
		IOx.of(1)
			.map(v => Promise.resolve(identity(v)))
			.run()
	);
	var r5 = await (
		IOx.of(Promise.resolve(1))
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
		IOx.of("Hello").concat(IOx.of(" World!")).run(),
		IOx.of("Hello World!").run(),
		"should concat two strings in IOx monads together into a new monad"
	);
});

qunit.test("#concat:async", async (assert) => {
	var r1 = await (
		IOx.of(Promise.resolve("Hello"))
			.concat(IOx.of(Promise.resolve(" World!")))
			.run()
	);
	var r2 = await (
		IOx.of("Hello")
			.concat(IOx.of(Promise.resolve(" World!")))
			.run()
	);
	var r3 = await (
		IOx.of(Promise.resolve("Hello"))
			.concat(IOx.of(" World!"))
			.run()
	);

	assert.equal(
		r1,
		"Hello World!",
		"(1) should concat two strings in IOx monads together into a new monad"
	);

	assert.equal(
		r2,
		"Hello World!",
		"(2) should concat two strings in IOx monads together into a new monad"
	);

	assert.equal(
		r3,
		"Hello World!",
		"(3) should concat two strings in IOx monads together into a new monad"
	);
});

qunit.test("non-IOx dependencies", async(assert) => {
	var res = [];
	var x = IO.of(2);
	var y = IO(() => {
		res.push("y");
		return Promise.resolve(3);
	});
	var z = IOx.of(4);
	var w = IOx((env,v1,v2,v3,v4) => {
		res.push(v1 * v2 * v3 * v4);
	},[ x, y, z, 1 ]);

	await w.run();

	assert.deepEqual(
		res,
		[ "y", 24 ],
		"resolved sync and async IOs for IOx"
	);

	z(7);

	// for good measure, make sure the updates have
	// plenty of time to have propagated
	await delayPr(50);

	assert.deepEqual(
		res,
		[ "y", 24, "y", 42 ],
		"with IOx dep update, re-resolve both IO deps for IOx"
	);

	await w.run();

	assert.deepEqual(
		res,
		[ "y", 24, "y", 42, "y", 42 ],
		"manually re-running IOx, re-resolves both IO deps"
	);

	z.close();

	// for good measure, make sure the updates have
	// plenty of time to have propagated
	await delayPr(50);

	assert.deepEqual(
		res,
		[ "y", 24, "y", 42, "y", 42 ],
		"after closing IOx dep, no re-resolving of the IOx occurs"
	);

	assert.ok(
		w.isClosed(),
		true,
		"after closing IOx dep, subscribed IOX should also close"
	);
});

qunit.test("update", (assert) => {
	var x1 = IOx.of(3);
	var x2 = IOx((_,v) => v * 2,[ x1, ]);
	var x3 = x2.map(v => v + 3);
	var x4 = IOx((_,v1,v2) => v1 + v2 + 5, [ x1, x3 ]);
	var x5 = x4.chain(v => IOx.of(v * 10));

	var v1 = x1.run();
	var v2 = x2.run();
	var v5 = x5.run();
	var v3 = x3.run();
	var v4 = x4.run();

	x1(5);

	var v6 = x1.run();
	var v7 = x2.run();
	var v8 = x3.run();
	var v9 = x4.run();
	var v10 = x5.run();

	x3(50);

	var v11 = x1.run();
	var v12 = x2.run();
	var v13 = x3.run();
	var v14 = x4.run();
	var v15 = x5.run();

	assert.equal(
		v1,
		3,
		"(1) IOx should hold a value"
	);
	assert.equal(
		v2,
		6,
		"(1) IOx value should propagate through IOx with a single subscription"
	);
	assert.equal(
		v3,
		9,
		"(1) IOx value should propagate through map"
	);
	assert.equal(
		v4,
		17,
		"(1) IOx value should propagate through IOx with multiple subscriptions"
	);
	assert.equal(
		v5,
		170,
		"(1) IOx value should propagate through chain"
	);

	assert.equal(
		v6,
		5,
		"(2) IOx should be able to update"
	);
	assert.equal(
		v7,
		10,
		"(2) IOx update should propagate through IOx with a single subscription"
	);
	assert.equal(
		v8,
		13,
		"(2) IOx update should propagate through map"
	);
	assert.equal(
		v9,
		23,
		"(2) IOx update should propagate through IOx with multiple subscriptions"
	);
	assert.equal(
		v10,
		230,
		"(2) IOx update should propagate through chain"
	);

	assert.equal(
		v11,
		5,
		"(3) IOx didn't update"
	);
	assert.equal(
		v12,
		10,
		"(3) IOx didn't update through a subscription"
	);
	assert.equal(
		v13,
		50,
		"(3) IOx updated"
	);
	assert.equal(
		v14,
		60,
		"(3) IOx update should propagate through IOx with multiple subscriptions"
	);
	assert.equal(
		v15,
		600,
		"(3) IOx update should propagate through chain"
	);

});

qunit.test("update:async", async(assert) => {
	var x1 = IOx.of.empty();
	var x2 = IOx((_,v) => v * 2,[ x1, ]);
	var x3 = x2.map(v => delayPr(50).then(() => v + 3));
	var x4 = IOx((_,v1,v2) => v1 + v2 + 5, [ x1, x3 ]);
	var x5 = x4.chain(v => delayIOx(v * 10,50));

	var v1 = x1.run();
	var v5 = x5.run();
	var v2 = x2.run();
	var v3 = x3.run();
	var v4 = x4.run();

	x1(3);

	v1 = await v1;
	v2 = await v2;
	v3 = await v3;
	v4 = await v4;
	v5 = await v5;

	x1(5);

	var v6 = await x1.run();
	var v7 = await x2.run();
	var v8 = await x3.run();
	var v9 = await x4.run();
	var v10 = await x5.run();

	x3(50);

	var v11 = await x1.run();
	var v12 = await x2.run();
	var v13 = await x3.run();
	var v14 = await x4.run();
	var v15 = await x5.run();

	assert.equal(
		v1,
		3,
		"(1) IOx should hold a value"
	);
	assert.equal(
		v2,
		6,
		"(1) IOx value should propagate through IOx with a single subscription"
	);
	assert.equal(
		v3,
		9,
		"(1) IOx value should propagate through map"
	);
	assert.equal(
		v4,
		17,
		"(1) IOx value should propagate through IOx with multiple subscriptions"
	);
	assert.equal(
		v5,
		170,
		"(1) IOx value should propagate through chain"
	);

	assert.equal(
		v6,
		5,
		"(2) IOx should be able to update"
	);
	assert.equal(
		v7,
		10,
		"(2) IOx update should propagate through IOx with a single subscription"
	);
	assert.equal(
		v8,
		13,
		"(2) IOx update should propagate through map"
	);
	assert.equal(
		v9,
		23,
		"(2) IOx update should propagate through IOx with multiple subscriptions"
	);
	assert.equal(
		v10,
		230,
		"(2) IOx update should propagate through chain"
	);

	assert.equal(
		v11,
		5,
		"(3) IOx didn't update"
	);
	assert.equal(
		v12,
		10,
		"(3) IOx didn't update through a subscription"
	);
	assert.equal(
		v13,
		50,
		"(3) IOx updated"
	);
	assert.equal(
		v14,
		60,
		"(3) IOx update should propagate through IOx with multiple subscriptions"
	);
	assert.equal(
		v15,
		600,
		"(3) IOx update should propagate through chain"
	);

});

qunit.test("close", (assert) => {
	var vals1 = IOx.of(2);
	var vals3 = [];
	var vals2 = vals1.chain(v => {
		var ciox = IOx.of(v * 2);
		vals3.push(ciox);
		return ciox;
	});
	vals2.run();

	assert.ok(
		!vals1.isClosed(),
		"(1) stream not closed yet"
	);

	assert.ok(
		!vals2.isClosed(),
		"(2) stream not closed yet"
	);

	vals1(3);

	assert.ok(
		!vals1.isClosed(),
		"(1) stream (still) not closed yet"
	);

	assert.ok(
		!vals2.isClosed(),
		"(2) stream (still) not closed yet"
	);

	vals1.close();
	vals1.run();

	assert.ok(
		vals1.isClosed(),
		"(1) stream now closed"
	);

	assert.ok(
		vals2.isClosed(),
		"(2) stream now closed"
	);

	for (let [ idx, stream ] of vals3.entries()) {
		assert.ok(
			stream.isClosed(),
			`(${idx}) stream now closed`
		);
	}
});

qunit.test("stop", (assert) => {
	var vals = IOx.of(2);
	var res = [];

	var pushed = vals.chain(v => IO.of(res.push(v)));

	pushed.run();

	assert.deepEqual(
		res,
		[ 2 ],
		"stream collects initial value at open"
	);

	vals(3);
	vals(4);

	assert.deepEqual(
		res,
		[ 2, 3, 4 ],
		"stream keeps collecting values while open"
	);

	pushed.stop();
	pushed.run();

	assert.deepEqual(
		res,
		[ 2, 3, 4, 4 ],
		"stream picks up latest value when restarting"
	);

	pushed.stop();

	vals(5);
	vals(6);
	vals(7);

	pushed.run();

	assert.deepEqual(
		res,
		[ 2, 3, 4, 4, 7 ],
		"stream does not collect values while stopped"
	);

	vals.stop();
	vals(8);

	assert.deepEqual(
		res,
		[ 2, 3, 4, 4, 7, 8 ],
		"stopped stream restarts when assigning a new value"
	);
});

qunit.test("freeze", (assert) => {
	var vals = IOx.of(2);
	var res = [];

	var pushed = vals.chain(v => IO.of(res.push(v)));

	pushed.run();

	assert.deepEqual(
		res,
		[ 2 ],
		"stream collects initial value at open"
	);

	vals(3);
	vals(4);

	assert.deepEqual(
		res,
		[ 2, 3, 4 ],
		"stream keeps collecting values while open"
	);

	vals.freeze();

	assert.ok(
		vals.isFrozen(),
		"stream is frozen"
	);

	assert.ok(
		!vals.isClosed(),
		"frozen stream not automatically closed"
	);

	vals(5);
	vals(6);
	vals(7);

	assert.equal(
		vals.run(),
		4,
		"frozen stream hasn't updated its value"
	);

	assert.deepEqual(
		res,
		[ 2, 3, 4 ],
		"frozen stream doesn't emit new values"
	);

	vals.close();

	assert.ok(
		vals.isClosed(),
		"frozen stream can still be closed"
	);
});

qunit.test("onEvent", async (assert) => {
	var evt = new EventEmitter();
	var vals = IOx.onEvent(evt,"tick");

	var res = [];
	var pushed = vals.chain(v => IO.of(res.push(v)));

	evt.emit("tick",1);

	assert.equal(
		evt.listenerCount("tick"),
		0,
		"event listener is lazily subscribed"
	);

	pushed.run();
	vals.run();

	assert.equal(
		evt.listenerCount("tick"),
		1,
		"event listener only subscribed once"
	);

	evt.emit("tick",2);
	evt.emit("tick",3);

	vals.stop();

	evt.emit("tick",4);
	evt.emit("tick",5);

	vals.run();

	evt.emit("tick",6);

	assert.deepEqual(
		res,
		[ 2, 3, 6 ],
		"stream should only get values while running (not stopped)"
	);

	vals.close();

	assert.ok(
		vals.isClosed(),
		"stream successfully closed"
	);

	assert.equal(
		evt.listenerCount("tick"),
		0,
		"event listener unsubscribed after stream closing"
	);
});

qunit.test("onceEvent", async (assert) => {
	var evt = new EventEmitter();
	var vals = IOx.onceEvent(evt,"tick");

	var res = [];
	var pushed = vals.chain(v => IO.of(res.push(v)));

	evt.emit("tick",1);

	assert.equal(
		evt.listenerCount("tick"),
		0,
		"event listener is lazily subscribed"
	);

	pushed.run();
	vals.run();

	assert.equal(
		evt.listenerCount("tick"),
		1,
		"event listener only subscribed once"
	);

	evt.emit("tick",2);
	evt.emit("tick",3);

	assert.deepEqual(
		res,
		[ 2 ],
		"stream should only get values while running (not stopped)"
	);

	assert.ok(
		vals.isClosed(),
		"once-stream closed automatically after first event"
	);

	assert.equal(
		evt.listenerCount("tick"),
		0,
		"event listener unsubscribed after stream closing"
	);
});

qunit.test("onTimer", async(assert) => {
	var vals1 = IOx.onTimer(20);
	var vals2 = IOx.onTimer(20,3);

	var res1 = [];
	var res2 = [];
	var pushed1 = vals1.chain(v => IO.of(res1.push(v)));
	var pushed2 = vals2.chain(v => IO.of(res2.push(v)));

	await delayPr(30);

	assert.equal(
		res1.length + res2.length,
		0,
		"timer is lazily started"
	);

	pushed1.run();
	pushed2.run();
	vals1.run();
	vals2.run();

	await delayPr(30);

	assert.deepEqual(
		res1,
		[ "tick" ],
		"open-ended timer initiated only once"
	);

	assert.deepEqual(
		res2,
		[ "tick" ],
		"count-limited timer initiated only once"
	);

	await delayPr(100);

	assert.deepEqual(
		res1,
		[ "tick", "tick", "tick", "tick", "tick", "tick" ],
		"open-ended timer kept running"
	);

	assert.deepEqual(
		res2,
		[ "tick", "tick", "tick" ],
		"count-limited timer only ran to count limit"
	);

	assert.ok(
		vals2.isClosed(),
		"count-limited timer automatically closed"
	);

	assert.ok(
		!vals1.isClosed(),
		"open-ended timer still running"
	);

	vals1.close();

	assert.ok(
		vals1.isClosed(),
		"open-ended timer now closed"
	);

	await delayPr(30);

	assert.deepEqual(
		res1,
		[ "tick", "tick", "tick", "tick", "tick", "tick" ],
		"open-ended timer didn't run after closing stream"
	);
});
