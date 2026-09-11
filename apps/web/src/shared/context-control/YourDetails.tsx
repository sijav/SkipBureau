import { useLingui } from '@lingui/react/macro'
import { Suspense, useId, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'urql'
import { REGIONS, regionName } from 'src/core/country'
import { CountriesQuery } from 'src/core/graphql'
import { useLocale } from 'src/core/i18n'
import { samePageFrom } from 'src/core/router'
import { useShell } from 'src/core/shell'
import { lazyPart } from 'src/shared/lazy-part'
import { ContextControl } from './ContextControl'

// SB-159: the panel, with the Autocomplete and Popper it is built on, arrives
// the first time it opens.
const ContextPopper = lazyPart(() => import('./ContextPopper').then((popper) => popper.ContextPopper))

export const YourDetails = () => {
  const { t } = useLingui()
  const { locale } = useLocale()
  const { origin, countryName } = useShell()
  const location = useLocation()
  const navigate = useNavigate()
  const id = useId()
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)

  // The names the product gives the countries it covers, Turkey rather than
  // Intl's Türkiye; every other country is named by Intl in the reader's language.
  const [{ data }] = useQuery({ query: CountriesQuery, variables: { locale }, pause: !open && !origin })
  const ours = useMemo(() => new Map((data?.countries ?? []).map((row) => [row.code, row.name])), [data])
  // Every country there is, named and sorted, only once the panel is open: on
  // every page this header is on, building it closed cost 100 ms on a phone
  // for a list nobody could see (SB-161).
  const options = useMemo(() => {
    if (!open) return []
    const collator = new Intl.Collator(locale)
    return REGIONS.map((code) => ({ code, name: ours.get(code) ?? regionName(code, locale) })).sort((a, b) => collator.compare(a.name, b.name))
  }, [open, ours, locale])

  const originName = origin ? (ours.get(origin) ?? regionName(origin, locale)) : null

  return (
    <>
      <ContextControl
        ref={setAnchor}
        known={originName ? t`From ${originName}` : undefined}
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
            countryName={countryName ?? ''}
            options={options}
            onOrigin={(code) => {
              setOpen(false)
              void navigate(samePageFrom(location, code))
            }}
          />
        </Suspense>
      )}
    </>
  )
}
