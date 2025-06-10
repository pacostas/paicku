import {Hook} from '@oclif/core'
import AdmZip from 'adm-zip'
import crypto from 'node:crypto'
import fs, {constants, promises as fsPromises, statSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {Readable} from 'node:stream'
import {finished} from 'node:stream/promises'
import * as tar from 'tar'

import {PACK_VERSION} from '../../constants/index.js'
import {getPackUrl} from '../../utils/index.js'

const hook: Hook<'prerun'> = async function () {
  const {cacheDir} = this.config

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, {recursive: true})
  }

  if (await isExecutable(path.join(cacheDir, 'pack'))) {
    return
  }

  const arch = os.arch()
  const {platform} = process
  const compression = platform === 'win32' ? 'zip' : 'tgz'

  const {
    env: {PAICKU_PACK_VERSION: packVersion = PACK_VERSION},
  } = process

  const packUrl = getPackUrl(platform, arch, packVersion)

  try {
    this.log(`Downloading pack binary with version ${packVersion} for ${arch} to ${cacheDir}`)
    await downloadFile(packUrl, cacheDir, `pack.${compression}`)

    this.log(`Downloading pack sha256 checksum`)
    await downloadFile(packUrl + '.sha256', cacheDir, `pack.${compression}.sha256`)

    const checksum = await checksumFile('sha256', path.join(cacheDir, `pack.${compression}`))

    const expectedChecksum = fs.readFileSync(path.join(cacheDir, `pack.${compression}.sha256`), 'utf8').split(' ')[0]

    if (checksum !== expectedChecksum) {
      this.error(`Checksum mismatch expected ${expectedChecksum}, got ${checksum}`, {exit: 1})
    }

    await extractArchive(path.join(cacheDir, `pack.${compression}`), cacheDir, compression, this.log.bind(this))

    if (platform === 'win32') {
      try {
        fs.renameSync(path.join(cacheDir, `pack.exe`), path.join(cacheDir, `pack`))
      } catch (error) {
        this.error(`Failed to rename pack binary \n Error: ${error}`, {exit: 1})
      }
    } else {
      await changePermissions(path.join(cacheDir, 'pack'), this.log.bind(this))
    }
  } catch (error) {
    this.error(`${error}`, {exit: 1})
  }

  fs.unlinkSync(path.join(cacheDir, `pack.${compression}`))
  fs.unlinkSync(path.join(cacheDir, `pack.${compression}.sha256`))
}

function checksumFile(hashName: string, path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(hashName)
    const stream = fs.createReadStream(path)
    stream.on('error', (err) => reject(err))
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

async function isExecutable(filePath: string): Promise<boolean> {
  try {
    const stats = statSync(filePath)
    if (!stats.isFile()) {
      return false
    }

    await fsPromises.access(filePath, constants.X_OK)
    return true
  } catch {
    return false
  }
}

async function changePermissions(filePath: string, log: (message: string) => void) {
  try {
    const stats = fs.statSync(filePath)
    if (stats.isFile()) {
      fs.chmodSync(filePath, 0o755) // Change permissions to rwxr-xr-x
      log(`Changed permissions for ${filePath} to 755`)
    } else {
      throw new Error(`${filePath} is not a file`)
    }
  } catch (error) {
    throw new Error(`Failed to change permissions for ${filePath}: ${error}`)
  }
}

async function extractArchive(
  archivePath: string,
  destDir: string,
  archiveType: 'tgz' | 'zip',
  log: (message: string) => void,
) {
  if (!fs.existsSync(destDir)) {
    throw new Error(`Destination directory does not exist: ${destDir}`)
  }

  if (archiveType === 'tgz') {
    await tar.x({
      C: destDir,
      file: archivePath,
    })
  } else {
    const zip = new AdmZip(archivePath)
    zip.extractAllTo(destDir, true)
  }

  log(`Extracted ${archivePath} to ${destDir}`)
}

async function downloadFile(url: string, destDir: string, destFilename: string) {
  const destinationPath = path.join(destDir, destFilename)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error downloading file: ${response.status} - ${response.statusText}`)
  }

  if (!fs.existsSync(destDir)) {
    throw new Error(`Destination directory does not exist: ${destDir}`)
  }

  const fileStream = fs.createWriteStream(destinationPath)
  if (!response.body) throw new Error('Response body is null')

  // @ts-expect-error we dont need to put types on response.body
  await finished(Readable.fromWeb(response.body).pipe(fileStream))
}

export default hook
