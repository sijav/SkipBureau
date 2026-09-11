import { useSyncExternalStore } from 'react'
import { JSON_LD, type StructuredDatum } from './guide'

// False on the server and while hydrating, which use the server snapshot;
// true once the page is React's. Nothing to subscribe to: it never changes back.
const never = () => () => {}
const useHydrated = (): boolean =>
  useSyncExternalStore(
    never,
    () => true,
    () => false,
  )

export const StructuredData = ({ data }: { data: readonly StructuredDatum[] }) => {
  const hydrated = useHydrated()

  // Not on the server or while hydrating: the file's head already carries the
  // same objects (SB-155), and a script in the body that the file does not
  // have is a hydration mismatch (SB-160).
  if (!hydrated) return null
  return (
    <>
      {data.map((datum) => (
        <script key={datum['@type']} type={JSON_LD}>
          {JSON.stringify(datum)}
        </script>
      ))}
    </>
  )
}
