import type { I18n } from '@lingui/core'
import { msg, plural } from '@lingui/core/macro'

/** A rule fact's value as the API sends it. */
export type FactShape = {
  operator: string
  numericValue?: string | null | undefined
  textValue?: string | null | undefined
  unit?: string | null | undefined
  currency?: string | null | undefined
}

/** What a fact says, as a reader reads it: `value` in the reader's language, `content` in English, the research's own words. */
export type FactValue = { value: string | null; content: string | null }

// A sum or a number in a unit this interface names in every language, or null
// for a unit it does not name, which is then the research's own words.
const quantity = (count: number, { unit, currency }: FactShape, i18n: I18n, locale: string): string | null => {
  if (currency) {
    // The narrow symbol, ₺ and €, as the agreed documents write sums, not TRY and EUR.
    const money = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(count)
    if (!unit) return money
    if (unit === 'year') return i18n._(msg`${money} a year`)
    if (unit === 'month' || unit === 'per month') return i18n._(msg`${money} a month`)
    return null
  }
  switch (unit) {
    case undefined:
    case null:
    case '':
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(count)
    case 'percent':
      return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(count / 100)
    case 'percentage points':
      return i18n._(msg`${plural(count, { one: '# percentage point', other: '# percentage points' })}`)
    case 'days':
      return i18n._(msg`${plural(count, { one: '# day', other: '# days' })}`)
    case 'working days':
      return i18n._(msg`${plural(count, { one: '# working day', other: '# working days' })}`)
    case 'weeks':
      return i18n._(msg`${plural(count, { one: '# week', other: '# weeks' })}`)
    case 'months':
      return i18n._(msg`${plural(count, { one: '# month', other: '# months' })}`)
    case 'years':
      return i18n._(msg`${plural(count, { one: '# year', other: '# years' })}`)
    case 'calendar years':
      return i18n._(msg`${plural(count, { one: '# calendar year', other: '# calendar years' })}`)
    // SB-280: Turkey's work permit states salaries as multiples of the minimum wage, and a staffing ratio.
    case 'times the gross minimum wage':
      return i18n._(msg`${plural(count, { 1: 'the gross minimum wage', other: '# times the gross minimum wage' })}`)
    case 'Turkish employees for each foreigner':
      return i18n._(msg`${plural(count, { one: '# Turkish employee for each foreigner', other: '# Turkish employees for each foreigner' })}`)
    default:
      return null
  }
}

/**
 * A rule fact's value, for a line on a guide (SB-257): the operator and the
 * number in its unit or currency, written by the interface in the reader's
 * language, and the research's English words beside it for a unit outside the
 * closed set or a text value. A none fact is "None".
 */
export const factValue = (fact: FactShape, i18n: I18n, locale: string): FactValue => {
  if (fact.operator === 'none') return { value: i18n._(msg`None`), content: null }

  const count = fact.numericValue === null || fact.numericValue === undefined ? null : Number(fact.numericValue)
  const named = count === null ? null : quantity(count, fact, i18n, locale)
  const number = count === null ? null : (named ?? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(count))
  const words = [count !== null && named === null ? fact.unit : null, fact.textValue].filter((part) => Boolean(part)).join(' ')
  const content = words === '' ? null : words

  if (number === null) return { value: null, content }
  if (fact.operator === 'within') return { value: i18n._(msg`within ${number}`), content }
  if (fact.operator === 'atMost') return { value: i18n._(msg`at most ${number}`), content }
  if (fact.operator === 'atLeast') return { value: i18n._(msg`at least ${number}`), content }
  return { value: number, content }
}
