"use strict";

var { isFunction, curry, } = require("../lib/util.js");
var IO = require("./io.js");

IOEventStream = Object.assign(
	curry(IOEventStream,2),
	{
		merge,
		zip,
		close,
	}
);
module.exports = IOEventStream;
module.exports.merge = merge;
module.exports.zip = zip;
module.exports.close = close;


// **************************

function IOEventStream(el,evtName,opts = {}) {
	var {
		debounce: debounceWindow = 0,
		maxDebounceDelay = 0,
		bufferSize = 100,
		throwBufferOverflow = false,
		evtOpts = {},
	} = opts;

	debounceWindow = Number(debounceWindow) || 0;
	maxDebounceDelay = Math.max(
		debounceWindow,
		Number(maxDebounceDelay) || 0
	);

	return IO(() => {
		var debounced = {
			evt: null,
			timestamp: null,
			def: null,
			intv: null,
		};
		var prStack;
		var nextStack;
		var forceClosed = Symbol("force closed");
		var { pr: hasClosed, next: triggerClose, } = getDeferred();
		var ait = eventStream();
		var origReturn = ait.return;
		var started = false;
		ait.return = itReturn;
		ait.closed = false;
		ait.start = start;
		ait.nextIO = nextIO;
		return ait;


		// ****************************

		function itReturn(...args) {
			var pr = origReturn.apply(ait,args);
			ait.closed = true;
			triggerClose(forceClosed);
			// debounce cycle still pending?
			if (debounced.timestamp) {
				clearTimeout(debounced.intv);
				let next = debounced.def.next;
				// reset the debounce state
				debounced.evt = debounced.timestamp =
					debounced.def = debounced.intv = null;
				// clear out the pending `await`
				next();
			}
			ait.return = origReturn;
			return pr;
		}

		function start() {
			if (!started) {
				started = true;
				prStack = [];
				nextStack = [];

				// (lazily) setup event listener
				if (isFunction(el.addEventListener)) {
					el.addEventListener(evtName,handler,evtOpts);
				}
				else if (isFunction(el.addListener)) {
					el.addListener(evtName,handler);
				}
				else if (isFunction(el.on)) {
					el.on(evtName,handler);
				}
			}
		}

		function nextIO(v) {
			return IO(() => ait.next(v));
		}

		async function *eventStream() {
			if (!started) {
				start();
			}

			try {
				while (true) {
					if (prStack.length == 0) {
						let { pr, next, } = getDeferred();
						prStack.push(pr);
						nextStack.push(next);
					}
					let res = await Promise.race([
						hasClosed,
						prStack.shift(),
					]);
					if (res == forceClosed) {
						return;
					}
					else {
						yield res;
					}
				}
			}
			finally {
				// remove event listener
				if (isFunction(el.removeEventListener)) {
					el.removeEventListener(evtName,handler,evtOpts);
				}
				else if (isFunction(el.removeListener)) {
					el.removeListener(evtName,handler);
				}
				else if (isFunction(el.off)) {
					el.off(evtName,handler);
				}
				prStack.length = nextStack.length = 0;
			}
		}

		async function handler(evt) {
			// need to debounce the event?
			if (debounceWindow > 0) {
				let now = Date.now();
				debounced.evt = evt;

				// debounce-delay timer hasn't been set yet?
				if (debounced.timestamp == null) {
					debounced.timestamp = now;
					debounced.def = getDeferred();
					debounced.intv = setTimeout(
						debounced.def.next,
						debounceWindow
					);

					// wait until the debounce-delay expires
					await debounced.def.pr;

					// debounce-cycle still valid and alive?
					if (debounced.def != null) {
						// override the `evt` parameter to the
						// last-received evt
						evt = debounced.evt;

						// reset any debouncing state
						debounced.evt = debounced.timestamp =
							debounced.def = debounced.intv = null;
					}
					else {
						return;
					}
				}
				// otherwise, repeat event while debounce-delay pending
				else {
					// clear the pending debounce-delay timer
					clearTimeout(debounced.intv);

					// have we still waited less than the max-delay?
					if ((now - debounced.timestamp) < maxDebounceDelay) {
						// reset the debounce-delay timer
						debounced.intv = setTimeout(
							debounced.def.next,

							// pick the lesser delay length of...
							Math.min(
								// debounce-window length
								debounceWindow,

								// or, time left below the max-delay
								maxDebounceDelay - (now - debounced.timestamp)
							)
						);
					}
					// otherwise, max-delay has already expired
					else {
						// unblock the event emission
						debounced.def.next();
					}

					return;
				}
			}

			if (nextStack.length > 0) {
				let next = nextStack.shift();
				next(evt);
			}
			else if (prStack.length < bufferSize) {
				let { pr, next, } = getDeferred();
				prStack.push(pr);
				next(evt);
			}
			else if (throwBufferOverflow) {
				let err = new Error("Event stream buffer overflow");
				err.evt = evt;
				throw err;
			}
		}
	});
}

