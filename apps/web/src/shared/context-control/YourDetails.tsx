import { useLingui } from '@lingui/react/macro'
import { Suspense, useId, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'urql'
import { REGIONS, regionName } from 'src/core/country'
import { CountriesQuery, overThePage, ReaderDetailsQuery } from 'src/core/graphql'
import { useLocale } from 'src/core/i18n'
import { samePageAs, samePageAt, samePageCleared, samePageFrom, samePageWhere } from 'src/core/router'
import { useShell } from 'src/core/shell'
import { lazyPart } from 'src/shared/lazy-part'
import { ContextControl } from './ContextControl'
import type { DetailOption } from './ContextPanel'

// SB-159: the panel, with the Autocomplete and Popper it is built on, arrives
// the first time it opens.
const ContextPopper = lazyPart(() => import('./ContextPopper').then((popper) => popper.ContextPopper))

type Listed = { code: string; parentCode: string | null; name: string }

/** A country's places or statuses as a row lists them: by name, each followed by the ones inside it, a level further in. */
const nested = (rows: readonly Listed[], locale: string): DetailOption[] => {
  const collator = new Intl.Collator(locale)
  const sorted = [...rows].sort((a, b) => collator.compare(a.name, b.name))
  const listed: DetailOption[] = []
  const inside = (parent: string | null, depth: number) => {
    for (const row of sorted.filter((candidate) => candidate.parentCode === parent)) {
      listed.push({ code: row.code, name: row.name, depth })
      inside(row.code, depth + 1)
    }
  }
  inside(null, 0)
  return listed
}

export const YourDetails = () => {
  const { t } = useLingui()
  const { locale } = useLocale()
  const { origin, country, countryName, place, status } = useShell()
  const location = useLocation()
  const navigate = useNavigate()
  const id = useId()
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)

  // The names the product gives the countries it covers, Turkey rather than
  // Intl's Türkiye; every other country is named by Intl in the reader's language.
  // `overThePage`: the header asks this for a reader who already has an
  // origin, while a page is on screen. Suspending here would blank that page.
  const [{ data }] = useQuery({ query: CountriesQuery, variables: { locale }, pause: !open && !origin, context: overThePage })
  const ours = useMemo(() => new Map((data?.countries ?? []).map((row) => [row.code, row.name])), [data])
  // Every country there is, named and sorted, only once the panel is open: on
  // every page this header is on, building it closed cost 100 ms on a phone
  // for a list nobody could see (SB-161).
  const options = useMemo(() => {
    if (!open) return []
    const collator = new Intl.Collator(locale)
    return REGIONS.map((code) => ({ code, name: ours.get(code) ?? regionName(code, locale) })).sort((a, b) => collator.compare(a.name, b.name))
  }, [open, ours, locale])

  // The country's places and statuses once the panel opens. The route guard
  // asks the same, with the same variables, when an address names one, so it
  // is one answer (SB-256).
  const [{ data: details }] = useQuery({
    query: ReaderDetailsQuery,
    variables: { country: country ?? '', locale },
    pause: !open || !country,
    context: overThePage,
  })
  const places = useMemo(() => nested(details?.places ?? [], locale), [details, locale])
  const statuses = useMemo(() => nested(details?.residenceStatuses ?? [], locale), [details, locale])
  const statusName = status ? details?.residenceStatuses.find((row) => row.code === status)?.name : undefined

  const originName = origin ? (ours.get(origin) ?? regionName(origin, locale)) : null

  const go = (to: string) => {
    setOpen(false)
    void navigate(to)
  }

  return (
    <>
      <ContextControl
        ref={setAnchor}
        known={originName ? t`From ${originName}` : undefined}
        place={place ? <bdi>{place.name}</bdi> : undefined}
        missing={originName && !place ? t`Add city` : undefined}
        open={open}
        controls={id}
        onClick={() => setOpen(!open)}
      />
      {open && (
        <Suspense fallback={null}>
          <ContextPopper
            anchor={anchor}
            onClose={() => setOpen(false)}
            id={id}
            origin={origin && originName ? { code: origin, name: originName } : null}
            country={country && countryName ? { code: country, name: countryName } : null}
            // The countries the API covers, which is all a reader can be in. Not
            // `options`: that is every country somebody can come from.
            countries={data?.countries ?? []}
            countryName={countryName ?? ''}
            options={options}
            place={place}
            places={places}
            status={status && statusName ? { code: status, name: statusName } : null}
            statuses={statuses}
            onOrigin={(code) => go(samePageFrom(location, code))}
            onCountry={(code) => go(samePageAt(location, code))}
            onPlace={(code) => go(samePageWhere(location, code))}
            onStatus={(code) => go(samePageAs(location, code))}
            onClear={() => go(samePageCleared(location))}
          />
        </Suspense>
      )}
    </>
  )
}
