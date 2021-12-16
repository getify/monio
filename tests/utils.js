const just = require("monio/just");
const maybe = require("monio/maybe");
const either = require("monio/either");

const identity = x => x;
const inc = x => x + 1;
const twice = x => x * 2;
const justProp = (key) => (obj) => just(obj[key]);
const maybeProp = (key) => (obj) => maybe.Just(obj[key]);
const eitherProp = (key) => (obj) => either(obj[key]);

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
	safeAwait,
};
