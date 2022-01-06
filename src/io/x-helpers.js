"use strict";

var {
	curry,
} = require("../lib/util.js");
var IOx = require("./iox.js");

// curry some public methods
reduce = curry(reduce,2);

module.exports = {
	filterIn,
	filterOut,
	distinct,
	distinctUntilChanged,
	reduce,
	seq,
	waitFor,

	// even though these are actually defined in
	// IOx, they're re-exported on this namespace
	// for convenience and coherency
	merge: IOx.merge,
	zip: IOx.zip,
	doIOx: IOx.do,
	doEIOx: IOx.doEither,
	fromIter: IOx.fromIter,
	toIter: IOx.toIter,
};
module.exports.filterIn = filterIn;
module.exports.filterOut = filterOut;
module.exports.distinct = distinct;
module.exports.distinctUntilChanged = distinctUntilChanged;
module.exports.reduce = reduce;
module.exports.seq = seq;
module.exports.waitFor = waitFor;

// even though these are actually defined in
// IOx, they're re-exported on this namespace
// for convenience and coherency
module.exports.merge = IOx.merge;
module.exports.zip = IOx.zip;
module.exports.doIOx = IOx.do;
module.exports.doEIOx = IOx.doEither;
module.exports.fromIter = IOx.fromIter;
module.exports.toIter = IOx.toIter;


// **************************

function filterIn(predicate) {
	const NeverIOx = IOx.of.empty();
	NeverIOx.freeze();
	NeverIOx.close = () => {};
	var iox = IOx.of.empty();

	return function filter(v){
		if (predicate(v)) {
			iox(v);
			return iox;
		}
		else {
			return NeverIOx;
		}
	};
}

function filterOut(predicate) {
	return filterIn(v => !predicate(v));
}

function distinct() {
	var prevPrim = new Set();
	var prevObj = new WeakSet();

	return filterIn(function distinct(v){
		var prevSet = (
			v && [ "object", "function" ].includes(typeof v) ? prevObj : prevPrim
		);
		if (!prevSet.has(v)) {
			prevSet.add(v);
			return true;
		}
		return false;
	});
}

function distinctUntilChanged() {
	// note: a distinct object literal as an initial
	// sentinel value to distinguish from any possible
	// passed in value (including undefined)
	var prev = {};

	return filterIn(function distinctUntilChanged(v){
		if (prev instanceof WeakSet) {
			if (v && [ "object", "function" ].includes(typeof v)) {
				if (!prev.has(v)) {
					prev = new WeakSet();
					prev.add(v);
					return true;
				}
			}
			else {
				prev = v;
				return true;
			}
		}
		else {
			if (v && [ "object", "function" ].includes(typeof v)) {
				prev = new WeakSet();
				prev.add(v);
				return true;
			}
			else if (!Object.is(v,prev)) {
				prev = v;
				return true;
			}
		}
		return false;
	});
}

function reduce(reducer,initialVal) {
	var iox = IOx.of.empty();
	var acc = initialVal;

	return function reduce(v){
		acc = reducer(acc,v);
		iox(acc);
		return iox;
	};
}

function seq(start = 0,step = 1) {
	return reduce((counter,v) => counter + step,start - step);
}

function waitFor(iox) {
	return IOx((env,v) => v,[ iox, ]);
}
