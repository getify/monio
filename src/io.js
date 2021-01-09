"use strict";

var { isPromise, } = require("./lib/util.js");
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
			typeof effect == "function" ? (effect.name || "anonymous function") :
			(effect && typeof effect._inspect == "function") ? effect._inspect() :
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
	return v && typeof v._is == "function" && v._is(brand);
}

function processNext(next,respVal,outerV) {
	return (new Promise(async (resv,rej) => {
		try {
			let m = monadFlatMap(
				(isPromise(respVal) ? await respVal : respVal),
				v => IO(() => next(v).then(resv,rej))
			);
			if (IO.is(m)) {
				await m.run(outerV);
			}
			else {
				resv();
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

		return (async function next(v){
			var resp = it.next(isPromise(v) ? await v : v);
			resp = isPromise(resp) ? await resp : resp;
			return (resp.done ?
				resp.value :
				processNext(next,resp.value,outerV)
			);
		})();
	});
}

function doEither(block) {
	return IO(outerV => {
		var it = getIterator(block,outerV);

		return (async function next(v){
			try {
				v = isPromise(v) ? await v : v;
				let resp = (Either.Left.is(v) ?
					it.throw(v) :
					it.next(v)
				);
				resp = isPromise(resp) ? await resp : resp;
				let respVal = (resp.done ?
					(isPromise(resp.value) ?
						await resp.value :
						resp.value
					) :
					resp.value
				);
				return (resp.done ?
					(Either.Right.is(respVal) ?
						respVal :
						Either.Right(respVal)
					) :
					processNext(next,respVal,outerV)
					.catch(next)
				);
			}
			catch (err) {
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
		typeof block == "function" ? block(v) :
		(block && typeof block == "object" && typeof block.next == "function") ? block :
		undefined
	);
}

function monadFlatMap(m,fn) {
	return m[
		"flatMap" in m ? "flatMap" :
		"chain" in m ? "chain" :
		"bind"
	](fn);
}
