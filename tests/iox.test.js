const qunit = require("qunit");
const { identity, inc, twice, ioProp, delayPr, delayIOx, } = require("./utils");

qunit.module("iox");

qunit.test("#unit", (assert) => {
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
		IOx(() => 1).run(),
		1,
		"should evaluate the function in the IOx monad and return its value"
	);

	assert.equal(
		IOx.of(1).run(),
		1,
		"should return the value held (by function) in the IOx monad"
	);

	assert.equal(
		IOx(v => v).run(1),
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
