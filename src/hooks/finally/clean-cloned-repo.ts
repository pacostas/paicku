import {Hook} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

const hook: Hook.Finally = async function (options) {
  if (options.id !== 'build') {
    return
  }

  const tmpClonedRepos = path.join(options.config.cacheDir, 'tmp-cloned-repos')
  for (const repoDir of fs.readdirSync(tmpClonedRepos)) {
    try {
      fs.rmSync(path.join(tmpClonedRepos, repoDir), {force: true, recursive: true})
    } catch (error) {
      if (error! instanceof Error) {
        options.context.error(`Unknown error while deleting cached dir: ${repoDir}  \n error: ${error}`)
      }

      const nodeError = error as NodeJS.ErrnoException
      options.context.error(
        `Error deleting ${repoDir} \n Error code: ${nodeError.code} \n Error message: ${nodeError.message}`,
      )
    }
  }
}

export default hook
