const just = require("monio/just");

const identity = x => x;
const inc = x => x + 1;
const twice = x => x * 2;
const justProp = (key) => (obj) => just(obj[key]);

module.exports = {
	identity,
	inc,
	twice,
	justProp,
};
