import { strict as assert } from 'node:assert'
import { afterEach, test, vi } from 'vitest'
import { onSystemModeChange, systemMode } from './systemMode'

type Listener = () => void

/**
 * A stand-in for `window.matchMedia`.
 *
 * It hands back a NEW list object on every call, which is what a browser does
 * and is the whole reason `onSystemModeChange` captures one. `listenerCount`
 * counts across every list ever created, so a version that called
 * `matchMedia` a second time to unsubscribe would remove a listener from an
 * empty list, leave the real one attached, and fail here rather than leaking
 * quietly once per mount.
 *
 * Through `window` because the source reaches browser globals that way, which
 * the working agreement says is so they stay mockable. This is that.
 */
const stubMatchMedia = (matches: boolean) => {
  const queries: string[] = []
  const lists: Set<Listener>[] = []

  const matchMedia = (query: string) => {
    queries.push(query)
    const listeners = new Set<Listener>()
    lists.push(listeners)

    return {
      matches,
      media: query,
      // The event name is checked here rather than asserted separately: a
      // source listening for anything but `change` registers nothing.
      addEventListener: (event: string, listener: Listener) => {
        if (event === 'change') listeners.add(listener)
      },
      removeEventListener: (event: string, listener: Listener) => {
        if (event === 'change') listeners.delete(listener)
      },
    }
  }

  vi.stubGlobal('window', { matchMedia })

  return {
    queries,
    listenerCount: () => lists.reduce((total, listeners) => total + listeners.size, 0),
    change: () => lists.forEach((listeners) => listeners.forEach((listener) => listener())),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

test('dark when the operating system asks for dark', () => {
  stubMatchMedia(true)

  assert.equal(systemMode(), 'dark')
})

test('light when it does not', () => {
  stubMatchMedia(false)

  assert.equal(systemMode(), 'light')
})

test('it asks the one question it means to ask', () => {
  const media = stubMatchMedia(false)

  systemMode()

  // A typo in the query string is invisible: an unrecognised feature simply
  // never matches, so the app would sit in light for ever and look correct.
  assert.deepEqual(media.queries, ['(prefers-color-scheme: dark)'])
})

test('a change reaches the listener, and unsubscribing detaches it', () => {
  const media = stubMatchMedia(false)
  let heard = 0

  const stop = onSystemModeChange(() => {
    heard += 1
  })

  assert.equal(media.listenerCount(), 1, 'nothing was subscribed')

  media.change()
  assert.equal(heard, 1)

  stop()
  assert.equal(media.listenerCount(), 0, 'the listener outlived its unsubscribe')

  media.change()
  assert.equal(heard, 1, 'a detached listener still fired')
})
