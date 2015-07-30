"use strict";

var R = require('require-parts')('ramda', 'src', ["partial", "map", "sortBy", "keys", "mapObjIndexed", "concat", "values", "assocPath", "reduce", "slice", "path", "defaultTo", "join", "flatten"]);

function writeSubGraphField(tablename, fieldname) {
    return "<" + tablename + "__" + fieldname + ">" + fieldname;
}

function writeTable(tabledata, tablename) {
    var lines = ["subgraph cluster" + tablename + " {"];
    var fields = R.join(
        "|",
        R.map(
            R.partial(writeSubGraphField, tablename),
            R.sort(
                function(a, b) {
                    if (a == 'id') { return -1; }
                    if (b == 'id') { return 1; }
                    return 0;
                },
                R.keys(tabledata)
            )
        )
    );
    lines.push('  label = "' + tablename + '";');
    lines.push('  struct' + tablename + ' [label="{' + fields + '}",shape=record];');
    lines.push("}");
    return lines;
}

function findLinks(struct) {
    var r = [];
    R.mapObjIndexed(function(table, tablename) {
        return R.mapObjIndexed(function(field, fieldname) {
            var l;
            if (field && field.hasOwnProperty('link')) {
                l = field.link.split(".");
                if (l.length < 2) {
                    l.push("id");
                }
                r.push(R.concat([tablename, fieldname], l));
            }
        }, table);
    }, struct);
    return r;
}

function addLinkFields(struct) {
    var links = findLinks(struct);
    return R.reduce(function(myStruct, link) {
        return R.assocPath(
            R.slice(2, 4, link),
            R.defaultTo(null, R.path(R.slice(2, 4, link), myStruct)),
            myStruct
        );
    }, struct, links);
}

function writeLink(linkSpec) {
    return R.join(' -> ', [
        R.join(':', ['struct' + linkSpec[0], linkSpec[0] + '__' + linkSpec[1]]),
        R.join(':', ['struct' + linkSpec[2], linkSpec[2] + '__' + linkSpec[3]])
    ]);
}

function getDotSrc(struct) {
    var finalStruct = addLinkFields(struct);
    var inner = R.map(function(s) { return "  " + s; }, R.flatten([
        R.values(R.mapObjIndexed(writeTable, finalStruct)),
        R.map(writeLink, findLinks(finalStruct))
    ]));
    return R.flatten(['digraph db {', inner, '}']);
}

function transform1(struct) {
    return R.mapObjIndexed(function(table) {
        return R.mapObjIndexed(function(field) {
            if (typeof field == 'string') {
                return { link: field };
            }
            return field;
        }, table);
    }, struct);
}

function transform(struct) {
    return transform1(struct);
}

transform.transform1 = transform1;

module.exports = {
    writeTable: writeTable,
    addLinkFields: addLinkFields,
    findLinks: findLinks,
    writeLink: writeLink,
    getDotSrc: getDotSrc,
    transform: transform
};
