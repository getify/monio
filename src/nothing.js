"use strict";

var { isFunction, } = require("./lib/util.js");

const BRAND = {};

module.exports = Object.assign(Nothing,{
	of: Nothing, pure: Nothing, unit: Nothing,
	is, isEmpty,
});


// **************************

function Nothing() {
	var publicAPI = {
		map: noop, chain: noop, flatMap: noop, bind: noop,
		fold, ap: noop, concat: noop, _inspect, _is,
		[Symbol.toStringTag]: "Nothing",
	};
	return publicAPI;

	// *********************

	function noop() {
		return publicAPI;
	}

	function fold(fn) {
		return fn();
	}

	function _inspect() {
		return `${publicAPI[Symbol.toStringTag]}()`;
	}

	function _is(br) {
		return br === BRAND;
	}

}

function is(val) {
	return !!(val && isFunction(val._is) && val._is(BRAND));
}

// default isEmpty(), can be overidden
function isEmpty(val) {
	return val == null; // null or undefined
}
