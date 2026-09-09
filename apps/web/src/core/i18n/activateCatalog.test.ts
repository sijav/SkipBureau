import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { activateCatalog, type Messages } from './activateCatalog'

/** A promise this test decides when to settle, so the race is not a guess. */
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const recorder = () => {
  const calls: [string, Messages][] = []
  return { calls, activate: (locale: string, messages: Messages) => calls.push([locale, messages]) }
}

test('a catalog that loads while it is still wanted becomes active', async () => {
  const { calls, activate } = recorder()
  const messages = { hello: 'salam' }

  const result = await activateCatalog({
    locale: 'fa-IR',
    load: async () => messages,
    isCurrent: () => true,
    activate,
  })

  assert.equal(result, 'activated')
  assert.deepEqual(calls, [['fa-IR', messages]])
})

test('a catalog that fails to load activates nothing and says so', async () => {
  const { calls, activate } = recorder()

  const result = await activateCatalog({
    locale: 'fa-IR',
    load: async () => {
      throw new Error('404')
    },
    isCurrent: () => true,
    activate,
  })

  assert.equal(result, 'failed')
  assert.deepEqual(calls, [], 'a failed load must not activate a half-empty catalog')
})

test('the check happens AFTER the load, not before it', async () => {
  // This is the whole reason the function exists. The request is current when
  // it starts and stale by the time its messages arrive, which is exactly what
  // a double-clicked language control produces. Guarding only at the top, or
  // only after activation, both pass a test that checks the return value and
  // still ship the bug.
  const { calls, activate } = recorder()
  const load = deferred<Messages>()
  let current = true

  const running = activateCatalog({
    locale: 'fa-IR',
    load: () => load.promise,
    isCurrent: () => current,
    activate,
  })

  // Someone switches back to English while the Persian import is in flight.
  current = false
  load.resolve({ hello: 'salam' })

  assert.equal(await running, 'stale')
  assert.deepEqual(calls, [], 'the losing request must not activate anything')
})

test('the winner of a two-request race is the one asked for last', async () => {
  const { calls, activate } = recorder()
  const slowFirst = deferred<Messages>()
  const fastSecond = deferred<Messages>()

  let generation = 0
  const request = (locale: 'en-US' | 'fa-IR', load: () => Promise<Messages>) => {
    generation += 1
    const mine = generation
    return activateCatalog({ locale, load, isCurrent: () => generation === mine, activate })
  }

  const first = request('fa-IR', () => slowFirst.promise)
  const second = request('en-US', () => fastSecond.promise)

  // The second request resolves first, then the first one finally lands.
  fastSecond.resolve({ hello: 'hello' })
  assert.equal(await second, 'activated')

  slowFirst.resolve({ hello: 'salam' })
  assert.equal(await first, 'stale')

  assert.deepEqual(
    calls.map(([locale]) => locale),
    ['en-US'],
    'the late arrival must not overwrite the locale the reader actually chose',
  )
})

test('a load that rejects after losing the race is still not an error anyone sees', async () => {
  // A stale request that also fails reports the failure, and the provider only
  // acts on a failure that is still current, so nothing is announced. The point
  // here is that it does not throw.
  const { calls, activate } = recorder()

  const result = await activateCatalog({
    locale: 'fa-IR',
    load: async () => {
      throw new Error('offline')
    },
    isCurrent: () => false,
    activate,
  })

  assert.equal(result, 'failed')
  assert.deepEqual(calls, [])
})
