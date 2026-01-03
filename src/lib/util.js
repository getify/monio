"use strict";

function EMPTY_FUNC() {}
const IS_CONT = Symbol("is-continuation");
const RET_CONT = Symbol("return-continuation");
const CONT_VAL = Symbol("continuation-value");
const EMPTY_SLOT = Object.freeze(Object.create(null));
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

// used for object pooling of continuation tuples
var continuationPool = [];
var nextFreeSlot = 0;
__GROW_CONTINUATION_POOL(100);

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
	$,

	// configure object pooling
	__GROW_CONTINUATION_POOL,
	__EMPTY_CONTINUATION_POOL,

	// internal use only
	definePipeWithMethodChaining,
	definePipeWithFunctionComposition,
	definePipeWithAsyncFunctionComposition,
	continuation,
	returnSignal,
	isReturnSignal,
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
module.exports.$ = $;

// configure object pooling
module.exports.__GROW_CONTINUATION_POOL = __GROW_CONTINUATION_POOL;
module.exports.__EMPTY_CONTINUATION_POOL = __EMPTY_CONTINUATION_POOL;

// internal use only
module.exports.definePipeWithMethodChaining = definePipeWithMethodChaining;
module.exports.definePipeWithFunctionComposition = definePipeWithFunctionComposition;
module.exports.definePipeWithAsyncFunctionComposition = definePipeWithAsyncFunctionComposition;
module.exports.continuation = continuation;
module.exports.returnSignal = returnSignal;
module.exports.isReturnSignal = isReturnSignal;
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
	if (Promise.withResolvers != null) {
		let { promise, resolve, reject, } = Promise.withResolvers();
		return { pr: promise, next: resolve, reject, };
	}
	else {
		let next, reject;
		let pr = new Promise((res,rej) => (next = res, reject = rej));
		return { pr, next, reject, };
	}
}

// wrap as single-iterable (if necessary)
function $(v) {
	if (
		v != null &&
		typeof v.next == "function" &&
		typeof v[Symbol.iterator] == "function" &&
		v[Symbol.iterator]() == v
	) {
		return v;
	}
	return {
		*[Symbol.iterator]() { return yield v; },
	};
}


// ***************************************************************
// ***************************************************************

function definePipeWithMethodChaining(context,methodName) {
	context[methodName].pipe = function pipe(...vs){
		for (let v of vs) {
			context = context[methodName](v);
		}
		return context;
	};
}

function definePipeWithFunctionComposition(context,methodName) {
	context[methodName].pipe = function pipe(...fns){
		return context[methodName](function composed(v){
			for (let fn of fns) {
				v = fn(v);
			}
			return v;
		});
	};
}

function definePipeWithAsyncFunctionComposition(context,methodName) {
	context[methodName].pipe = function pipe(...fns){
		return context[methodName](function composed(v){
			return (fns.length > 0 ?
				trampoline(possiblyAsyncPipe(v,fns)) :
				v
			);
		});
	};
}

function possiblyAsyncPipe(v,[ nextFn, ...nextFns ]) {
	return (
		// at the end of the (potentially async) composition?
		nextFns.length == 0 ?
			nextFn(v) :

			// otherwise, continue the composition
			continuation(
				() => nextFn(v),

				nextV => (
					isPromise(nextV) ?
						// trampoline() here unwraps the continuation
						// immediately, because we're already in an
						// async microtask from the promise
						nextV.then(v2 => trampoline(possiblyAsyncPipe(v2,nextFns))) :

						possiblyAsyncPipe(nextV,nextFns)
				)
			)
	);
}

// used internally by IO/IOx/State, marks a tuple
// as a continuation that trampoline(..)
// should process
function continuation(left,right) {
	var cont = getContinuation();

	if (arguments.length > 1) {
		cont[0] = left;
		cont[1] = right;
	}
	else if (arguments.length == 1) {
		cont[0] = left;
	}

	return cont;
}

// used internally by IO/IOx/State, signals to
// `run(..)` / `evaluate(..)` call that it should
// return any continuation rather than processing
// it
function returnSignal(val) {
	// signal already marked?
	if (isReturnSignal(val)) {
		/* istanbul ignore next */
		return val;
	}
	else {
		return {
			[RET_CONT]: true,
			val,
		};
	}
}

// used internally by IO/IOx/State, determines
// if the reader-env passed into `run(..)` /
// `evaluate(..)` was a signal to return any
// continuation rather than processing it
function isReturnSignal(v) {
	return (v && v[RET_CONT] === true);
}

// used internally by IO/IOx/State, prevents
// RangeError call-stack overflow when
// composing many IO/IOx/States together
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
				let cont = stack.pop();
				let right = cont[1];
				recycleContinuation(cont);

				if (isFunction(right)) {
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
	}
	return res;
}

// pooling continuation tuples to reduce GC
// (adapted from: https://github.com/getify/deePool)
function getContinuation() {
	// pool used up, need to grow it?
	if (nextFreeSlot == continuationPool.length) {
		__GROW_CONTINUATION_POOL(continuationPool.length || 100);
	}

	var cont = continuationPool[nextFreeSlot];
	continuationPool[nextFreeSlot++] = EMPTY_SLOT;
	return cont;
}

function recycleContinuation(cont) {
	cont.length = 0;
	continuationPool[--nextFreeSlot] = cont;
}

function __GROW_CONTINUATION_POOL(growByCount) {
	growByCount = Math.max(1,growByCount);
	var curLen = continuationPool.length;
	continuationPool.length += growByCount;
	for (let i = curLen; i < continuationPool.length; i++) {
		let cont = [];
		cont[IS_CONT] = true;
		continuationPool[i] = cont;
	}
}

/* istanbul ignore next */
function __EMPTY_CONTINUATION_POOL() {
	continuationPool.length = nextFreeSlot = 0;
}
