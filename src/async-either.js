"use strict";

var { isPromise, } = require("./lib/util.js");
var Either = require("./either.js");

var brand = {};

var publicAPI = Object.assign(AsyncEither,{
	Left: AsyncLeft, Right: AsyncRight,
	of: AsyncRight, pure: AsyncRight, unit: AsyncRight,
	is, fromFoldable, fromPromise,
});

module.exports = publicAPI;


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
			var _doMap = fn => {
				// note: intentionally using chain() here
				var res = m.chain(fn);
				return (isPromise(res) ?
					splitPromise(res) :
					(m._is_right() ?
						res :
						Promise.reject(res)
					)
				);
			};

			return (isPromise(v) ?
				v.then(_doMap) :
				_doMap(v)
			);
		};

		return AsyncEither(pr.then(handle,handle));
	}

	function chain(v) {
		var handle = m => {
			var _doChain = fn => {
				var res = m.chain(fn);
				return (
					is(res) ? res.fold(v => v,v => v) :
					Either.is(res) ? res.fold(
						e => Promise.reject(e),
						v => v
					) :
					res
				);
			};

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
		return pr.then(handle(asRight),handle(asLeft));
	}

	function _inspect() {
		return `${publicAPI[Symbol.toStringTag]}(Promise)`;
	}

	function _is(br) {
		return br === brand;
	}

}

function is(val) {
	return val && typeof val._is == "function" && val._is(brand);
}

function fromFoldable(m) {
	return m.fold(AsyncEither.Left,AsyncEither.Right);
}

function splitPromise(pr) {
	return pr.then(
		v => (
			Either.is(v) ? v : Either.Right(v)
		),
		v => Promise.reject(
			Either.is(v) ? v : Either.Left(v)
		)
	);
}

function toPromise(m) {
	return new Promise((res,rej) =>
		m.fold(
			v => rej(Either.Left(v)),
			v => res(Either.Right(v))
		)
	);
}
