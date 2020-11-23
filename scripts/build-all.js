#!/usr/bin/env node

var fs = require("fs"),
	path = require("path"),
	util = require("util"),
	{ execFile } = require("child_process"),

	execFileAsync = util.promisify(execFile),
	packageJSON,
	copyrightHeader,
	version,
	year = (new Date()).getFullYear(),
	builds,

	ROOT_DIR = path.join(__dirname,".."),
	SRC_DIR = path.join(ROOT_DIR,"src"),
	DIST_DIR = path.join(ROOT_DIR,"dist"),

	result
;

console.log("*** Building Monio ***");

(async function main(){
	try {
		// try to make the dist directory, if needed
		try {
			fs.mkdirSync(DIST_DIR,0o755);
		}
		catch (err) { }

		// read package.json
		packageJSON = JSON.parse(
			fs.readFileSync(
				path.join(ROOT_DIR,"package.json"),
				{ encoding: "utf8", }
			)
		);
		// read version number from package.json
		version = packageJSON.version;
		// read copyright-header text, render with version and year
		copyrightHeader = fs.readFileSync(
			path.join(SRC_DIR,"copyright-header.txt"),
			{ encoding: "utf8", }
		).replace(/`/g,"");
		copyrightHeader = Function("version","year",`return \`${copyrightHeader}\`;`)( version, year );

		// run moduloze CLI on the src/ tree
		await execFileAsync(
			path.join(ROOT_DIR,"node_modules",".bin","mz"),
			[
				`--prepend=${ copyrightHeader }`,
				"-ruben",
			]
		);

		console.log("Complete.");
	}
	catch (err) {
		console.error(err);
		process.exit(1);
	}
})();
