"use strict";

var { isFunction, } = require("./lib/util.js");

var brand = {};

module.exports = Object.assign(Just,{
	of: Just, pure: Just, unit: Just, is,
});


// **************************

function Just(val) {
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		ap, concat, _inspect, _is,
		[Symbol.toStringTag]: "Just",
	};
	return publicAPI;

	// *********************

	function map(fn) {
		return Just(fn(val));
	}

	// aka: bind, flatMap
	function chain(fn) {
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
		return br === brand;
	}

}

function is(val) {
	return val && isFunction(val._is) && val._is(brand);
}
