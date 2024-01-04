"use strict";

var {
	isFunction,
	isPromise,
	definePipeWithMethodChaining,
	definePipeWithAsyncFunctionComposition,
	continuation,
	returnSignal,
	isReturnSignal,
	trampoline,
} = require("./lib/util.js");

const BRAND = {};

module.exports = Object.assign(State,{
	of, pure: of, unit: of, is,
	"get": get, put,
});


// **************************

function State(stateFn = function stateFn(st) { return { value: undefined, state: st, }; }) {
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		evaluate,
		/*fold, */concat, _inspect, _is,
		[Symbol.toStringTag]: "State",
	};
	// decorate API methods with `.pipe(..)` helper
	definePipeWithAsyncFunctionComposition(publicAPI,"map");
	definePipeWithMethodChaining(publicAPI,"chain");
	definePipeWithMethodChaining(publicAPI,"concat");
	return publicAPI;

	// *********************

	function map(fn) {
		return State(st => continuation(
			() => stateFn(st),
			res => (isPromise(res) ? res.then(next) : next(res))
		));


		// *********************

		function next(res) {
			var res2 = fn(res.value);
			return (
				isPromise(res2) ?
					res2.then(res3 => ({
						value: res3,
						state: res.state,
					})) :

					{
						value: res2,
						state: res.state,
					}
			);
		}
	}

	// aka: bind, flatMap
	function chain(fn) {
		return State(st => continuation(
			() => stateFn(st),
			res => (isPromise(res) ? res.then(next) : next(res))
		));


		// *********************

		function next(res2) {
			var res3 = fn(res2.value);
			// note: if you don't return a State to the
			// `chain(fn)` function, as required by the
			// implied type signature of `chain(..)`, one
			// of these two lines will throw as we try to
			// `evaluate(..)` the expected State
			return (
				isPromise(res3) ?
					res3.then(res4 => res4.evaluate(res2.state)) :

					res3.evaluate(returnSignal(res2.state))
			);
		}
	}

	function concat(m) {
		return State(st => continuation(
			() => stateFn(st),
			res1 => continuation(
				// note: if you don't provide a State
				// monad to `concat(m)`, as the implied
				// type signature requires, this line will
				// throw as we try to `evaluate(..)` the expected
				// State
				() => m.evaluate(returnSignal(st)),
				res2 => (
					(isPromise(res1) || isPromise(res2)) ?
						(
							Promise.all([ res1, res2, ])
							.then(([ v1, v2, ]) => ({
								value: v1.value.concat(v2.value),
								state: v1.state,
							}))
						) :

						{
							value: res1.value.concat(res2.value),
							state: res1.state,
						}
				)
			)
		));
	}

	function evaluate(initState) {
		if (isReturnSignal(initState)) {
			return stateFn(initState.val);
		}
		else {
			return trampoline(stateFn(initState));
		}
	}

	function _inspect() {
		return `${publicAPI[Symbol.toStringTag]}(${
			isFunction(stateFn) ? (stateFn.name || "anonymous function") :
			String(stateFn)
		})`;
	}

	function _is(br) {
		return br === BRAND;
	}

}

function is(val) {
	return !!(val && isFunction(val._is) && val._is(BRAND));
}

function of(v) {
	return State(st => ({
		value: v,
		state: st,
	}));
}

function get() {
	return State(st => ({
		value: st,
		state: st,
	}));
}

function put(st) {
	return State(() => ({
		value: undefined,
		state: st,
	}));
}
