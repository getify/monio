"use strict";

var {
	isFunction,
	isPromise,
	isMonad,
	getDeferred,
} = require("../lib/util.js");
var IO = require("./io.js");

const BRAND = {};
const EMPTY = {};
const UNSET = Symbol("unset");
const CLOSED = Symbol("closed");
var registerHooks = new WeakMap();

of.empty = ofEmpty;

module.exports = Object.assign(IOx,{
	of, pure: of, unit: of, is, do: $do, doEither, onEvent,
	onceEvent, merge, zip, filterIn, filterOut, distinct,
	distinctUntilChanged,
});
module.exports.of = of;
module.exports.pure = of;
module.exports.unit = of;
module.exports.is = is;
module.exports.do = $do;
module.exports.doEither = doEither;
module.exports.onEvent = onEvent;
module.exports.onceEvent = onceEvent;
module.exports.merge = merge;
module.exports.zip = zip;
module.exports.filterIn = filterIn;
module.exports.filterOut = filterOut;
module.exports.distinct = distinct;
module.exports.distinctUntilChanged = distinctUntilChanged;



// **************************


function IOx(iof,deps = []) {
	if (Array.isArray(deps)) {
		deps = [ ...deps ];
	}

	var currentEnv = UNSET;
	var currentVal = UNSET;
	var waitForDeps;
	var depsComplete;
	var depVals;
	var listeners;
	var closing = false;

	var io = IO(effect);
	io.assign = assign;	// just to control a quirk of minification
	var publicAPI = Object.assign(IOx$,{
		map, chain, flatMap: chain, bind: chain,
		concat, run, stop, close, isClosed, toString,
		_chain_with_IO, _inspect, _is, [Symbol.toStringTag]: "IOx",
	});
	registerHooks.set(publicAPI,[ registerListener, unregisterListener, ]);
	return publicAPI;

	// *****************************************

	// wrapper used only for external re-mapping of
	// name for publicAPI/instance (assignment function)
	function IOx$(v) {
		assign(v);
	}

	// purely for debugging aesthetics
	function toString() {
		return `[function ${this[Symbol.toStringTag] || this.name}]`;
	}

	function run(env) {
		if (io && currentVal != CLOSED) {
			return io.run(env);
		}
	}

	function stop() {
		unregisterWithDeps();
		depVals = null;
		currentEnv = UNSET;
	}

	function close() {
		if (!closing) {
			closing = true;
			stop();
			if (currentVal != CLOSED) {
				updateCurrentVal(CLOSED);
			}
			registerHooks.delete(publicAPI);
			waitForDeps = depsComplete = deps = iof = io = publicAPI = listeners = null;
		}
	}

	function isClosed() {
		return closing;
	}

	function assign(v) {
		if (!closing) {
			unregisterWithDeps();
			deps = depVals = currentEnv = iof = null;
			return updateCurrentVal(v);
		}
	}

	function map(fn) {
		return IOx((env,publicAPIv) => fn(publicAPIv),[ publicAPI, ]);
	}

	function chain(fn) {
		return IOx(function IOxChain(env,publicAPIv){
			var res = fn(publicAPIv);

			return (
				isPromise(res) ? res.then(handle) : handle(res)
			);

			// **************************************

			function handle(ciox) {
				// are we chaining with a valid IOx instance?
				if (registerHooks.has(ciox)) {
					// artificially register a listener for *outer* IOx
					registerListener(
						(_,val) => {
							// *outer* IOx has now closed, but chained IOx
							// is still open?
							if (val == CLOSED && !ciox.isClosed()) {
								// close the chained IOx (for memory cleanup)
								ciox.close();
							}
						},
						publicAPIv,
						currentEnv != UNSET ? currentEnv : env
					);
				}

				return ciox.run(env);
			}
		},[ publicAPI, ]);
	}

	function concat(m) {
		return IOx((env,v1) => {
			var v2 = m.run(env);
			return (
				isPromise(v2) ?
					v2.then(v2 => v1.concat(v2)) :
					v1.concat(v2)
			);
		},[ publicAPI, ]);
	}

	function effect(env) {
		if (!closing && isFunction(iof)) {
			// first run?
			if (currentEnv == UNSET) {
				registerWithDeps(env);
			}
			currentEnv = env;

			var dv = collectDepVals();
			if (!dv) {
				return waitForDeps;
			}
			// all dependencies are now closed?
			else if (dv == CLOSED) {
				try {
					return getDeferred().pr;
				}
				finally {
					close();
				}
			}

			let res = iof(currentEnv,...dv);
			if (res != EMPTY) {
				return updateCurrentVal(res);
			}
			else {
				return undefined;
			}
		}
		else if (![ UNSET, CLOSED, EMPTY ].includes(currentVal)) {
			return currentVal;
		}
		else {
			return iof;
		}
	}

	function collectDepVals() {
		if (Array.isArray(deps) && deps.length > 0) {
			let ret = [];
			for (let dep of deps) {
				if (
					dep &&
					isFunction(dep) &&
					registerHooks.has(dep)
				) {
					ret.push(depVals.get(dep));
				}
				// from an "empty IOx"
				else if (dep == EMPTY) {
					ret.push(UNSET);
				}
				else {
					ret.push(dep);
				}
			}

			// all depedencies closed?
			if (ret.every(v => v == CLOSED)) {
				return CLOSED;
			}
			// any dep values still unset (or closed)?
			else if (ret.includes(UNSET) || ret.includes(CLOSED)) {
				if (!waitForDeps) {
					({ pr: waitForDeps, next: depsComplete, } = getDeferred());
				}
				return false;
			}

			return ret;
		}
		return [];
	}

	function updateCurrentVal(v) {
		return (isPromise(v) ?
			v.then(handle).catch(logUnhandledError) :
			handle(v)
		);

		function handle(v) {
			currentVal = v;

			if (Array.isArray(listeners)) {
				// saving in case an update causes a closing
				let _publicAPI = publicAPI;
				let _listeners = [ ...listeners ];

				for (let listener of _listeners) {
					listener(_publicAPI,currentVal);
				}
			}
			// not yet fully closed?
			if (currentVal == CLOSED && io) {
				close();
			}

			if (![ UNSET, CLOSED, EMPTY ].includes(currentVal)) {
				if (depsComplete) {
					depsComplete(currentVal);
					waitForDeps = depsComplete = null;
				}
				return currentVal;
			}
			else if (depsComplete) {
				depsComplete(undefined);
				waitForDeps = depsComplete = null;
				return undefined;
			}
		}
	}

	function registerListener(listener,dep,env) {
		if (currentVal == CLOSED) {
			listener(dep,CLOSED);
		}
		else {
			if (!Array.isArray(listeners)) {
				listeners = [ listener, ];
			}
			else {
				listeners.push(listener);
			}

			// haven't run yet?
			if (currentEnv == UNSET) {
				safeIORun(publicAPI,env);
			}
			else {
				// respond with most recent value
				listener(dep,currentVal);
			}
		}
	}

	function unregisterListener(listener) {
		if (Array.isArray(listeners) && listeners.length > 0) {
			let idx = listeners.findIndex(l => l == listener);
			if (idx != -1) {
				listeners.splice(idx,1);
			}
		}
	}

	function registerWithDeps(env) {
		// need to subscribe to any deps?
		if (Array.isArray(deps) && deps.length > 0) {
			if (!depVals) {
				depVals = new WeakMap();
			}
			for (let dep of deps) {
				// is this dep an IOx instance that
				// we haven't registered with before?
				if (
					dep &&
					isFunction(dep) &&
					registerHooks.has(dep) &&
					!depVals.has(dep)
				) {
					depVals.set(dep,UNSET);
					let [ regListener, ] = registerHooks.get(dep);
					// IOx instance still active/valid?
					if (isFunction(regListener)) {
						regListener(onDepUpdate,dep,env);
					}
				}
			}
		}
	}

	function unregisterWithDeps() {
		// need to unsubscribe any deps?
		if (Array.isArray(deps) && deps.length > 0) {
			for (let dep of deps) {
				// is this dep an IOx instance?
				if (
					dep &&
					isFunction(dep) &&
					registerHooks.has(dep)
				) {
					if (depVals) {
						depVals.delete(dep);
					}
					let [ , unregListener, ] = registerHooks.get(dep);
					// IOx instance still active/valid?
					if (isFunction(unregListener)) {
						unregListener(onDepUpdate);
					}
				}
			}
		}
	}

	function onDepUpdate(dep,newVal) {
		if (depVals) {
			depVals.set(dep,newVal);
		}
		if (currentEnv != UNSET) {
			safeIORun(publicAPI,currentEnv);
		}
		else {
			let dv = collectDepVals();
			if (dv == CLOSED) {
				close();
			}
		}
	}

	// perf optimization "cheat" intended only for `IO.do(..)`:
	//
	// skips evaluating with an enclosing IOx and instead
	// allows current value to either be immediately resolved,
	// or queues up for when the first value resolution of this
	// IOx occurs
	function _chain_with_IO(fn) {
		return (
			(currentVal != UNSET && currentEnv != UNSET) ?
				fn(currentVal != CLOSED ? currentVal : undefined) :
				io.chain(fn)
		);
	}

	function _inspect() {
		return `${publicAPI[Symbol.toStringTag]}(${
			isFunction(iof) ? (iof.name || "anonymous function") :
			isMonad(currentVal) && isFunction(currentVal._inspect) ? currentVal._inspect() :
			![ UNSET, CLOSED ].includes(currentVal) ? String(currentVal) :
			".."
		})`;
	}

	function _is(br) {
		return !!(br === BRAND || ((io || IO.of())._is(br)));
	}

}

