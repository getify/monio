"use strict";

// curry some public methods
fold = curry(fold,2);
foldMap = curry(foldMap,2);

module.exports = {
	getMonadFlatMap,
	isMonad,
	liftM,
	isFunction,
	isPromise,
	curry,
	fold,
	foldMap,
	getDeferred,
};
module.exports.getMonadFlatMap = getMonadFlatMap;
module.exports.isMonad = isMonad;
module.exports.liftM = liftM;
module.exports.isFunction = isFunction;
module.exports.isPromise = isPromise;
module.exports.curry = curry;
module.exports.fold = fold;
module.exports.foldMap = foldMap;
module.exports.getDeferred = getDeferred;


// **************************

var builtInFunctions = new Set(
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
);

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
