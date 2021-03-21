"use strict";

var { isFunction, isPromise, } = require("../lib/util.js");
var IO = require("./io.js");

var brand = {};

module.exports = Object.assign(AnyIO,{ of, is, empty, });


// **************************

function AnyIO(effect) {
	var io = IO(effect);
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		ap, concat, run, _inspect, _is,
		[Symbol.toStringTag]: "AnyIO",
	};
	return publicAPI;

	// *********************


	function chain(fn) {
		return io.chain(fn);
	}

	function map(fn) {
		return AnyIO(env => io.map(fn).run(env));
	}

	function ap(aio) {
		return aio.map(effect);
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
		return br === brand || io._is(br);
	}

}

function of(v) {
	return AnyIO(() => v);
}

function is(v) {
	return v && isFunction(v._is) && v._is(brand);
}

function empty() {
	return AnyIO(() => false);
}
