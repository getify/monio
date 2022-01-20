"use strict";

var {
	getMonadFlatMap,
	isFunction,
	isPromise,
	isMonad,
	liftM,
	curry,
	foldMap,
	runSignal,
} = require("../lib/util.js");
var IO = require("./io.js");
var AllIO = require("./all.js");
var AnyIO = require("./any.js");
var IOx = require("./iox.js");
var Maybe = require("../maybe.js");
var Either = require("../either.js");

// curry some public methods
listFilterInIO = curry(listFilterInIO,2);
listFilterOutIO = curry(listFilterOutIO,2);

var returnedValues = new WeakSet();

module.exports = {
	log,
	getReader,
	waitAll,
	maybeFromIO,
	eitherFromIO,
	applyIO,
	doIO: IO.do,
	doEIO: IO.doEither,
	doIOBind,
	doEIOBind,
	listFilterInIO,
	listFilterOutIO,
	listConcatIO,
	match,
	iif,
	elif,
	els,
	iNot,
	iAnd,
	iOr,
	iReturn,
	wasReturned,
	ifReturned,
	matchReturned,
	getPropIO,
	assignPropIO,
};
module.exports.log = log;
module.exports.getReader = getReader;
module.exports.waitAll = waitAll;
module.exports.maybeFromIO = maybeFromIO;
module.exports.eitherFromIO = eitherFromIO;
module.exports.applyIO = applyIO;
module.exports.doIO = IO.do;
module.exports.doEIO = IO.doEither;
module.exports.doIOBind = doIOBind;
module.exports.doEIOBind = doEIOBind;
module.exports.listFilterInIO = listFilterInIO;
module.exports.listFilterOutIO = listFilterOutIO;
module.exports.listConcatIO = listConcatIO;
module.exports.match = match;
module.exports.iif = iif;
module.exports.elif = elif;
module.exports.els = els;
module.exports.iNot = iNot;
module.exports.iAnd = iAnd;
module.exports.iOr = iOr;
module.exports.iReturn = iReturn;
module.exports.wasReturned = wasReturned;
module.exports.ifReturned = ifReturned;
module.exports.matchReturned = matchReturned;
module.exports.getPropIO = getPropIO;
module.exports.assignPropIO = assignPropIO;


// **************************

function log(...args) {
	return IO(() => console.log(...args));
}

function getReader() {
	return IO(env => env);
}

function waitAll(...list) {
	return IO(env => (
		Promise.all(
			list.map(v => liftIO(env,v).run(env))
		)
	));
}

function maybeFromIO(v,env = {}) {
	var res = liftIO(env,v).run(env);
	return (isPromise(res) ?
		res.then(Maybe.from) :
		Maybe.from(res)
	);
}

function eitherFromIO(v,env = {}) {
	var res = liftIO(env,v).run(env);
	return (isPromise(res) ?
		res.then(v => Either.fromFoldable(Maybe.from(v))) :
		Either.fromFoldable(Maybe.from(res))
	);
}

function applyIO(io,env) {
	return IO(() => io.run(runSignal(env)));
}

function doIOBind(gen,env) {
	return (...args) => (
		IO(() => IO.do(gen,...args).run(runSignal(env)))
	);
}

function doEIOBind(gen,env) {
	return (...args) => (
		IO(() => IO.doEither(gen,...args).run(runSignal(env)))
	);
}

function listFilterInIO(predicateIO,list) {
	return listConcatIO(
		list.map(v =>
			predicateIO(v)
			.map(include => (include ? [ v, ] : []))
		)
	);
}

function listFilterOutIO(predicateIO,list) {
	return listFilterInIO(
		v => iNot(predicateIO(v)),
		list
	);
}

function listConcatIO(list) {
	return list.reduce(
		(io,v) => io.concat(v),
		IO.of([])
	);
}

function match(...args) {
	if (args.length < 2) {
		throw new Error("Invalid match arguments");
	}

	var defaultElseCond = Symbol("default");
	var clauses = [];
	// chunk the args up into if/then and else-if/then
	// tuples
	while (args.length > 0) {
		if (args.length > 1) {
			let clause = args.slice(0,2);
			args = args.slice(2);
			clauses.push(clause);
		}
		else {
			// final else clause
			clauses.push([ defaultElseCond, args[0], ]);
			args.length = 0;
		}
	}

	// process (or skip) the "thens" based on the
	// if-conditional expression results
	var doThens = (env,thens) => res => {
		// did the if-conditional "expression" resolve to truthy?
		if (res) {
			// if "thens" is a function, assume a lazy
			// expression thunk
			thens = isFunction(thens) ? thens() : thens;
			// lift "thens" to an array if not already
			thens = (Array.isArray(thens) ? thens : [thens]);

			// process the "thens"
			return (
				thens
				// IO-lift each "then" and chain them all
				// together
				.reduce(
					(io,then) => io.chain(v => (
						liftIO(env,v).chain(v => (
							returnedValues.has(v) ?
								IO.of(v) :
								liftIO(env,then)
						))
					)),
					IO.of()
				)
				// final "result" of the "thens" handling
				// should be the "return" value (if set)
				// or the result of the if-conditional
				// expression
				.chain(v => (
					liftIO(env,v).chain(v => (
						IO.of(
							returnedValues.has(v) ? v :
							res !== defaultElseCond ? res :
							undefined
						)
					))
				))
			);
		}
		else {
			return IO.of(res);
		}
	};

	return IO(env => (
		clauses.reduce(
			(io,[cond,thens]) => (
				io.chain(prevRes => (
					!prevRes ?
						liftIO(env,cond).chain(doThens(env,thens)) :
						IO.of(prevRes)
				))
			),
			IO.of()
		)
		.run(runSignal(env))
	));
}

