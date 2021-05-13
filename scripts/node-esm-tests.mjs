#!/usr/bin/env node

import { createRequire } from "module";
const require = createRequire(import.meta.url);

import {
	Just,
	Nothing,
	Maybe,
	Either,
	AsyncEither,
	IO,
	AnyIO,
	AllIO,
	IOHelpers,
	IOEventStream
} from "../dist/esm/index.mjs";
global.Just = Just;
global.Nothing = Nothing;
global.Maybe = Maybe;
global.Either = Either;
global.AsyncEither = AsyncEither;
global.IO = IO;
global.AnyIO = AnyIO;
global.AllIO = AllIO;
global.IOHelpers = IOHelpers;
global.IOEventStream = IOEventStream;

global.QUnit = require("qunit");

require("../tests/qunit.config.js");
require("./load-tests.js")();

QUnit.start();
