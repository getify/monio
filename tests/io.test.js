const qunit = require("qunit");
const { identity, inc, twice, ioProp } = require("./utils");

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
