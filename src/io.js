"use strict";

var {
	isFunction,
	isPromise,
	isMonad,
	getMonadFlatMap,
} = require("./lib/util.js");
var Nothing = require("./nothing.js");
var Either = require("./either.js");

var brand = {};

module.exports = Object.assign(IO,{ of, is, do: $do, doEither, });
module.exports.RIO = IO;
module.exports.Reader = IO;


// **************************

function IO(effect) {
	var publicAPI = {
		map, chain, flatMap: chain, bind: chain,
		ap, concat, run, _inspect, _is,
		[Symbol.toStringTag]: "IO",
	};
	return publicAPI;

	// *********************

	function map(fn) {
		return IO(v => {
			var res = effect(v);
			return (isPromise(res) ? res.then(fn) : fn(res));
		});
	}

	function chain(fn) {
		return IO(v => {
			var res = effect(v);
			return (isPromise(res) ?
				res.then(fn).then(v2 => v2.run(v)) :
				fn(res).run(v)
			);
		});
	}

	function ap(m) {
		return m.map(effect);
	}

	function concat(m) {
		return IO(v => {
			var res = effect(v);
			var res2 = m.run(v);
			return (
				(isPromise(res) || isPromise(res2)) ?
					(
						Promise.all([ res, res2, ])
						.then(([ v1, v2, ]) => v1.concat(v2))
					) :
					res.concat(res2)
			);
		});
	}

	function run(v) {
		return effect(v);
	}

	function _inspect() {
		return `${publicAPI[Symbol.toStringTag]}(${
			isFunction(effect) ? (effect.name || "anonymous function") :
			(effect && isFunction(effect._inspect)) ? effect._inspect() :
			val
		})`;
	}

	function _is(br) {
		return br === brand;
	}

}

function of(v) {
	return IO(() => v);
}

function is(v) {
	return v && isFunction(v._is) && v._is(brand);
}

function processNext(next,respVal,outerV,throwEither = false) {
	return (new Promise(async function c(resv,rej){
		try {
			// if respVal is a promise, safely unwrap it
			let [ nextRespVal, unwrappedType, ] = (
				isPromise(respVal) ?
					await safeUnwrap(respVal,throwEither) :
					[ respVal, "value", ]
			);

			// construct chained IO
			let m = (
				// Nothing monad should short-circuit to no-op?
				Nothing.is(nextRespVal) ?
					IO(() => resv()) :

					// chain the monad
					monadFlatMap(
						(
							// ensure we're chaining to a monad
							(
								// need to wrap Either:Left error?
								(
									throwEither &&
									unwrappedType == "error" &&
									Either.Left.is(nextRespVal)
								) ||

								// need to lift non-monad?
								!isMonad(nextRespVal)
							) ?
								// wrap it in an IO
								IO.of(nextRespVal) :

								// otherwise, must already be a monad
								nextRespVal
						),
						// chain/flatMap the monad to the "next" IO step
						v => (
							IO(() => next(v,unwrappedType).then(resv,rej))
						)
					)
			);

			// run the next step of the IO chain
			try {
				await m.run(outerV);
			}
			catch (err) {
				// if running the next step produced an
				// exception, try to inject that error back
				// into the do-routine; if that is cleanly
				// handled, resolve the promise with that
				// result
				resv(
					// injected error may not be cleanly
					// handled, so this might throw instead!
					await next(err,"error")
				);
			}
		}
		catch (err) {
			rej(err);
		}
	}));
}

function $do(block) {
	return IO(outerV => {
		var it = getIterator(block,outerV);

		return (async function next(v,type){
			var resp = (
				type === "error" ?
					it.throw(v) :
					it.next(v)
			);

			// if resp is a promise (from async iterator),
			// unwrap it
			//
			// note: this might throw!
			resp = isPromise(resp) ? await resp : resp;

			// is the iterator done?
			if (resp.done) {
				return (
					// if an IO was returned, automatically run it
					// as if it was yielded before returning
					IO.is(resp.value) ?
						resp.value.run(outerV) :
						resp.value
				);
			}
			// otherwise, move onto the next step
			else {
				return processNext(next,resp.value,outerV,/*throwEither=*/false);
			}
		})();
	});
}

function doEither(block) {
	return IO(outerV => {
		var it = getIterator(block,outerV);

		return (async function next(v,type){
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

			// locally catch exception for Either:Left wrapping
			try {
				// v already lifted to ensure it's an Either
				let resp = v.fold(
					err => it.throw(err),
					v => it.next(v)
				);

				// if resp is a promise (from async iterator),
				// unwrap it
				//
				// note: this might throw!
				resp = isPromise(resp) ? await resp : resp;

				// is the iterator done?
				if (resp.done) {
					let respVal = (
						// if final value is a promise, unwrap it
						isPromise(resp.value) ? await resp.value : resp.value
					);
					respVal = (
						// was an IO returned?
						IO.is(respVal) ?
							// automatically run the IO
							// as if it was yielded before
							// returning
							respVal.run(outerV) :
							respVal
					);
					respVal = (
						// if result is (still) a promise, unwrap it
						isPromise(respVal) ? await respVal : respVal
					);

					// returned an Either:Left (to treat as an
					// exception)?
					if (Either.Left.is(respVal)) {
						throw respVal;
					}
					// returned an already Either:Right wrapped
					// final value?
					else if (Either.Right.is(respVal)) {
						return respVal;
					}
					// otherwise, wrap the final value as an
					// Either:Right
					else {
						return Either.Right(respVal);
					}
				}
				// otherwise, move onto the next step
				else {
					return processNext(next,resp.value,outerV,/*throwEither=*/true);
				}
			}
			catch (err) {
				// any locally caught exception that's not yet
				// an Either:Left should be wrapped as such;
				// then rethrow
				throw (Either.Left.is(err) ?
					err :
					Either.Left(err)
				);
			}
		})();
	});
}

function getIterator(block,v) {
	return (
		isFunction(block) ? block(v) :
		(block && typeof block == "object" && isFunction(block.next)) ? block :
		undefined
	);
}

function monadFlatMap(m,fn) {
	return getMonadFlatMap(m).call(m,fn);
}

async function safeUnwrap(v,throwEither) {
	try {
		v = isPromise(v) ? await v : v;
		if (throwEither && Either.Left.is(v)) {
			throw v;
		}
		return [ v, "value", ];
	}
	catch (err) {
		return [ err, "error", ];
	}
}
