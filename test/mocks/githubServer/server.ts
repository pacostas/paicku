import * as fs from 'node:fs'
import * as http from 'node:http'
import * as path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const githubServer = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const filePath = path.join(__dirname, '../../mocks/githubServer', decodeURIComponent(req.url || ''))
  console.log(process.env.PAICKU_PACK_VERSION)

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404)
      return res.end('404 Not Found')
    }

    fs.createReadStream(filePath).pipe(res)
  })
})

export default githubServer