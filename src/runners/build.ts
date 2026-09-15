import {Interfaces} from '@oclif/core'
import {execa} from 'execa'
import os from 'node:os'
import path from 'node:path'

import {CONTAINER_RUNTIMES_IN_PRIORITY, DEFAULT_BUILDER_IMAGE} from '../constants/index.js'
import {buildFlags} from '../flargs/build.js'
import {Confirm, EnvsForRun, RunnerConsole, RunnerLogs} from '../types/index.js'
import {
  cloneRepo,
  configureContainerRuntime,
  filterByInstalledApps,
  hasRegistryPrefix,
  parseFlags,
  parseGitRemoteRepo,
  sortArrayBasedOnOrder,
} from '../utils/index.js'

export type BuildOptions = Partial<Interfaces.InferredFlags<typeof buildFlags>>

import process from 'node:process'

export interface BuildResult {
  command: string
  containerRuntime: string
  envsForRun: EnvsForRun
  imageName: string
  stdout: string[]
  warnings: string[]
}

type BuildRunnerOptions = {
  confirm: Confirm
  console: RunnerConsole
  cwd?: string
  env?: Record<string, string | undefined>
  logs?: RunnerLogs
}

export async function runBuild(
  imageName: string | undefined,
  options: BuildOptions,
  executablePath: string,
  runnerOptions: BuildRunnerOptions,
): Promise<BuildResult> {
  const {confirm, console, cwd, env: runnerEnv, logs = {error: [], log: [], warn: []}} = runnerOptions

  const arch = os.arch()
  const {env: processEnv, platform} = process
  const cacheDir = path.dirname(executablePath)
  const flags = {...options}

  if (flags['container-runtime']) {
    const availableContainerRuntimes = await filterByInstalledApps([flags['container-runtime']], platform)

    if (availableContainerRuntimes.length === 0) {
      console.error(`${flags['container-runtime']} is not installed.`)
    }
  } else {
    const availableContainerRuntimes = await filterByInstalledApps(CONTAINER_RUNTIMES_IN_PRIORITY, platform)

    if (availableContainerRuntimes.length === 0) {
      console.error('No available container runtime available in the system.')
    }

    const containerRuntimesInPriorityOrder = sortArrayBasedOnOrder(
      availableContainerRuntimes,
      CONTAINER_RUNTIMES_IN_PRIORITY,
    )

    flags['container-runtime'] = containerRuntimesInPriorityOrder[0]
    console.warn(`You haven't specified a container runtime, using the: ${flags['container-runtime']}`)
  }

  const containerRuntime = flags['container-runtime']

  // We delete the flag because this flag does not exit
  // on pack cli but only on paicku.
  delete flags['container-runtime']

  const packConfiguration = await configureContainerRuntime(
    containerRuntime,
    {
      arch,
      platform,
    },
    console,
    confirm,
  )

  const {envs, envsForRun} = packConfiguration

  let resolvedImageName = imageName

  if (!resolvedImageName) {
    resolvedImageName = `image-paicku-${crypto.randomUUID()}`
    console.warn(`You haven't specified an image name, using a random one: ${resolvedImageName}`)
  }

  if (!flags.builder) {
    flags.builder = DEFAULT_BUILDER_IMAGE
    console.warn(`You haven't specified a builder, using the default one: ${flags.builder}`)
  }

  if (!hasRegistryPrefix(flags.builder)) {
    console.error(`The builder "${flags.builder}" must be prefixed with a registry (e.g. "docker.io/" or "ghcr.io/").`)
  }

  const appPath = flags.path ?? '.'
  const {context, gitURL, isGitRemoteRepo} = parseGitRemoteRepo(appPath)
  if (isGitRemoteRepo) {
    const clonedAppDir = await cloneRepo(gitURL, cacheDir, console.log, console.error)
    flags.path = path.join(clonedAppDir, context)
  } else {
    flags.path = path.isAbsolute(appPath) ? path.normalize(appPath) : path.resolve(appPath)
  }

  const flagsArray = parseFlags(flags)

  console.log(`Building image ${resolvedImageName} with builder ${flags.builder}`)

  const packArgs = ['build', resolvedImageName, ...flagsArray, ...packConfiguration.flags]

  const execOptions = {
    cwd,
    env: {
      ...processEnv,
      ...envs,
      ...runnerEnv,
    },
  }

  const execaOptions = {
    ...execOptions,
    reject: false,
    stdio: ['inherit', 'pipe', 'pipe'] as const,
  }

  const subprocess = execa(executablePath, packArgs, execaOptions)

  if (subprocess.stdout) {
    subprocess.stdout.on('data', (chunk) => {
      console.log(chunk.toString().trimEnd())
    })
  }

  if (subprocess.stderr) {
    subprocess.stderr.on('data', (chunk) => {
      console.logToStderr(chunk.toString().trimEnd())
    })
  }

  const result = await subprocess

  if (result.failed) {
    console.error('Build failed.', {command: result.command, exit: result.exitCode ?? 1})
  }

  return {
    command: result.command,
    containerRuntime,
    envsForRun,
    imageName: resolvedImageName,
    stdout: logs.log,
    warnings: logs.warn,
  }
}
