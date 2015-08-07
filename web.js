"use strict";

/* eslint-env browser */
/* global ace, Viz, jsyaml */

var lib = require('./lib.js'),
    debounce = require('debounce');

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/yaml");

function redraw() {
    /* eslint new-cap: 0 */
    document.getElementById("diagram").innerHTML = Viz(
        editor.getValue(),
        "svg"
    );
}

redraw();


editor.getSession().on('change', debounce(redraw, 200));
