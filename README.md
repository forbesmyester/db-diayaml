# DiaYAML

Draw database diagrams using GraphViz / DOT from a very simple YAML file.

## Example JSON File

    {
        "person": { "name": null },
        "address": { "line1": null, "line2": null, "person": { "link": "person"} },
        "order": {
            "address": { "link": "address" }
        },
        "a": { "letter": { "link": "person.name" } },
        "b": { "something": null }
    }

## Example Output

![Output of above example](./bin/dbdiagram.png)

## Usage

    Output a GraphViz / Dot file from a simplified YAML file
  
    Usage
  
    --help            Print usage instructions
    --file <array>    The input file (there can be many, but only the first will be
                      read!)
    --json            Use a JSON file instead of the default YAML
  
  
    YAML Usage:
  
      node index.js dbdiagram.yml | dot -Gdpi=64 -Tpng:cairo:cairo > bin/dbdiagram.png && display.im6 bin/dbdiagram.png
  
    JSON Usage:
  
      node index.js --json test/dbdiagram.json | dot -Gdpi=64 -Tpng:cairo:cairo > bin/dbdiagram.png && display.im6 bin/dbdiagram.png

