"use strict";

var { EMPTY_FUNC, isFunction, isPromise, } = require("./lib/util.js");
var Either = require("./either.js");

const BRAND = {};

module.exports = Object.assign(AsyncEither,{
	Left: AsyncLeft, Right: AsyncRight,
	of: AsyncRight, pure: AsyncRight, unit: AsyncRight,
	is, fromFoldable, fromPromise,
});


// **************************

function AsyncLeft(v) {
	return AsyncEither(Either.Left(v));
}

function AsyncRight(v) {
	return AsyncEither(Either.Right(v));
}

function AsyncEither(v) {
	return fromPromise(
		isPromise(v) ? v :
		Either.Left.is(v) ? Promise.reject(v) :
		Promise.resolve(v)
	);
}

function fromPromise(pr) {
	pr = splitPromise(pr);

	var publicAPI = { map, chain, flatMap: chain, bind: chain,
		ap, concat, fold, _inspect, _is,
		[Symbol.toStringTag]: "AsyncEither",
	};
	return publicAPI;

	// *********************

	function map(v) {
		var handle = m => {
			// note: m is a regular Either (Left or Right)
			var _doMap = fn => m.fold(
				Either.Left,
				rightV => {
					try {
						return fn(rightV);
					}
					catch (err) {
						return Either.Left(err);
					}
				}
			);

			// note: ap(..) passes in a promise for a held function
			return (isPromise(v) ? v.then(_doMap) : _doMap(v));
		};

		return AsyncEither(pr.then(handle,handle));
	}

	function chain(v) {
		var handle = m => {
			// note: m is a regular Either (Left or Right)
			var _doChain = fn => m.fold(
				Either.Left,
				rightV => {
					try {
						let res = fn(rightV);
						return (
							// extract value from AsyncEither
							// or Either?
							(is(res) || Either.is(res)) ?
								res.fold(
									Either.Left,
									identity
								) :

							// otherwise, just pass the value
							// through as-is
							res
						);

					}
					catch (err) {
						return Either.Left(err);
					}
				}
			);

			// note: promise check unnecessary, but put here
			// for consistency with map(..)
			return (isPromise(v) ? v.then(_doChain) : _doChain(v));
		};

		return AsyncEither(pr.then(handle,handle));
	}

	function ap(m) {
		return m.map(pr);
	}

	function concat(m) {
		return m.map(v => pr.then(val => val.concat(v)));
	}

	function fold(asLeft,asRight) {
		var handle = whichSide => m => m.fold(
			v => Promise.reject(whichSide(v)),
			whichSide
		);
		var pr2 = pr.then(handle(asRight),handle(asLeft));
		// silence unhandled rejection warnings
		pr2.catch(EMPTY_FUNC);
		return pr2;
	}

	function _inspect() {
		return `${publicAPI[Symbol.toStringTag]}(Promise)`;
	}

	function _is(br) {
		return br === BRAND;
	}

}

function is(val) {
	return !!(val && isFunction(val._is) && val._is(BRAND));
}

function fromFoldable(m) {
	return m.fold(AsyncEither.Left,AsyncEither.Right);
}

function splitPromise(pr) {
	var pr2 = pr.then(
		v => (
			Either.is(v) ? v : Either.Right(v)
		),
		v => Promise.reject(
			Either.is(v) ? v : Either.Left(v)
		)
	);
	// silence unhandled rejection warnings
	pr2.catch(EMPTY_FUNC);
	return pr2;
}
