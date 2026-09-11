import { createElement, Suspense } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { isLazyPart, lazyPart } from './lazyPart'

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

    await expect(Part.preload()).rejects.toThrow('offline')
    await Part.preload()
    expect(attempts).toBe(2)
    expect(html(createElement(Part, { name: 'Ada' }))).toContain('Hello Ada')
  })

  it('is told apart from a plain component', () => {
    expect(isLazyPart(lazyPart(async () => Greeting))).toBe(true)
    expect(isLazyPart(Greeting)).toBe(false)
    expect(isLazyPart('div')).toBe(false)
  })
})
