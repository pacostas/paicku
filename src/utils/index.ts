import {lookpath} from 'lookpath'
import {execFileSync, spawn} from 'node:child_process'
import {existsSync, lstatSync, mkdirSync, mkdtempSync} from 'node:fs'
import path, {join} from 'node:path'
import url from 'node:url'

import {CLONED_REPOS_TMP_DIRNAME} from '../constants/index.js'
import {Envs, Flags} from '../types/index.js'

export function getPackUrl(platform: string, arch: string, packVersion: string) {
  const packNamingConvention = getPackNamingConvention(arch, platform)

  const compression = platform === 'win32' ? 'zip' : 'tgz'

  const GITHUB_BASE_URL = process.env.PAICKU_GITHUB_BASE_URL || 'https://github.com'
  return [
    GITHUB_BASE_URL,
    'buildpacks',
    'pack',
    'releases',
    'download',
    `v${packVersion}`,
    `pack-v${packVersion}-${packNamingConvention}.${compression}`,
  ].join('/')
}

export function getPackNamingConvention(arch: string, platform: string): string {
  if (platform === 'linux') {
    switch (arch) {
      case 'arm64': {
        return 'linux-arm64'
      }
      // by default we set it to ppc64le

      case 'ppc64': {
        return 'linux-ppc64le'
      }

      case 's390x': {
        return 'linux-s390x'
      }

      case 'x64': {
        return 'linux'
      }

      default: {
        throw new Error(`Unsupported architecture: ${arch} for ${platform}`)
      }
    }
  }

  if (platform === 'darwin') {
    if (arch === 'x64') {
      return 'macos'
    }

    if (arch === 'arm64') {
      return 'macos-arm64'
    }

    throw new Error(`Unsupported architecture: ${arch} for darwin`)
  }

  if (platform === 'win32') {
    if (arch === 'x64') {
      return 'windows'
    }

    throw new Error(`Unsupported architecture: ${arch} for windows`)
  }

  throw new Error(`Unsupported platform/architecture: ${platform}/${arch}`)
}

export async function runPack(
  flargs: string[],
  console: {
    error: (message: string, options?: {exit: number}) => void
    log: (message: string) => void
  },
  envs: Envs,
  cacheDir: string,
): Promise<void> {
  const packBinFilepath = path.join(cacheDir, 'pack')

  for (const [key, value] of Object.entries(envs)) {
    process.env[key] = value
  }

  const bin = spawn(packBinFilepath, flargs)

  for await (const chunk of bin.stdout) {
    console.log(chunk.toString())
  }

  let errorChunks = ''
  for await (const errorChunk of bin.stderr) {
    errorChunks += errorChunk
  }

  const exitCode = await new Promise<number>((resolve) => {
    bin.on('close', resolve)
  })

  if (exitCode) {
    console.error(errorChunks.toString(), {exit: Number(exitCode)})
  }
}

export function parseFlags(flags: Flags): string[] {
  // iterate over the flags and add them to an array
  const flagsArray: string[] = []

  for (const [key, value] of Object.entries(flags)) {
    if (typeof value === 'boolean' && value === true) {
      flagsArray.push(`--${key}`)
    } else {
      flagsArray.push(`--${key}`, value.toString())
    }
  }

  return flagsArray
}

export async function parseGitRemoteRepo(
  path: string,
): Promise<{context: string; gitURL: string; isGitRemoteRepo: boolean}> {
  // If is a URL extract the context
  const [urlOrPath, context = '.'] = path.split(/:(?!\/\/)/)
  const url = parseURL(urlOrPath)
  if (url) {
    try {
      // Validate is a git repository
      execFileSync('git', ['ls-remote', '--heads', urlOrPath, 'HEAD'])
      return {context, gitURL: url.href, isGitRemoteRepo: true}
    } catch (error) {
      if (error instanceof Error) {
        throw new TypeError(error.message)
      }

      throw new Error('The provided URL is not a git repository')
    }
  }

  let isDir
  try {
    isDir = lstatSync(urlOrPath).isDirectory()
  } catch {
    isDir = false
  }

  // If is not a directory, is a tar or a tgz file, or an invalid path
  // In that case we let pack throw the error
  if (!isDir) {
    return {context, gitURL: '', isGitRemoteRepo: false}
  }

  // We want to validate if the directory is a local repository or a local remote repository
  const remotes = execFileSync('git', ['-C', urlOrPath, 'remote', '-v'])

  // Heuristic way:
  // If it has at least one remote 99.9% is a local repository
  if (remotes.length > 0) {
    return {context: '', gitURL: '', isGitRemoteRepo: false}
  }

  // Otherwise is a local remote repository
  return {context, gitURL: urlOrPath, isGitRemoteRepo: true}
}

