import { Trans } from '@lingui/react/macro'
import { Suspense, useDeferredValue, useEffect, useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'urql'
import { withCountry } from 'src/core/country'
import { AskQuery, overThePage } from 'src/core/graphql'
import { formatMonth, useLocale } from 'src/core/i18n'
import { paths, useShellJourney } from 'src/core/router'
import { useShell } from 'src/core/shell'
import { AskResultRow } from 'src/shared/ask-result-row'
import { lazyPart } from 'src/shared/lazy-part'
import type { AskPanelGroup } from './AskPanel'
import { NothingFound } from './NothingFound'

// SB-159: the panel, and the Popper under it, arrive the first time it opens.
const AskPanel = lazyPart(() => import('./AskPanel').then((panel) => panel.AskPanel))

/**
 * The panel's code, fetched now. The app does this while the page is idle; a
 * story has no idle, so a story that opens the panel asks for it first.
 */
export const preloadAskPanel = (): Promise<unknown> => AskPanel.preload()

/** What an Ask field needs from the panel it opens: where to anchor, and its input's wiring. */
export type AskBindings = {
  anchorRef: (element: HTMLElement | null) => void
  // Handlers go on the field itself: MUI's InputBase puts its own on the inner
  // input, over any passed through to it, so a focus there never arrives.
  events: {
    onFocus: () => void
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  }
  // A combobox whose popup is a dialog, which is what the panel is: it holds
  // links grouped under headings, not a list of options to pick one from.
  input: {
    role: 'combobox'
    'aria-haspopup': 'dialog'
    'aria-expanded': boolean
    'aria-controls': string
  }
  /** Asking remembers the question and opens everything it found, on the results page. */
  onAsk: (question: string) => void
}

// The reader's own recent questions, kept in their browser only: there are no
// accounts, and nothing about what someone asked leaves their device.
const RECENT = 'skipbureau:recent-asks'
const KEEP = 5

const readRecent = (): string[] => {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(RECENT) ?? '[]')
    return Array.isArray(stored) ? stored.filter((entry): entry is string => typeof entry === 'string') : []
  } catch {
    return []
  }
}

const remember = (question: string): string[] => {
  const next = [question, ...readRecent().filter((entry) => entry !== question)].slice(0, KEEP)
  try {
    window.localStorage.setItem(RECENT, JSON.stringify(next))
  } catch {
    // Storage refused, in a private window say: the list only lives this visit.
  }
  return next
}

/**
 * The Ask panel's controller, for whichever Ask field is on the page: opens on
 * focus, closes on Escape or a click elsewhere, and asks the API as the reader
 * types. The field is the caller's; this owns what opens beneath it.
 */
export const useAsk = ({ question, onQuestion }: { question: string; onQuestion: (question: string) => void }): { bindings: AskBindings; panel: ReactNode } => {
  const { locale } = useLocale()
  const { country, countryName } = useShell()
  const journey = useShellJourney()
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>(readRecent)
  const id = useId()
  const text = useDeferredValue(question.trim())

  // `overThePage`: this opens over a page rather than being one, so it must
  // not suspend. See the note on the constant.
  const [{ data, fetching }] = useQuery({ query: AskQuery, variables: { country: country ?? '', text, locale }, pause: !open || !country, context: overThePage })

  // A click anywhere but the field or its panel puts the panel away.
  useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (anchor?.contains(target) || window.document.getElementById(id)?.contains(target)) return
      setOpen(false)
    }
    window.document.addEventListener('pointerdown', away)
    return () => window.document.removeEventListener('pointerdown', away)
  }, [open, anchor, id])

  const bindings: AskBindings = {
    anchorRef: setAnchor,
    events: {
      onFocus: () => setOpen(true),
      onKeyDown: (event) => {
        if (event.key === 'Escape') setOpen(false)
      },
    },
    input: {
      role: 'combobox',
      'aria-haspopup': 'dialog',
      'aria-expanded': open,
      'aria-controls': id,
    },
    onAsk: (asked) => {
      const trimmed = asked.trim()
      // Nothing typed: the panel, with what is popular, is the answer.
      if (!trimmed || !journey) {
        setOpen(true)
        return
      }
      setRecent(remember(trimmed))
      setOpen(false)
      void navigate(paths.search(journey, trimmed))
    },
  }

  if (!country || !journey) return { bindings, panel: null }

  const name = countryName ?? ''
  const found = data?.ask
  const close = () => setOpen(false)

  const rows: ReactNode[] = [
    ...(found?.tasks ?? [])
      .filter((task) => task.open)
      .map((task) => (
        <AskResultRow
          key={`task-${task.slug}`}
          kind="task"
          title={<bdi>{withCountry(task.title, name)}</bdi>}
          detail={task.subtitle ? <bdi>{withCountry(task.subtitle, name)}</bdi> : undefined}
          to={paths.taskHub(journey, task.slug)}
          onClick={close}
        />
      )),
    ...(found?.guides ?? []).map((guide) => {
      const verified = formatMonth(guide.verifiedAt, locale)
      return (
        <AskResultRow
          key={`guide-${guide.slug}`}
          kind="guide"
          title={<bdi>{guide.title}</bdi>}
          detail={<Trans>Reading · verified {verified}</Trans>}
          to={paths.guide(journey, guide.slug)}
          onClick={close}
        />
      )
    }),
    ...(found?.answers ?? []).map((answer) => (
      <AskResultRow
        key={`answer-${answer.slug}`}
        kind="quickAnswer"
        title={<bdi>{answer.question}</bdi>}
        detail={<bdi>{answer.answer}</bdi>}
        to={answer.guideSlug ? paths.guide(journey, answer.guideSlug) : undefined}
        onClick={answer.guideSlug ? close : undefined}
      />
    )),
  ]

  const groups: AskPanelGroup[] = text
    ? // Nothing found is said only once the answer is in, never while it is on its way.
      [{ label: <Trans>Results for “{text}”</Trans>, rows: rows.length > 0 ? rows : fetching ? null : <NothingFound /> }]
    : [
        ...(recent.length > 0
          ? [
              {
                label: <Trans>Recent questions</Trans>,
                rows: recent.slice(0, 2).map((entry) => (
                  <AskResultRow key={`recent-${entry}`} kind="recent" title={<bdi>{entry}</bdi>} onClick={() => onQuestion(entry)} />
                )),
              },
            ]
          : []),
        ...(rows.length > 0 ? [{ label: <Trans>Popular right now</Trans>, rows }] : []),
      ]

  return {
    bindings,
    panel:
      open && groups.length > 0 ? (
        <Suspense fallback={null}>
          <AskPanel
            anchor={anchor}
            open
            id={id}
            groups={groups}
            footer={text ? <Trans>We’ll ask about your nationality or city only if it changes the answer.</Trans> : undefined}
          />
        </Suspense>
      ) : null,
  }
}
