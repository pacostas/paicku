import {Flags} from '@oclif/core'

export const globalFlags = {
  forceColor: Flags.boolean({
    description: 'Force color output',
    helpGroup: 'GLOBAL',
  }),
  noColor: Flags.boolean({
    description: 'Disable color output',
    helpGroup: 'GLOBAL',
  }),
  quiet: Flags.boolean({
    char: 'q',
    description: 'Show less output',
    helpGroup: 'GLOBAL',
  }),
  timestamps: Flags.boolean({
    description: 'Enable timestamps in output',
    helpGroup: 'GLOBAL',
  }),
  verbose: Flags.boolean({
    char: 'v',
    description: 'Show more output',
    helpGroup: 'GLOBAL',
  }),
}
