"use strict";

var brand = {};

Left.is = LeftIs;
Right.is = RightIs;

var publicAPI = Object.assign(Either,{
	Left, Right, of: Right, pure: Right,
	unit: Right, is, fromFoldable,
});

module.exports = publicAPI;


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
		return `${publicAPI[Symbol.toStringTag]}(${
			typeof val == "string" ? JSON.stringify(val) :
			typeof val == "undefined" ? "" :
			typeof val == "function" ? (val.name || "anonymous function") :
			val && typeof val._inspect == "function" ? val._inspect() :
			val
		})`;
	}

	function _is(br) {
		return br === brand;
	}

	function _is_right() {
		return isRight;
	}

}

function is(val) {
	return val && typeof val._is == "function" && val._is(brand);
}

function fromFoldable(m) {
	return m.fold(Left,Right);
}
