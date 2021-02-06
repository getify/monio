"use strict";

module.exports = {
	getMonadFlatMap,
	isFunction,
	isPromise,
	isMonad,
	curry,
	liftM,
};
module.exports.getMonadFlatMap = getMonadFlatMap;
module.exports.isFunction = isFunction;
module.exports.isPromise = isPromise;
module.exports.isMonad = isMonad;
module.exports.curry = curry;
module.exports.liftM = liftM;


// **************************

function getMonadFlatMap(m) {
	var ret = m[
		"flatMap" in m ? "flatMap" :
		"chain" in m ? "chain" :
		"bind"
	];
	return (
		(
			isFunction(ret) &&
			ret !== Function.prototype.bind &&
			ret !== Array.prototype.flatMap
		) ?
			ret :
			undefined
	);
}

function isFunction(v) {
	return !!(v && typeof v == "function");
}

function isPromise(v) {
	return !!(v && isFunction(v.then));
}

// duck-type check for monad'ness
function isMonad(v) {
	return !!(
		v &&
		(typeof v == "object" || isFunction(v)) &&
		isFunction(getMonadFlatMap(v))
	);
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

function liftM(val) {
	return isMonad(val) ? val : Just(val);
}
