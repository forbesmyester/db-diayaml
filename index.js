"use strict";

var lib = require('./lib'),
    cliArgs = require("command-line-args"),
    R = require('ramda'),
    fs = require('fs');

/* define the command-line options */
var cli = cliArgs([
    { name: "help", type: Boolean, description: "Print usage instructions" },
    { name: "file", type: Array, defaultOption: true, description: "The input file (there can be many, but only the first will be read!)" },
    { name: "json", type: Boolean, defaultOption: false, description: "Use a JSON file instead of the default YAML" }
]);

/* parse the supplied command-line values */
var options = cli.parse();

/* generate a usage guide */
var usage = cli.getUsage({
    header: "Output a GraphViz / Dot file from a simplified YAML file",
    footer: "\n\n  YAML Usage:\n\n    node index.js dbdiagram.yml | dot -Gdpi=64 -Tpng:cairo:cairo > dbdiagram.png && display.im6 dbdiagram.png\n\n  JSON Usage:\n\n    node index.js --json test/dbdiagram.json | dot -Gdpi=64 -Tpng:cairo:cairo > dbdiagram.png && display.im6 dbdiagram.png"
});

if (
    options.help ||
    !options.hasOwnProperty('file') ||
    !options.file.length
) {
    console.log(usage);
    process.exit(0);
}

if (!options.json) {
    console.log("ERROR: Only JSON is currently supported!");
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
