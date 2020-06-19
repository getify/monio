"use strict";

var ioEventStream = el => evtName => IO(() => {
	var { pr, next, } = getDeferred();

	// setup event listener
	if (isFunction(el.addEventListener)) {
		el.addEventListener(evtName,handler,false);
	}
	else if (isFunction(el.addListener)) {
		el.addListener(evtName,handler);
	}
	else if (isFunction(el.on)) {
		el.on(evtName,handler);
	}

	// setup event unlistener
	var eventUnlisten =
		isFunction(el.removeEventListener) ? el.removeEventListener.bind(el,evtName,handler,false) :
		isFunction(el.removeListener) ? el.removeListener.bind(el,evtName,handler) :
		isFunction(el.off) ? el.off.bind(el,evtName,handler) :
		() => {}
	;

	return eventStream();


	// ****************************

	async function *eventStream() {
		try {
			while (true) {
				yield pr;
			}
		}
		finally {
			eventUnlisten();
		}
	}

	function handler(evt) {
		var f = next;
		({ pr, next, } = getDeferred());
		f(evt);
	}

	function getDeferred() {
		var next;
		var pr = new Promise(res => next = res);
		return { pr, next, };
	}

	function isFunction(v) {
		return v && typeof v == "function";
	}

});