function is(v) {
	return !!(v && isFunction(v._is) && v._is(BRAND));
}

function of(v) {
	return IOx(() => v);
}

function ofEmpty() {
	return IOx(() => {},[ EMPTY, ]);
}

function $do(gen,deps = [],...args) {
	return IOx((env,...deps) => (
		IO.do(gen,...deps,...args).run(env)
	),deps);
}

function doEither(gen,deps = [],...args) {
	return IOx((env,...deps) => (
		IO.doEither(gen,...deps,...args).run(env)
	),deps);
}

function onEvent(el,evtName,evtOpts = false) {
	var subscribed = false;
	var iox = IOx(effect);

	// save original methods
	var { run: _run, stop: _stop, close: _close, } = iox;

	// overwrite methods with wrapped versions
	Object.assign(iox,{ run, stop, close, });

	return iox;

	// *****************************************

	function effect() {
		subscribe();
		return EMPTY;
	}

	function subscribe() {
		if (!subscribed && iox) {
			subscribed = true;

			// (lazily) setup event listener
			if (isFunction(el.addEventListener)) {
				el.addEventListener(evtName,iox,evtOpts);
			}
			else if (isFunction(el.addListener)) {
				el.addListener(evtName,iox);
			}
			else if (isFunction(el.on)) {
				el.on(evtName,iox);
			}
		}
	}

	function unsubscribe() {
		if (subscribed && iox) {
			subscribed = false;

			// remove event listener
			if (isFunction(el.removeEventListener)) {
				el.removeEventListener(evtName,iox,evtOpts);
			}
			else if (isFunction(el.removeListener)) {
				el.removeListener(evtName,iox);
			}
			else if (isFunction(el.off)) {
				el.off(evtName,iox);
			}
		}
	}

	function run(env) {
		subscribe();
		if (_run) {
			_run(env);
		}
	}

	function stop() {
		unsubscribe();
		_stop();
	}

	function close() {
		if (iox) {
			// restore original methods
			Object.assign(iox,{
				run: _run, stop: _stop, close: _close,
			});
			stop();
			iox.close();
			run = _run = _stop = stop = _close = close =
				iox = el = evtOpts = null;
		}
	}

}

