"use strict";

module.exports = {
	getMonadFlatMap,
	isFunction,
	isPromise,
	isMonad,
	curry,
};
module.exports.getMonadFlatMap = getMonadFlatMap;
module.exports.isFunction = isFunction;
module.exports.isPromise = isPromise;
module.exports.isMonad = isMonad;
module.exports.curry = curry;


// **************************

function getMonadFlatMap(m) {
	return m[
		"flatMap" in m ? "flatMap" :
		"chain" in m ? "chain" :
		"bind"
	];
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
