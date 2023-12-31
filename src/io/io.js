"use strict";

var {
	EMPTY_FUNC,
	isFunction,
	isPromise,
	isMonad,
	getMonadFlatMap,
	definePipeWithMethodChaining,
	definePipeWithAsyncFunctionComposition,
	continuation,
	returnSignal,
	isReturnSignal,
	trampoline,
} = require("../lib/util.js");
var Nothing = require("../nothing.js");
var Either = require("../either.js");

const BRAND = {};

module.exports = Object.assign(IO,{
	of, pure: of, unit: of, is, do: $do, doEither, fromIOx,
});
module.exports.RIO = IO;
module.exports.of = of;
module.exports.pure = of;
module.exports.unit = of;
module.exports.is = is;
module.exports.do = $do;
module.exports.doEither = doEither;
module.exports.fromIOx = fromIOx;


// *****************************************

function IO(effect) {
	const TAG = "IO";
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		concat, run, _inspect, _is,
		[Symbol.toStringTag]: TAG,
	};
	// decorate API methods with `.pipe(..)` helper
	definePipeWithAsyncFunctionComposition(publicAPI,"map");
	definePipeWithMethodChaining(publicAPI,"chain");
	definePipeWithMethodChaining(publicAPI,"concat");
	return publicAPI;

	// *****************************************

	function map(fn) {
		return IO(env => continuation(
			() => effect(env),
			res => (isPromise(res) ? res.then(fn) : fn(res))
		));
	}

	function chain(fn) {
		return IO(env => continuation(
			() => effect(env),
			res => {
				var res2 = (isPromise(res) ? res.then(fn) : fn(res));
				return (isPromise(res2) ?
					// note: if you don't return an IO/IOx to the
					// `chain(fn)` function, as required by the
					// implied type signature of `chain(..)`, one
					// of these two lines will throw as we try to
					// `run(..)` the expected IO/IOx
					res2.then(io2 => io2.run(env)) :
					res2.run(returnSignal(env))
				);
			}
		));
	}

	function concat(m) {
		return IO(env => continuation(
			() => effect(env),
			res1 => continuation(
				// note: if you don't provide an IO/IOx
				// monad to `concat(m)`, as the implied
				// type signature requires, this line will
				// throw as we try to `run(..)` the expected
				// IO/IOx
				() => m.run(returnSignal(env)),
				res2 => (
					(isPromise(res1) || isPromise(res2)) ?
						(
							Promise.all([ res1, res2, ])
							.then(([ v1, v2, ]) => v1.concat(v2))
						) :
						res1.concat(res2)
				)
			)
		));
	}

	function run(env) {
		if (isReturnSignal(env)) {
			return effect(env.val);
		}
		else {
			return trampoline(effect(env));
		}
	}

	function _inspect() {
		return `${publicAPI[Symbol.toStringTag]}(${
			isFunction(effect) ? (effect.name || "anonymous function") :
			String(effect)
		})`;
	}

	function _is(br) {
		return br === BRAND;
	}

}

function of(v) {
	return IO(() => v);
}

function is(v) {
	return !!(v && isFunction(v._is) && v._is(BRAND));
}

function processNext(next,respVal,outerEnv,throwEither) {
	return (isPromise(respVal) ?

		// trampoline()s here unwrap the continuations
		// immediately, because we're already in an
		// async microtask from the promise
		safeUnwrap(respVal,throwEither).then(
			([nrv,type]) => trampoline(handleNextRespVal(nrv,type))
		)
		.catch(err => trampoline(handleNextRespVal(err,"error"))) :

		handleNextRespVal(
			respVal,
			(
				(throwEither && Either.Left.is(respVal)) ?
					"error" :
					"value"
			)
		)
	);


	// ***********************************************************

	function handleNextRespVal(nextRespVal,unwrappedType) {
		// wrapping IO to process yielded value
		var ioWrap = v => IO(() => next(v,unwrappedType));

		// is the yielded value a recognized, "foldable" monad?
		var isFoldable = (
			isMonad(nextRespVal) && isFunction(nextRespVal.fold)
		);

		// might the yielded value need to be wrapped in an IO?
		var wrapInIO = (
			// non-monad value?
			!isMonad(nextRespVal) ||

			// need to wrap Either:Left error?
			(
				throwEither &&
				unwrappedType == "error" &&
				Either.Left.is(nextRespVal)
			) ||

			// non-IO monad, but also unrecognized or
			// non-"foldable"?
			(!is(nextRespVal) && !isFoldable)
		);

		var nextIO = (
			// Nothing monad (should short-circuit to no-op)?
			Nothing.is(nextRespVal) ? IO.of() :

			// IOx monad? (unfortunately, cannot use `IOx.is(..)`
			// brand check because it creates a circular dependency
			// between IO and IOx)
			!!(
				nextRespVal &&
				isFunction(nextRespVal) &&
				isFunction(nextRespVal._chain_with_IO) &&
				isFunction(nextRespVal.toString) &&
				/^\[function (Never)?IOx\]$/.test(nextRespVal.toString())
			) ? (
				// chain IOx via a regular IO to reduce overhead
				nextRespVal._chain_with_IO(ioWrap)
			) :

			// need to wrap value in an IO?
			wrapInIO ? ioWrap(nextRespVal) :

			// recognized "foldable" monad?
			isFoldable ? nextRespVal.fold(ioWrap,ioWrap) :

			// otherwise, must already an IO
			monadFlatMap(nextRespVal,ioWrap)
		);

		return nextIO.run(returnSignal(outerEnv));
	}
}