function iif(cond,thens,...elses) {
	return match(
		cond,
		thens,
		...elses.flatMap(v => v)
	);
}

function elif(cond,thens) {
	// NOTE: intentionally truncating to prevent confusing
	// nested "elses" expressions
	return [ cond, thens, ];
}

function els(thens) {
	return [ thens, ];
}

function iReturn(val) {
	return IO(env => (
		liftIO(env,val)
		.map(v => {
			var ret = { returned: v, };
			returnedValues.add(ret);
			return ret;
		})
		.run(runSignal(env))
	));
}

function iNot(val) {
	return IO(env => (
		liftIO(env,val)
		.map(v => !v)
		.run(runSignal(env))
	));
}

function iAnd(...vals) {
	return IO(env => (
		foldMap(
			val => AllIO.fromIO(liftIO(env,val)),
			vals
		)
		.run(runSignal(env))
	));
}

function iOr(...vals) {
	return IO(env => (
		foldMap(
			val => AnyIO.fromIO(liftIO(env,val)),
			vals
		)
		.run(runSignal(env))
	));
}

function wasReturned(v) {
	return returnedValues.has(v);
}

function ifReturned(iifIO) {
	return iifIO.map(ifres => (
		wasReturned(ifres) ? ifres.returned : undefined
	));
}

function matchReturned(matchIO) {
	return matchIO.map(matchres => (
		wasReturned(matchres) ? matchres.returned : undefined
	));
}

function getPropIO(prop,obj) {
	// lift `obj` to a monad
	var m = liftM(obj);

	// still need to lift monad to IO?
	if (!IO.is(m) && isFunction(m.fold)) {
		m = m.fold(IO.of,IO.of);
	}

	return m.map(obj => obj[prop]);
}

function assignPropIO(prop,val,obj) {
	// lift `val` to a monad
	var m1 = liftM(val);
	// still need to lift `val` monad to IO?
	if (!IO.is(m1) && isFunction(m1.fold)) {
		m1 = m1.fold(IO.of,IO.of);
	}

	// lift `obj` to a monad
	var m2 = liftM(obj);
	// still need to lift `obj` monad to IO?
	if (!IO.is(m2) && isFunction(m2.fold)) {
		m2 = m2.fold(IO.of,IO.of);
	}

	return (
		// NOTE: intentional outer 'chain(..)'
		// instead of 'map(..)'
		m1.chain(val => (
			m2.map(obj => (obj[prop] = val))
		))
	);
}


// **************************
// internal use only

function liftIO(env,v) {
	// monad?
	if (isMonad(v)) {
		// already an IO (or: IOx, AllIO, AnyIO)?
		if (IO.is(v)) {
			return v;
		}
		// Either:Left or Maybe:Nothing?
		else if (Either.Left.is(v) || Maybe.Nothing.is(v)) {
			// treat as an implicitly "early returned" value
			let ret = { returned: v, };
			returnedValues.add(ret);
			return IO.of(ret);
		}
		else {
			// attempt extracting value to "convert" to an IO
			let res = (
				isFunction(v.fold) ? v.fold(IO.of) :

				// intentional "type violation" since we have
				// an unusual/unrecognized monad that's not
				// "foldable" to extract its value legally
				getMonadFlatMap(v).call(v,IO.of)
			);

			// did "converting" to an IO work?
			if (IO.is(res)) {
				return res;
			}
			// final fallback: wrap the monad in an IO
			// (note: shouldn't get here)
			else {
				/* istanbul ignore next */
				return IO.of(v);
			}
		}
	}
	// non-monad function? (assume do-routine that needs env
	// passed to it as first argument)
	else if (isFunction(v)) {
		return liftIO(env,v(env));
	}
	// iterator?
	else if (v && typeof v == "object" && isFunction(v.next)) {
		return IO.do(v);
	}
	// fallback: wrap whatever value this is in an IO
	else {
		return IO.of(v);
	}
}