function onceEvent(el,evtName,evtOpts = false) {
	var listener;
	var subscribed = false;
	var fired = false;
	var iox = onEvent(el,evtName,evtOpts);

	// save original methods
	var { run: _run, stop: _stop, close: _close, } = iox;

	// overwrite methods with wrapped versions
	Object.assign(iox,{ run, stop, close, });

	return iox;

	// ***************************

	function subscribe() {
		if (!subscribed && !listener && iox) {
			subscribed = true;

			// listen for when the event fires
			listener = IOx(onFire,[ iox, ]);
		}
	}

	function unsubscribe() {
		if (subscribed && listener) {
			subscribed = false;

			listener.close();
			listener = null;
		}
	}

	function run(env) {
		if (iox) {
			if (_run) {
				iox.run = _run;
			}
			subscribe();
			if (listener) {
				listener.run(env);
			}
		}
	}

	function stop() {
		if (iox) {
			iox.run = run;
			unsubscribe();
			_stop();
		}
	}

	function close() {
		if (iox) {
			// restore original methods
			Object.assign(iox,{
				run: _run, stop: _stop, close: _close,
			});
			stop();
			iox.close();
			run = _run = _stop = stop = _close = close =
				iox = listener = null;
		}
	}

	function onFire() {
		if (!fired) {
			fired = true;
			close();
		}
	}

}

