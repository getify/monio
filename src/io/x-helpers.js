"use strict";

var {
	EMPTY_FUNC,
	curry,
} = require("../lib/util.js");
var IOx = require("./iox.js");

// curry some public methods
reduce = curry(reduce,2);
eventPullStream = curry(eventPullStream,2);

module.exports = {
	filterIn,
	filterOut,
	distinct,
	distinctUntilChanged,
	reduce,
	scan: reduce,
	seq,
	take,
	takeWhile,
	throttle,
	waitFor,
	eventPullStream,

	// even though these are actually defined in
	// IOx, they're re-exported on this namespace
	// for convenience and coherency
	merge: IOx.merge,
	zip: IOx.zip,
	doIOx: IOx.do,
	doEIOx: IOx.doEither,
	debounce: IOx.debounce,
	onEvent: IOx.onEvent,
	onceEvent: IOx.onceEvent,
	onTimer: IOx.onTimer,
	fromIO: IOx.fromIO,
	fromIter: IOx.fromIter,
	toIter: IOx.toIter,
	fromObservable: IOx.fromObservable,
};
module.exports.filterIn = filterIn;
module.exports.filterOut = filterOut;
module.exports.distinct = distinct;
module.exports.distinctUntilChanged = distinctUntilChanged;
module.exports.reduce = reduce;
module.exports.scan = reduce;
module.exports.seq = seq;
module.exports.take = take;
module.exports.takeWhile = takeWhile;
module.exports.throttle = throttle;
module.exports.waitFor = waitFor;
module.exports.eventPullStream = eventPullStream;

// even though these are actually defined in
// IOx, they're re-exported on this namespace
// for convenience and coherency
module.exports.merge = IOx.merge;
module.exports.zip = IOx.zip;
module.exports.doIOx = IOx.do;
module.exports.doEIOx = IOx.doEither;
module.exports.debounce = IOx.debounce;
module.exports.onEvent = IOx.onEvent;
module.exports.onceEvent = IOx.onceEvent;
module.exports.onTimer = IOx.onTimer;
module.exports.fromIO = IOx.fromIO;
module.exports.fromIter = IOx.fromIter;
module.exports.toIter = IOx.toIter;
module.exports.fromObservable = IOx.fromObservable;


// **************************

function filterIn(predicate) {
	var iox = IOx.of.empty();

	return function filter(v){
		if (predicate(v)) {
			iox(v);
			return iox;
		}
		else {
			return IOx.Never;
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

function take(count,closeOnComplete = true) {
	count = Math.max(Number(count) || 0,0);
	return takeWhile(() => (count-- > 0),closeOnComplete);
}

function takeWhile(whilePredicate,closeOnComplete = true) {
	var iox = IOx.of.empty();

	return function takeWhile(v){
		if (whilePredicate(v)) {
			iox(v);
			return iox;
		}
		else if (!iox.isClosed() && closeOnComplete) {
			iox.close();
		}
		return IOx.Never;
	};
}

function throttle(time) {
	time = Math.max(Number(time) || 0,0);

	var timer;
	var ioxs = [];

	return function throttle(v) {
		ioxs.push(IOx.of.empty());
		var lastIOx = ioxs[ioxs.length - 1];

		if (timer == null) {
			let prevIOxs = ioxs.slice(0,-1);
			ioxs.length = 0;

			// clean up previous IOxs that won't ever
			// get a value
			for (let prevIOx of prevIOxs) {
				prevIOx.never();
			}
			if (!lastIOx.isClosed()) {
				// timer completed, so emit value
				lastIOx(v);
			}

			// set throttle window timer
			timer = setTimeout(() => (timer = null),time);
		}

		// return only the most recently created IOx
		return lastIOx;
	};
}

function waitFor(iox) {
	return IOx((env,v) => v,[ iox, ]);
}

function eventPullStream(el,evtName,opts) {
	return IOx.toIter(IOx.onEvent(el,evtName,opts));
}
