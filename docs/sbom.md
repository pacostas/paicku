`paicku sbom`
=============

Interact with SBoM

* [`paicku sbom download IMAGENAME`](#paicku-sbom-download-imagename)

## `paicku sbom download IMAGENAME`

Interact with SBoM

```
USAGE
  $ paicku sbom download IMAGENAME [--forceColor] [--noColor] [-q] [--timestamps] [-v] [-h] [-o <value>] [--remote
    <value>]

ARGUMENTS
  IMAGENAME  Download SBoM from specified image

FLAGS
  -h, --help                Help for 'download'
  -o, --output-dir=<value>  [default: .] Path to export SBoM contents.
      --remote=<value>      Download SBoM of image in remote registry (without pulling image)

GLOBAL FLAGS
  -q, --quiet       Show less output
  -v, --verbose     Show more output
      --forceColor  Force color output
      --noColor     Disable color output
      --timestamps  Enable timestamps in output

DESCRIPTION
  Interact with SBoM

EXAMPLES
  $ paicku sbom download buildpacksio/pack
```

_See code: [src/commands/sbom/download.ts](https://github.com/nodeshift/nodeshift/blob/v0.0.3/src/commands/sbom/download.ts)_
