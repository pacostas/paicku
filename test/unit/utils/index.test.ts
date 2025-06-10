import {expect} from 'chai'

import {Flags} from '../../../src/types/index.js'
import {
  getPackNamingConvention,
  gitIsInstalled,
  parseFlags,
  parseURL,
  sortArrayBasedOnOrder,
} from '../../../src/utils/index.js'

describe('utils', () => {
  it('checks if git is installed', async () => {
    const result = gitIsInstalled()
    expect(result).to.be.true
  })

  it('Parses a valid url', async () => {
    const tests = [
      {
        got: 'http://valid.url.com',
        want: 'http://valid.url.com/',
      },
      {
        got: 'httpsinvalid.url.com',
        want: null,
      },
      {
        got: 'httpsinvalid.url.com',
        want: null,
      },
    ]

    for (const test of tests) {
      const result = parseURL(test.got)
      if (test.want === null) {
        expect(result).to.be.null
      } else {
        expect(result?.href).to.be.equal(test.want)
      }
    }
  })

  it('Returns the pack naming convention', async () => {
    const tests = [
      {
        got: {arch: 'x64', platform: 'linux'},
        want: 'linux',
      },
      {
        got: {arch: 'arm64', platform: 'linux'},
        want: 'linux-arm64',
      },
      {
        got: {arch: 'ppc64', platform: 'linux'},
        want: 'linux-ppc64le',
      },
      {
        got: {arch: 's390x', platform: 'linux'},
        want: 'linux-s390x',
      },
      {
        got: {arch: 'x64', platform: 'darwin'},
        want: 'macos',
      },
      {
        got: {arch: 'arm64', platform: 'darwin'},
        want: 'macos-arm64',
      },
      {
        got: {arch: 'x64', platform: 'win32'},
        want: 'windows',
      },
    ]
    for (const test of tests) {
      const result = getPackNamingConvention(test.got.arch, test.got.platform)
      expect(result).to.be.equal(test.want)
    }
  })

  it('Parses flags correctly', async () => {
    const tests: {got: Flags; want: string[]}[] = [
      {
        got: {flag1: true, flag2: 'value2', flag3: 3},
        want: ['--flag1', '--flag2', 'value2', '--flag3', '3'],
      },
      {
        got: {flag1: false, flag2: 'value2'},
        want: ['--flag1', 'false', '--flag2', 'value2'],
      },
      {
        got: {},
        want: [],
      },
    ]

    for (const test of tests) {
      const result = parseFlags(test.got)
      expect(result).to.deep.equal(test.want)
    }
  })

  it('Sorts array based on order', async () => {
    const tests = [
      {
        got: ['b', 'a', 'c'],
        order: ['a', 'b', 'c'],
        want: ['a', 'b', 'c'],
      },
      {
        got: ['c', 'b', 'a'],
        order: ['a', 'b', 'c'],
        want: ['a', 'b', 'c'],
      },
      {
        got: ['a', 'b', 'c'],
        order: ['c', 'b', 'a'],
        want: ['c', 'b', 'a'],
      },
      {
        got: ['a', 'b', 'c'],
        order: ['a', 'b', 'c'],
        want: ['a', 'b', 'c'],
      },
      {
        got: ['a', 'b', 'c'],
        order: [],
        want: ['a', 'b', 'c'],
      },
      {
        got: [],
        order: ['a', 'b', 'c'],
        want: [],
      },
      {
        got: [],
        order: [],
        want: [],
      },
      {
        got: ['a', 'b', 'c'],
        order: ['a', 'b', 'c', 'd'],
        want: ['a', 'b', 'c'],
      },
      {
        got: ['a', 'b', 'c'],
        order: ['d', 'e', 'f'],
        want: ['a', 'b', 'c'],
      },
      {
        got: ['a', 'b', 'c'],
        order: ['d', 'e', 'f'],
        want: ['a', 'b', 'c'],
      },
    ]
    for (const test of tests) {
      const result = sortArrayBasedOnOrder(test.got, test.order)
      expect(result).to.deep.equal(test.want)
    }
  })
})
