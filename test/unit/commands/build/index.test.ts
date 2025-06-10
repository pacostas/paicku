import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as chai from 'chai'
import {mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import * as path from 'node:path'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import ghServer from './../../../mocks/githubServer/server'

chai.config.truncateThreshold = 0

const ROOT_DIR = path.dirname(path.join(fileURLToPath(import.meta.url), '../../../..'))

describe('build', () => {
  let tempDir: string

  before(() => {
    ghServer.listen(3003, () => {})
  })

  after((done) => {
    ghServer.close(done)
  })

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'paicku-test-'))
    process.env.PAICKU_CACHE_DIR = tempDir
    process.env.PAICKU_GITHUB_BASE_URL = 'http://localhost:3003'
    process.env.PAICKU_PACK_VERSION = '0.0.1'
  })

  afterEach(async () => {
    await rm(tempDir, {force: true, recursive: true})
  })

  it('with path and builder', async () => {
    const {error, stdout} = await runCommand('build imagename --builder builder-ubi --path p/a/t/h')
    expect(error).to.be.undefined
    expect(stdout).to.include('Building image imagename with builder builder-ubi')
    expect(stdout).to.include('build imagename --builder builder-ubi')
  })

  it('only with imagename', async () => {
    const {error, stdout} = await runCommand('build imagename')
    expect(error).to.be.undefined
    expect(stdout).to.include('Building image imagename with builder paketocommunity/builder-ubi8-base')
    expect(stdout).to.contain(
      'build imagename --default-process web --path . --pull-policy always --builder paketocommunity/builder-ubi8-base',
    )
  })

  it('with a remote repository', async () => {
    const {error, stdout} = await runCommand(`build imagename --path ${ROOT_DIR}/test/unit/testdata/node-app.git`)
    expect(error).to.be.undefined
    expect(stdout).to.match(/Cloning the repository... into .+tmp-cloned-repos\/node-app-.+/)
    expect(stdout).to.include('Repository cloned successfully')
    expect(stdout).to.include('Building image imagename with builder paketocommunity/builder-ubi8-base')
    expect(stdout).to.match(
      /build imagename --default-process web --path .+tmp-cloned-repos\/node-app-.+ --pull-policy always --builder paketocommunity\/builder-ubi8-base/,
    )
  })

  it('with a remote repository and app on sub directory', async () => {
    const {error, stdout} = await runCommand(
      `build imagename --path ${ROOT_DIR}/test/unit/testdata/node-app.git:sub-dir`,
    )
    expect(error).to.be.undefined
    expect(stdout).to.match(
      /build imagename --default-process web --path .+tmp-cloned-repos\/node-app-.+\/sub-dir --pull-policy always --builder paketocommunity\/builder-ubi8-base/,
    )
  })

  it('throws an error if its a url and is not a valid git remote repo', async () => {
    const {error} = await runCommand('build imagename --path https://not-a-validurl.not-valid')
    expect(error?.message).to.contain(`Could not resolve host: not-a-validurl.not-valid`)
  })
})
