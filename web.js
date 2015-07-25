"use strict";

/* eslint-env browser */
/* global ace, Viz, jsyaml */

var lib = require('./lib.js'),
    debounce = require('debounce');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/yaml");

function redraw() {
    console.log("redraw");
    var json = {};
    try {
        json = jsyaml.safeLoad(editor.getValue());
    } catch (e) {
        console.log("Error reading YAML");
    }
    /* eslint new-cap: 0 */
    document.getElementById("diagram").innerHTML = Viz(
        lib.getDotSrc(json).join("\n"),
        "svg"
    );
}

redraw();


editor.getSession().on('change', debounce(redraw, 200));
