"use strict";

// NOTE: these are to silence spurious
// errors/warnings that Node emits b/c
// it doesn't trust that we know what
// we're doing with catching promise
// rejections
process.on("unhandledRejection",()=>{});
process.on("rejectionHandled",()=>{});
// ***************************************************


const rxjs = require("rxjs");
const EventEmitter = require("events");
const qunit = require("qunit");
const { INJECT_MONIO, delayPr, } = require("./utils");
INJECT_MONIO({ Just, Maybe, Either, IO, IOx });

qunit.module("iox-helpers");

qunit.test("filterIn", (assert) => {
	var vals = IOx.of.empty();

	var onlyOdds = vals.chain(IOxHelpers.filterIn(v => v % 2 == 1));
	var onlyEvens = vals.chain(IOxHelpers.filterIn(v => v % 2 == 0));

	var res1 = [];
	var res2 = [];

	IOx((env,v) => res1.push(v),[ onlyOdds, ]).run();
	IOx((env,v) => res2.push(v),[ onlyEvens, ]).run();

	assert.equal(
		res1.length + res2.length,
		0,
		"initially empty"
	);

	vals(1);

	assert.deepEqual(
		res1,
		[ 1 ],
		"only 1 in the onlyOdds"
	);

	assert.equal(
		res2.length,
		0,
		"nothing in onlyEvens yet"
	);

	vals(2);

	assert.deepEqual(
		res1,
		[ 1 ],
		"(still) only 1 in the onlyOdds"
	);

	assert.deepEqual(
		res2,
		[ 2 ],
		"only 2 in the onlyEvens"
	);

	vals(3);

	assert.deepEqual(
		res1,
		[ 1, 3 ],
		"1,3 in the onlyOdds"
	);

	assert.deepEqual(
		res2,
		[ 2 ],
		"(still) only 2 in the onlyEvens"
	);

	vals(4);

	assert.deepEqual(
		res1,
		[ 1, 3 ],
		"(still) 1,3 in the onlyOdds"
	);

	assert.deepEqual(
		res2,
		[ 2, 4 ],
		"2,4 in the onlyEvens"
	);

});

qunit.test("filterOut", (assert) => {
	var vals = IOx.of.empty();

	var onlyOdds = vals.chain(IOxHelpers.filterOut(v => v % 2 == 0));
	var onlyEvens = vals.chain(IOxHelpers.filterOut(v => v % 2 == 1));

	var res1 = [];
	var res2 = [];

	IOx((env,v) => res1.push(v),[ onlyOdds, ]).run();
	IOx((env,v) => res2.push(v),[ onlyEvens, ]).run();

	assert.equal(
		res1.length + res2.length,
		0,
		"initially empty"
	);

	vals(1);

	assert.deepEqual(
		res1,
		[ 1 ],
		"only 1 in the onlyOdds"
	);

	assert.equal(
		res2.length,
		0,
		"nothing in onlyEvens yet"
	);

	vals(2);

	assert.deepEqual(
		res1,
		[ 1 ],
		"(still) only 1 in the onlyOdds"
	);

	assert.deepEqual(
		res2,
		[ 2 ],
		"only 2 in the onlyEvens"
	);

	vals(3);

	assert.deepEqual(
		res1,
		[ 1, 3 ],
		"1,3 in the onlyOdds"
	);

	assert.deepEqual(
		res2,
		[ 2 ],
		"(still) only 2 in the onlyEvens"
	);

	vals(4);

	assert.deepEqual(
		res1,
		[ 1, 3 ],
		"(still) 1,3 in the onlyOdds"
	);

	assert.deepEqual(
		res2,
		[ 2, 4 ],
		"2,4 in the onlyEvens"
	);

});

qunit.test("distinct", (assert) => {
	var oneObj = { x: 1 };
	var oneArr = [ 1 ];
	var oneFunc = () => {};
	var vals = IOx.of.empty();
	var res = [];

	IOx((env,v) => res.push(v),[ vals.chain(IOxHelpers.distinct()) ]).run();

	assert.equal(
		res.length,
		0,
		"initially empty"
	);

	vals(1);
	vals(2);
	vals(3);
	vals(1);
	vals(1);
	vals(2);
	vals(4);

	assert.deepEqual(
		res,
		[ 1, 2, 3, 4 ],
		"only ever-distinct numbers"
	);

	vals(oneObj);
	vals(oneArr);
	vals(oneArr);
	vals(oneObj);
	vals(oneArr);
	vals(oneFunc);
	vals(oneFunc);
	vals(oneObj);

	assert.deepEqual(
		res,
		[ 1, 2, 3, 4, oneObj, oneArr, oneFunc ],
		"including ever-distinct object/array/func values"
	);
});

