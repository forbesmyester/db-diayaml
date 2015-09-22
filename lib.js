"use strict";

var R = require('require-parts')('ramda', 'src', ["partial", "map", "sort", "keys", "mapObjIndexed", "concat", "values", "assocPath", "reduce", "slice", "path", "defaultTo", "join", "flatten", "pipe", "flip"]);

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
            var l, links, current = [];
            links = R.defaultTo([], R.path(['links'], field));
            R.map(function(link) {
                l = link.target.split(".");
                if (l.length < 2) {
                    l.push("id");
                }
                current = R.concat([tablename, fieldname], l);
                if (link.hasOwnProperty('diaprops')) {
                    current.push(link.diaprops);
                }
                r.push(current);
            }, links);
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

    function asLineProp(v, k) {
        return k + '=' + v;
    }

    function sorter(a, b) {
        if (a < b) { return -1; }
        return 1;
    }

    var propsStr = '';
    if (linkSpec[4]) {
        propsStr = R.pipe(
            R.mapObjIndexed(asLineProp),
            R.values,
            R.sort(sorter),
            R.join(', '),
            R.concat(' ['),
            R.flip(R.concat)("]")
        )(linkSpec[4]);
    }
    return R.join(' -> ', [
        R.join(':', ['struct' + linkSpec[0], linkSpec[0] + '__' + linkSpec[1]]),
        R.join(':', ['struct' + linkSpec[2], linkSpec[2] + '__' + linkSpec[3]])
    ]) + propsStr;
}

function getDotSrc(struct) {
    var finalStruct = addLinkFields(struct);
    var inner = R.map(function(s) { return "  " + s; }, R.flatten([
        R.values(R.mapObjIndexed(writeTable, finalStruct)),
        R.map(writeLink, findLinks(finalStruct))
    ]));
    // inner.unshift('nodesep = 1;');
    return R.flatten(['digraph db {', inner, '}']);
}

function transform1(struct) {
    return R.mapObjIndexed(function(table) {
        return R.mapObjIndexed(function(field) {
            if (typeof field == 'string') {
                return { links: field.split(/, */g) };
            }
            return field;
        }, table);
    }, struct);
}

function transform2(struct) {

    function getNewVal(link) {
            if (typeof link == 'string') {
                return { target: link };
            }
            return link;
    }

    return R.mapObjIndexed(function(table) {
        return R.mapObjIndexed(function(field) {
            if (field === null) { return null; }
            var r = R.assocPath(
                ['links'],
                R.map(
                    getNewVal,
                    R.defaultTo([], R.path(['links'], field))
                ),
                field
            );
            if (field.hasOwnProperty('link')) {
                if (!r.links) { r.links = []; }
                r.links.push(getNewVal(r.link));
                delete r.link;
            }
            return r;
        }, table);
    }, struct);
}

function transform(struct) {
    return transform2(transform1(struct));
}

transform.transform1 = transform1;
transform.transform2 = transform2;

module.exports = {
    writeTable: writeTable,
    addLinkFields: addLinkFields,
    findLinks: findLinks,
    writeLink: writeLink,
    getDotSrc: getDotSrc,
    transform: transform
};
