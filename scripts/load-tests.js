"use strict";

var path = require("path");
var fs = require("fs");

module.exports = function loadTests(){
	var files = fs.readdirSync(path.join(__dirname,"..","tests"));
	var testFiles = files.filter(filepath => /\.test\.js$/.test(filepath));
	for (let testFile of testFiles) {
		require(path.join(__dirname,"..","tests",testFile));
	}
};