qunit.test("distinctUntilChanged", (assert) => {
	var oneObj = { x: 1 };
	var oneArr = [ 1 ];
	var oneFunc = () => {};
	var vals = IOx.of.empty();
	var res = [];

	IOx((env,v) => res.push(v),[
		vals.chain(IOxHelpers.distinctUntilChanged()),
	]).run();

	assert.equal(
		res.length,
		0,
		"initially empty"
	);

	vals(1);
	vals(2);
	vals(3);
	vals(1);
	vals(1);
	vals(2);
	vals(2);
	vals(4);

	assert.deepEqual(
		res,
		[ 1, 2, 3, 1, 2, 4 ],
		"only adjacent-distinct numbers"
	);

	vals(oneObj);
	vals(oneArr);
	vals(oneArr);
	vals(2);
	vals(2);
	vals(oneObj);
	vals(oneArr);
	vals(oneFunc);
	vals(3);
	vals(oneFunc);
	vals(oneObj);

	assert.deepEqual(
		res,
		[ 1, 2, 3, 1, 2, 4, oneObj, oneArr, 2, oneObj, oneArr, oneFunc, 3, oneFunc, oneObj ],
		"including adjacent-distinct object/array/func values"
	);
});

qunit.test("reduce/scan", (assert) => {
	var vals = IOx.of.empty();
	var res = [];

	IOx((env,v1,v2) => res.push(v1,v2),[
		vals.chain(IOxHelpers.reduce((product,v) => product * v,3)),
		vals.chain(IOxHelpers.scan((product,v) => product * v,10))
	]).run();

	assert.equal(
		res.length,
		0,
		"initially empty"
	);

	vals(2);

	assert.deepEqual(
		res,
		[ 6, 20 ],
		"first reduction"
	);

	vals(3);

	assert.deepEqual(
		res,
		[ 6, 20, 18, 20, 18, 60 ],
		"second reduction"
	);

	vals(4);

	assert.deepEqual(
		res,
		[ 6, 20, 18, 20, 18, 60, 72, 60, 72, 240 ],
		"third reduction"
	);
});

qunit.test("seq", (assert) => {
	var vals = IOx.of.empty();
	var res1 = [];
	var res2 = [];

	IOx((env,v) => res1.push(v),[
		vals.chain(IOxHelpers.seq()),
	]).run();
	IOx((env,v) => res2.push(v),[
		vals.chain(IOxHelpers.seq(5,-3)),
	]).run();

	assert.equal(
		res1.length + res2.length,
		0,
		"initially empty"
	);

	vals(10);

	assert.deepEqual(
		res1,
		[ 0 ],
		"first sequence iteration counting upward"
	);

	assert.deepEqual(
		res2,
		[ 5 ],
		"first sequence iteration counting downward"
	);

	vals("whatever");

	assert.deepEqual(
		res1,
		[ 0, 1 ],
		"second sequence iteration counting upward"
	);

	assert.deepEqual(
		res2,
		[ 5, 2 ],
		"second sequence iteration counting downward"
	);

	vals(null);

	assert.deepEqual(
		res1,
		[ 0, 1, 2 ],
		"third sequence iteration counting upward"
	);

	assert.deepEqual(
		res2,
		[ 5, 2, -1 ],
		"third sequence iteration counting downward"
	);
});

qunit.test("take", async (assert) => {
	var res1 = [];
	var res2 = [];
	var res3 = [];

	var iox1 = IOx.of.empty();
	var iox2 = IOxHelpers.fromIter([ 10, 20, 30, 40, 50 ],true);
	var iox3 = IOx.of(100);

	var pushed1 = IOx((env,v) => res1.push(v),[ iox1.chain(IOxHelpers.take(4)) ]);
	var pushed2 = IOx((env,v) => res2.push(v),[ iox2.chain(IOxHelpers.take(4)) ]);
	var pushed3 = IOx((env,v) => res3.push(v),[ iox3.chain(IOxHelpers.take(4,/*closeOnComplete=*/false)) ]);

	pushed1.run();

	iox1(1);

	assert.deepEqual(
		res1,
		[ 1 ],
		"first value through first take(4)"
	);

	iox1(3);
	iox1(5);
	iox1(7);
	iox1(9);

	assert.deepEqual(
		res1,
		[ 1, 3, 5, 7 ],
		"only next three values through first take(4)"
	);

	assert.ok(
		pushed1.isClosed(),
		"after taking 4, first closes (as default)"
	);

	pushed2.run();

	assert.deepEqual(
		res2,
		[ 10, 20, 30, 40 ],
		"all four values from iterable through second take(4)"
	);

	assert.ok(
		iox2.isClosed(),
		"after taking 4, second closes (as default)"
	);

	pushed3.run();

	assert.deepEqual(
		res3,
		[ 100 ],
		"first value through third take(4)"
	);

	assert.ok(
		!pushed3.isClosed(),
		"third still open after sending its first value"
	);

	iox3(200);
	iox3(300);
	iox3(400);
	iox3(500);

	assert.deepEqual(
		res3,
		[ 100, 200, 300, 400 ],
		"third only took four"
	);

	assert.ok(
		!pushed3.isClosed(),
		"third still open even after taking all four"
	);
});

