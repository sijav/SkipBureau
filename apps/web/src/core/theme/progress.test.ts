import { strict as assert } from 'node:assert'
import { test } from 'vitest'
import { segments } from './progress'

test('the step after the last completed is the current one, as in Figma 17:28', () => {
  assert.deepEqual(segments(3, 9), ['done', 'done', 'done', 'current', 'remaining', 'remaining', 'remaining', 'remaining', 'remaining'])
})

test('nothing started: the first step is current', () => {
  assert.deepEqual(segments(0, 3), ['current', 'remaining', 'remaining'])
})

test('everything done: no step is current', () => {
  assert.deepEqual(segments(3, 3), ['done', 'done', 'done'])
})
