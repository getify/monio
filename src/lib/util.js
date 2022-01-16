"use strict";

const IS_CONT = Symbol("is-continuation");
const RUN_CONT = Symbol("return-continuation");
const CONT_VAL = Symbol("continuation-value");
const EMPTY_FUNC = () => {};
const builtInFunctions = Object.freeze(new Set(
	// list of candidates (may or may not be real functions)
	[
		Function.prototype.bind,
		Array.prototype.flatMap,
		Set.prototype.flatMap,  // only a contemplated future method
		(function *(){})().flatMap,  // proposed (stage-2)
		(async function*(){})().flatMap,  // proposed (stage-2)
	]
	// include only actual real functions from that list
	.filter(isFunction)
));

// curry some public methods
fold = curry(fold,2);
foldMap = curry(foldMap,2);

module.exports = {
	EMPTY_FUNC,
	identity,
	getMonadFlatMap,
	isMonad,
	liftM,
	isFunction,
	isPromise,
	curry,
	fold,
	foldMap,
	getDeferred,
	continuation,
	runSignal,
	isRunSignal,
	trampoline,
};
module.exports.EMPTY_FUNC = EMPTY_FUNC;
module.exports.identity = identity;
module.exports.getMonadFlatMap = getMonadFlatMap;
module.exports.isMonad = isMonad;
module.exports.liftM = liftM;
module.exports.isFunction = isFunction;
module.exports.isPromise = isPromise;
module.exports.curry = curry;
module.exports.fold = fold;
module.exports.foldMap = foldMap;
module.exports.getDeferred = getDeferred;
module.exports.continuation = continuation;
module.exports.runSignal = runSignal;
module.exports.isRunSignal = isRunSignal;
module.exports.trampoline = trampoline;


// *****************************************

function identity(v) { return v; }

function getMonadFlatMap(m) {
	var fmFunc = m.flatMap || m.chain || m.bind;

	// return a flatMap/bind/chain function if found
	return isFunction(fmFunc) ? fmFunc : undefined;
}

// duck-type check for monad'ness
function isMonad(v) {
	var fmFunc = (
		(
			v &&
			(typeof v == "object" || isFunction(v))
		) ?
			getMonadFlatMap(v) :
			undefined
	);

	return !!(
		// was a flatMap/bind/chain function found?
		fmFunc &&

		// but make sure it's not one of the known built-in
		// prototype methods
		!builtInFunctions.has(fmFunc) &&

		// also try to avoid any unknown built-in prototype
		// methods
		(
			!((fmFunc.toString() || "").includes("[native code]")) ||
			((fmFunc.name || "").startsWith("bound"))
		)
	);
}

function liftM(val) {
	return isMonad(val) ? val : Just(val);
}

function isFunction(v) {
	return !!(v && typeof v == "function");
}

function isPromise(v) {
	return !!(v && isFunction(v.then));
}

function curry(fn,arity = fn.length) {
    return (function nextCurried(prevArgs){
        return (...nextArgs) => {
            var args = [ ...prevArgs, ...nextArgs, ];

            if (args.length >= arity) {
                return fn(...args);
            }
            else {
                return nextCurried(args);
            }
        };
    })([]);
}

function fold(s,v) {
	return s.concat(v);
}

function foldMap(f,list,empty) {
	return (
		empty ? list.reduce((s,v) => fold(s,f(v)),empty) :
		list.length > 0 ? list.slice(1).reduce(
			(s,v) => fold(s,f(v)),
			f(list[0])
		) :
		undefined
	);
}

function getDeferred() {
	var next;
	var pr = new Promise(res => next = res);
	return { pr, next, };
}

// used internally by IO/IOx, marks a tuple
// as a continuation that trampoline(..)
// should process
function continuation(cont) {
	cont[IS_CONT] = true;
	return cont;
}

// used internally by IO/IOx, signals to
// `run(..)` call that it should return any
// continuation rather than processing it
function runSignal(env) {
	return {
		[RUN_CONT]: true,
		env,
	};
}

// used internally by IO/IOx, determines
// if the reader-env passed into `run(..)`
// was a signal to return any continuation
// rather than processing it
function isRunSignal(v) {
	return (v && v[RUN_CONT] === true);
}

// used internally by IO/IOx, prevents
// RangeError call-stack overflow when
// composing many IO/IOx's together
function trampoline(res) {
	var stack = [];

	processContinuation: while (Array.isArray(res) && res[IS_CONT] === true) {
		let left = res[0];

		// compute the left-half of the continuation
		// tuple
		let leftRes = left();

		// store left-half result directly in the
		// continuation tuple (for later recall
		// during processing right-half of tuple)
		// res[0] = { [CONT_VAL]: leftRes };
		res[0] = leftRes;

		// store the modified continuation tuple
		// on the stack
		stack.push(res);

		// left half of continuation tuple returned
		// another continuation?
		if (Array.isArray(leftRes) && leftRes[IS_CONT]) {
			// process the next continuation
			res = leftRes;
			continue processContinuation;
		}
		// otherwise, process right half of continuation
		// tuple
		else {
			// grab the most recent left-hand value
			res = stack[stack.length - 1][0];

			// start popping the stack
			while (stack.length > 0) {
				let [ ,	right ] = stack.pop();

				res = right(res);

				// right half of continuation tuple returned
				// another continuation?
				if (Array.isArray(res) && res[IS_CONT] === true) {
					// process the next continuation
					continue processContinuation;
				}
			}
		}
	}
	return res;
}
