import { createElement, Suspense } from 'react'
import { renderToString } from 'react-dom/server'
import { prerender } from 'react-dom/static'
import { describe, expect, it } from 'vitest'
import { isLazyPart, isPartLoadFailure, lazyPart } from './lazyPart'

const Greeting = ({ name }: { name: string }) => createElement('p', null, `Hello ${name}`)

// renderToString never waits: whatever suspends shows its fallback.
const html = (element: ReturnType<typeof createElement>) => renderToString(createElement(Suspense, { fallback: 'waiting' }, element))

describe('lazyPart', () => {
  it('suspends until its code is in, then renders at once', async () => {
    const Part = lazyPart(async () => Greeting)
    expect(html(createElement(Part, { name: 'Ada' }))).toContain('waiting')

    await Part.preload()
    expect(html(createElement(Part, { name: 'Ada' }))).toContain('Hello Ada')
  })

  it('asks again after a load that failed', async () => {
    let attempts = 0
    const Part = lazyPart(async () => {
      attempts += 1
      if (attempts === 1) throw new Error('offline')
      return Greeting
    })

    const failure = await Part.preload().catch((error: unknown) => error)
    // What the app reloads for, when a render needs it: this, and not any error.
    expect(isPartLoadFailure(failure)).toBe(true)
    expect(isPartLoadFailure(new Error('offline'))).toBe(false)
    await Part.preload()
    expect(attempts).toBe(2)
    expect(html(createElement(Part, { name: 'Ada' }))).toContain('Hello Ada')
  })

  it('lets a render that needs it see the failure, rather than loading again and again', async () => {
    let attempts = 0
    const Part = lazyPart(async (): Promise<typeof Greeting> => {
      attempts += 1
      throw new Error('gone')
    })
    const seen: unknown[] = []

    // A static render waits for everything, retrying what suspended.
    await prerender(createElement(Suspense, { fallback: 'waiting' }, createElement(Part, { name: 'Ada' })), { onError: (error) => void seen.push(error) })

    expect(attempts).toBe(1)
    expect(seen.some(isPartLoadFailure)).toBe(true)
  })

  it('is told apart from a plain component', () => {
    expect(isLazyPart(lazyPart(async () => Greeting))).toBe(true)
    expect(isLazyPart(Greeting)).toBe(false)
    expect(isLazyPart('div')).toBe(false)
  })
})
