import { describe, expect, test } from 'vitest'
import { LIMITS, SubmissionLimit, clientAddress } from '../src/proposal/submissionLimit.js'

/**
 * The limiter on its own, where a clock can be handed in: the hour window and
 * the ceiling on what is remembered cannot be reached by a test that has to
 * wait for them.
 */

describe('who the client is', () => {
  test('is the last entry of the forwarded header, which is the one our own edge wrote', () => {
    // The caller wrote the first two. A proxy appends what it saw, so the last
    // is the only one that was not chosen by whoever is being limited.
    expect(clientAddress({ headers: { 'x-forwarded-for': '10.0.0.1, 8.8.8.8, 203.0.113.7' } })).toBe('203.0.113.7')
  })

  test('a forged header cannot make two clients look like one, or one look like many', () => {
    const forger = { headers: { 'x-forwarded-for': `whatever they like, 203.0.113.7` } }
    const honest = { headers: { 'x-forwarded-for': '203.0.113.7' } }
    expect(clientAddress(forger)).toBe(clientAddress(honest))
  })

  test('a repeated header arrives as a list, and the last of it still wins', () => {
    expect(clientAddress({ headers: { 'x-forwarded-for': ['10.0.0.1', '203.0.113.9'] } })).toBe('203.0.113.9')
  })

  test('with no proxy in front, it is the socket', () => {
    expect(clientAddress({ socket: { remoteAddress: '127.0.0.1' } })).toBe('127.0.0.1')
    expect(clientAddress({})).toBe('unknown')
  })
})

describe('how often one client may suggest a change', () => {
  test('a second submission straight away waits, and one later does not', () => {
    const limit = new SubmissionLimit()
    const start = 1_000_000

    expect(limit.mustWait('a', start)).toBe(false)
    limit.record('a', start)

    expect(limit.mustWait('a', start + LIMITS.apartMs - 1)).toBe(true)
    expect(limit.mustWait('a', start + LIMITS.apartMs)).toBe(false)
  })

  test('five in an hour, and the sixth waits for the first to age out', () => {
    const limit = new SubmissionLimit()
    const start = 1_000_000
    // Spaced past the pause, so what refuses the sixth is the hour's count.
    for (let index = 0; index < LIMITS.perClient; index += 1) limit.record('a', start + index * LIMITS.apartMs)

    const after = start + LIMITS.perClient * LIMITS.apartMs
    expect(limit.mustWait('a', after)).toBe(true)

    // Once the first has fallen out of the window there is room again.
    expect(limit.mustWait('a', start + LIMITS.windowMs + 1)).toBe(false)
  })

  test('one client waiting does not make another wait', () => {
    const limit = new SubmissionLimit()
    const now = 1_000_000
    limit.record('a', now)

    expect(limit.mustWait('a', now)).toBe(true)
    expect(limit.mustWait('b', now)).toBe(false)
  })

  test('asking does not spend a slot', () => {
    // Only a stored row counts, so a refusal for a bad email does not cost the
    // reader the submission they are about to correct and send again.
    const limit = new SubmissionLimit()
    const now = 1_000_000
    for (let index = 0; index < 50; index += 1) expect(limit.mustWait('a', now)).toBe(false)
  })

  test('what it remembers has a ceiling, and the oldest client is dropped first', () => {
    const limit = new SubmissionLimit()
    const now = 1_000_000
    limit.record('first', now)
    for (let index = 0; index < LIMITS.clients; index += 1) limit.record(`filler-${index}`, now + 1)

    // The map cannot be grown without bound by an attacker with many
    // addresses, which would be a denial of service built out of the defence
    // against one. The cost is that the dropped client gets one free
    // submission, rather than everyone getting none.
    expect(limit.mustWait('first', now + 2)).toBe(false)
    expect(limit.mustWait(`filler-${LIMITS.clients - 1}`, now + 2)).toBe(true)
  })

  test('a busy client is not evicted by its own traffic', () => {
    const limit = new SubmissionLimit()
    const now = 1_000_000
    limit.record('busy', now)
    for (let index = 0; index < LIMITS.clients - 1; index += 1) limit.record(`filler-${index}`, now + 1)
    limit.record('busy', now + 2)
    for (let index = 0; index < LIMITS.clients - 1; index += 1) limit.record(`later-${index}`, now + 3)

    expect(limit.mustWait('busy', now + 4)).toBe(true)
  })
})
