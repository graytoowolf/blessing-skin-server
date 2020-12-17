import * as fetch from '@/scripts/net'
import apt from '@/scripts/cli/AptCommand'
import { Stdio } from './stdio'

jest.mock('@/scripts/net')

describe('install plugin', () => {
  it('succeeded', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'ok' })
    const stdio = new Stdio()

    await apt(stdio, ['install', 'test'])
    expect(fetch.post).toBeCalledWith('/admin/plugins/market/download', {
      name: 'test',
    })
    expect(stdio.getStdout()).toInclude('ok')
  })

  it('failed with reasons', async () => {
    fetch.post.mockResolvedValue({
      code: 1,
      message: 'failed',
      data: { reason: ['unresolved'] },
    })
    const stdio = new Stdio()

    await apt(stdio, ['install', 'test'])
    expect(fetch.post).toBeCalledWith('/admin/plugins/market/download', {
      name: 'test',
    })
    expect(stdio.getStdout()).toInclude('failed')
    expect(stdio.getStdout()).toInclude('- unresolved')
  })

  it('use `upgrade` command', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'ok' })
    const stdio = new Stdio()

    await apt(stdio, ['upgrade', 'test'])
    expect(fetch.post).toBeCalledWith('/admin/plugins/market/download', {
      name: 'test',
    })
    expect(stdio.getStdout()).toInclude('ok')
  })
})

describe('remove plugin', () => {
  beforeAll(() => jest.useRealTimers())

  it('cancelled', async () => {
    const stdio = new Stdio()

    setImmediate(() => process.stdin.emit('keypress', 'n', 'n'))
    await apt(stdio, ['remove', 'test'])
    expect(fetch.post).not.toBeCalled()
  })

  it('succeeded', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'ok' })
    const stdio = new Stdio()

    setImmediate(() => process.stdin.emit('keypress', 'y', 'y'))
    await apt(stdio, ['remove', 'test'])
    expect(fetch.post).toBeCalledWith('/admin/plugins/manage', {
      action: 'delete',
      name: 'test',
    })
    expect(stdio.getStdout()).toInclude('ok')
  })
})
