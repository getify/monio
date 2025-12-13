"use strict";

var {
	isFunction,
	definePipeWithMethodChaining,
	definePipeWithFunctionComposition,
} = require("./lib/util.js");
var Just = require("./just.js");

const BRAND = {};

Left.is = LeftIs;
Right.is = RightIs;

Object.defineProperty(Either,Symbol.hasInstance,{
	value: is,
});
Object.defineProperty(Left,Symbol.hasInstance,{
	value: LeftIs,
});
Object.defineProperty(Right,Symbol.hasInstance,{
	value: RightIs,
});

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

function LeftOrRight(val,isRight) {
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		ap, concat, fold, _inspect, _is, _is_right,
		get [Symbol.toStringTag]() {
			return `Either:${isRight ? "Right" : "Left"}`;
		},
		toString: _inspect, [Symbol.toPrimitive]: _inspect,
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
		return br === BRAND;
	}

	function _is_right() {
		return isRight;
	}

}

function is(val) {
	return !!(val && isFunction(val._is) && val._is(BRAND));
}

function fromFoldable(m) {
	return m.fold(Left,Right);
}