function zip(ioxs = []) {
	if (Array.isArray(ioxs)) {
		ioxs = [ ...ioxs ];
	}

	var subscribed = false;
	var queues = new Map();
	var iox = IOx(effect);

	// save original methods
	var { run: _run, stop: _stop, close: _close, } = iox;

	// overwrite methods with wrapped versions
	Object.assign(iox,{ run, stop, close, });

	return iox;

	// *****************************************

	function effect(env) {
		subscribe(env);
		return EMPTY;
	}

	function subscribe(env) {
		if (!subscribed && iox) {
			subscribed = true;

			if (Array.isArray(ioxs)) {
				for (let x of ioxs) {
					// need a queue to hold stream's values?
					if (!queues.has(x)) {
						queues.set(x,[]);
					}

					// register a listener for the stream?
					if (registerHooks.has(x)) {
						let [ regListener, ] = registerHooks.get(x);
						regListener(onUpdate,x,env);
					}
				}
				checkListeners();
			}
		}
	}

	function onUpdate(stream,v) {
		if (!iox.isClosed()) {
			if (v != CLOSED) {
				if (queues.has(stream)) {
					queues.get(stream).push(v);
				}
			}
			checkListeners();
		}
	}

	function checkListeners() {
		if (
			!iox.isClosed() &&
			Array.isArray(ioxs)
		) {
			// keep checking until we've drained all the
			// queues of values
			while (true) {
				let allStreamsClosed = true;
				let collectedQueues;
				let collectedValues;
				for (let x of ioxs) {
					// stream still open?
					if (!x.isClosed()) {
						allStreamsClosed = false;
					}

					// collect next value in queue?
					let queue = queues.get(x);
					if (queue.length > 0) {
						collectedValues = collectedValues || [];
						collectedQueues = collectedQueues || [];
						collectedValues.push(queue[0]);
						collectedQueues.push(queue);
					}
					// could stream still produce values?
					else if (!x.isClosed()) {
						// since we have no value for this
						// stream currently, done for now
						return;
					}
				}

				// collected values to emit?
				if (
					Array.isArray(collectedValues) &&
					Array.isArray(collectedQueues) &&
					collectedValues.length > 0 &&
					collectedQueues.length > 0
				) {
					// remove all the collected values from their
					// respective queues
					for (let queue of collectedQueues) {
						queue.shift();
					}

					// emit the collected values
					iox(collectedValues);
				}
				// otherwise, done for now
				else {
					// but, also need to close the zip stream?
					if (allStreamsClosed) {
						close();
					}
					break;
				}
			}
		}
	}

	function unsubscribe() {
		if (subscribed && iox) {
			subscribed = false;

			if (Array.isArray(ioxs)) {
				for (let x of ioxs) {
					if (registerHooks.has(x)) {
						let [ , unregListener, ] = registerHooks.get(x);
						unregListener(onUpdate);
					}
				}
			}
		}
	}

	function run(env) {
		subscribe(env);
		if (_run) {
			_run(env);
		}
	}

	function stop() {
		unsubscribe();
		_stop();
	}

	function close() {
		if (iox) {
			// restore original methods
			Object.assign(iox,{
				run: _run, stop: _stop, close: _close,
			});
			stop();
			iox.close();
			run = _run = _stop = stop = _close = close =
				queues = iox = ioxs = null;
		}
	}

}

