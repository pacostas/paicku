import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import ghServer from './../../../mocks/githubServer/server'

describe('builder', () => {
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

  it('runs builder suggest ', async () => {
    const {stdout} = await runCommand('builder suggest')
    expect(stdout).to.contain('builder suggest')
  })
})
