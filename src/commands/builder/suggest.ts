import {Command, Flags} from '@oclif/core'

import {globalFlags} from '../../global/flags.js'
import {parseFlags, runPack} from '../../utils/index.js'

export default class BuilderSuggest extends Command {
  static aliases = ['builder:suggest', 'builders:suggest']

  static override args = {}

  static override description = 'Interact with builders'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  static override flags = {
    ...globalFlags,
    help: Flags.boolean({char: 'h', description: "Help for 'builder'"}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(BuilderSuggest)

    const flagsArray = parseFlags(flags)

    await runPack(
      ['builder', 'suggest', ...flagsArray],
      {error: this.error.bind(this), log: this.log.bind(this)},
      {},
      this.config.cacheDir,
    )
  }
}
