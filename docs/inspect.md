`paicku inspect`
================

Show information about a built app image

* [`paicku inspect IMAGENAME`](#paicku-inspect-imagename)

## `paicku inspect IMAGENAME`

Show information about a built app image

```
USAGE
  $ paicku inspect IMAGENAME [--forceColor] [--noColor] [-q] [--timestamps] [-v] [--bom] [-h] [-o
    json|yaml|toml|human-readable]

ARGUMENTS
  IMAGENAME  Name of the image to inspect

FLAGS
  -h, --help             Help for 'inspect'
  -o, --output=<option>  [default: human-readable] Output format to display builder detail.
                         <options: json|yaml|toml|human-readable>
      --bom              print bill of materials

GLOBAL FLAGS
  -q, --quiet       Show less output
  -v, --verbose     Show more output
      --forceColor  Force color output
      --noColor     Disable color output
      --timestamps  Enable timestamps in output

DESCRIPTION
  Show information about a built app image

ALIASES
  $ paicku inspect
  $ paicku inspect-image

EXAMPLES
  $ paicku inspect buildpacksio/pack
```

_See code: [src/commands/inspect/index.ts](https://github.com/nodeshift/nodeshift/blob/v0.0.3/src/commands/inspect/index.ts)_
