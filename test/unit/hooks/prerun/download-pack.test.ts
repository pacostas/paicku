import {runHook} from '@oclif/test'
import {expect} from 'chai'
import * as fs from 'node:fs'
import {mkdtemp, rm} from 'node:fs/promises'
import * as http from 'node:http'
import {tmpdir} from 'node:os'
import * as path from 'node:path'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const filePath = path.join(__dirname, '../../fixtures', decodeURIComponent(req.url || ''))
  console.log(process.env.PAICKU_PACK_VERSION)

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404)
      return res.end('404 Not Found')
    }

    fs.createReadStream(filePath).pipe(res)
  })
})

describe('download pack hook', () => {
  let tempDir: string

  before(() => {
    server.listen(3003, () => {})
  })

  after((done) => {
    server.close(done)
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

  it('shows a message', async () => {
    const {error, stdout} = await runHook('prerun', {
      id: 'build',
    })

    expect(error).to.be.undefined
    expect(stdout).to.contain('Downloading pack binary with version')
    expect(stdout).to.contain('Downloading pack sha256 checksum')
  })
})
