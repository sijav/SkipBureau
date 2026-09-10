/**
 * A country code the API confirmed exists.
 *
 * Branded rather than a bare string, and no longer a literal union. The set
 * lives in the database, so it cannot be known at compile time, and a union of
 * one was pretending otherwise. What the brand still buys is that a locale, a
 * slug or a raw URL segment cannot be passed where a validated country belongs.
 *
 * The only way to make one is `validated`, and the only caller that should is
 * the route guard, once the API has answered.
 */
declare const validCountry: unique symbol

export type CountryCode = string & { readonly [validCountry]: true }

export const validated = (code: string): CountryCode => code as CountryCode

/**
 * Where `/` sends someone who has told us nothing.
 *
 * A product default, not a registry: it is one code, and the root redirect has
 * to cope with the row being gone rather than trusting it.
 */
export const defaultCountry = 'tr'

/** A country segment is two letters. Whether it EXISTS is the API's answer. */
export const looksLikeCountry = (value: string): boolean => /^[a-z]{2}$/.test(value)
