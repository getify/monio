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

qunit.module("io-all");

qunit.test("foldMap:very-long", (assert) => {
	var io = AllIO(initV => initV === true);
	var ioList = [ io ];

	for (let i = 0; i < 25000; i++) {
		ioList.push(AllIO.of(true));
	}

	var finalTrue = AllIO.of(true);
	var finalFalse = AllIO.of(false);

	var res1 = foldMap(
		identity,
		ioList.concat(finalTrue)
	)
	.run(/*initV=*/true);

	assert.ok(
		res1 === true,
		"foldMap with all trues"
	);

	var res2 = foldMap(
		identity,
		ioList.concat(finalTrue)
	)
	.run(/*initV=*/false);

	assert.ok(
		res2 === false,
		"foldMap with only first false"
	);

	var res3 = foldMap(
		identity,
		ioList.concat(finalFalse)
	)
	.run(/*initV=*/true);

	assert.ok(
		res3 === false,
		"foldMap with only last false"
	);
});
