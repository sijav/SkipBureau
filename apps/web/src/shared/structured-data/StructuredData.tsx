import { JSON_LD, type StructuredDatum } from './guide'

/**
 * SB-087: a page's schema.org markup, one script per object. Rendered at build
 * time (SB-155) it is nothing: the file's head carries the same objects.
 */
export const StructuredData = ({ data }: { data: readonly StructuredDatum[] }) =>
  typeof window === 'undefined' ? null : (
    <>
      {data.map((datum) => (
        <script key={datum['@type']} type={JSON_LD}>
          {JSON.stringify(datum)}
        </script>
      ))}
    </>
  )
