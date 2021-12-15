"use strict";

var { isFunction, } = require("./lib/util.js");
var Just = require("./just.js");
var Nothing = require("./nothing.js");

const BRAND = {};

Object.assign(MaybeJust,Just);
Object.assign(MaybeNothing,Nothing);

module.exports = Object.assign(Maybe,{
	Just: MaybeJust, Nothing: MaybeNothing, of: Maybe,
	pure: Maybe, unit: Maybe, is, from,
});


// **************************

function MaybeJust(val) {
	return Maybe(val);
}

function MaybeNothing() {
	return Maybe(Nothing());
}

function Maybe(val) {
	var mn = val;
	var isJust = MaybeJust.is(mn) && !is(mn);
	var isNothing = MaybeNothing.is(mn) && !is(mn);

	if (!(isJust || isNothing)) {
		mn = Just(val);
		isJust = true;
	}
	else if (isJust) {
		// intentional monad violation, to extract its value
		val = mn.chain(v => v);
	}
	// isNothing
	else {
		val = void 0;
	}

	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		ap, concat, fold, _inspect, _is,
		get [Symbol.toStringTag]() {
			return `Maybe:${mn[Symbol.toStringTag]}`;
		},
	};

	return publicAPI;

	// *********************

	function map(fn) {
		return (isJust ? Maybe(mn.map(fn)) : publicAPI);
	}

	function chain(fn) {
		return (isJust ? mn.chain(fn) : publicAPI);
	}

	function ap(m) {
		return (isJust ? m.map(val) : publicAPI);
	}

	function concat(m) {
		return (isJust ? m.map(v => val.concat(v)) : publicAPI);
	}

	function fold(asNothing,asJust) {
		return (isJust ? asJust(val) : asNothing(val));
	}

	function _inspect() {
		var v = isJust ? mn._inspect().match(/^Just\((.*)\)$/)[1] : "";
		return `${publicAPI[Symbol.toStringTag]}(${ v })`;
	}

	function _is(br) {
		return !!(br === BRAND || mn._is(br));
	}

}

function is(val) {
	return !!(val && isFunction(val._is) && val._is(BRAND));
}

function from(val) {
	return MaybeNothing.isEmpty(val) ? MaybeNothing() : Maybe(val);
}
