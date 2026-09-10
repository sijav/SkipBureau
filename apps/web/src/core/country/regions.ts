/**
 * Every country a reader can come from: ISO 3166-1 alpha-2, and XK for Kosovo,
 * whose people hold its passports. Read off CLDR 48 in Node's ICU, less its
 * retired aliases (UK, SU, YU and the like) and the codes that name something
 * other than a country (EU, UN, ZZ). Lowercase, as the database writes codes;
 * a URL writes them in capitals. Names come from Intl, in the reader's language.
 */
// One row per first letter, so a missing code is easy to spot.
const CODES = `
  ad ae af ag ai al am ao aq ar as at au aw ax az
  ba bb bd be bf bg bh bi bj bl bm bn bo bq br bs bt bv bw by bz
  ca cc cd cf cg ch ci ck cl cm cn co cr cu cv cw cx cy cz
  de dj dk dm do dz
  ec ee eg eh er es et
  fi fj fk fm fo fr
  ga gb gd ge gf gg gh gi gl gm gn gp gq gr gs gt gu gw gy
  hk hm hn hr ht hu
  id ie il im in io iq ir is it
  je jm jo jp
  ke kg kh ki km kn kp kr kw ky kz
  la lb lc li lk lr ls lt lu lv ly
  ma mc md me mf mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz
  na nc ne nf ng ni nl no np nr nu nz
  om
  pa pe pf pg ph pk pl pm pn pr ps pt pw py
  qa
  re ro rs ru rw
  sa sb sc sd se sg sh si sj sk sl sm sn so sr ss st sv sx sy sz
  tc td tf tg th tj tk tl tm tn to tr tt tv tw tz
  ua ug um us uy uz
  va vc ve vg vi vn vu
  wf ws
  xk
  ye yt
  za zm zw
`

export const REGIONS: readonly string[] = CODES.trim().split(/\s+/)

const known = new Set(REGIONS)

/** A code for a country someone can come from, in either case. */
export const isRegion = (code: string): boolean => known.has(code.toLowerCase())

/**
 * A country's name in the reader's language, from Intl. Where the database
 * names the country, as it does every destination, the caller prefers that:
 * Intl says Türkiye in English and the product says Turkey.
 */
export const regionName = (code: string, language: string): string =>
  new Intl.DisplayNames([language], { type: 'region' }).of(code.toUpperCase()) ?? code.toUpperCase()
