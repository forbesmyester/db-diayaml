"use strict";

/* eslint-env browser */
/* global ace, Viz */

var lib = require('./lib.js'),
    debounce = require('debounce'),
    jsyaml = require('js-yaml');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/yaml");

function drawError(msg) {
    document.getElementById("diagram").innerHTML = '<div class="error"><h2>Error</h2><p>There was an error in ' + msg + '</p></div>';
}

function redraw() {
    var json = {};
    try {
        json = jsyaml.safeLoad(editor.getValue());
    } catch (e) {
        return drawError('YAML conversion');
    }
    /* eslint new-cap: 0 */
    try {
        document.getElementById("diagram").innerHTML = Viz(
            lib.getDotSrc(lib.transform(json)).join("\n"),
            "svg"
        );
    } catch (e) {
        drawError('generated GraphViz/DOT source, see console');
        if (console && console.log) {
            console.log("ERROR IN DOT SRC: ", lib.getDotSrc(lib.transform(json)).join("\n"));
        }
    }
}

redraw();


editor.getSession().on('change', debounce(redraw, 750));
