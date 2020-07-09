const just = require("monio/just");
const maybe = require("monio/maybe");

const identity = x => x;
const inc = x => x + 1;
const twice = x => x * 2;
const justProp = (key) => (obj) => just(obj[key]);
const maybeProp = (key) => (obj) => maybe.Just(obj[key]);

module.exports = {
	identity,
	inc,
	twice,
	justProp,
	maybeProp,
};