function $do($V,...args) {
	return IO(outerEnv => {
		var it = getIterator($V,outerEnv,/*outerThis=*/this,args);

		return (new Promise(res => res(trampoline(next()))))
			.catch(err => trampoline(next(err,"error")))
			.catch(liftDoError);

		// ************************************************

		function next(v,type) {
			try {
				var resp = (
					type === "error" ?
						it.throw(v) :
						it.next(v)
				);

				return (
					// iterator from an async generator?
					isPromise(resp) ?

						// trampoline() here unwraps the continuation
						// immediately, because we're already in an
						// async microtask from the promise
						resp.then(v => trampoline(handleResp(v))) :

						handleResp(resp)
				);


				// ***********************************************

				function handleResp(resp) {
					// is the iterator done?
					if (resp.done) {
						try {
							// if an IO was returned, automatically run it
							// as if it was yielded before returning
							return (
								IO.is(resp.value) ?
									resp.value.run(returnSignal(outerEnv)) :
									resp.value
							);
						}
						catch (err) {
							return liftDoError(err);
						}
					}
					// otherwise, move onto the next step
					else {
						return processNext(next,resp.value,outerEnv,/*throwEither=*/false);
					}
				}
			}
			catch (err) {
				return liftDoError(err);
			}
		}
	});
}

function liftDoError(err) {
	var pr = Promise.reject(err);
	// silence unhandled rejection warnings
	pr.catch(EMPTY_FUNC);
	return pr;
}

function doEither($V,...args) {
	return IO(outerEnv => {
		var it = getIterator($V,outerEnv,/*outerThis=*/this,args);

		// trampoline()s here unwrap the continuations
		// immediately, because we're already in an
		// async microtask from the promise
		return (new Promise(res => res(trampoline(next()))))
			.catch(err => trampoline(next(err,"error")))
			.catch(liftDoEitherError);

		// ************************************************

		function next(v,type) {
			// lift v to an Either (Left or Right) if necessary
			v = (
				(type == "error" && !Either.Left.is(v)) ?
					Either.Left(v) :
				(type == "value" && !Either.Right.is(v)) ?
					Either.Right(v) :
				(!Either.is(v)) ?
					Either(v) :
					v
			);

			try {
				// v already lifted to ensure it's an Either
				let resp = v.fold(
					err => it.throw(err),
					v => it.next(v)
				);

				return (
					isPromise(resp) ?

						// trampoline() here unwraps the continuation
						// immediately, because we're already in an
						// async microtask from the promise
						resp.then(v => trampoline(handleResp(v))) :

						handleResp(resp)
				);

				// ***********************************************

				function handleResp(resp) {
					// is the iterator done?
					if (resp.done) {
						return continuation(
							() => {
								try {
									return (
										// if an IO was returned, automatically run it
										// as if it was yielded before returning
										IO.is(resp.value) ?
											resp.value.run(returnSignal(outerEnv)) :
											resp.value
									);
								}
								catch (err) {
									return liftDoEitherError(err);
								}
							},
							respVal => {
								return (isPromise(respVal) ?
									respVal.then(handleRespVal) :
									handleRespVal(respVal)
								);
							}
						);
					}
					// otherwise, move onto the next step
					else {
						return processNext(next,resp.value,outerEnv,/*throwEither=*/true);
					}
				}

				function handleRespVal(respVal) {
					// already an Either:Right?
					if (Either.Right.is(respVal)) {
						return respVal;
					}
					// returned an Either:Left (to treat as an
					// exception)?
					else if (Either.Left.is(respVal)) {
						return liftDoEitherError(respVal);
					}
					// otherwise, wrap the final value as an
					// Either:Right
					else {
						return Either.Right(respVal);
					}
				}
			}
			catch (err) {
				return liftDoEitherError(err);
			}
		}
	});
}

function liftDoEitherError(err) {
	err = (
		(isPromise(err) || Either.Left.is(err)) ? err :
		Either.Left(err)
	);
	var pr = Promise.reject(err);
	// silence unhandled rejection warnings
	pr.catch(EMPTY_FUNC);
	return pr;
}

function fromIOx(iox) {
	return IO(env => iox.run(returnSignal(env)));
}

function getIterator(v,env,outerThis,args) {
	return (
		isFunction(v) ? v.call(outerThis,env,...args) :
		(v && isFunction(v.next)) ? v :
		undefined
	);
}

function monadFlatMap(m,fn) {
	return getMonadFlatMap(m).call(m,fn);
}

async function safeUnwrap(v,throwEither) {
	try {
		v = await v;
		if (throwEither && Either.Left.is(v)) {
			throw v;
		}
		return [ v, "value", ];
	}
	catch (err) {
		return [ err, "error", ];
	}
}