function merge(...streams) {
	return IO(() => mergeStreams());


	// ****************************

	async function *mergeStreams() {
		try {
			while (true) {
				let prs = pullFromStreams(streams);

				// listening to any streams?
				if (prs.length > 0) {
					try {
						// last open stream?
						if (prs.length == 1) {
							let [ streamIdx, stream, res, ] = await prs[0];

							// stream closed?
							if (res.done) {
								// cleanup
								streams[streamIdx] = null;

								// complete iterator
								return;
							}
							else {
								// keep listening to the stream
								streams[streamIdx] = stream;
							}

							// send stream value out through iterator
							yield res.value;
						}
						// otherwise keep cycling through still-open streams
						else {
							let [ streamIdx, stream, res, ] = await Promise.race(prs);

							// remove stream from current position (but preserve indexing)
							// note: will be re-inserted if still open
							streams[streamIdx] = null;

							// stream still open?
							if (!res.done) {
								// re-insert it at the end for next iteration
								// (balanced round-robin scheduling)
								streams.push(stream);

								// send stream value out through iterator
								yield res.value;
							}
						}
					}
					catch (err) {
						// send exception out through iterator (closing it)
						return Promise.reject(err);
					}
				}
				// otherwise, we're done
				else {
					return;
				}
			}
		}
		finally {
			// force-close any remaining streams
			await close(streams);
		}
	}
}

function zip(...streams) {
	return IO(() => zipStreams());


	// ****************************

	async function *zipStreams() {
		try {
			while (true) {
				let prs = pullFromStreams(streams);

				// listening to any streams?
				if (prs.length > 0) {
					try {
						let vals = (
							(await Promise.all(prs))
							.reduce(
								function getStreamVals(list,val){
									var [ streamIdx, stream, res, ] = val;
									// stream closed?
									if (res.done) {
										// cleanup
										streams[streamIdx] = null;
										return list;
									}
									else {
										// keep listening to the stream
										streams[streamIdx] = stream;
										return [ ...list, res.value, ];
									}
								},
							[])
						);

						// any streams still open producing values?
						if (vals.length > 0) {
							yield vals;
						}
						else {
							// complete iterator
							return;
						}
					}
					catch (err) {
						// send exception out through iterator (closing it)
						return Promise.reject(err);
					}
				}
				// otherwise, we're done
				else {
					return;
				}
			}
		}
		finally {
			// force-close any remaining streams
			await close(...streams).run();
		}
	}
}

function pullFromStreams(streams) {
	return (
		streams
		.map(function callIter(v,idx){
			// stream (iterator) waiting for its
			// next() call?
			if (v && isFunction(v.next)) {
				streams[idx] = (async function getNext(){
					var pr = v.next();
					try {
						let res = await pr;
						// store normal iterator result
						return (
							streams[idx] = [ idx, v, res, ]
						);
					}
					catch (err) {
						// clear slot on exception
						streams[idx] = null;
						return pr;
					}
				})();
				return streams[idx];
			}

			// otherwise, keep value untouched
			return v;
		})
		// remove any empty values
		.filter(Boolean)
	);
}

function close(...streams) {
	return IO(() => (
		Promise.all(streams.map(async function closeStream(stream){
			if (stream && isFunction(stream.return)) {
				try {
					return await stream.return();
				}
				catch (err) {}
			}
		}))
	));
}

function getDeferred() {
	var next;
	var pr = new Promise(res => next = res);
	return { pr, next, };
}
