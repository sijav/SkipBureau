import { useEffect, useLayoutEffect } from 'react'
import { useShell } from 'src/core/shell'

/**
 * The design's scroll handoff, 62:849: one primary Ask at a time. While the
 * page's own large field is on screen the header shows none; once it scrolls
 * under the header, the header's takes over.
 *
 * Takes the element, from a callback ref, not a ref object: a page that waits
 * for its data mounts the field later, and an effect keyed on a ref object
 * would have run once, found nothing, and never looked again.
 */
export const useOwnsAsk = (field: HTMLElement | null, headerHeight: number, claimAtStart = true) => {
  const { setPageOwnsAsk } = useShell()

  // Claimed before the first paint, so the header's field never flashes on a
  // page that loads at the top with its own in view. A page whose field sits
  // further down does not claim it, and waits to be scrolled to.
  useLayoutEffect(() => {
    if (claimAtStart) setPageOwnsAsk(true)
    return () => setPageOwnsAsk(false)
  }, [claimAtStart, setPageOwnsAsk])

  useEffect(() => {
    const element = field
    if (!element) return

    // The sticky header covers the top of the viewport, so a field scrolled
    // under it is out of view even though it is still inside the window.
    const observer = new window.IntersectionObserver(([entry]) => setPageOwnsAsk(Boolean(entry?.isIntersecting)), {
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [field, headerHeight, setPageOwnsAsk])
}
