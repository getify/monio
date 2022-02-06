"use strict";

var {
	isFunction,
	isPromise,
	definePipeWithMethodChaining,
	definePipeWithAsyncFunctionComposition,
	runSignal,
} = require("../lib/util.js");
var IO = require("./io.js");

const BRAND = {};

module.exports = Object.assign(AllIO,{ of, is, fromIO, empty, });


// **************************

function AllIO(effect) {
	var io = IO(effect);
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		concat, run, _inspect, _is,
		[Symbol.toStringTag]: "AllIO",
	};
	// decorate API methods with `.pipe(..)` helper
	definePipeWithAsyncFunctionComposition(publicAPI,"map");
	definePipeWithMethodChaining(publicAPI,"chain");
	definePipeWithMethodChaining(publicAPI,"concat");
	return publicAPI;

	// *********************

	function chain(fn) {
		return AllIO(env => io.chain(fn).run(runSignal(env)));
	}

	function map(fn) {
		return AllIO(env => io.map(fn).run(runSignal(env)));
	}

	function concat(aio) {
		return AllIO(env => (
			IO(env => io.run(runSignal(env)))
			.map(v => (
				v && aio.run(runSignal(env))
			))
			.run(runSignal(env))
		));
	}

	function run(env) {
		return io.run(env);
	}

	function _inspect() {
		var v = io._inspect().match(/^IO\((.*)\)$/)[1];
		return `${publicAPI[Symbol.toStringTag]}(${ v })`;
	}

	function _is(br) {
		return !!(br === BRAND || io._is(br));
	}

}

function of(v) {
	return AllIO(() => v);
}

function is(v) {
	return !!(v && isFunction(v._is) && v._is(BRAND));
}

function fromIO(io) {
	return AllIO(env => io.run(runSignal(env)));
}

function empty() {
	return AllIO(() => true);
}
