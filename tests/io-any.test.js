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
const { identity, foldMap, } = MonioUtil;

qunit.module("io-any");

qunit.test("foldMap:very-long", (assert) => {
	var io = AnyIO(initV => initV !== false);
	var ioList = [ io ];

	for (let i = 0; i < 25000; i++) {
		ioList.push(AnyIO.of(false));
	}

	var finalTrue = AnyIO.of(true);
	var finalFalse = AnyIO.of(false);

	var res1 = foldMap(
		identity,
		ioList.concat(finalFalse)
	)
	.run(/*initV=*/false);

	assert.ok(
		res1 === false,
		"foldMap with all falses"
	);

	var res2 = foldMap(
		identity,
		ioList.concat(finalFalse)
	)
	.run(/*initV=*/true);

	assert.ok(
		res2 === true,
		"foldMap with only first true"
	);

	var res3 = foldMap(
		identity,
		ioList.concat(finalTrue)
	)
	.run(/*initV=*/false);

	assert.ok(
		res3 === true,
		"foldMap with only last true"
	);
});
