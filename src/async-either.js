"use strict";

var {
	EMPTY_FUNC,
	isFunction,
	isPromise,
	identity,
} = require("./lib/util.js");
var Either = require("./either.js");

const BRAND = {};

module.exports = Object.assign(AsyncEither,{
	Left: AsyncLeft, Right: AsyncRight,
	of: AsyncRight, pure: AsyncRight, unit: AsyncRight,
	is, fromFoldable, fromPromise,
});


// **************************

function AsyncLeft(v) {
	return fromPromise(
		isPromise(v) ? v : Promise.reject(v)
	);
}

function AsyncRight(v) {
	return fromPromise(
		isPromise(v) ? v : Promise.resolve(v)
	);
}

function AsyncEither(v) {
	return (
		isPromise(v) ? fromPromise(v) :
		Either.Left.is(v) ? AsyncLeft(v) :
		AsyncRight(v)
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

	function map(fn) {
		// note: m is a regular Either (Left or Right)
		var handle = m => m.fold(
			leftV => { throw Either.Left(leftV); },
			rightV => {
				try {
					return fn(rightV);
				}
				catch (err) {
					throw Either.Left(err);
				}
			}
		);
		return AsyncEither(pr.then(handle,handle));
	}

	function chain(fn) {
		// note: m is a regular Either (Left or Right)
		var handle = m => m.fold(
			leftV => { throw Either.Left(leftV); },
			rightV => {
				try {
					let res = fn(rightV);
					return (
						// extract value from AsyncEither
						// or Either?
						(is(res) || Either.is(res)) ?
							res.fold(
								lv => { throw lv; },
								identity
							) :

						// otherwise, just pass the value
						// through as-is
						res
					);
				}
				catch (err) {
					throw Either.Left(err);
				}
			}
		);

		return AsyncEither(pr.then(handle,handle));
	}

	function ap(m2) {
		// m1 is a regular Either (Left or Right)
		var handle = m1 => m1.fold(
			leftV => { throw Either.Left(leftV); },
			fn => {
				try {
					let res = m2.map(fn);
					return (
						// extract value from AsyncEither
						// or Either?
						(is(res) || Either.is(res)) ?
							res.fold(
								lv => { throw lv; },
								identity
							) :

						// otherwise, just pass the value
						// through as-is
						res
					);
				}
				catch (err) {
					throw Either.Left(err);
				}
			}
		);

		return AsyncEither(pr.then(handle,handle));
	}

	function concat(m2) {
		// m1 is a regular Either (Left or Right)
		var handle = m1 => m1.fold(
			leftV => { throw Either.Left(leftV); },
			rightV => {
				try {
					let res = m2.map(v => rightV.concat(v));
					return (
						// extract value from AsyncEither
						// or Either?
						(is(res) || Either.is(res)) ?
							res.fold(
								lv => { throw lv; },
								identity
							) :

						// otherwise, just pass the value
						// through as-is
						res
					);
				}
				catch (err) {
					throw Either.Left(err);
				}
			}
		);

		return AsyncEither(pr.then(handle,handle));
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
