"use strict";

var lib = require('./lib'),
    cliArgs = require("command-line-args"),
    R = require('ramda'),
    fs = require('fs');

/* define the command-line options */
var cli = cliArgs([
    { name: "help", type: Boolean, description: "Print usage instructions" },
    { name: "file", type: Array, defaultOption: true, description: "The input file" }
]);

/* parse the supplied command-line values */
var options = cli.parse();

/* generate a usage guide */
var usage = cli.getUsage({
    header: "A synopsis application.",
    footer: "For more information, visit http://example.com"
});

if (
    options.help ||
    !options.hasOwnProperty('file') ||
    !options.file.length
) {
    console.log(usage);
    process.exit(0);
}
if (R.any(
    function(f) { return !fs.existsSync(f); },
    options.file
)) {
    console.log("ERROR: File not found");
    console.log(usage);
    process.exit(1);
}

var json = {};
try {
    json = JSON.parse(
        fs.readFileSync(options.file[0])
    );
} catch (e) {
    console.log("ERROR: Invalid JSON");
    process.exit(2);
}

console.log(lib.getDotSrc(json).join("\n"));
