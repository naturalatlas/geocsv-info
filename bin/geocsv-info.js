#!/usr/bin/env node
var geocsvinfo = require('../index.js');

var filename = process.argv[2];
if (!filename) {
	console.error('Filename must be provided');
	process.exit(1);
}

geocsvinfo(filename, function(err, metadata) {
	if (err) {
		console.log(err);
		process.exit(1);
	}
	console.log(metadata);
	process.exit(0);
});