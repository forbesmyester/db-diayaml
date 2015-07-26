"use strict";

var expect = require('expect.js'),
    lib = require('../lib.js');

var sample1 = {
    person: { name: null },
    order: { owner: { link: "person" } },
    a: { letter: { link: "person.name" } },
    b: { something: null }
};


describe('lib', function() {
    it('can find findLinks', function() {
        expect(lib.findLinks(sample1)).to.eql(
            [
                ["order", "owner", "person", "id"],
                ["a", "letter", "person", "name"]
            ]
        );
    });

    it('can addLinkFields', function() {
        expect(lib.addLinkFields(sample1)).to.eql({
            person: { id: null, name: null },
            order: { owner: { link: "person" } },
            a: { letter: { link: "person.name" } },
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
    });

    it('can do a series of transforms', function() {
        expect(lib.transform.transform1({
            person: { name: null },
            b: { something: "person" }
        })).to.eql({
            person: { name: null },
            b: { something: { link: "person" } }
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
            '  structa:a__letter -> structperson:person__name',
            '}'
        ];

        expect(lib.getDotSrc(sample1)).to.eql(expected);

    });
});

