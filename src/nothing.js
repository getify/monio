"use strict";

var brand = {};

module.exports = Object.assign(Nothing,{
	of: Nothing, pure: Nothing, unit: Nothing,
	is, isEmpty,
});


// **************************

function Nothing() {
	var publicAPI = {
		map: noop, chain: noop, flatMap: noop, bind: noop,
		ap: noop, concat: noop, _inspect, _is,
		[Symbol.toStringTag]: "Nothing",
	};
	return publicAPI;

	// *********************

	function noop() {
		return publicAPI;
	}

	function _inspect() {
		return `${publicAPI[Symbol.toStringTag]}()`;
	}

	function _is(br) {
		return br === brand;
	}

}

function is(val) {
	return val && typeof val._is == "function" && val._is(brand);
}

// default isEmpty(), can be overidden
function isEmpty(val) {
	return val == null; // null or undefined
}