qunit.test("debounce", async (assert) => {
	var res1 = [];
	var res2 = [];
	var res3 = [];
	var vals1 = IOx.of.empty();
	var vals2 = IOx.of.empty();
	var vals3 = IOx.of.empty();
	var iox1 = vals1.chain( IOxHelpers.debounce(/*wait=*/30) );
	var iox2 = vals2.chain( IOxHelpers.debounce(/*wait=*/30,/*maxTime=*/70) );
	var chainFn3 = IOxHelpers.debounce(/*wait=*/30);
	var debounceIOxs3 = [];
	var iox3 = vals3.chain(v => {
		debounceIOxs3.push(chainFn3(v));
		return debounceIOxs3[debounceIOxs3.length - 1];
	});

	var pushed1 = IOx((env,v) => res1.push(v),[ iox1 ]);
	var pushed2 = IOx((env,v) => res2.push(v),[ iox2 ]);
	var pushed3 = IOx((env,v) => res3.push(v),[ iox3 ]);

	pushed1.run();

	vals1(10);
	vals1(20);
	await delayPr(5);
	vals1(30);
	await delayPr(40);
	vals1(50);
	await delayPr(0);
	vals1(60);
	await delayPr(40);

	assert.deepEqual(
		res1,
		[ 30, 60 ],
		"debouncing throws away previously received messages if event is triggered again too soon"
	);

	vals1(70);
	vals1(80);
	vals1.close();

	assert.ok(
		vals1.isClosed() && pushed1.isClosed(),
		"closing source stream closes debounced stream"
	);

	assert.deepEqual(
		res1,
		[ 30, 60 ],
		"closing debounced stream doesn't flush any queued values immediately"
	);

	await delayPr(35);

	assert.deepEqual(
		res1,
		[ 30, 60 ],
		"no straggling values come through closed stream after a delay"
	);

	pushed2.run();
	await delayPr(10);
	vals2(200);
	vals2(201);
	vals2(202);
	await delayPr(5);
	vals2(203);
	vals2(204);
	await delayPr(20);
	vals2(205);
	vals2(206);
	await delayPr(10);
	vals2(207);
	await delayPr(15);
	vals2(208);
	await delayPr(20);
	vals2(209);
	await delayPr(25);
	vals2(210);
	vals2(211);
	await delayPr(10);
	vals2(212);
	await delayPr(15);
	vals2(213);
	vals2(214);
	await delayPr(20);
	vals2(215);
	await delayPr(20);
	vals2(216);
	vals2(217);
	await delayPr(15);
	vals2(218);
	await delayPr(35);

	assert.deepEqual(
		res2,
		[ 208, 214, 218 ],
		"debouncing maxTime window forces latest value through"
	);

	vals2.never();

	assert.ok(
		vals2.isNever() && iox2.isNever() && pushed2.isNever(),
		"marking source stream as 'never' marks subsequent streams as 'never'"
	);

	pushed3.run();
	vals3(500);
	vals3(501);
	vals3(502);
	await delayPr(15);
	vals3(503);
	await delayPr(20);
	vals3(504);
	vals3(505);
	await delayPr(35);
	debounceIOxs3[debounceIOxs3.length - 1].never();
	vals3(506);
	vals3(507);
	await delayPr(10);
	vals3(508);
	vals3(509);
	debounceIOxs3[debounceIOxs3.length - 1].never();

	assert.deepEqual(
		res3,
		[ 505 ],
		"marking debounced stream as 'never' doesn't flush any queued values immediately"
	);

	assert.ok(
		!iox3.isNever() && !pushed3.isNever(),
		"marking debounce stream as 'never' doesn't affect subsequent streams"
	);

	await delayPr(35);

	assert.deepEqual(
		res3,
		[ 505 ],
		"marking last debounce stream as 'never' prevents its queued value from ever coming through"
	);

	assert.ok(
		debounceIOxs3.every(iox => iox.isNever()),
		"all debounced streams marked as 'never' (for memory cleanup purposes)"
	);
});

