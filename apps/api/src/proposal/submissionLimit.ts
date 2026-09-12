import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'

/**
 * How often one client may suggest a change, and how much one guide may
 * receive. See `#SB-050 - Anonymous submissions without an open drain.md`.
 */
export const LIMITS = {
  /** Between one client's submissions. Stops a hundred in a second. */
  apartMs: 30_000,
  /** From one client, per hour. Stops a hundred in a minute. */
  perClient: 5,
  /** For one guide, per hour, counted from the table. Keeps the queue readable. */
  perGuide: 20,
  windowMs: 60 * 60 * 1000,
  /**
   * How many clients are remembered at once. Without a ceiling this map is
   * something an attacker with many addresses can grow until the process dies,
   * which would be a denial of service built out of the defence against one.
   * The oldest are dropped first: a dropped client gets one free submission,
   * which is the right way round.
   */
  clients: 10_000,
} as const

/**
 * The client, as the edge sees it.
 *
 * The socket address behind an ingress is the ingress, identical for everyone,
 * so it comes from `X-Forwarded-For` instead, and from the **last** entry of
 * it: a proxy appends what it saw, so the last entry is the one our own edge
 * wrote. Everything to the left of it is whatever the caller sent, forged or
 * not, and a limiter keyed on that is keyed on nothing.
 */
export const clientAddress = (request: {
  headers?: Record<string, string | string[] | undefined>
  socket?: { remoteAddress?: string | undefined }
}): string => {
  const header = request.headers?.['x-forwarded-for']
  const line = Array.isArray(header) ? header[header.length - 1] : header
  const hops = (line ?? '')
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean)
  return hops[hops.length - 1] ?? request.socket?.remoteAddress ?? 'unknown'
}

// Kept as a hash, never as an address. There are no accounts here and nothing
// about who read what is stored; a heap dump holding a list of readers'
// addresses would be exactly the record this product does not keep.
const fingerprint = (address: string): string => createHash('sha256').update(address).digest('base64').slice(0, 22)

@Injectable()
export class SubmissionLimit {
  // One entry per client, holding the times of its recent submissions. Insertion
  // order is the eviction order, and re-inserting on write keeps a busy client
  // from being evicted mid-window.
  private readonly seen = new Map<string, number[]>()

  /**
   * Whether this client has to wait, and nothing else: asking does not count
   * as submitting, so a refusal for another reason does not spend a slot.
   */
  mustWait(address: string, now = Date.now()): boolean {
    const times = this.recent(address, now)
    const last = times[times.length - 1]
    if (last !== undefined && now - last < LIMITS.apartMs) return true
    return times.length >= LIMITS.perClient
  }

  /** Called once a submission is actually stored. */
  record(address: string, now = Date.now()): void {
    const key = fingerprint(address)
    const times = [...this.recent(address, now), now]
    this.seen.delete(key)
    this.seen.set(key, times)

    while (this.seen.size > LIMITS.clients) {
      const oldest = this.seen.keys().next()
      if (oldest.done) break
      this.seen.delete(oldest.value)
    }
  }

  private recent(address: string, now: number): number[] {
    const times = this.seen.get(fingerprint(address)) ?? []
    return times.filter((time) => now - time < LIMITS.windowMs)
  }

  /** Only for tests: a limiter that remembers nothing. */
  forget(): void {
    this.seen.clear()
  }
}
