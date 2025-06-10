import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {it as mochaIt} from 'mocha'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT_DIR = path.dirname(path.join(fileURLToPath(import.meta.url), '../../../..'))

const skip = process.platform === 'win32'
const it = skip ? mochaIt.skip : mochaIt

describe('build', () => {
  it('It should build a Nodejs app in docker', async () => {
    const imageName = `${crypto.randomUUID()}`

    const flargs = [
      'build',
      imageName,
      '--builder',
      'paketobuildpacks/builder-jammy-base',
      '--path',
      `${ROOT_DIR}/integration/testdata/nodejs_simple_app`,
      '--container-runtime',
      'docker',
    ].join(' ')

    const {error, stdout} = await runCommand(flargs)
    expect(error).to.be.undefined
    expect(stdout).to.contain(`Successfully built image '${imageName}'`)
  })

  it('It should build a Nodejs app in podman', async () => {
    const imageName = `${crypto.randomUUID()}`

    const flargs = [
      'build',
      imageName,
      '--builder',
      'paketobuildpacks/builder-jammy-base',
      '--path',
      `${ROOT_DIR}/integration/testdata/nodejs_simple_app`,
      '--container-runtime',
      'podman',
    ].join(' ')

    const {error, stdout} = await runCommand(flargs)
    expect(error).to.be.undefined
    expect(stdout).to.contain(`Successfully built image '${imageName}'`)
  })
})
