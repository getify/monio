"use strict";

// *****************************************
// these are injected by the testing process
// via `INJECT_MONIO(..)` below
var just;
var maybe;
var either;
var state;
var IO;
var IOx;

// *****************************************


const inc = x => x + 1;
const twice = x => x * 2;
const justProp = (key) => (obj) => just(obj[key]);
const maybeProp = (key) => (obj) => maybe.Just(obj[key]);
const eitherProp = (key) => (obj) => either(obj[key]);
const stateProp = (key) => (obj) => state.of(obj[key]);
const asyncStateProp = (key) => (obj) => asyncStateVal(obj[key]);
const asyncStateVal = v => state(async st => ({ value: v, state: st }));
const ioProp = (key) => (obj) => IO.of(obj[key]);
const delayPr = (ms) => new Promise(r => setTimeout(r,ms));
const delayIO = (v,ms) => IO(() => delayPr(ms).then(() => v));
const delayIOx = (v,ms) => IOx(() => delayPr(ms).then(() => v),[]);

async function safeAwait(pr) {
	try {
		return await pr;
	}
	catch (err) {
		return err;
	}
}

function INJECT_MONIO(monio) {
	({
		Just: just = just,
		Maybe: maybe = maybe,
		Either: either = either,
		State: state = state,
		IO = IO,
		IOx = IOx,
	} = monio);
}

function sumArithSeries(n,a1 = 0,a2 = n - 1) {
	return n * (a1 + a2) / 2;
}

module.exports = {
	INJECT_MONIO,
	inc,
	twice,
	justProp,
	maybeProp,
	eitherProp,
	stateProp,
	asyncStateProp,
	asyncStateVal,
	ioProp,
	delayPr,
	delayIO,
	delayIOx,
	safeAwait,
	sumArithSeries,
};
