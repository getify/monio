"use strict";

var { isFunction, isPromise, } = require("../lib/util.js");
var IO = require("./io.js");

const BRAND = {};

module.exports = Object.assign(AllIO,{ of, is, empty, });


// **************************

function AllIO(effect) {
	var io = IO(effect);
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		concat, run, _inspect, _is,
		[Symbol.toStringTag]: "AllIO",
	};
	return publicAPI;

	// *********************

	function chain(fn) {
		return AllIO(env => io.chain(fn).run(env));
	}

	function map(fn) {
		return AllIO(env => io.map(fn).run(env));
	}

	function concat(aio) {
		return AllIO(env => (
			IO(io.run)
			.map(v => (
				v && aio.run(env)
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
	return AllIO(() => v);
}

function is(v) {
	return !!(v && isFunction(v._is) && v._is(BRAND));
}

function empty() {
	return AllIO(() => true);
}
