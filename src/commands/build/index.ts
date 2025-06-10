import {Args, Command, Flags} from '@oclif/core'
import os from 'node:os'
import path from 'node:path'

import {CONTAINER_RUNTIMES_IN_PRIORITY} from '../../constants/index.js'
import {globalFlags} from '../../global/flags.js'
import {
  cloneRepo,
  configureContainerRuntime,
  filterByInstalledApps,
  parseFlags,
  parseGitRemoteRepo,
  runPack,
  sortArrayBasedOnOrder,
} from '../../utils/index.js'

export default class Build extends Command {
  static args = {
    imageName: Args.string({description: 'Name of the output image', required: false}),
  }

  static description = 'Build an image'

  static examples = [
    {
      command: `<%= config.bin %> <%= command.id %>`,
      description: 'Build an app with a random image-name and default builder',
    },
    {
      command: `<%= config.bin %> <%= command.id %> image-name --builder builder-ubi8-base`,
      description: 'Build and app with a specific image-name and builder',
    },
    {
      command: `<%= config.bin %> <%= command.id %> backend-image-name  --path https://github.com/nodeshift/mern-workshop --context-dir backend`,
      description: 'Build an app from a remote git repository with specifying a sub-directory.',
    },
    {
      command: `<%= config.bin %> <%= command.id %> image-name --builder builder-ubi8-base --path /path/to/app`,
      description: 'Build an app with a specific image-name and builder with a specific local path',
    },
  ]

