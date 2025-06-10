import {runHook} from '@oclif/test'
import {expect} from 'chai'

describe('Finally hooks', () => {
  it('it does not run in case it is not a build', async () => {
    const {stdout} = await runHook('finally', {id: 'sommeid'})
    expect(stdout).to.contain('')
  })
})