export function gitIsInstalled(): boolean {
  try {
    execFileSync('git', ['--version'])
    return true
  } catch {
    return false
  }
}

export async function cloneRepo(
  remoteURL: string,
  cacheDir: string,
  log: (message: string) => void,
  errorLog: (message: string, options?: {exit: number}) => void,
): Promise<string> {
  if (!gitIsInstalled()) {
    errorLog('Git is not installed in the system, please install it to clone a remote repository')
  }

  const clonedReposDirPath = join(cacheDir, CLONED_REPOS_TMP_DIRNAME)

  try {
    if (!existsSync(clonedReposDirPath)) {
      mkdirSync(clonedReposDirPath)
    }
  } catch {
    errorLog('Error creating directory in cache', {exit: Number(1)})
  }

  const repoName = path.basename(remoteURL, '.git')

  let clonedRepoPath = ''
  try {
    clonedRepoPath = mkdtempSync(join(clonedReposDirPath, `${repoName}-`))
  } catch {
    errorLog('Error creating temporary directory dir in cache', {exit: Number(1)})
  }

  const bin = spawn('git', ['clone', '--depth', '1', remoteURL, clonedRepoPath])

  log(`Cloning the repository... into ${clonedRepoPath}`)

  let errorChunks = ''
  for await (const errorChunk of bin.stderr) {
    errorChunks += errorChunk
  }

  const exitCode = await new Promise<number>((resolve) => {
    bin.on('close', resolve)
  })

  if (exitCode) {
    errorLog(errorChunks.toString(), {exit: Number(exitCode)})
  }

  log('Repository cloned successfully')
  return clonedRepoPath
}

export function parseURL(url: string): URL | null {
  try {
    const parsedURL = new URL(url)
    return parsedURL
  } catch {
    return null
  }
}

export async function filterByInstalledApps(apps: string[], platform: string): Promise<string[]> {
  switch (platform) {
    case 'linux':
    case 'darwin': {
      try {
        const result = await Promise.all(
          apps.map(async (app) => {
            const appExist = await lookpath(app)
            return appExist ? app : null
          }),
        ).then((results) => results.filter((app) => app !== null))
        return result
      } catch {
        return []
      }
    }

    case 'win32': {
      execFileSync('where', apps)
      break
    }
  }

  return []
}

