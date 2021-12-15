"use strict";

var { isFunction, isPromise, } = require("../lib/util.js");
var IO = require("./io.js");

const BRAND = {};

module.exports = Object.assign(AnyIO,{ of, is, empty, });


// **************************

function AnyIO(effect) {
	var io = IO(effect);
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		concat, run, _inspect, _is,
		[Symbol.toStringTag]: "AnyIO",
	};
	return publicAPI;

	// *********************

	function chain(fn) {
		return AnyIO(env => io.chain(fn).run(env));
	}

	function map(fn) {
		return AnyIO(env => io.map(fn).run(env));
	}

	function concat(aio) {
		return AnyIO(env => (
			IO(io.run)
			.map(v => (
				v || aio.run(env)
			))
			.run(env)
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
	return AnyIO(() => v);
}

function is(v) {
	return !!(v && isFunction(v._is) && v._is(BRAND));
}

function empty() {
	return AnyIO(() => false);
}
