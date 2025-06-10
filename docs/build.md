`paicku build`
==============

Build an image

* [`paicku build [IMAGENAME]`](#paicku-build-imagename)

## `paicku build [IMAGENAME]`

Build an image

```
USAGE
  $ paicku build [IMAGENAME] [--forceColor] [--noColor] [-q] [--timestamps] [-v] [-B <value>] [-b
    <value>...] [-r <value>] [--cache <value>] [--cache-image <value>] [--clear-cache] [--container-runtime
    docker|podman] [--creation-time <value>] [-D <value>] [-d <value>] [--docker-host <value>] [-e <value>...]
    [--env-file <value>...] [--extension <value>...] [--gid <value>] [-h] [--interactive] [--lifecycle-image <value>]
    [--network <value>] [-p <value>] [--platform <value>] [--post-buildpack <value>...] [--pre-buildpack <value>...]
    [--previous-image <value>] [--publish] [--pull-policy <value>] [--report-output-dir <value>] [--run-image <value>]
    [--sbom-output-dir <value>] [--sparse] [-t <value>...] [--trust-builder] [--trust-extra-buildpacks] [--uid <value>]
    [--volume <value>...] [--workspace <value>]

ARGUMENTS
  IMAGENAME  Name of the output image

FLAGS
  -B, --builder=<value>
      Builder image

  -D, --default-process=<value>
      [default: web] Set the default process type

  -b, --buildpack=<value>...
      Buildpack to use. One of:
      a buildpack by id and version in the form of '<buildpack>@<version>',
      path to a buildpack directory (not supported on Windows),
      path/URL to a buildpack .tar or .tgz file, or
      a packaged buildpack image name in the form of '<hostname>/<repo>[:<tag>]'
      Repeat for each buildpack in order, or supply once by comma-separated list

  -d, --descriptor=<value>
      Path to the project descriptor file

  -e, --env=<value>...
      Build-time environment variable, in the form 'VAR=VALUE' or 'VAR'.
      When using latter value-less form, value will be taken from current
      environment at the time this command is executed.
      This flag may be specified multiple times and will override
      individual values defined by --env-file.
      Repeat for each env in order (comma-separated lists not accepted)
      NOTE: These are NOT available at image runtime.

  -h, --help
      Help for 'build'

  -p, --path=<value>
      [default: .] Path to app dir or zip-formatted file (defaults to current working directory)

  -r, --buildpack-registry=<value>
      Buildpack Registry by name.

  -t, --tag=<value>...
      Additional tags to push the output image to.
      Tags should be in the format 'image:tag' or 'repository/image:tag'.
      Repeat for each tag in order, or supply once by comma-separated list

  --cache=<value>
      Cache options used to define cache techniques for build process.
      - Cache as bind: 'type=<build/launch>;format=bind;source=<path to directory>'
      - Cache as image (requires --publish): 'type=<build/launch>;format=image;name=<registry image name>'
      - Cache as volume: 'type=<build/launch>;format=volume;[name=<volume name>]'
      - If no name is provided, a random name will be generated.
      (default type=build;format=volume;type=launch;format=volume;)

  --cache-image=<value>
      Cache build layers in remote registry. Requires --publish

  --clear-cache
      Clear image's associated cache before building

  --container-runtime=<option>
      Specify container runtime to build and push your image.
      <options: docker|podman>

  --creation-time=<value>
      Desired create time in the output image config. Accepted values are Unix timestamps (e.g., '1641013200'), or 'now'.
      Platform API version must be at least 0.9 to use this feature.

  --docker-host=<value>
      Address to docker daemon that will be exposed to the build container.
      If not set (or set to empty string) the standard socket location will be used.
      Special value 'inherit' may be used in which case DOCKER_HOST environment variable will be used.
      This option may set DOCKER_HOST environment variable for the build container if needed.

  --env-file=<value>...
      Build-time environment variables file
      One variable per line, of the form 'VAR=VALUE' or 'VAR'
      When using latter value-less form, value will be taken from current
      environment at the time this command is executed
      NOTE: These are NOT available at image runtime."

  --extension=<value>...
      Extension to use. One of:
      an extension by id and version in the form of '<extension>@<version>',
      path to an extension directory (not supported on Windows),
      path/URL to an extension .tar or .tgz file, or
      a packaged extension image name in the form of '<hostname>/<repo>[:<tag>]'
      Repeat for each extension in order, or supply once by comma-separated list

  --gid=<value>
      Override GID of user's group in the stack's build and run images. The provided value must be a positive number

  --interactive
      Launch a terminal UI to depict the build process

  --lifecycle-image=<value>
      Custom lifecycle image to use for analysis, restore, and export when builder is untrusted.

  --network=<value>
      Connect detect and build containers to network

  --platform=<value>
      Platform to build on (e.g., "linux/amd64").

  --post-buildpack=<value>...
      Buildpacks to append to the groups in the builder's order

  --pre-buildpack=<value>...
      Buildpacks to prepend to the groups in the builder's order

  --previous-image=<value>
      Set previous image to a particular tag reference, digest reference, or (when performing a daemon build) image ID

  --publish
      Publish the application image directly to the container registry specified in <image-name>, instead of the daemon.
      The run image must also reside in the registry.

  --pull-policy=<value>
      [default: always] Pull policy to use. Accepted values are always, never, and if-not-present.

  --report-output-dir=<value>
      Path to export build report.toml.
      Omitting the flag yield no report file.

  --run-image=<value>
      Run image (defaults to default stack's run image)
      Omitting the flag will yield no SBoM content.

  --sbom-output-dir=<value>
      Path to export SBoM contents.

  --sparse
      Use this flag to avoid saving on disk the run-image layers when the application image is exported to OCI layout
      format

  --trust-builder
      Trust the provided builder.
      All lifecycle phases will be run in a single container.
      For more on trusted builders, and when to trust or untrust a builder, check out our docs here:
      https://buildpacks.io/docs/tools/pack/concepts/trusted_builders

  --trust-extra-buildpacks
      Trust buildpacks that are provided in addition to the buildpacks on the builder

  --uid=<value>
      Override UID of user in the stack's build and run images. The provided value must be a positive number

  --volume=<value>...
      Mount host volume into the build container, in the form '<host path>:<target path>[:<options>]'.
      - 'host path': Name of the volume or absolute directory path to mount.
      - 'target path': The path where the file or directory is available in the container.
      - 'options' (default "ro"): An optional comma separated list of mount options.
      - "ro", volume contents are read-only.
      - "rw", volume contents are readable and writeable.
      - "volume-opt=<key>=<value>", can be specified more than once, takes a key-value pair consisting of the option name
      and its value.
      Repeat for each volume in order (comma-separated lists not accepted)

  --workspace=<value>
      Location at which to mount the app dir in the build image

GLOBAL FLAGS
  -q, --quiet       Show less output
  -v, --verbose     Show more output
      --forceColor  Force color output
      --noColor     Disable color output
      --timestamps  Enable timestamps in output

DESCRIPTION
  Build an image

EXAMPLES
  Build an app with a random image-name and default builder

    $ paicku build

  Build and app with a specific image-name and builder

    $ paicku build image-name --builder builder-ubi8-base

  Build an app from a remote git repository with specifying a sub-directory.

    $ paicku build backend-image-name  --path https://github.com/nodeshift/mern-workshop --context-dir backend

  Build an app with a specific image-name and builder with a specific local path

    $ paicku build image-name --builder builder-ubi8-base --path /path/to/app
```

_See code: [src/commands/build/index.ts](https://github.com/nodeshift/nodeshift/blob/v0.0.1/src/commands/build/index.ts)_
