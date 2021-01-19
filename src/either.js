"use strict";

var { isFunction, } = require("./lib/util.js");
var Just = require("./just.js");

var brand = {};

Left.is = LeftIs;
Right.is = RightIs;

module.exports = Object.assign(Either,{
	Left, Right, of: Right, pure: Right,
	unit: Right, is, fromFoldable,
});


// **************************

function Left(val) {
	return LeftOrRight(val,/*isRight=*/false);
}

function LeftIs(val) {
	return is(val) && !val._is_right();
}

function Right(val) {
	return LeftOrRight(val,/*isRight=*/true);
}

function RightIs(val) {
	return is(val) && val._is_right();
}

function Either(val) {
	return LeftOrRight(val,/*isRight=*/true);
}

function LeftOrRight(val,isRight = true) {
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		ap, concat, fold, _inspect, _is, _is_right,
		get [Symbol.toStringTag]() {
			return `Either:${isRight ? "Right" : "Left"}`;
		},
	};
	return publicAPI;

	// *********************

	function map(fn) {
		return (isRight ? LeftOrRight(fn(val),isRight) : publicAPI);
	}

	function chain(fn) {
		return (isRight ? fn(val) : publicAPI);
	}

	function ap(m) {
		return (isRight ? m.map(val) : publicAPI);
	}

	function concat(m) {
		return (isRight ? m.map(v => val.concat(v)) : publicAPI);
	}

	function fold(asLeft,asRight) {
		return (isRight ? asRight(val) : asLeft(val));
	}

	function _inspect() {
		var v = Just(val)._inspect().match(/^Just\((.*)\)$/)[1];
		return `${publicAPI[Symbol.toStringTag]}(${ v })`;
	}

	function _is(br) {
		return br === brand;
	}

	function _is_right() {
		return isRight;
	}

}

function is(val) {
	return val && isFunction(val._is) && val._is(brand);
}

function fromFoldable(m) {
	return m.fold(Left,Right);
}
