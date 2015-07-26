"use strict";

/* eslint-env browser */
/* global ace, Viz, jsyaml */

var lib = require('./lib.js'),
    debounce = require('debounce');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/yaml");

function redraw() {
    var json = {};
    try {
        json = jsyaml.safeLoad(editor.getValue());
    } catch (e) {
        document.getElementById("diagram").innerHTML = '<div class="error"><h2>Error</h2><p>Your YAML does not appear to be valid</p></div>';
        return;
    }
    /* eslint new-cap: 0 */
    document.getElementById("diagram").innerHTML = Viz(
        lib.getDotSrc(lib.transform(json)).join("\n"),
        "svg"
    );
}

redraw();


editor.getSession().on('change', debounce(redraw, 200));