function merge(ioxs = []) {
	if (Array.isArray(ioxs)) {
		ioxs = [ ...ioxs ];
	}

	var subscribed = false;
	var iox = IOx(effect);

	// save original methods
	var { run: _run, stop: _stop, close: _close, } = iox;

	// overwrite methods with wrapped versions
	Object.assign(iox,{ run, stop, close, });

	return iox;

	// *****************************************

	function effect(env) {
		subscribe(env);
		return EMPTY;
	}

	function subscribe(env) {
		if (!subscribed && iox) {
			subscribed = true;

			if (Array.isArray(ioxs)) {
				// setup listeners for all merged streams
				for (let x of ioxs) {
					if (registerHooks.has(x)) {
						let [ regListener, ] = registerHooks.get(x);
						regListener(onUpdate,x,env);
					}
				}
				checkListeners();
			}
		}
	}

	function onUpdate(_,v) {
		if (!iox.isClosed()) {
			if (v != CLOSED) {
				iox(v);
			}
			checkListeners();
		}
	}

	function checkListeners() {
		if (
			!iox.isClosed() &&
			// all merged streams closed?
			Array.isArray(ioxs) &&
			ioxs.every(x => x.isClosed())
		) {
			close();
		}
	}

	function unsubscribe() {
		if (subscribed && iox) {
			subscribed = false;

			if (Array.isArray(ioxs)) {
				for (let x of ioxs) {
					if (registerHooks.has(x)) {
						let [ , unregListener, ] = registerHooks.get(x);
						unregListener(onUpdate);
					}
				}
			}
		}
	}

	function run(env) {
		subscribe(env);
		if (_run) {
			_run(env);
		}
	}

	function stop() {
		unsubscribe();
		_stop();
	}

	function close() {
		if (iox) {
			// restore original methods
			Object.assign(iox,{
				run: _run, stop: _stop, close: _close,
			});
			stop();
			iox.close();
			run = _run = _stop = stop = _close = close =
				iox = ioxs = null;
		}
	}

}

function filterIn(predicate) {
	const EMPTY = IOx.of.empty();
	var iox = IOx.of.empty();

	return function filter(v){
		if (predicate(v)) {
			iox(v);
			return iox;
		}
		return EMPTY;
	};
}

function filterOut(predicate) {
	return filterIn(v => !predicate(v));
}

function distinct() {
	var prevPrim = new Set();
	var prevObj = new WeakSet();

	return filterIn(function distinct(v){
		var prevSet = (
			v && [ "object", "function" ].includes(typeof v) ? prevObj : prevPrim
		);
		if (!prevSet.has(v)) {
			prevSet.add(v);
			return true;
		}
		return false;
	});
}

function distinctUntilChanged() {
	// note: a distinct object literal as an initial
	// sentinel value to distinguish from any possible
	// passed in value (including undefined)
	var prev = {};

	return filterIn(function distinctUntilChanged(v){
		if (prev instanceof WeakSet) {
			if (v && [ "object", "function" ].includes(typeof v)) {
				if (!prev.has(v)) {
					prev = new WeakSet();
					prev.add(v);
					return true;
				}
			}
			else {
				prev = v;
				return true;
			}
		}
		else {
			if (v && [ "object", "function" ].includes(typeof v)) {
				prev = new WeakSet();
				prev.add(v);
				return true;
			}
			else if (!Object.is(v,prev)) {
				prev = v;
				return true;
			}
		}
		return false;
	});
}

function safeIORun(io,env) {
	try {
		var res = io.run(env);
		if (isPromise(res)) {
			res.catch(logUnhandledError);
		}
	}
	catch (err) {
		Promise.reject(err).catch(logUnhandledError);
	}
}

function logUnhandledError(err) {
	console.log(err && (
		err.stack ? err.stack : err.toString()
	));
}