export function sortArrayBasedOnOrder(array: string[], order: string[]): string[] {
  return array.sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

// eslint-disable-next-line complexity
export async function configureContainerRuntime(
  containerRuntime: string,
  target: {arch: string; platform: string},
  console: {
    error: (message: string, options?: {exit: number}) => void
    log: (message: string) => void
  },
): Promise<{envs: Envs; flags: string[]}> {
  if (containerRuntime === 'podman' && target.platform === 'darwin' && target.arch === 'arm64') {
    return configurePodmanOnDarwinArm64(console)
  }

  if (containerRuntime === 'podman' && target.platform === 'darwin' && target.arch === 'x64') {
    // We use the same configuration for both darwin arm64 and x64
    return configurePodmanOnDarwinArm64(console)
  }

  if (containerRuntime === 'docker' && target.platform === 'darwin' && target.arch === 'arm64') {
    return configureDockerOnDarwinArm64()
  }

  if (containerRuntime === 'docker' && target.platform === 'darwin' && target.arch === 'x64') {
    // we use the same configuration for both darwin arm64 and x64
    return configureDockerOnDarwinArm64()
  }

  if (containerRuntime === 'docker' && target.platform === 'linux' && target.arch === 'x64') {
    return configureDockerOnLinuxAmd64()
  }

  if (containerRuntime === 'podman' && target.platform === 'linux' && target.arch === 'x64') {
    return configurePodmanOnLinuxAmd64()
  }

  if (containerRuntime === 'docker' && target.platform === 'linux' && target.arch === 'arm64') {
    // we use the same configuration for both linux arm64 and x64
    return configureDockerOnLinuxAmd64()
  }

  if (containerRuntime === 'podman' && target.platform === 'linux' && target.arch === 'arm64') {
    // we use the same configuration for both linux arm64 and x64
    return configurePodmanOnLinuxAmd64()
  }

  console.error(`Building apps with paicku on ${target.platform} ${target.arch} is not yet supported`)
  return {envs: {}, flags: []}
}

async function configurePodmanOnLinuxAmd64(): Promise<{envs: Envs; flags: string[]}> {
  const podmandInfo = execFileSync('podman', ['info', '-f', '{{.Host.RemoteSocket.Path}}'], {
    encoding: 'utf8',
  })

  execFileSync('systemctl', ['--user', 'start', 'podman.socket'], {encoding: 'utf8'})

  return {
    envs: {DOCKER_HOST: `unix://${podmandInfo.trim()}`},
    flags: ['--docker-host', 'inherit'],
  }
}

async function configureDockerOnLinuxAmd64(): Promise<{envs: Envs; flags: string[]}> {
  return {envs: {}, flags: []}
}

async function configureDockerOnDarwinArm64(): Promise<{envs: Envs; flags: string[]}> {
  return {envs: {}, flags: []}
}

async function configurePodmanOnDarwinArm64(console: {
  error: (message: string, options?: {exit: number}) => void
  log: (message: string) => void
}): Promise<{envs: Envs; flags: string[]}> {
  const podmandSystemConnectionLsCommand = execFileSync(
    'podman',
    ['system', 'connection', 'ls', '--format="{{.URI}} {{.Identity}}"'],
    {
      encoding: 'utf8',
    },
  )

  const listPodmanConnections = podmandSystemConnectionLsCommand
    .split('\n')
    .map((line) => line.slice(1, -1))
    .find((line) => line.includes('root'))

  if (!listPodmanConnections) {
    console.error('Failed configuring podman')
    return {envs: {}, flags: []}
  }

  const podmanMachineUri = url.parse(listPodmanConnections.split(' ')[0])
  const identity = listPodmanConnections.split(' ')[1]

  if (
    !podmanMachineUri ||
    !identity ||
    !podmanMachineUri.protocol ||
    !podmanMachineUri.host ||
    !podmanMachineUri.auth
  ) {
    console.error('Failed configuring podman')
    return {envs: {}, flags: []}
  }

  execFileSync('ssh-add', ['-k', identity])

  // We check on the known_hosts file if the host is already there
  // if not we fall to the catch block and we add it through ssh command.
  try {
    execFileSync('ssh-keygen', ['-F', `[${podmanMachineUri.hostname}]:${podmanMachineUri.port}`])
  } catch {
    const podmanMachineBaseUri = `${podmanMachineUri.protocol}//${podmanMachineUri.auth}@${podmanMachineUri.host}`

    const sshBin = spawn('ssh', ['-i', identity, podmanMachineBaseUri, '-o', 'StrictHostKeyChecking=no', 'exit'])

    for await (const chunk of sshBin.stdout) {
      console.log(chunk.toString())
    }

    let errorChunks = ''
    for await (const errorChunk of sshBin.stderr) {
      errorChunks += errorChunk
    }

    const exitCode = await new Promise<number>((resolve) => {
      sshBin.on('close', resolve)
    })

    if (exitCode) {
      console.error(errorChunks.toString())
      return {envs: {}, flags: []}
    }
  }

  return {
    envs: {DOCKER_HOST: podmanMachineUri.href},
    flags: ['--docker-host', 'inherit'],
  }
}
