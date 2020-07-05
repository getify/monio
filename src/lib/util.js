"use strict";

module.exports = {
	isFunction,
	isPromise,
	curry,
};
module.exports.isFunction = isFunction;
module.exports.isPromise = isPromise;
module.exports.curry = curry;


// **************************

function isFunction(v) {
	return v && typeof v == "function";
}

function isPromise(v) {
	return v && typeof v.then == "function";
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
