import {Args, Command, Flags} from '@oclif/core'

import {globalFlags} from '../../global/flags.js'
import {parseFlags, runPack} from '../../utils/index.js'

export default class Inspect extends Command {
  static aliases = ['inspect', 'inspect-image']

  static override args = {
    imageName: Args.string({description: 'Name of the image to inspect', required: true}),
  }

  static override description = 'Show information about a built app image'

  static override examples = ['<%= config.bin %> <%= command.id %> buildpacksio/pack']

  static override flags = {
    ...globalFlags,
    bom: Flags.boolean({description: 'print bill of materials'}),
    help: Flags.boolean({char: 'h', description: "Help for 'inspect'"}),
    output: Flags.string({
      char: 'o',
      default: 'human-readable',
      description: `Output format to display builder detail.`,
      options: ['json', 'yaml', 'toml', 'human-readable'],
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Inspect)

    const flagsArray = parseFlags(flags)

    await runPack(
      ['inspect', args.imageName, ...flagsArray],
      {error: this.error.bind(this), log: this.log.bind(this)},
      {},
      this.config.cacheDir,
    )
  }
}
