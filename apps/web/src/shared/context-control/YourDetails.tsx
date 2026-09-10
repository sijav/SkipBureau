import { useLingui } from '@lingui/react/macro'
import { ClickAwayListener, Popper } from '@mui/material'
import { useId, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'urql'
import { REGIONS, regionName } from 'src/core/country'
import { CountriesQuery } from 'src/core/graphql'
import { useLocale } from 'src/core/i18n'
import { samePageFrom } from 'src/core/router'
import { useShell } from 'src/core/shell'
import { ContextControl } from './ContextControl'
import { ContextPanel } from './ContextPanel'

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
      <Popper
        open={open}
        anchorEl={anchor}
        placement="bottom-end"
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        sx={{ zIndex: 'modal' }}
      >
        <ClickAwayListener
          onClickAway={(event) => {
            // The control toggles the panel itself.
            if (event.target instanceof Node && anchor?.contains(event.target)) return
            setOpen(false)
          }}
        >
          <div
            onKeyDown={(event) => {
              if (event.key !== 'Escape') return
              setOpen(false)
              anchor?.focus()
            }}
          >
            <ContextPanel
              id={id}
              origin={origin && originName ? { code: origin, name: originName } : null}
              countryName={countryName ?? ''}
              options={options}
              onOrigin={(code) => {
                setOpen(false)
                void navigate(samePageFrom(location, code))
              }}
            />
          </div>
        </ClickAwayListener>
      </Popper>
    </>
  )
}