qunit.test("throttle", async (assert) => {
	var res1 = [];

	var iox1 = IOx.of.empty();
	var iox2 = iox1.chain( IOxHelpers.throttle(30) );
	var iox3 = IOx((env,v) => res1.push(v),[ iox2 ]);
	iox3.run();

	for (let i = 0; i < 14; i++) {
		iox1(i);
		if (i % 2 == 1) await delayPr(20);
	}

	assert.deepEqual(
		res1,
		[ 0, 4, 8, 12 ],
		"only throttled values come through"
	);

	iox1.close();

	assert.ok(
		iox1.isClosed() && iox2.isClosed() && iox3.isClosed(),
		"closing source stream propagates through throttle"
	);
});

qunit.test("waitFor", async (assert) => {
	var evt = new EventEmitter();
	var vals = IOx.onEvent(evt,"tick");
	var waitForVals = IOxHelpers.waitFor(vals);

	var res1 = [];
	var res2 = vals.run();
	var res3 = waitForVals.run();
	waitForVals.chain(v => (res1.push(v),IO.of(42))).run();

	assert.equal(
		res2,
		undefined,
		"didn't wait, so is undefined"
	);

	assert.equal(
		res1.length,
		0,
		"still empty"
	);

	assert.ok(
		res3 instanceof Promise,
		"waitFor() produces a promise"
	);

	evt.emit("tick",2);

	assert.equal(
		await res3,
		2,
		"promise resolves to the first value to come through the stream"
	);

	assert.deepEqual(
		res1,
		[ 2 ],
		"only holds 2"
	);

	evt.emit("tick",3);

	assert.deepEqual(
		res1,
		[ 2, 3 ],
		"holds 2,3"
	);
});

qunit.test("zip", (assert) => {
	var vals1 = IOx.of.empty();
	var vals2 = IOx.of.empty();
	var vals3 = IOx.of.empty();
	var valsZipped = IOxHelpers.zip([ vals1, vals2 ]);
	var valsZipped2 = IOxHelpers.zip([ vals3 ]);
	var res = [];

	var pushed = IOx((env,v) => res.push(v),[ valsZipped ]);
	pushed.run();

	assert.equal(
		res.length,
		0,
		"initially empty"
	);

	vals1(5);
	vals1(10);
	vals1(15);

	assert.equal(
		res.length,
		0,
		"still empty"
	);

	vals2(100);

	assert.deepEqual(
		res,
		[ [ 5, 100 ] ],
		"once all source streams have a value, zipped stream emits"
	);

	vals1(20);

	assert.deepEqual(
		res,
		[ [ 5, 100 ] ],
		"source streams keep buffering if necessary"
	);

	vals2(101);
	vals2(102);
	vals2(103);
	vals2(104);

	assert.deepEqual(
		res,
		[ [ 5, 100 ], [ 10, 101 ], [ 15, 102 ], [ 20, 103 ] ],
		"buffered streams drain as sufficient values in other streams arrive"
	);

	vals1.stop();
	vals2(105);
	vals2(106);
	vals2(107);
	vals2(108);

	assert.deepEqual(
		res,
		[ [ 5, 100 ], [ 10, 101 ], [ 15, 102 ], [ 20, 103 ] ],
		"stopped source streams just prevent any zipping"
	);

	vals1(25);

	assert.deepEqual(
		res,
		[ [ 5, 100 ], [ 10, 101 ], [ 15, 102 ], [ 20, 103 ], [ 25, 104 ] ],
		"restarting source stream allows zipping to continue"
	);

	valsZipped.stop();
	vals1(30);
	vals1(35);
	vals2(109);

	valsZipped.run();

	assert.deepEqual(
		res,
		[ [ 5, 100 ], [ 10, 101 ], [ 15, 102 ], [ 20, 103 ], [ 25, 104 ], [ 35, 105 ] ],
		"restarting zip-stream allows zipping to continue"
	);

	vals1.close();
	vals1(40);

	assert.ok(
		!valsZipped.isClosed(),
		"closed source stream does not close zip-stream"
	);

	assert.deepEqual(
		res,
		[ [ 5, 100 ], [ 10, 101 ], [ 15, 102 ], [ 20, 103 ], [ 25, 104 ], [ 35, 105 ], [ 106 ], [ 107 ], [ 108 ], [ 109 ] ],
		"closed source stream reduces zipping size, allows draining buffer"
	);

	vals2(110);

	assert.deepEqual(
		res,
		[ [ 5, 100 ], [ 10, 101 ], [ 15, 102 ], [ 20, 103 ], [ 25, 104 ], [ 35, 105 ], [ 106 ], [ 107 ], [ 108 ], [ 109 ], [ 110 ] ],
		"zipping continues even with fewer source streams"
	);

	vals2.close();
	vals2(111);

	assert.deepEqual(
		res,
		[ [ 5, 100 ], [ 10, 101 ], [ 15, 102 ], [ 20, 103 ], [ 25, 104 ], [ 35, 105 ], [ 106 ], [ 107 ], [ 108 ], [ 109 ], [ 110 ] ],
		"when all source streams are closed, zip-stream gets nothing else"
	);

	assert.ok(
		valsZipped.isClosed(),
		"once all source streams are closed, zip-stream is closed"
	);

	valsZipped2.run();
	var res2 = valsZipped2.isClosed();
	valsZipped2.close();
	var res3 = valsZipped2.isClosed();

	assert.ok(
		!res2 && res3 && !vals3.isClosed(),
		"zip stream doesn't close unless we close it"
	);
});

