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

/**
 * The context control wired to the address. Where the reader says they come
 * from becomes part of the URL, `/en-IR/TR`, so a page they share says it too,
 * and taking it back returns them to `/en/TR`.
 */
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
  const options = useMemo(() => {
    const ours = new Map((data?.countries ?? []).map((row) => [row.code, row.name]))
    return REGIONS.map((code) => ({ code, name: ours.get(code) ?? regionName(code, locale) })).sort((a, b) =>
      a.name.localeCompare(b.name, locale),
    )
  }, [data, locale])

  const originName = origin ? (options.find((option) => option.code === origin)?.name ?? regionName(origin, locale)) : null

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
