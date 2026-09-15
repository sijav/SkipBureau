import { setupI18n } from '@lingui/core'
import { beforeAll, expect, test } from 'vitest'
import { loadCatalog } from 'src/core/i18n'
import { factValue } from './factValue'

const i18n = setupI18n()

beforeAll(async () => {
  i18n.loadAndActivate({ locale: 'en-US', messages: await loadCatalog('en-US') })
})

const valueOf = (fact: Parameters<typeof factValue>[0]) => factValue(fact, i18n, 'en-US')

test('each operator reads as words around the value, and none is None', () => {
  expect(valueOf({ operator: 'within', numericValue: '2', unit: 'weeks' })).toEqual({ value: 'within 2 weeks', content: null })
  expect(valueOf({ operator: 'atMost', numericValue: '1000', currency: 'EUR' })).toEqual({ value: 'at most €1,000', content: null })
  expect(valueOf({ operator: 'atLeast', numericValue: '15000', currency: 'TRY' })).toEqual({ value: 'at least ₺15,000', content: null })
  expect(valueOf({ operator: 'equals', numericValue: '16', currency: 'EUR' })).toEqual({ value: '€16', content: null })
  expect(valueOf({ operator: 'none' })).toEqual({ value: 'None', content: null })
})

test('the units the interface names are written in the reader’s language, singular and plural', () => {
  expect(valueOf({ operator: 'within', numericValue: '20', unit: 'working days' }).value).toBe('within 20 working days')
  expect(valueOf({ operator: 'within', numericValue: '1', unit: 'weeks' }).value).toBe('within 1 week')
  expect(valueOf({ operator: 'atMost', numericValue: '7', unit: 'months' }).value).toBe('at most 7 months')
  expect(valueOf({ operator: 'atLeast', numericValue: '5', unit: 'calendar years' }).value).toBe('at least 5 calendar years')
  expect(valueOf({ operator: 'atMost', numericValue: '20', unit: 'percent' }).value).toBe('at most 20%')
  expect(valueOf({ operator: 'equals', numericValue: '3.6', unit: 'percent' }).value).toBe('3.6%')
  expect(valueOf({ operator: 'equals', numericValue: '0.25', unit: 'percentage points' }).value).toBe('0.25 percentage points')
  expect(valueOf({ operator: 'equals', numericValue: '77400', unit: 'year', currency: 'EUR' }).value).toBe('€77,400 a year')
})

test('a unit the interface does not name, and a text value, are the research’s own words beside the value', () => {
  expect(valueOf({ operator: 'atMost', numericValue: '90', unit: 'days in any 180 days' })).toEqual({
    value: 'at most 90',
    content: 'days in any 180 days',
  })
  expect(valueOf({ operator: 'equals', textValue: 'unlimited' })).toEqual({ value: null, content: 'unlimited' })
  expect(valueOf({ operator: 'within', numericValue: '90', unit: 'days', textValue: 'of entry' })).toEqual({
    value: 'within 90 days',
    content: 'of entry',
  })
})