qunit.test("merge", (assert) => {
	var vals1 = IOx.of.empty();
	var vals2 = IOx.of.empty();
	var vals3 = IOx.of.empty();
	var valsMerged = IOxHelpers.merge([ vals1, vals2 ]);
	var valsMerged2 = IOxHelpers.merge([ vals3 ]);
	var res = [];

	var pushed = IOx((env,v) => res.push(v),[ valsMerged ]);
	pushed.run();

	assert.equal(
		res.length,
		0,
		"initially empty"
	);

	vals1(5);

	assert.deepEqual(
		res,
		[ 5 ],
		"(1) any stream can contribute to merge regardless of the other streams"
	);

	vals1(10);

	assert.deepEqual(
		res,
		[ 5, 10 ],
		"(2) any stream can contribute to merge regardless of the other streams"
	);

	vals2(100);
	vals2(101);
	vals1(15);
	vals2(102);

	assert.deepEqual(
		res,
		[ 5, 10, 100, 101, 15, 102 ],
		"(3) any stream can contribute to merge regardless of the other streams"
	);

	pushed.stop();

	vals1(20);
	vals2(103);

	assert.deepEqual(
		res,
		[ 5, 10, 100, 101, 15, 102 ],
		"stopped subscription to merge-stream doesn't collect its values"
	);

	pushed.run();

	assert.deepEqual(
		res,
		[ 5, 10, 100, 101, 15, 102, 103 ],
		"restarting subscription picks up latest value"
	);

	vals2(104);
	vals1(25);

	assert.deepEqual(
		res,
		[ 5, 10, 100, 101, 15, 102, 103, 104, 25 ],
		"merge-stream still sending values"
	);

	valsMerged.stop();

	vals1(30);
	vals2(105);
	vals2(106);
	vals1(35);

	valsMerged.run();

	assert.deepEqual(
		res,
		[ 5, 10, 100, 101, 15, 102, 103, 104, 25, 35, 106 ],
		"merge-stream pushed out latest from both participating streams when restarting"
	);

	vals2(107);
	vals1.stop();
	vals1(40);
	vals2(108);

	assert.deepEqual(
		res,
		[ 5, 10, 100, 101, 15, 102, 103, 104, 25, 35, 106, 107, 40, 108 ],
		"stopped and restarted source stream still participates in the merge"
	);

	vals1.close();

	assert.ok(
		!valsMerged.isClosed(),
		"merge-stream still open even if a source stream is closed (as long as at least one source stream is still open)"
	);

	vals2(109);
	vals1(45);
	vals2(110);

	assert.deepEqual(
		res,
		[ 5, 10, 100, 101, 15, 102, 103, 104, 25, 35, 106, 107, 40, 108, 109, 110 ],
		"closed sources streams don't participate in merge-stream, but don't affect it"
	);

	vals2.close();
	vals2(111);

	assert.deepEqual(
		res,
		[ 5, 10, 100, 101, 15, 102, 103, 104, 25, 35, 106, 107, 40, 108, 109, 110 ],
		"when all source streams are closed, merge-stream gets nothing else"
	);

	assert.ok(
		valsMerged.isClosed(),
		"once all source streams are closed, merge-stream is closed"
	);

	valsMerged2.run();
	var res2 = valsMerged2.isClosed();
	valsMerged2.close();
	var res3 = valsMerged2.isClosed();

	assert.ok(
		!res2 && res3 && !vals3.isClosed(),
		"merge stream doesn't close unless we close it"
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

qunit.test("onTimer", async (assert) => {
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

qunit.test("fromIO", async (assert) => {
	var res1 = [];
	var res2 = [];

	var x = IO(env => { res1.push("x",env); return env; });
	var y = IO(env => { res2.push("y",env); return Promise.resolve(env); });

	var z = IOx.fromIO(x);
	var w = IOx.fromIO(y);

	var res3 = z.run(2);

	assert.equal(
		res3,
		2,
		"sync IO to IOx flows through immediately"
	);

	assert.deepEqual(
		res1,
		[ "x", 2 ],
		"sync IO executed once for IOx evaluation"
	);

	res3 = z.run(2);

	assert.equal(
		res3,
		2,
		"sync IO to IOx flows through immediately, again"
	);

	assert.deepEqual(
		res1,
		[ "x", 2, "x", 2 ],
		"sync IO executed again for second IOx evaluation"
	);

	res3 = w.run(3);

	assert.ok(
		res3 instanceof Promise,
		"async IO produces promise from IOx"
	);

	res3 = await res3;

	assert.equal(
		res3,
		3,
		"async IO to IOx flows through asynchronously"
	);

	assert.deepEqual(
		res2,
		[ "y", 3 ],
		"async IO executed once for IOx evaluation"
	);

	res3 = await w.run(3);

	assert.equal(
		res3,
		3,
		"async IO to IOx flows through asynchronously, again"
	);

	assert.deepEqual(
		res2,
		[ "y", 3, "y", 3 ],
		"async IO executed again for second IOx evaluation"
	);
});

qunit.test("fromIter:sync", (assert) => {
	var vals1 = IOx.fromIter([1,2,3]);
	var vals2 = IOx.fromIter(() => [4,5,6][Symbol.iterator](),/*closeOnComplete=*/false);
	var vals3 = IOx.fromIter([7,8,9][Symbol.iterator](),/*closeOnComplete=*/false);

	var res1 = [];
	var res2 = [];
	var res3 = [];

	var x = IOx((env,v) => { res1.push("x",v); },[ vals1, ]);
	var y = IOx((env,v) => { res2.push("y",v); },[ vals2, ]);
	var z = IOx((env,v) => { res3.push("z",v); },[ vals3, ]);

	x.run();

	assert.deepEqual(
		res1,
		[ "x", 1, "x", 2, "x", 3 ],
		"(1) sync iterable comes through all at once"
	);

	assert.ok(
		vals1.isClosed(),
		"IOx automatically closes when subscribed iterable is fully consumed"
	);

	assert.ok(
		x.isClosed(),
		"IOx closes when subscribed iterable has closed"
	);

	y.run();

	assert.deepEqual(
		res2,
		[ "y", 4, "y", 5, "y", 6 ],
		"(2) sync iterable comes through all at once"
	);

	assert.ok(
		!vals2.isClosed(),
		"sync iterable stays open"
	);

	assert.ok(
		!y.isClosed(),
		"IOx not closed when subscribed iterable stays open"
	);

	vals2(60);
	vals2(600);

	assert.deepEqual(
		res2,
		[ "y", 4, "y", 5, "y", 6, "y", 60, "y", 600 ],
		"still open sync iterable can still push through more values"
	);

	vals2.close();
	vals2.close();

	assert.ok(
		y.isClosed(),
		"IOx closes when subscribed iterable is manually closed"
	);

	vals3.run();
	z.run();

	vals3(30);
	vals3(300);
	vals3(3000);

	assert.deepEqual(
		res3,
		[ "z", 9, "z", 30, "z", 300, "z", 3000 ],
		"sync iterable only emits values once subscribed (discards all but most recent)"
	);
});

qunit.test("fromIter:async", async (assert) => {
	function asyncIter(iter) {
		return async function *asyncIter() {
			for (let v of iter) {
				await delayPr(10);
				yield v;
			}
		};
	}

	// **************************

	var vals1 = IOxHelpers.fromIter({
		[Symbol.asyncIterator]() { return asyncIter([1,2,3])(); }
	});
	var vals2 = IOxHelpers.fromIter(asyncIter([4,5,6]),/*closeOnComplete=*/false);
	var vals3 = IOxHelpers.fromIter(asyncIter([7,8,9])(),/*closeOnComplete=*/false);

	var res1 = [];
	var res2 = [];
	var res3 = [];

	var x = IOx((env,v) => { res1.push("x",v); },[ vals1, ]);
	var y = IOx((env,v) => { res2.push("y",v); },[ vals2, ]);
	var z = IOx((env,v) => { res3.push("z",v); },[ vals3, ]);

	x.run();

	await delayPr(50);

	assert.deepEqual(
		res1,
		[ "x", 1, "x", 2, "x", 3 ],
		"(1) async iterable comes through eventually"
	);

	assert.ok(
		vals1.isClosed(),
		"IOx automatically closes when subscribed iterable is fully consumed"
	);

	assert.ok(
		x.isClosed(),
		"IOx closes when subscribed iterable has closed"
	);

	y.run();

	await delayPr(50);

	assert.deepEqual(
		res2,
		[ "y", 4, "y", 5, "y", 6 ],
		"(2) async iterable comes through eventually"
	);

	assert.ok(
		!vals2.isClosed(),
		"async iterable stays open"
	);

	assert.ok(
		!y.isClosed(),
		"IOx not closed when subscribed iterable stays open"
	);

	vals2(60);
	vals2(600);

	assert.deepEqual(
		res2,
		[ "y", 4, "y", 5, "y", 6, "y", 60, "y", 600 ],
		"still open sync iterable can still push through more values"
	);

	vals2.close();
	vals2.close();

	assert.ok(
		y.isClosed(),
		"IOx closes when subscribed iterable is manually closed"
	);

	vals3.run();

	await delayPr(50);

	z.run();

	vals3(30);
	vals3(300);
	vals3(3000);

	assert.deepEqual(
		res3,
		[ "z", 9, "z", 30, "z", 300, "z", 3000 ],
		"async iterable only emits values once subscribed (discards all but most recent)"
	);
});

qunit.test("fromIter:sync-of-async", async (assert) => {
	function syncOfAsyncIter(iter) {
		return iter.map(v => delayPr(10).then(() => v));
	}

	// **************************

	var vals1 = IOxHelpers.fromIter(syncOfAsyncIter([1,2,3]));

	var res1 = [];

	var x = IOx((env,v) => { res1.push("x",v); },[ vals1, ]);

	x.run();

	await delayPr(50);

	assert.deepEqual(
		res1,
		[ "x", 1, "x", 2, "x", 3 ],
		"(1) async iterable comes through eventually"
	);

	assert.ok(
		vals1.isClosed(),
		"IOx automatically closes when subscribed iterable is fully consumed"
	);

	assert.ok(
		x.isClosed(),
		"IOx closes when subscribed iterable has closed"
	);
});

qunit.test("toIter:sync", async (assert) => {
	var x = IOxHelpers.fromIter([ 1, 2, 3 ]);
	var y = IOxHelpers.fromIter([ 4, 5, 6 ],/*closeOnComplete=*/false);
	var z = IOxHelpers.fromIter([ 7, 8, 9 ],/*closeOnComplete=*/false);
	var w = IOxHelpers.fromIter([]);

	var res1 = [];
	var res2 = [];
	var res3 = [];
	var res4 = [];
	var res5;

	var it1 = IOxHelpers.toIter(x,/*env=*/undefined);
	for await (let v of it1) {
		res1.push("x",v);
		if (v === 2) {
			res5 = it1.return(42);
		}
	}

	assert.ok(
		x.isClosed(),
		"sync source IOx ran (and closed itself)"
	);

	assert.deepEqual(
		res1,
		[ "x", 1, "x", 2 ],
		"async iterable received all values from sync source IOx, until it closed itself"
	);

	assert.ok(
		res5 instanceof Promise,
		"iterable return() produces a promise"
	);

	res5 = await res5;

	assert.ok(
		res5.value === 42 && res5.done === true,
		"iterable return() promise resolves properly"
	);

	for await (let v of IOxHelpers.toIter(y,/*env=*/undefined)) {
		res2.push("y",v);
		if (v === 5) {
			res2.push("closing");
			y.close();
		}
	}

	assert.ok(
		y.isClosed(),
		"sync source IOx ran (and was manually closed during consumption)"
	);

	assert.deepEqual(
		res2,
		[ "y", 4, "y", 5, "closing", "y", 6 ],
		"(1) async iterable received all values from sync source IOx"
	);

	// asynchronously close z
	setTimeout(function timer(){
		res3.push("closing");
		z.close();
	},50);

	for await (let v of IOxHelpers.toIter(z,/*env=*/undefined)) {
		res3.push("z",v);
	}

	assert.ok(
		z.isClosed(),
		"sync source IOx ran (and was asynchronously closed after consumption)"
	);

	assert.deepEqual(
		res3,
		[ "z", 7, "z", 8, "z", 9, "closing" ],
		"(2) async iterable received all values from sync source IOx"
	);

	w.run();

	assert.ok(
		w.isClosed(),
		"empty iterable source IOx closed itself immediately"
	);

	var it2 = IOxHelpers.toIter(w,/*env=*/undefined);

	for await (let v of it2) {
		res4.push("w, oops",v);
	}

	assert.ok(
		res4.length == 0,
		"async iterable didn't receive any values from an already closed sync source IOx"
	);

	let { value: resValue, done: resDone } = await it2.next();

	assert.ok(
		resValue === undefined && resDone === true,
		"iterating an already closed iterator does nothing"
	);

	let { value: retValue, done: retDone } = await it2.return(100);

	assert.ok(
		retValue === 100 && retDone === true,
		"iterator return() after close does nothing"
	);
});

qunit.test("toIter:async", async (assert) => {
	function asyncIter(iter) {
		return async function *asyncIter() {
			for (let v of iter) {
				await delayPr(10);
				yield v;
			}
		};
	}

	var x = IOxHelpers.fromIter(asyncIter([ 1, 2, 3 ]));
	var y = IOxHelpers.fromIter(asyncIter([ 4, 5, 6 ]),/*closeOnComplete=*/false);
	var z = IOxHelpers.fromIter(asyncIter([ 7, 8, 9 ]),/*closeOnComplete=*/false);
	var w = IOxHelpers.fromIter(asyncIter([]));

	var res1 = [];
	var res2 = [];
	var res3 = [];
	var res4 = [];
	var res5;

	var it1 = IOxHelpers.toIter(x,/*env=*/undefined);
	for await (let v of it1) {
		res1.push("x",v);
		if (v === 2) {
			res5 = it1.return(42);
		}
	}

	// wait for closure to fully propagate
	await delayPr(25);

	assert.ok(
		x.isClosed(),
		"async source IOx ran (and closed itself)"
	);

	assert.deepEqual(
		res1,
		[ "x", 1, "x", 2 ],
		"async iterable received all values from async source IOx, until it closed itself"
	);

	assert.ok(
		res5 instanceof Promise,
		"iterable return() produces a promise"
	);

	res5 = await res5;

	assert.ok(
		res5.value === 42 && res5.done === true,
		"iterable return() promise resolves properly"
	);

	for await (let v of IOxHelpers.toIter(y,/*env=*/undefined)) {
		res2.push("y",v);
		if (v === 5) {
			res2.push("closing");
			y.close();
		}
	}

	assert.ok(
		y.isClosed(),
		"async source IOx ran (and was manually closed during consumption)"
	);

	assert.deepEqual(
		res2,
		[ "y", 4, "y", 5, "closing" ],
		"async iterable received all values from async source IOx, until it closed itself"
	);

	// asynchronously close z
	setTimeout(function timer(){
		res3.push("closing");
		z.close();
	},50);

	for await (let v of IOxHelpers.toIter(z,/*env=*/undefined)) {
		res3.push("z",v);
	}

	assert.ok(
		z.isClosed(),
		"async source IOx ran (and was asynchronously closed after consumption)"
	);

	assert.deepEqual(
		res3,
		[ "z", 7, "z", 8, "z", 9, "closing" ],
		"async iterable received all values from async source IOx"
	);

	w.run();

	// wait for closure to fully propagate
	await delayPr(25);

	assert.ok(
		w.isClosed(),
		"empty iterable source IOx closed itself eventually"
	);

	var it2 = IOxHelpers.toIter(w,/*env=*/undefined);

	for await (let v of it2) {
		res4.push("w, oops",v);
	}

	assert.ok(
		res4.length == 0,
		"async iterable didn't receive any values from an already closed async source IOx"
	);

	let { value: resValue, done: resDone } = await it2.next();

	assert.ok(
		resValue === undefined && resDone === true,
		"iterating an already closed iterator does nothing"
	);

	let { value: retValue, done: retDone } = await it2.return(100);

	assert.ok(
		retValue === 100 && retDone === true,
		"iterator return() after close does nothing"
	);
});

qunit.test("fromObservable", async (assert) => {
	var res1 = [];
	var res2 = [];

	var sub;
	var rx1 = new rxjs.Observable(subscriber => {
		sub = subscriber;
	});
	var iox1 = IOx.fromObservable(rx1);
	var pusher1 = IOx((env,v) => (res1.push(v), v),[ iox1 ]);

	var rx2 = rxjs.of(20,30,40);
	var pusher2 = IOx((env,v) => res2.push(v),[ IOx.fromObservable(rx2) ]);

	var res3 = iox1.run();
	var res4 = pusher1.run();

	assert.equal(
		res3,
		undefined,
		"iox-from-observable returns undefined when run"
	);

	assert.ok(
		res4 instanceof Promise,
		"subscribed pusher iox waiting for observable's first value (via promise)"
	);

	sub.next(10);

	res4 = await res4;

	assert.equal(
		res4,
		10,
		"subscribed pusher resolved to first value from observable"
	);

	assert.deepEqual(
		res1,
		[ 10 ],
		"received first value from observable"
	);

	sub.next(15);

	iox1.close();

	assert.ok(
		pusher1.isClosed() && iox1.isClosed() && sub.closed,
		"iox close() unsubscribes observable"
	);

	assert.deepEqual(
		res1,
		[ 10, 15 ],
		"received second value from observable"
	);

	pusher2.run();

	assert.deepEqual(
		res2,
		[ 20, 30, 40 ],
		"received predefined values from observable"
	);

	assert.ok(
		pusher2.isClosed(),
		"completed observable closed iox"
	);
});
