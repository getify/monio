const just = require("monio/just");
const maybe = require("monio/maybe");
const either = require("monio/either");
const IO = require("monio/io");

const identity = x => x;
const inc = x => x + 1;
const twice = x => x * 2;
const justProp = (key) => (obj) => just(obj[key]);
const maybeProp = (key) => (obj) => maybe.Just(obj[key]);
const eitherProp = (key) => (obj) => either(obj[key]);
const ioProp = (key) => (obj) => IO.of(obj[key]);
const delayPr = (ms) => new Promise(r => setTimeout(r,ms));
const delayIOx = (v,ms) => IOx(() => delayPr(ms).then(() => v),[]);

async function safeAwait(pr) {
	try {
		return await pr;
	}
	catch (err) {
		return err;
	}
}

module.exports = {
	identity,
	inc,
	twice,
	justProp,
	maybeProp,
	eitherProp,
	ioProp,
	delayPr,
	delayIOx,
	safeAwait,
};
