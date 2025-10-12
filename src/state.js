"use strict";

var {
	isFunction,
	definePipeWithMethodChaining,
	definePipeWithFunctionComposition,
	continuation,
	returnSignal,
	isReturnSignal,
	trampoline,
} = require("./lib/util.js");

const BRAND = {};

module.exports = Object.assign(State,{
	of, pure: of, unit: of, is,
	"get": get, gets, put, modify,
	do: $do, doEither
});


// **************************

function State(stateFn = function stateFn(st) { return { value: undefined, state: st, }; }) {
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		evaluate, ap, concat, _inspect, _is,
		[Symbol.toStringTag]: "State",
	};
	// decorate API methods with `.pipe(..)` helper
	definePipeWithFunctionComposition(publicAPI,"map");
	definePipeWithMethodChaining(publicAPI,"chain");
	definePipeWithMethodChaining(publicAPI,"ap");
	definePipeWithMethodChaining(publicAPI,"concat");
	return publicAPI;

	// *********************

	function map(fn) {
		return State(st => continuation(
			() => stateFn(st),
			res => ({
				state: res.state,
				value: fn(res.value)
			})
		));
	}

	// aka: bind, flatMap
	function chain(fn) {
		return State(st => continuation(
			() => stateFn(st),
			res => fn(res.value).evaluate(returnSignal(res.state))
		));
	}

	function ap(m) {
		return State(st => continuation(
			() => stateFn(st),
			res => m.map(res.value).evaluate(returnSignal(res.state))
		));
	}

	function concat(m) {
		return State(st => continuation(
			() => stateFn(st),
			res1 => continuation(
				// note: if you don't provide a State
				// monad to `concat(m)`, as the implied
				// type signature requires, this line will
				// throw as we try to `evaluate(..)` the
				// expected State
				() => m.evaluate(returnSignal(st)),
				res2 => ({
					value: res1.value.concat(res2.value),
					state: res2.state
				})
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

function gets(fn) {
	return State(st => ({
		value: fn(st),
		state: st
	}))
}

function put(st) {
	return State(() => ({
		value: undefined,
		state: st,
	}));
}

function modify(fn) {
	return State(st => ({
		value: undefined,
		state: fn(st),
	}));
}

function processNext(next,respVal,outerState,throwEither) {
	if (throwEither && Either.Left.is(respVal)) {
		return next(respVal,"error",outerState);
	}

	if (!State.is(respVal)) {
		return next(respVal,"value",outerState);
	}

	return continuation(
		() => {
			try {
				return respVal.evaluate(returnSignal(outerState));
			}
			catch (err) {
				return next(
					(
						(throwEither && !Either.Left.is(err)) ?
							Either.Left(err) :
							err
					),
					"error",
					outerState
				);
			}
		},

		({ value, state: innerState }) => (
			processNext(next,value,innerState,throwEither)
		)
	);
}

function $do($V,...args) {
	return State(outerState => {
		var it = getIterator($V,outerState,/*outerThis=*/this,args);
		return next(undefined,"value",outerState);


		// ************************************************

		function next(v,type,innerState) {
			return continuation(
				() => (
					type === "error" ?
						it.throw(v) :
						it.next(v)
				),

				resp => {
					// is the iterator done?
					if (resp.done) {
						// if a State was returned, automatically run it
						// as if it was yielded before returning
						return (
							State.is(resp.value) ?
								resp.value.evaluate(returnSignal(innerState)) :

								{
									value: resp.value,
									state: innerState
								}
						);
					}
					// otherwise, move onto the next step
					else {
						return (
							processNext(next,resp.value,innerState,/*throwEither=*/false)
						);
					}
				}
			);
		}
	});
}

function doEither($V,...args) {
	return State(outerState => {
		var it = getIterator($V,outerState,/*outerThis=*/this,args);
		return next(undefined,"value",outerState);


		// ************************************************

		function next(v,type,innerState) {
			return continuation(
				() => {
					if (Either.is(v)) {
						// extract from Either
						v.fold(
							left => v = left,
							right => v = right
						);
					}
					try {
						return (
							type === "error" ?
								it.throw(v) :
								it.next(v)
						);
					}
					catch (err) {
						throw (
							Either.Left.is(err) ?
								err :
								Either.Left(err)
						);
					}
				},

				resp => {
					// is the iterator done?
					if (resp.done) {
						try {
							// if a State was returned, automatically run it
							// as if it was yielded before returning
							let out = (
								State.is(resp.value) ?
									resp.value.evaluate(returnSignal(innerState)) :

									{
										value: resp.value,
										state: innerState
									}
							);
							if (Either.Left.is(out.value)) {
								throw out.value;
							}
							return {
								...out,
								value: (
									Either.Right.is(out.value) ?
										out.value :
										Either.Right(out.value)
								),
							};
						}
						catch (err) {
							throw (
								Either.Left.is(err) ?
									err :
									Either.Left(err)
							);
						}
					}
					// otherwise, move onto the next step
					else {
						return (
							processNext(next,resp.value,innerState,/*throwEither=*/true)
						);
					}
				}
			);
		}
	});
}

function getIterator(v,state,outerThis,args) {
	return (
		isFunction(v) ? v.call(outerThis,state,...args) :
		(v && isFunction(v.next)) ? v :
		/* istanbul ignore next */
		undefined
	);
}