  static flags = {
    ...globalFlags,
    builder: Flags.string({char: 'B', description: 'Builder image', required: false}),
    buildpack: Flags.string({
      char: 'b',
      description: `Buildpack to use. One of:
      a buildpack by id and version in the form of '<buildpack>@<version>',
      path to a buildpack directory (not supported on Windows),
      path/URL to a buildpack .tar or .tgz file, or
      a packaged buildpack image name in the form of '<hostname>/<repo>[:<tag>]'
      Repeat for each buildpack in order, or supply once by comma-separated list`,
      multiple: true,
    }),
    'buildpack-registry': Flags.string({
      char: 'r',
      description: 'Buildpack Registry by name.',
    }),
    cache: Flags.string({
      description: `Cache options used to define cache techniques for build process.
      - Cache as bind: 'type=<build/launch>;format=bind;source=<path to directory>'
      - Cache as image (requires --publish): 'type=<build/launch>;format=image;name=<registry image name>'
      - Cache as volume: 'type=<build/launch>;format=volume;[name=<volume name>]'
          - If no name is provided, a random name will be generated.
      (default type=build;format=volume;type=launch;format=volume;)`,
    }),
    'cache-image': Flags.string({
      description: 'Cache build layers in remote registry. Requires --publish',
    }),
    'clear-cache': Flags.boolean({
      description: "Clear image's associated cache before building",
    }),
    'container-runtime': Flags.string({
      description: 'Specify container runtime to build and push your image.',
      options: CONTAINER_RUNTIMES_IN_PRIORITY,
    }),
    'creation-time': Flags.string({
      description: `Desired create time in the output image config. Accepted values are Unix timestamps (e.g., '1641013200'), or 'now'. Platform API version must be at least 0.9 to use this feature.`,
    }),
    'default-process': Flags.string({
      char: 'D',
      default: 'web',
      description: 'Set the default process type',
    }),
    descriptor: Flags.string({
      char: 'd',
      description: 'Path to the project descriptor file',
    }),
    'docker-host': Flags.string({
      description: `Address to docker daemon that will be exposed to the build container.
       If not set (or set to empty string) the standard socket location will be used.
       Special value 'inherit' may be used in which case DOCKER_HOST environment variable will be used.
       This option may set DOCKER_HOST environment variable for the build container if needed.`,
    }),
    env: Flags.string({
      char: 'e',
      description: `Build-time environment variable, in the form 'VAR=VALUE' or 'VAR'.
      When using latter value-less form, value will be taken from current
        environment at the time this command is executed.
      This flag may be specified multiple times and will override
        individual values defined by --env-file.
      Repeat for each env in order (comma-separated lists not accepted)
      NOTE: These are NOT available at image runtime.`,
      multiple: true,
    }),
    'env-file': Flags.string({
      description: `Build-time environment variables file
      One variable per line, of the form 'VAR=VALUE' or 'VAR'
      When using latter value-less form, value will be taken from current
        environment at the time this command is executed
      NOTE: These are NOT available at image runtime."`,
      multiple: true,
    }),
    extension: Flags.string({
      description: ` Extension to use. One of:
        an extension by id and version in the form of '<extension>@<version>',
        path to an extension directory (not supported on Windows),
        path/URL to an extension .tar or .tgz file, or
        a packaged extension image name in the form of '<hostname>/<repo>[:<tag>]'
      Repeat for each extension in order, or supply once by comma-separated list`,
      multiple: true,
    }),
    gid: Flags.integer({
      description: `Override GID of user's group in the stack's build and run images. The provided value must be a positive number`,
    }),
    help: Flags.boolean({char: 'h', description: "Help for 'build'"}),
    interactive: Flags.boolean({description: 'Launch a terminal UI to depict the build process'}),
    'lifecycle-image': Flags.string({
      description: 'Custom lifecycle image to use for analysis, restore, and export when builder is untrusted.',
    }),
    network: Flags.string({
      description: 'Connect detect and build containers to network',
    }),
    path: Flags.string({
      char: 'p',
      default: '.',
      description: 'Path to app dir or zip-formatted file (defaults to current working directory)',
    }),
    platform: Flags.string({
      description: 'Platform to build on (e.g., "linux/amd64").',
    }),
    'post-buildpack': Flags.string({
      description: `Buildpacks to append to the groups in the builder's order`,
      multiple: true,
    }),
    'pre-buildpack': Flags.string({
      description: "Buildpacks to prepend to the groups in the builder's order",
      multiple: true,
    }),
    'previous-image': Flags.string({
      description:
        'Set previous image to a particular tag reference, digest reference, or (when performing a daemon build) image ID',
    }),
    publish: Flags.boolean({
      description:
        'Publish the application image directly to the container registry specified in <image-name>, instead of the daemon. The run image must also reside in the registry.',
    }),
    'pull-policy': Flags.string({
      default: 'always',
      description: 'Pull policy to use. Accepted values are always, never, and if-not-present.',
    }),
    'report-output-dir': Flags.string({
      description: `Path to export build report.toml.
      Omitting the flag yield no report file.`,
    }),
    'run-image': Flags.string({
      description: `Run image (defaults to default stack's run image)
      Omitting the flag will yield no SBoM content.`,
    }),
    'sbom-output-dir': Flags.string({
      description: 'Path to export SBoM contents.',
    }),
    sparse: Flags.boolean({
      description: `Use this flag to avoid saving on disk the run-image layers when the application image is exported to OCI layout format`,
    }),
    tag: Flags.string({
      char: 't',
      description: `Additional tags to push the output image to.
      Tags should be in the format 'image:tag' or 'repository/image:tag'.
      Repeat for each tag in order, or supply once by comma-separated list`,
      multiple: true,
    }),
    'trust-builder': Flags.boolean({
      description: `Trust the provided builder.
      All lifecycle phases will be run in a single container.
      For more on trusted builders, and when to trust or untrust a builder, check out our docs here: https://buildpacks.io/docs/tools/pack/concepts/trusted_builders`,
    }),
    'trust-extra-buildpacks': Flags.boolean({
      description: `Trust buildpacks that are provided in addition to the buildpacks on the builder`,
    }),
    uid: Flags.integer({
      description: `Override UID of user in the stack's build and run images. The provided value must be a positive number`,
    }),
    volume: Flags.string({
      description: `Mount host volume into the build container, in the form '<host path>:<target path>[:<options>]'.
      - 'host path': Name of the volume or absolute directory path to mount.
      - 'target path': The path where the file or directory is available in the container.
      - 'options' (default "ro"): An optional comma separated list of mount options.
          - "ro", volume contents are read-only.
          - "rw", volume contents are readable and writeable.
          - "volume-opt=<key>=<value>", can be specified more than once, takes a key-value pair consisting of the option name and its value.
      Repeat for each volume in order (comma-separated lists not accepted)
`,
      multiple: true,
    }),
    workspace: Flags.string({
      description: 'Location at which to mount the app dir in the build image',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Build)
    let envs = {}

    const arch = os.arch()
    const {platform} = process

    if (flags['container-runtime']) {
      const availableContainerRuntimes = await filterByInstalledApps([flags['container-runtime']], platform)

      if (availableContainerRuntimes.length === 0) {
        this.error(`${flags['container-runtime']} is not install.`)
      }
    } else {
      const availableContainerRuntimes = await filterByInstalledApps(CONTAINER_RUNTIMES_IN_PRIORITY, platform)

      if (availableContainerRuntimes.length === 0) {
        this.error('No available container runtime available in the system.')
      }

      // Sort the array based on the priority order
      const containerRuntimesInPriorityOrder = sortArrayBasedOnOrder(
        availableContainerRuntimes,
        CONTAINER_RUNTIMES_IN_PRIORITY,
      )

      flags['container-runtime'] = containerRuntimesInPriorityOrder[0]
      this.warn(`You haven't specified a container runtime, using the: ${flags['container-runtime']}`)
    }

    const containerRuntime = flags['container-runtime']

    // We delete the flag because this flag does not exit
    // on pack cli but only on paicku.
    delete flags['container-runtime']

    // Validate container runtime is up and running
    const packConfiguration = await configureContainerRuntime(
      containerRuntime,
      {
        arch,
        platform,
      },
      {
        error: this.error.bind(this),
        log: this.log.bind(this),
      },
    )
    envs = packConfiguration.envs

    if (!args.imageName) {
      args.imageName = `image-paicku-${crypto.randomUUID()}`
      this.warn(`You havent specified an image name, using a random one: ${args.imageName}`)
    }

    if (!flags.builder) {
      flags.builder = 'paketocommunity/builder-ubi8-base'
      this.warn(`You haven't specified a builder, using the default one: ${flags.builder}`)
    }

    const {context, gitURL, isGitRemoteRepo} = await parseGitRemoteRepo(flags.path)
    if (isGitRemoteRepo) {
      const clonedAppDir = await cloneRepo(gitURL, this.config.cacheDir, this.log.bind(this), this.error.bind(this))
      flags.path = path.join(clonedAppDir, context)
    }

    const flagsArray = parseFlags(flags)

    this.log(`Building image ${args.imageName} with builder ${flags.builder}`)

    await runPack(
      ['build', args.imageName, ...flagsArray, ...packConfiguration.flags],
      {error: this.error.bind(this), log: this.log.bind(this)},
      envs,
      this.config.cacheDir,
    )
  }
}
