import { useEffect, useLayoutEffect, type RefObject } from 'react'
import { useShell } from 'src/core/shell'

/**
 * The design's scroll handoff, 62:849: one primary Ask at a time. While the
 * page's own large field is on screen the header shows none; once it scrolls
 * under the header, the header's takes over.
 */
export const useOwnsAsk = (field: RefObject<HTMLElement | null>, headerHeight: number) => {
  const { setPageOwnsAsk } = useShell()

  // Claimed before the first paint, so the header's field never flashes on a
  // page that loads at the top with its own in view.
  useLayoutEffect(() => {
    setPageOwnsAsk(true)
    return () => setPageOwnsAsk(false)
  }, [setPageOwnsAsk])

  useEffect(() => {
    const element = field.current
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
