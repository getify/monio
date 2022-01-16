"use strict";

// *****************************************
// these are injected by the testing process
// via `INJECT_MONIO(..)` below
var just;
var maybe;
var either;
var IO;
var IOx;

// *****************************************


const inc = x => x + 1;
const twice = x => x * 2;
const justProp = (key) => (obj) => just(obj[key]);
const maybeProp = (key) => (obj) => maybe.Just(obj[key]);
const eitherProp = (key) => (obj) => either(obj[key]);
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
		Just: just,
		Maybe: maybe,
		Either: either,
		IO,
		IOx,
	} = monio);
}

module.exports = {
	INJECT_MONIO,
	inc,
	twice,
	justProp,
	maybeProp,
	eitherProp,
	ioProp,
	delayPr,
	delayIO,
	delayIOx,
	safeAwait,
};
