"use strict";

var {
	isFunction,
	definePipeWithMethodChaining,
	definePipeWithFunctionComposition,
} = require("./lib/util.js");

const BRAND = {};

Object.defineProperty(Just,Symbol.hasInstance,{
	value: is,
});

module.exports = Object.assign(Just,{
	of: Just, pure: Just, unit: Just, is,
});


// **************************

function Just(val) {
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		fold, ap, concat, _inspect, _is, toString: _inspect,
		[Symbol.toStringTag]: "Just", [Symbol.toPrimitive]: _inspect,
		*[Symbol.iterator]() { return yield this; },
	};
	// decorate API methods with `.pipe(..)` helper
	definePipeWithFunctionComposition(publicAPI,"map");
	definePipeWithMethodChaining(publicAPI,"chain");
	definePipeWithMethodChaining(publicAPI,"ap");
	definePipeWithMethodChaining(publicAPI,"concat");
	return publicAPI;

	// *********************

	function map(fn) {
		return Just(fn(val));
	}

	// aka: bind, flatMap
	function chain(fn) {
		return fn(val);
	}

	// note: this is like `chain(..)`
	// but doesn't expect a Just return
	function fold(fn) {
		return fn(val);
	}

	function ap(m) {
		return m.map(val);
	}

	function concat(m) {
		return m.map(v => val.concat(v));
	}

	function _inspect() {
		return `${publicAPI[Symbol.toStringTag]}(${ _serialize(val) })`;
	}

	function _serialize(val) {
		return (
			typeof val == "string" ? `"${ val }"` :
			typeof val == "undefined" ? "" :
			isFunction(val) ? (val.name || "anonymous function") :
			val && isFunction(val._inspect) ? val._inspect() :
			Array.isArray(val) ? `[${ val.map(v => v == null ? String(v) : _serialize(v)) }]` :
			String(val)
		);
	}

	function _is(br) {
		return br === BRAND;
	}

}

function is(val) {
	return !!(val && isFunction(val._is) && val._is(BRAND));
}
