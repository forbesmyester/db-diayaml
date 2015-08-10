"use strict";

var expect = require('expect.js'),
    lib = require('../lib.js');

var sample1 = {
    person: { name: null },
    order: { owner: { link: { target: "person" } } },
    a: { letter: { link: { target: "person.name", diaprops: { color: "red" } } } },
    b: { something: null }
};


describe('lib', function() {
    it('can findLinks', function() {
        expect(lib.findLinks(sample1)).to.eql(
            [
                ["order", "owner", "person", "id"],
                ["a", "letter", "person", "name", { color: "red" }]
            ]
        );
    });

    it('can addLinkFields', function() {
        expect(lib.addLinkFields(sample1)).to.eql({
            person: { id: null, name: null },
            order: { owner: { link: { target: "person" } } },
            a: { letter: { link: { target: "person.name", diaprops: { color: "red" } } } },
            b: { something: null }
        });
    });

    it('can writeTable', function() {
        var s = lib.addLinkFields(sample1);
        expect(lib.writeTable(s.person, 'person')).to.eql([
            'subgraph clusterperson {',
            '  label = "person";',
            '  structperson [label="{<person__id>id|<person__name>name}",shape=record];',
            '}'
        ]);
    });

    it('can writeLink', function() {
        expect(lib.writeLink(["order", "owner", "person", "id"])).to.eql(
            'structorder:order__owner -> structperson:person__id'
        );
        expect(lib.writeLink(["order", "owner", "person", "id", {style: 'dashed', color: 'red'}])).to.eql(
            'structorder:order__owner -> structperson:person__id [color=red, style=dashed]'
        );
    });

    it('transform1 will add a link field if just plain text', function() {

        expect(lib.transform.transform1({
            person: { name: null },
            b: { something: "person" }
        })).to.eql({
            person: { name: null },
            b: { something: { link: "person" } }
        });

    });

    it('transform1 will not corrupt data if its already complete', function() {

        expect(lib.transform.transform1({
            person: { name: null },
            b: { something: { link: { target: "person" } } }
        })).to.eql({
            person: { name: null },
            b: { something: { link: { target: "person" } } }
        });

        expect(lib.transform.transform1({
            person: { name: null },
            b: { something: { link: "person" } }
        })).to.eql({
            person: { name: null },
            b: { something: { link: "person" } }
        });

    });

    it('transform2 will add fuller link structure', function() {

        expect(lib.transform.transform2({
            person: { name: null },
            b: { something: { link: "person" } }
        })).to.eql({
            person: { name: null },
            b: { something: { link: { target: "person" } } }
        });
    });

    it('transform2 will not corrupt data if its already complete', function() {

        expect(lib.transform.transform2({
            person: { name: null },
            b: { something: { link: { target: "person" } } }
        })).to.eql({
            person: { name: null },
            b: { something: { link: { target: "person" } } }
        });

    });

    it('can writeDatabase', function() {
        var expected = [
            'digraph db {',
            '  subgraph clusterperson {',
            '    label = "person";',
            '    structperson [label="{<person__id>id|<person__name>name}",shape=record];',
            '  }',
            '  subgraph clusterorder {',
            '    label = "order";',
            '    structorder [label="{<order__owner>owner}",shape=record];',
            '  }',
            '  subgraph clustera {',
            '    label = "a";',
            '    structa [label="{<a__letter>letter}",shape=record];',
            '  }',
            '  subgraph clusterb {',
            '    label = "b";',
            '    structb [label="{<b__something>something}",shape=record];',
            '  }',
            '  structorder:order__owner -> structperson:person__id',
            '  structa:a__letter -> structperson:person__name [color=red]',
            '}'
        ];

        expect(lib.getDotSrc(sample1)).to.eql(expected);

    });
});

